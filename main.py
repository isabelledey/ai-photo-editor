import json
import os
import re
from pathlib import Path
from uuid import uuid4

import google.generativeai as genai
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image, UnidentifiedImageError

# Define core project directories relative to this file.
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
UPLOADS_DIR = BASE_DIR / "uploads"

# Ensure expected runtime folders exist.
STATIC_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# Load Gemini API key from env; fallback placeholder for local setup.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")

app = FastAPI(title="AI Image Editor")

# Expose static assets (css/js) at /static.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Expose uploaded files so the frontend can preview uploaded images.
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Configure Jinja2 template loader.
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


def determine_orientation(width: int, height: int) -> str:
    """Return image orientation label from dimensions."""
    if width > height:
        return "Landscape"
    if height > width:
        return "Portrait"
    return "Square"


def parse_ai_json(raw_text: str) -> dict:
    """Parse AI output as JSON, supporting markdown-wrapped JSON blocks."""
    cleaned = raw_text.strip()

    # If model returns ```json ... ```, extract only the JSON body.
    fenced_match = re.search(r"```(?:json)?\\s*(\{.*?\})\\s*```", cleaned, flags=re.DOTALL)
    if fenced_match:
        cleaned = fenced_match.group(1)

    # Fallback to first JSON object in text.
    if not cleaned.startswith("{"):
        object_match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if object_match:
            cleaned = object_match.group(0)

    parsed = json.loads(cleaned)

    # Normalize schema and data types for predictable frontend usage.
    person_detected = bool(parsed.get("person_detected", False))
    face_detected = bool(parsed.get("face_detected", False))
    gender = str(parsed.get("perceived_gender", "Unknown/Not clear")).strip() or "Unknown/Not clear"

    allowed_genders = {"Male", "Female", "Unknown/Not clear"}
    if gender not in allowed_genders:
        gender = "Unknown/Not clear"

    return {
        "person_detected": person_detected,
        "face_detected": face_detected,
        "perceived_gender": gender,
    }


def analyze_image_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Call Gemini to analyze whether the image contains a person/face and perceived gender."""
    prompt = (
        "Analyze this image and respond with ONLY valid JSON (no markdown, no extra text). "
        "Use exactly these keys: person_detected (boolean), face_detected (boolean), "
        "perceived_gender (string: 'Male', 'Female', or 'Unknown/Not clear')."
    )

    # If no real API key is configured, return safe defaults.
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
        return {
            "person_detected": False,
            "face_detected": False,
            "perceived_gender": "Unknown/Not clear",
        }

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    response = model.generate_content(
        [
            prompt,
            {
                "mime_type": mime_type,
                "data": image_bytes,
            },
        ]
    )

    # Parse model output into strict JSON schema.
    return parse_ai_json(response.text or "")


@app.get("/", response_class=HTMLResponse)
async def render_home(request: Request):
    """Render the main page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Accept a single image file, save it, extract image metadata,
    run Gemini analysis, and return a structured JSON response.
    """
    # Basic MIME validation (e.g., image/png, image/jpeg).
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed.")

    suffix = Path(file.filename or "").suffix.lower()
    safe_filename = f"{uuid4().hex}{suffix if suffix else '.bin'}"
    destination = UPLOADS_DIR / safe_filename

    # Read uploaded data once, then persist it.
    image_bytes = await file.read()
    destination.write_bytes(image_bytes)

    # Open saved image and collect size/orientation.
    try:
        with Image.open(destination) as img:
            width, height = img.size
    except UnidentifiedImageError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc

    orientation = determine_orientation(width, height)

    # Run AI analysis. If AI call fails, return explicit fallback values.
    try:
        ai_analysis = analyze_image_with_gemini(image_bytes=image_bytes, mime_type=file.content_type)
    except Exception:
        ai_analysis = {
            "person_detected": False,
            "face_detected": False,
            "perceived_gender": "Unknown/Not clear",
        }

    return {
        "success": True,
        "filename": safe_filename,
        "file_url": f"/uploads/{safe_filename}",
        "width": width,
        "height": height,
        "orientation": orientation,
        "ai_analysis": ai_analysis,
    }
