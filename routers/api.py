import logging
import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from core.config import UPLOADS_DIR
from services.ai_service import analyze_image_with_gemini, enhance_face
from services.image_service import determine_orientation, save_upload_and_get_metadata

router = APIRouter(prefix="/api", tags=["api"])
logger = logging.getLogger(__name__)


class EnhanceFaceRequest(BaseModel):
    image_filename: str


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload image, extract metadata, run AI analysis, and return structured response."""
    saved_path, width, height = await save_upload_and_get_metadata(file=file, uploads_dir=UPLOADS_DIR)

    orientation = determine_orientation(width=width, height=height)
    image_bytes = saved_path.read_bytes()

    try:
        ai_analysis = analyze_image_with_gemini(
            image_bytes=image_bytes,
            mime_type=file.content_type or "image/jpeg"
        )

    except Exception as e:
        logger.exception("AI analysis failed for '%s': %s", saved_path.name, e)
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
        raise HTTPException(status_code=500, detail=f"Face enhancement failed: {e}") from e

    suffix = source_path.suffix.lower() or ".jpg"
    enhanced_name = f"enhanced_{uuid4().hex}{suffix}"
    enhanced_path = UPLOADS_DIR / enhanced_name
    enhanced_path.write_bytes(enhanced_bytes)

    return {"success": True, "enhanced_image_url": f"/uploads/{enhanced_name}"}
