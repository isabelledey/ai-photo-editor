import logging
import mimetypes
import os
import urllib.request
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from threading import Lock
from typing import Literal
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

# ---------------------------
# App + environment bootstrap
# ---------------------------
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
UPLOADS_DIR = BASE_DIR / "uploads"
TERMS_FILE = BASE_DIR / "TermsOfUse.md"
ACCESSIBILITY_FILE = BASE_DIR / "Accessibility.md"

STATIC_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(dotenv_path=BASE_DIR / ".env")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "").strip()

app = FastAPI(title="AI Face Stylizer")
FRONTEND_INDEX = TEMPLATES_DIR / "index.html"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_face_stylizer")

# ---------------------------
# Static + SPA hosting
# ---------------------------
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
images_dir = STATIC_DIR / "images"
if images_dir.exists():
    app.mount("/images", StaticFiles(directory=images_dir), name="images")


# ---------------------------
# In-memory admin logs store
# ---------------------------
class RunLog(BaseModel):
    id: int
    timestamp: str
    theme: str
    status: Literal["success", "failed"]


LOGS: list[RunLog] = []
LOGS_LOCK = Lock()
NEXT_LOG_ID = 1


def add_log(theme: str, status: Literal["success", "failed"]):
    global NEXT_LOG_ID
    with LOGS_LOCK:
        record = RunLog(
            id=NEXT_LOG_ID,
            timestamp=datetime.now(timezone.utc).isoformat(),
            theme=theme,
            status=status,
        )
        NEXT_LOG_ID += 1
        LOGS.append(record)
        return record


# ---------------------------
# Theme mapping
# ---------------------------
THEME_PROMPTS = {
    "basic": "high-end professional retouch, natural skin texture, masterpiece",
    "festival": "festival makeup, holographic glitter on cheekbones, vibrant neon festival lighting, high fashion",
    "fantasy": "ethereal fantasy makeup, soft glowing skin, cinematic mystical lighting, fairy-tale aesthetic",
    "corporate": "professional corporate makeup, clean studio lighting, business portrait",
}


def normalize_theme(theme: str) -> str:
    normalized = (theme or "").strip().lower()
    return normalized if normalized in THEME_PROMPTS else "basic"


# ---------------------------
# Replicate helpers
# ---------------------------
def _extract_output_url(output) -> str:
    if isinstance(output, (list, tuple)) and output:
        candidate = output[0]
    else:
        candidate = output

    if isinstance(candidate, str):
        return candidate

    maybe_url = getattr(candidate, "url", None)
    if callable(maybe_url):
        return str(maybe_url())
    if isinstance(maybe_url, str):
        return maybe_url

    raise ValueError("Replicate did not return a valid output URL")


def _download_url(url: str) -> bytes:
    with urllib.request.urlopen(url) as response:
        return response.read()


def _run_flux_transform(image_path: Path, prompt: str, prompt_strength: float) -> tuple[str, bytes]:
    if not REPLICATE_API_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN is missing in .env")

    try:
        import replicate
    except Exception as exc:
        raise RuntimeError("replicate is not installed. Run: pip install replicate") from exc

    client = replicate.Client(api_token=REPLICATE_API_TOKEN)
    model_ref = "black-forest-labs/flux-1.1-pro"

    # Keep prompt strength fixed unless admin overrides via slider.
    strength = max(0.0, min(1.0, float(prompt_strength)))

    # Try common payload field variants to handle model schema differences.
    payload_variants = [
        {"prompt": prompt, "image": None, "prompt_strength": strength, "output_format": "png"},
        {"prompt": prompt, "image_prompt": None, "prompt_strength": strength, "output_format": "png"},
        {"prompt": prompt, "input_image": None, "strength": strength, "output_format": "png"},
        {"prompt": prompt, "input_images": [], "image_prompt_strength": strength, "output_format": "png"},
    ]

    last_error: Exception | None = None
    for payload in payload_variants:
        try:
            with image_path.open("rb") as source_file:
                if "image" in payload:
                    payload["image"] = source_file
                if "image_prompt" in payload:
                    payload["image_prompt"] = source_file
                if "input_image" in payload:
                    payload["input_image"] = source_file
                if "input_images" in payload:
                    payload["input_images"] = [source_file]

                logger.info("Replicate run: model=%s payload_keys=%s", model_ref, list(payload.keys()))
                output = client.run(model_ref, input=payload)

            output_url = _extract_output_url(output)
            output_bytes = _download_url(output_url)
            return output_url, output_bytes
        except Exception as exc:
            last_error = exc
            logger.exception("Replicate attempt failed: %s", exc)
            continue

    raise RuntimeError(f"Replicate transform failed: {last_error}")


