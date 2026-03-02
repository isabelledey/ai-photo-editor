from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from core.config import STATIC_DIR, TEMPLATES_DIR, UPLOADS_DIR
from routers.api import router as api_router
from routers.pages import router as pages_router

app = FastAPI(title="AI Stylist App")

# Static files and uploaded files exposure.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Template engine shared through application state.
app.state.templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Route registration.
app.include_router(pages_router)
app.include_router(api_router)
