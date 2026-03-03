import mimetypes
import os
import urllib.request
from io import BytesIO
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse

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

FLUX_MODEL_REFS = [
    os.getenv("FLUX_MODEL", "black-forest-labs/flux-1.1-pro"),
    "black-forest-labs/flux-1.1-pro",
]

THEME_STYLIZER_PROMPTS: dict[str, str] = {
    "basic": "high-end professional retouch, natural skin texture, masterpiece",
    "festival": "festival makeup, holographic glitter on cheekbones, vibrant neon festival lighting, high fashion",
    "fantasy": "ethereal fantasy makeup, soft glowing skin, cinematic mystical lighting, fairy-tale aesthetic",
    "corporate": "professional corporate makeup, clean studio lighting, business portrait",
}


def normalize_theme(theme: str) -> str:
    normalized = (theme or "").strip().lower()
    return normalized if normalized in THEME_PROMPTS else "basic"


def _is_not_found_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "404" in message or "not found" in message


def resolve_uploads_image_path(image_url: str, uploads_dir: Path) -> Path:
    """
    Resolve a frontend image URL into a safe local file path under uploads_dir.
    """
    parsed = urlparse((image_url or "").strip())
    path_value = parsed.path or ""
    # Accept plain filename, /uploads/filename, or full URL ending with /uploads/filename.
    filename = Path(path_value).name if path_value else Path(image_url or "").name
    candidate = (uploads_dir / filename).resolve()
    uploads_root = uploads_dir.resolve()
    if uploads_root not in candidate.parents or not candidate.exists():
        raise FileNotFoundError(f"Image not found in uploads: {image_url}")
    return candidate


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


def _run_replicate_with_model_fallback(client, model_refs: list[str], input_payload: dict):
    last_error: Exception | None = None
    for model_ref in model_refs:
        if not model_ref:
            continue
        logger.info("Replicate attempt: model=%s", model_ref)
        print(f"[Replicate] attempt model={model_ref}")
        try:
            output = client.run(model_ref, input=input_payload)
            logger.info("Replicate success: model=%s", model_ref)
            print(f"[Replicate] success model={model_ref}")
            return output, model_ref
        except Exception as exc:
            last_error = exc
            logger.exception("Replicate failed for model=%s: %s", model_ref, exc)
            print(f"[Replicate] failed model={model_ref} error={exc}")
    raise RuntimeError(
        f"Replicate failed for all model refs={model_refs}. Last error: {last_error}"
    )


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

    with image_path.open("rb") as source_file:
        output, _ = _run_replicate_with_model_fallback(
            client=client,
            model_refs=DEFAULT_CODEFORMER_MODELS,
            input_payload={
                "image": source_file,
                "codeformer_fidelity": 0.7,
                "background_enhance": True,
                "face_upsample": True,
                "upscale": 2,
            },
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


def transform_with_flux(
    image_path: Path,
    theme: str,
    uploads_dir: Path,
    prompt_strength: float = 0.45,
    model_ref: str = "black-forest-labs/flux-1.1-pro",
) -> dict:
    """
    Stylize an uploaded portrait using FLUX image-to-image.
    """
    if not REPLICATE_API_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN is missing. Add it to your .env file.")

    try:
        import replicate
    except Exception as exc:
        raise RuntimeError(
            "The `replicate` package is not installed. Install it with `pip install replicate`."
        ) from exc

    normalized_theme = normalize_theme(theme)
    strength = max(0.0, min(1.0, float(prompt_strength)))
    prompt = THEME_STYLIZER_PROMPTS[normalized_theme]
    client = replicate.Client(api_token=REPLICATE_API_TOKEN)

    output = None
    used_model = ""
    last_error: Exception | None = None

    model_refs = [model_ref] if model_ref else FLUX_MODEL_REFS
    for model_ref in model_refs:
        if not model_ref:
            continue

        # Keep strength fixed at 0.45 while trying input field variants for model compatibility.
        payload_candidates: list[dict] = [
            {
                "prompt": prompt,
                "image": None,  # filled below with file handle
                "prompt_strength": strength,
                "output_format": "png",
            },
            {
                "prompt": prompt,
                "image_prompt": None,  # filled below with file handle
                "prompt_strength": strength,
                "output_format": "png",
            },
            {
                "prompt": prompt,
                "input_image": None,  # filled below with file handle
                "strength": strength,
                "output_format": "png",
            },
            {
                "prompt": prompt,
                "input_images": [],  # filled below with file handle
                "image_prompt_strength": strength,
                "output_format": "png",
            },
        ]

        for payload in payload_candidates:
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

                    logger.info("Replicate FLUX attempt: model=%s payload_keys=%s", model_ref, list(payload.keys()))
                    print(f"[Replicate] FLUX attempt model={model_ref} payload_keys={list(payload.keys())}")
                    output = client.run(model_ref, input=payload)

                used_model = model_ref
                logger.info("Replicate FLUX success: model=%s", model_ref)
                print(f"[Replicate] FLUX success model={model_ref}")
                break
            except Exception as exc:
                last_error = exc
                logger.exception("Replicate FLUX failed for model=%s: %s", model_ref, exc)
                print(f"[Replicate] FLUX failed model={model_ref} error={exc}")
                if _is_not_found_error(exc):
                    # Model ref itself is unavailable for this account/api key.
                    break
                continue

        if output is not None:
            break

    if output is None:
        raise RuntimeError(f"FLUX transform failed for models={model_refs}. Last error: {last_error}")

    output_url = _extract_output_url(output)
    stylized_bytes = _download_output(output_url)

    enhanced_name = f"stylized_{uuid4().hex}.png"
    enhanced_path = uploads_dir / enhanced_name
    enhanced_path.write_bytes(stylized_bytes)

    return {
        "theme": normalized_theme,
        "prompt": prompt,
        "enhanced_filename": enhanced_name,
        "output_url": output_url,
        "model": used_model,
        "prompt_strength": strength,
    }
