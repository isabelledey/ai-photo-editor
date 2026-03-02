from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    """Render landing page."""
    return request.app.state.templates.TemplateResponse("index.html", {"request": request})


@router.get("/app", response_class=HTMLResponse)
async def app_page(request: Request):
    """Render main application page."""
    return request.app.state.templates.TemplateResponse("app.html", {"request": request})
