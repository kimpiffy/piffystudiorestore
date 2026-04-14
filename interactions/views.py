import logging
import random
import re

import requests

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET


logger = logging.getLogger(__name__)


def _fallback_prompt() -> str:
    starters = [
        "Create",
        "Design",
        "Capture",
        "Imagine",
        "Build",
        "Compose",
    ]
    subjects = [
        "a surreal lilac portrait",
        "a dreamy mixed-media poster",
        "a nostalgic art print",
        "a luminous collage scene",
        "a playful editorial illustration",
        "a cinematic zine cover",
    ]
    details = [
        "with soft neon accents and tactile texture",
        "that feels handmade, intimate, and slightly mysterious",
        "layered with unexpected shadows and gentle motion",
        "that balances elegance, warmth, and a little chaos",
        "using bold shapes, grain, and an offbeat colour palette",
        "with a sense of motion that stops just before a dream ends",
    ]
    return (
        f"{random.choice(starters)} {random.choice(subjects)} "
        f"{random.choice(details)}."
    )


def _clean_prompt(text: str) -> str:
    text = re.sub(r"^[\s\"'“”]+|[\s\"'“”]+$", "", text.strip())
    text = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)[0].strip()
    return text.rstrip(".") + "."


def _openai_prompt() -> str | None:
    api_key = getattr(settings, "OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    model = getattr(settings, "OPENAI_PROMPT_MODEL", "gpt-4o-mini")
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You write one-sentence creative prompts for an artist's "
                    "inspiration widget. Return exactly one sentence, with "
                    "no bullet points, no headings, and no extra commentary."
                ),
            },
            {
                "role": "user",
                "content": "Generate a fresh, vivid creative prompt.",
            },
        ],
        "temperature": 1.1,
        "max_tokens": 60,
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None

    cleaned = _clean_prompt(content)
    return cleaned if cleaned else None


@require_GET
def creative_prompt(request):
    try:
        prompt = _openai_prompt() or _fallback_prompt()
        source = (
            "openai"
            if getattr(settings, "OPENAI_API_KEY", "").strip()
            else "fallback"
        )
    except requests.RequestException as exc:
        logger.warning("Prompt generation fell back after API error: %s", exc)
        prompt = _fallback_prompt()
        source = "fallback"

    return JsonResponse({"prompt": prompt, "source": source})
