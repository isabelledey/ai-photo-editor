import os
from pathlib import Path

from dotenv import load_dotenv

# Core paths.
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
UPLOADS_DIR = BASE_DIR / "uploads"

# Load variables from the project .env explicitly.
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Environment configuration.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Ensure runtime directories exist.
STATIC_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
