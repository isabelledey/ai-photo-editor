from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError


def determine_orientation(width: int, height: int) -> str:
    """Determine orientation label from dimensions."""
    if width > height:
        return "Landscape"
    if height > width:
        return "Portrait"
    return "Square"


async def save_upload_and_get_metadata(file: UploadFile, uploads_dir: Path) -> tuple[Path, int, int]:
    """
    Validate, save upload with UUID filename, and return (saved_path, width, height).
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed.")

    suffix = Path(file.filename or "").suffix.lower()
    safe_filename = f"{uuid4().hex}{suffix if suffix else '.bin'}"
    destination = uploads_dir / safe_filename

    content = await file.read()
    destination.write_bytes(content)

    try:
        with Image.open(destination) as img:
            width, height = img.size
    except UnidentifiedImageError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc

    return destination, width, height