# ---------------------------
# API routes
# ---------------------------
@app.post("/api/enhance")
async def enhance_face(
    file: UploadFile = File(...),
    theme: str = Form("basic"),
    prompt_strength: float = Form(0.45),
):
    normalized_theme = normalize_theme(theme)
    logger.info(
        "ENHANCE start filename=%s content_type=%s theme=%s prompt_strength=%.2f",
        file.filename,
        file.content_type,
        normalized_theme,
        prompt_strength,
    )

    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported.")

    # Save upload
    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    filename = f"{uuid4().hex}{ext}"
    source_path = UPLOADS_DIR / filename
    source_path.write_bytes(await file.read())

    # Validate image quickly
    try:
        with Image.open(source_path) as img:
            img.verify()
    except Exception as exc:
        source_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}") from exc

    prompt = THEME_PROMPTS[normalized_theme]

    try:
        output_url, enhanced_bytes = _run_flux_transform(
            image_path=source_path,
            prompt=prompt,
            prompt_strength=prompt_strength,
        )

        enhanced_name = f"enhanced_{uuid4().hex}.png"
        enhanced_path = UPLOADS_DIR / enhanced_name
        enhanced_path.write_bytes(enhanced_bytes)

        add_log(theme=normalized_theme, status="success")
        logger.info("ENHANCE success source=%s output=%s", filename, enhanced_name)

        return {
            "success": True,
            "theme": normalized_theme,
            "prompt": prompt,
            "prompt_strength": max(0.0, min(1.0, float(prompt_strength))),
            "source_filename": filename,
            "enhanced_image_url": f"/uploads/{enhanced_name}",
            "replicate_output_url": output_url,
        }
    except Exception as exc:
        add_log(theme=normalized_theme, status="failed")
        logger.exception("ENHANCE failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/admin/logs")
async def get_admin_logs():
    with LOGS_LOCK:
        logs = [entry.model_dump() for entry in LOGS]

    total_runs = len(logs)
    estimated_cost = round(total_runs * 0.01, 2)
    return {
        "success": True,
        "logs": logs,
        "total_runs": total_runs,
        "estimated_cost_usd": estimated_cost,
    }


@app.delete("/api/admin/logs")
async def clear_admin_logs():
    global NEXT_LOG_ID
    with LOGS_LOCK:
        LOGS.clear()
        NEXT_LOG_ID = 1
    return {"success": True}


# ---------------------------
# Legal docs endpoints
# ---------------------------
@app.get("/legal/terms", include_in_schema=False)
async def legal_terms():
    if not TERMS_FILE.exists():
        raise HTTPException(status_code=404, detail="TermsOfUse.md not found")
    return FileResponse(TERMS_FILE)


@app.get("/legal/accessibility", include_in_schema=False)
async def legal_accessibility():
    if not ACCESSIBILITY_FILE.exists():
        raise HTTPException(status_code=404, detail="Accessibility.md not found")
    return FileResponse(ACCESSIBILITY_FILE)


# ---------------------------
# SPA fallback routes
# ---------------------------
def serve_frontend_index() -> FileResponse:
    if not FRONTEND_INDEX.exists():
        raise HTTPException(
            status_code=503,
            detail="Frontend build not found. Run `npm run build` inside `/client` first.",
        )
    return FileResponse(path=FRONTEND_INDEX)


@app.get("/", include_in_schema=False)
async def frontend_home():
    return serve_frontend_index()


@app.get("/{full_path:path}", include_in_schema=False)
async def frontend_fallback(full_path: str):
    blocked_roots = ("api", "static", "uploads", "images", "legal")
    if full_path.startswith(blocked_roots):
        raise HTTPException(status_code=404, detail="Not found")

    return serve_frontend_index()
