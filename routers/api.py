from fastapi import APIRouter, UploadFile, File

from core.config import UPLOADS_DIR
from services.ai_service import analyze_image_with_gemini
from services.image_service import determine_orientation, save_upload_and_get_metadata

router = APIRouter(prefix="/api", tags=["api"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload image, extract metadata, run AI analysis, and return structured response."""
    saved_path, width, height = await save_upload_and_get_metadata(file=file, uploads_dir=UPLOADS_DIR)

    orientation = determine_orientation(width=width, height=height)
    image_bytes = saved_path.read_bytes()

    try:
        ai_analysis = analyze_image_with_gemini(image_bytes=image_bytes, mime_type=file.content_type or "image/*")
    except Exception:
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
