import base64
import json
import logging
import os
import re
import time

import google.generativeai as genai

from core.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def _coerce_bool(value) -> bool:
    """Convert mixed JSON/LLM boolean forms into a strict bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "1"}:
            return True
        if normalized in {"false", "no", "0", "", "none", "null"}:
            return False
    return False


def _normalize_gender(value: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"male", "man", "boy", "masculine"}:
        return "Male"
    if normalized in {"female", "woman", "girl", "feminine"}:
        return "Female"
    return "Unknown/Not clear"


def _coerce_confidence(value) -> float:
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, confidence))


def parse_ai_json(raw_text: str) -> dict:
    """Parse model output into strict JSON structure."""
    cleaned = (raw_text or "").strip()

    fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, flags=re.DOTALL)
    if fenced_match:
        cleaned = fenced_match.group(1)

    if not cleaned.startswith("{"):
        object_match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if object_match:
            cleaned = object_match.group(0)

    parsed = json.loads(cleaned)

    person_detected = _coerce_bool(parsed.get("person_detected", False))
    face_detected = _coerce_bool(parsed.get("face_detected", False))
    gender = _normalize_gender(str(parsed.get("perceived_gender", "")))
    gender_confidence = _coerce_confidence(parsed.get("gender_confidence", 0))

    # Safety rule: if no person/face was detected, gender cannot be reliable.
    if not person_detected or not face_detected:
        gender = "Unknown/Not clear"
    # Conservative threshold to reduce false Male/Female labels.
    elif gender_confidence < 0.9:
        gender = "Unknown/Not clear"

    return {
        "person_detected": person_detected,
        "face_detected": face_detected,
        "perceived_gender": gender,
        "gender_confidence": gender_confidence,
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
        "perceived_gender (string: 'Male', 'Female', or 'Unknown/Not clear'), "
        "gender_confidence (number between 0 and 1). "
        "If there is no clear human person or no clear face, set person_detected=false, "
        "face_detected=false, perceived_gender='Unknown/Not clear', and gender_confidence=0. "
        "Do NOT guess gender when uncertain. Prefer 'Unknown/Not clear' over a weak guess."
    )

    model = genai.GenerativeModel("models/gemini-2.0-flash")
    payload = [
        prompt,
        {
            "mime_type": mime_type,
            "data": image_bytes,
        },
    ]
    generation_config = {
        "temperature": 0,
        "response_mime_type": "application/json",
    }

    try:
        response = model.generate_content(
            payload,
            generation_config=generation_config,
        )
    except Exception as e:
        error_message = str(e)
        is_quota_error = (
            "429" in error_message
            or "quota" in error_message.lower()
            or "rate" in error_message.lower()
        )

        if is_quota_error:
            logger.warning("Gemini quota/rate limit hit (429). Retrying once in 2 seconds...")
            time.sleep(2)
            try:
                response = model.generate_content(
                    payload,
                    generation_config=generation_config,
                )
            except Exception as retry_error:
                logger.error("Gemini analysis retry failed after 429: %s", retry_error)
                print(f"Gemini analysis failed after retry (429): {retry_error}")
                raise
        else:
            logger.error("Gemini analysis failed: %s", e)
            print(f"Gemini analysis failed: {e}")
            raise

    raw_text = response.text or ""
    try:
        parsed = parse_ai_json(raw_text)
    except Exception:
        logger.exception("Failed to parse Gemini response text: %r", raw_text)
        raise

    logger.info(
        "AI analysis parsed: person=%s face=%s gender=%s",
        parsed["person_detected"],
        parsed["face_detected"],
        parsed["perceived_gender"],
    )
    return parsed


def _extract_image_bytes_from_response(response) -> bytes:
    """
    Extract binary image bytes from a Gemini response.
    Handles common SDK part formats across model versions.
    """
    candidates = getattr(response, "candidates", None) or []
    top_level_parts = getattr(response, "parts", None) or []

    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []

        for part in parts:
            inline_data = getattr(part, "inline_data", None)
            if inline_data is not None:
                data = getattr(inline_data, "data", None)
                if isinstance(data, bytes):
                    return data
                if isinstance(data, str):
                    return base64.b64decode(data)

            # Fallback for dictionary-like part payloads.
            if isinstance(part, dict):
                inline_data = part.get("inline_data", {})
                data = inline_data.get("data")
                if isinstance(data, bytes):
                    return data
                if isinstance(data, str):
                    return base64.b64decode(data)

    # Some SDK versions expose parts directly on the response.
    for part in top_level_parts:
        inline_data = getattr(part, "inline_data", None)
        if inline_data is not None:
            data = getattr(inline_data, "data", None)
            if isinstance(data, bytes):
                return data
            if isinstance(data, str):
                return base64.b64decode(data)

    raise ValueError("No enhanced image binary data found in Gemini response.")


async def enhance_face(image_bytes: bytes, mime_type: str) -> bytes:
    """
    Perform identity-preserving facial enhancement and return enhanced image bytes.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is missing or empty.")

    # Detailed prompt to preserve identity and avoid generative drift.
    prompt = (
        "Based on this image, perform identity-preserving facial enhancement. "
        "Focus on enhancing clarity, improving skin texture, and sharpening features, "
        "but you MUST NOT alter the fundamental facial structure, identity, or expression "
        "of the person. Do not add or remove any elements."
    )

    # Provider hook for future fal.ai + GFPGAN integration.
    # Keep default path on Gemini until fal.ai pipeline is wired.
    provider = os.getenv("FACE_ENHANCER_PROVIDER", "gemini").strip().lower()
    if provider == "fal":
        raise NotImplementedError(
            "FACE_ENHANCER_PROVIDER='fal' is reserved for upcoming GFPGAN integration."
        )

    model = genai.GenerativeModel("models/gemini-2.0-flash")
    response = await model.generate_content_async(
        [
            prompt,
            {
                "mime_type": mime_type,
                "data": image_bytes,
            },
        ]
    )

    return _extract_image_bytes_from_response(response)
