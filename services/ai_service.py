import json
import logging
import re

import google.generativeai as genai

from core.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)


def parse_ai_json(raw_text: str) -> dict:
    """Parse model output into strict JSON structure."""
    cleaned = (raw_text or "").strip()

    fenced_match = re.search(r"```(?:json)?\\s*(\{.*?\})\\s*```", cleaned, flags=re.DOTALL)
    if fenced_match:
        cleaned = fenced_match.group(1)

    if not cleaned.startswith("{"):
        object_match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if object_match:
            cleaned = object_match.group(0)

    parsed = json.loads(cleaned)

    person_detected = bool(parsed.get("person_detected", False))
    face_detected = bool(parsed.get("face_detected", False))
    gender = str(parsed.get("perceived_gender", "Unknown/Not clear")).strip() or "Unknown/Not clear"

    allowed_genders = {"Male", "Female", "Unknown/Not clear"}
    if gender not in allowed_genders:
        gender = "Unknown/Not clear"

    return {
        "person_detected": person_detected,
        "face_detected": face_detected,
        "perceived_gender": gender,
    }


def analyze_image_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Run Gemini image analysis and return normalized JSON fields."""
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is missing or empty. Check your .env loading and key value.")
        return {
            "person_detected": False,
            "face_detected": False,
            "perceived_gender": "Unknown/Not clear",
        }

    prompt = (
        "Analyze this image and respond with ONLY valid JSON (no markdown, no extra text). "
        "Use exactly these keys: person_detected (boolean), face_detected (boolean), "
        "perceived_gender (string: 'Male', 'Female', or 'Unknown/Not clear')."
    )

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(
        [
            prompt,
            {
                "mime_type": mime_type,
                "data": image_bytes,
            },
        ]
    )

    return parse_ai_json(response.text or "")
