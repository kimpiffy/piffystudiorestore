import json
import logging
import random
import re
import threading
from collections import deque

import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

logger = logging.getLogger(__name__)

RECENT_PROMPTS = deque(maxlen=60)
RECENT_LOCK = threading.Lock()

DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_TEMPERATURE = 0.95
OPENAI_ATTEMPTS = 4

PROMPT_FAMILIES = [
    "psychological",
    "exercise",
    "perceptual",
    "transformation",
    "research",
]
FAMILY_WEIGHTS = [40, 30, 12, 12, 6]


def _normalize(text: str) -> str:
    compact = re.sub(r"[^a-z0-9 ]", "", text.lower())
    return re.sub(r"\s+", " ", compact).strip()


def _recent_list() -> list[str]:
    with RECENT_LOCK:
        return list(RECENT_PROMPTS)


def _remember(prompt: str) -> None:
    with RECENT_LOCK:
        RECENT_PROMPTS.append(_normalize(prompt))


def _is_similar(candidate: str, recent: list[str]) -> bool:
    norm = _normalize(candidate)
    if norm in recent:
        return True

    words = set(norm.split())
    for existing in recent:
        existing_words = set(existing.split())
        if not existing_words:
            continue
        overlap = len(words & existing_words) / max(
            len(words | existing_words),
            1,
        )
        if overlap > 0.7:
            return True
    return False


def _clean(text: str) -> str:
    text = re.sub(r'^[\s"\'“”]+|[\s"\'“”]+$', "", text.strip())
    text = re.sub(r"\s+", " ", text)
    text = re.split(r"[\n\r]", text)[0]

    words = re.findall(r"[A-Za-z0-9']+", text)
    if len(words) > 14:
        text = " ".join(words[:14])

    return text.rstrip(".!?") + "."


def _valid(prompt: str) -> bool:
    word_count = len(re.findall(r"[A-Za-z0-9']+", prompt))
    if word_count < 4 or word_count > 14:
        return False

    banned = [
        r"\b(therapy|healing|trauma|mindset|manifest)\b",
        r"\b(ballroom|gown|dance|ceremonial|ritual)\b",
        r"\b(nearest object|household item)\b",
    ]
    return not any(re.search(pattern, prompt, re.I) for pattern in banned)


def _get_temp(request) -> float:
    raw = request.GET.get("temperature") or getattr(
        settings,
        "OPENAI_PROMPT_TEMPERATURE",
        DEFAULT_TEMPERATURE,
    )
    try:
        value = float(raw)
    except (TypeError, ValueError):
        value = DEFAULT_TEMPERATURE
    return max(0.0, min(2.0, value))


def _fallback() -> str:
    recent = _recent_list()
    pool = [
        "Draw the part that does not quite belong.",
        "Something in the image is slightly wrong.",
        "Let one detail disrupt everything else.",
        "Draw what feels almost but not fully remembered.",
        "Something is missing but still shaping the whole.",
        "Revisit an old drawing and work from the weakest part.",
        "Use colours you usually avoid.",
        "Draw without looking at the paper.",
        "Remove the most obvious element and continue.",
        "Repeat one form until it changes meaning.",
        "Notice something nearby and distort it slightly.",
        "Draw something you just saw from memory.",
        "Focus on what you usually ignore and follow it.",
        "Observe something briefly, then alter it.",
        "Let one form become something else halfway through.",
        "Break the symmetry and follow the imbalance.",
        "Combine two incompatible elements into one form.",
        "Look up an unfamiliar diagram and draw its logic.",
    ]
    random.shuffle(pool)

    for prompt in pool:
        cleaned = _clean(prompt)
        if _valid(cleaned) and not _is_similar(cleaned, recent):
            _remember(cleaned)
            return cleaned

    return "Draw what feels slightly wrong."


def _build_payload(
    model: str,
    temp: float,
    family: str,
    recent: list[str],
) -> dict:
    system = f"""
You generate short creative prompts that make someone want to draw.

These are not assignments.
They are psychologically engaging starting points.

Each prompt:
- one sentence
- 4-14 words
- usable immediately
- open enough for interpretation
- implies drawing without over-explaining

Balance:
- usability FIRST
- psychological engagement SECOND

Prompt family: {family}

Families:
psychological -> tension, ambiguity, projection
exercise -> practical drawing move
perceptual -> observation or memory
transformation -> mutation, substitution, distortion
research -> rare reference-based inspiration

Avoid:
- theatrical imagery (ballrooms, gowns, performance)
- household-object fixation
- vague poetic nonsense
- step-by-step instructions

Make it feel:
- slightly uncomfortable
- intriguing
- worth doing

Return JSON only.
"""

    user = f"""
Generate one prompt.

Avoid repeating:
{recent}

Make it feel alive and drawable.
"""

    return {
        "model": model,
        "input": [
            {
                "role": "developer",
                "content": [{"type": "input_text", "text": system}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": user}],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "prompt",
                "schema": {
                    "type": "object",
                    "properties": {"prompt": {"type": "string"}},
                    "required": ["prompt"],
                },
            }
        },
        "temperature": temp,
    }


def _openai(request) -> str | None:
    key = getattr(settings, "OPENAI_API_KEY", "").strip()
    if not key:
        return None

    model = getattr(settings, "OPENAI_PROMPT_MODEL", DEFAULT_MODEL)
    temp = _get_temp(request)
    recent = _recent_list()[-10:]

    for _ in range(OPENAI_ATTEMPTS):
        family = random.choices(PROMPT_FAMILIES, weights=FAMILY_WEIGHTS)[0]
        payload = _build_payload(model, temp, family, recent)

        response = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        response.raise_for_status()

        data = response.json()

        try:
            raw = data["output"][0]["content"][0]["text"]
            parsed = json.loads(raw)
            prompt = _clean(parsed.get("prompt", ""))
        except (KeyError, IndexError, TypeError, json.JSONDecodeError):
            continue

        if not prompt:
            continue
        if not _valid(prompt):
            continue
        if _is_similar(prompt, recent):
            continue

        _remember(prompt)
        return prompt

    return None


@require_GET
def creative_prompt(request):
    try:
        prompt = _openai(request)
        if prompt:
            return JsonResponse({"prompt": prompt, "source": "openai"})
    except requests.RequestException as exc:
        logger.warning("OpenAI request failed: %s", exc)
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("OpenAI response parsing failed: %s", exc)

    return JsonResponse({"prompt": _fallback(), "source": "fallback"})
