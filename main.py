from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from core.config import STATIC_DIR, TEMPLATES_DIR, UPLOADS_DIR
from routers.api import router as api_router

app = FastAPI(title="AI Stylist App")
FRONTEND_INDEX = TEMPLATES_DIR / "index.html"

# Static files and uploaded files exposure.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
# Compatibility mount: older frontend bundles may request public images from /images/*
app.mount("/images", StaticFiles(directory=STATIC_DIR / "images"), name="images")

# API route registration.
app.include_router(api_router)


def serve_frontend_index() -> FileResponse:
    """Serve the compiled React entrypoint exported by Vite."""
    if not FRONTEND_INDEX.exists():
        raise HTTPException(
            status_code=503,
            detail="Frontend build not found. Run `npm run build` inside `/client` first.",
        )
    return FileResponse(path=FRONTEND_INDEX)


@app.get("/", include_in_schema=False)
async def frontend_home():
    return serve_frontend_index()


@app.get("/app", include_in_schema=False)
async def frontend_app():
    return serve_frontend_index()


@app.get("/{full_path:path}", include_in_schema=False)
async def frontend_fallback(full_path: str):
    """
    SPA fallback for client-side routes, while preserving /api, /static, and /uploads.
    """
    blocked_roots = ("api", "static", "uploads", "images")
    if full_path.startswith(blocked_roots):
        raise HTTPException(status_code=404, detail="Not found")

    return serve_frontend_index()
