from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Define core project directories relative to this file.
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
UPLOADS_DIR = BASE_DIR / "uploads"

# Ensure expected runtime folders exist.
STATIC_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="AI Image Editor")

# Expose static assets (css/js) at /static.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Expose uploaded files so the frontend can preview uploaded images.
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Configure Jinja2 template loader.
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.get("/", response_class=HTMLResponse)
async def render_home(request: Request):
    """Render the main page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Accept a single image file, save it using a UUID-based filename,
    and return metadata for frontend preview.
    """
    # Basic MIME validation (e.g., image/png, image/jpeg).
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed.")

    # Keep original extension if present; otherwise default to .bin.
    suffix = Path(file.filename or "").suffix.lower()
    safe_filename = f"{uuid4().hex}{suffix if suffix else '.bin'}"
    destination = UPLOADS_DIR / safe_filename

    # Write the uploaded bytes to disk.
    content = await file.read()
    destination.write_bytes(content)

    return {
        "success": True,
        "file_path": str(destination),
        "file_url": f"/uploads/{safe_filename}",
    }
