import logging
import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel, Field

from core.config import UPLOADS_DIR
from services.ai_service import analyze_image_with_gemini, enhance_face
from services.replicate_service import (
    enhance_with_codeformer,
    normalize_theme,
    resolve_uploads_image_path,
    transform_with_flux,
)
from services.image_service import determine_orientation, save_upload_and_get_metadata

router = APIRouter(prefix="/api", tags=["api"])
logger = logging.getLogger(__name__)


class EnhanceFaceRequest(BaseModel):
    image_filename: str


class TransformRequest(BaseModel):
    image_url: str
    theme: str = "basic"
    prompt_strength: float = Field(default=0.45, ge=0.0, le=1.0)


@router.post("/transform")
async def transform_image(payload: TransformRequest):
    """
    Stylize an uploaded portrait using FLUX with theme prompt mapping.
    Accepts image_url + theme (strict requirement).
    """
    normalized_theme = normalize_theme(payload.theme)
    logger.info("TRANSFORM start: image_url=%s theme=%s", payload.image_url, normalized_theme)
    print(
        f"[API] /api/transform start image_url={payload.image_url} theme={normalized_theme} prompt_strength={payload.prompt_strength}"
    )

    try:
        source_path = resolve_uploads_image_path(payload.image_url, UPLOADS_DIR)
        transformed = transform_with_flux(
            image_path=source_path,
            theme=normalized_theme,
            uploads_dir=UPLOADS_DIR,
            prompt_strength=payload.prompt_strength,
            model_ref="black-forest-labs/flux-1.1-pro",
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("TRANSFORM failed: %s", exc)
        print(f"[API] /api/transform error={exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info(
        "TRANSFORM success: source=%s output=%s model=%s theme=%s",
        source_path.name,
        transformed["enhanced_filename"],
        transformed["model"],
        transformed["theme"],
    )
    print(
        f"[API] /api/transform success source={source_path.name} output={transformed['enhanced_filename']} model={transformed['model']} theme={transformed['theme']}"
    )

    return {
        "success": True,
        "source_filename": source_path.name,
        "theme": transformed["theme"],
        "prompt": transformed["prompt"],
        "model": transformed["model"],
        "prompt_strength": transformed["prompt_strength"],
        "enhanced_image_url": f"/uploads/{transformed['enhanced_filename']}",
        "replicate_output_url": transformed["output_url"],
    }


@router.post("/enhance")
async def enhance_image(file: UploadFile = File(...), theme: str = Form("basic")):
    """
    Enhance uploaded face image with Replicate CodeFormer after client-side face detection.
    """
    normalized_theme = normalize_theme(theme)
    logger.info(
        "ENHANCE(v2) start: filename=%s content_type=%s theme=%s",
        file.filename,
        file.content_type,
        normalized_theme,
    )
    print(
        f"[API] /api/enhance start filename={file.filename} content_type={file.content_type} theme={normalized_theme}"
    )

    saved_path, width, height = await save_upload_and_get_metadata(file=file, uploads_dir=UPLOADS_DIR)

    try:
        enhanced = enhance_with_codeformer(
            image_path=saved_path,
            theme=normalized_theme,
            uploads_dir=UPLOADS_DIR,
        )
    except Exception as exc:
        logger.exception("ENHANCE(v2) failed: %s", exc)
        print(f"[API] /api/enhance error={exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info(
        "ENHANCE(v2) success: source=%s enhanced=%s theme=%s",
        saved_path.name,
        enhanced["enhanced_filename"],
        enhanced["theme"],
    )
    print(
        f"[API] /api/enhance success source={saved_path.name} enhanced={enhanced['enhanced_filename']} theme={enhanced['theme']}"
    )

    return {
        "success": True,
        "source_filename": saved_path.name,
        "width": width,
        "height": height,
        "theme": enhanced["theme"],
        "theme_prompt": enhanced["theme_prompt"],
        "enhanced_image_url": f"/uploads/{enhanced['enhanced_filename']}",
        "replicate_output_url": enhanced["output_url"],
    }


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload image, extract metadata, run AI analysis, and return structured response."""
    logger.info(
        "UPLOAD start: filename=%s content_type=%s",
        file.filename,
        file.content_type,
    )
    print(f"[API] /api/upload start filename={file.filename} content_type={file.content_type}")

    saved_path, width, height = await save_upload_and_get_metadata(file=file, uploads_dir=UPLOADS_DIR)
    logger.info(
        "UPLOAD saved: stored_filename=%s width=%s height=%s",
        saved_path.name,
        width,
        height,
    )
    print(f"[API] /api/upload saved stored_filename={saved_path.name} width={width} height={height}")

    orientation = determine_orientation(width=width, height=height)
    image_bytes = saved_path.read_bytes()

    try:
        ai_analysis = analyze_image_with_gemini(
            image_bytes=image_bytes,
            mime_type=file.content_type or "image/jpeg"
        )
        logger.info("UPLOAD ai_analysis: %s", ai_analysis)
        print(f"[API] /api/upload ai_analysis={ai_analysis}")

    except Exception as e:
        logger.exception("AI analysis failed for '%s': %s", saved_path.name, e)
        print(f"[API] /api/upload ai_analysis_error={e}")
        ai_analysis = {
            "person_detected": False,
            "face_detected": False,
            "perceived_gender": "Unknown/Not clear",
        }

    return {
        "success": True,
        "filename": saved_path.name,
        "file_url": f"/uploads/{saved_path.name}",
        "width": width,
        "height": height,
        "orientation": orientation,
        "ai_analysis": ai_analysis,
    }


@router.post("/enhance-face")
async def enhance_face_endpoint(payload: EnhanceFaceRequest):
    """
    Enhance facial details while preserving identity and return a new image URL.
    """
    logger.info("ENHANCE start: image_filename=%s", payload.image_filename)
    print(f"[API] /api/enhance-face start image_filename={payload.image_filename}")

    source_path = (UPLOADS_DIR / Path(payload.image_filename).name).resolve()
    uploads_root = UPLOADS_DIR.resolve()

    # Prevent path traversal and missing file errors.
    if uploads_root not in source_path.parents or not source_path.exists():
        raise HTTPException(status_code=404, detail="Source image not found.")

    source_bytes = source_path.read_bytes()
    mime_type = mimetypes.guess_type(source_path.name)[0] or "image/jpeg"

    try:
        enhanced_bytes = await enhance_face(image_bytes=source_bytes, mime_type=mime_type)
    except Exception as e:
        logger.exception("Face enhancement failed for '%s': %s", source_path.name, e)
        print(f"[API] /api/enhance-face error source={source_path.name} error={e}")
        raise HTTPException(status_code=500, detail=f"Face enhancement failed: {e}") from e

    suffix = source_path.suffix.lower() or ".jpg"
    enhanced_name = f"enhanced_{uuid4().hex}{suffix}"
    enhanced_path = UPLOADS_DIR / enhanced_name
    enhanced_path.write_bytes(enhanced_bytes)
    logger.info("ENHANCE success: output=%s", enhanced_name)
    print(f"[API] /api/enhance-face success output={enhanced_name}")

    return {"success": True, "enhanced_image_url": f"/uploads/{enhanced_name}"}
