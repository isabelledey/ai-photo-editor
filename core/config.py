from pathlib import Path

from dotenv import load_dotenv
import os

# Load variables from .env into process environment.
load_dotenv()

# Core paths.
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
UPLOADS_DIR = BASE_DIR / "uploads"

# Environment configuration.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Ensure runtime directories exist.
STATIC_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
