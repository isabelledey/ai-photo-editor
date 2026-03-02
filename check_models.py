import os

from dotenv import load_dotenv
import google.generativeai as genai


def main() -> None:
    # Load environment variables from .env
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        print("GEMINI_API_KEY is missing or empty in .env")
        return

    # Configure Gemini client
    genai.configure(api_key=api_key)

    print("Models that support generateContent:\n")

    # List models and print those supporting generateContent
    for model in genai.list_models():
        methods = getattr(model, "supported_generation_methods", []) or []
        if "generateContent" not in methods:
            continue

        name = getattr(model, "name", "")
        lowered = name.lower()
        mark = " ⭐" if any(tag in lowered for tag in ("flash", "vision", "pro")) else ""
        print(f"{name}{mark}")


if __name__ == "__main__":
    main()
