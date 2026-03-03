import mimetypes
import os
import urllib.request
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageEnhance
import logging

from core.config import REPLICATE_API_TOKEN

logger = logging.getLogger(__name__)

THEME_PROMPTS: dict[str, str] = {
    "basic": "standard CodeFormer restoration",
    "festival": "colorful festival glitter, vibrant lighting",
    "fantasy": "ethereal glow, cinematic fantasy lighting",
    "corporate": "professional studio headshot, sharp focus",
}

# Try pinned versions first (more stable), then fallback to model slug.
DEFAULT_CODEFORMER_MODELS = [
    os.getenv("CODEFORMER_MODEL", "sczhou/codeformer:27778a621403be737f3b7dc4f1e355f9cc8e856e733b1900a587015f400d0b17"),
    "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
    "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
    "sczhou/codeformer",
]


def normalize_theme(theme: str) -> str:
    normalized = (theme or "").strip().lower()
    return normalized if normalized in THEME_PROMPTS else "basic"


def _extract_output_url(output) -> str:
    if isinstance(output, (list, tuple)) and output:
        first = output[0]
    else:
        first = output

    if isinstance(first, str):
        return first

    url = getattr(first, "url", None)
    if callable(url):
        return str(url())
    if isinstance(url, str):
        return url

    raise ValueError("Replicate did not return a valid output URL.")


def _download_output(url: str) -> bytes:
    with urllib.request.urlopen(url) as response:
        return response.read()


def _apply_theme_postprocess(image_bytes: bytes, theme: str) -> bytes:
    """
    Apply lightweight style tuning per theme after CodeFormer restoration.
    CodeFormer itself does not accept free-text prompts.
    """
    normalized_theme = normalize_theme(theme)

    with Image.open(BytesIO(image_bytes)) as image:
        result = image.convert("RGB")

        if normalized_theme == "festival":
            result = ImageEnhance.Color(result).enhance(1.25)
            result = ImageEnhance.Brightness(result).enhance(1.07)
            result = ImageEnhance.Contrast(result).enhance(1.08)
        elif normalized_theme == "fantasy":
            result = ImageEnhance.Color(result).enhance(1.15)
            result = ImageEnhance.Brightness(result).enhance(1.05)
            result = ImageEnhance.Contrast(result).enhance(1.12)
        elif normalized_theme == "corporate":
            result = ImageEnhance.Color(result).enhance(0.95)
            result = ImageEnhance.Contrast(result).enhance(1.10)
            result = ImageEnhance.Sharpness(result).enhance(1.20)

        output_buffer = BytesIO()
        result.save(output_buffer, format="PNG")
        return output_buffer.getvalue()


def enhance_with_codeformer(image_path: Path, theme: str, uploads_dir: Path) -> dict:
    """
    Run CodeFormer on Replicate and store enhanced image in uploads_dir.

    Note: sczhou/codeformer does not natively support free-text prompts.
    We still track and return the selected theme prompt for downstream styling pipelines.
    """
    if not REPLICATE_API_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN is missing. Add it to your .env file.")

    try:
        import replicate  # lazy import so app can run even when package is not installed
    except Exception as exc:
        raise RuntimeError(
            "The `replicate` package is not installed. Install it with `pip install replicate`."
        ) from exc

    normalized_theme = normalize_theme(theme)
    theme_prompt = THEME_PROMPTS[normalized_theme]

    client = replicate.Client(api_token=REPLICATE_API_TOKEN)

    output = None
    last_error: Exception | None = None
    attempted_models: list[str] = []

    for model_ref in DEFAULT_CODEFORMER_MODELS:
        if not model_ref:
            continue

        attempted_models.append(model_ref)
        logger.info("Replicate attempt: model=%s image=%s", model_ref, image_path.name)
        print(f"[Replicate] attempt model={model_ref} image={image_path.name}")

        try:
            with image_path.open("rb") as source_file:
                output = client.run(
                    model_ref,
                    input={
                        "image": source_file,
                        "codeformer_fidelity": 0.7,
                        "background_enhance": True,
                        "face_upsample": True,
                        "upscale": 2,
                    },
                )
            logger.info("Replicate success: model=%s", model_ref)
            print(f"[Replicate] success model={model_ref}")
            break
        except Exception as exc:
            last_error = exc
            logger.exception("Replicate failed for model=%s: %s", model_ref, exc)
            print(f"[Replicate] failed model={model_ref} error={exc}")
            continue

    if output is None:
        raise RuntimeError(
            f"Replicate CodeFormer failed for all model refs: {attempted_models}. Last error: {last_error}"
        )

    output_url = _extract_output_url(output)
    enhanced_bytes = _download_output(output_url)
    enhanced_bytes = _apply_theme_postprocess(enhanced_bytes, normalized_theme)

    extension = mimetypes.guess_extension(mimetypes.guess_type(image_path.name)[0] or "") or ".png"
    enhanced_name = f"enhanced_{uuid4().hex}{extension}"
    enhanced_path = uploads_dir / enhanced_name
    enhanced_path.write_bytes(enhanced_bytes)

    return {
        "theme": normalized_theme,
        "theme_prompt": theme_prompt,
        "enhanced_filename": enhanced_name,
        "output_url": output_url,
    }
