import json
from urllib.parse import urljoin

from django.conf import settings
from django.templatetags.static import static


DEFAULT_SITE_NAME = "Kim Piffy"
DEFAULT_DESCRIPTION = (
    "Kim Piffy is a UK-based multidisciplinary artist and web designer creating "
    "immersive installations, sensory and light-based artwork, creative-health "
    "projects, community workshops and distinctive digital experiences."
)

PRIVATE_OR_TRANSACTIONAL_PREFIXES = (
    "/admin/",
    "/accounts/",
    "/shop/manage/",
    "/shop/cart/",
    "/shop/add-to-cart/",
    "/shop/remove-from-cart/",
    "/shop/update-cart-item/",
    "/shop/create-checkout-session/",
    "/shop/thank-you/",
    "/shop/cancel/",
    "/shop/webhook/",
    "/shop/webhooks/",
    "/interactions/",
)

PROJECT_SEO_FIELDS = [
    "project_title",
    "seo_description",
    "project_type",
    "year",
    "location",
    "commissioner",
    "collaborator",
    "photographer",
    "media_materials",
    "accessibility_approach",
    "audience_or_participants",
    "project_outcomes",
    "primary_image",
    "image_alt_text",
    "image_credit",
    "canonical_slug",
    "social_sharing_image",
]


PROJECT_SEO_TITLE_PATTERN = "{project_name} - {project_type} | Kim Piffy"


def build_project_seo_title(project_name: str, project_type: str) -> str:
    return PROJECT_SEO_TITLE_PATTERN.format(
        project_name=project_name.strip(),
        project_type=project_type.strip(),
    )


def _normalized_host(host: str) -> str:
    return host.split(":")[0].strip().lower()


def canonical_base_url() -> str:
    return settings.SEO_CANONICAL_BASE_URL.rstrip("/")


def canonical_url(request, path: str | None = None) -> str:
    target_path = path or request.path or "/"
    if not target_path.startswith("/"):
        target_path = f"/{target_path}"
    return urljoin(f"{canonical_base_url()}/", target_path.lstrip("/"))


def absolute_static_url(path: str) -> str:
    return urljoin(f"{canonical_base_url()}/", static(path).lstrip("/"))


def is_private_or_transactional_path(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in PRIVATE_OR_TRANSACTIONAL_PREFIXES)


def is_production_host(request) -> bool:
    host = _normalized_host(request.get_host())
    for allowed in settings.SEO_PRODUCTION_HOSTS:
        allowed = allowed.lower().strip()
        if not allowed:
            continue
        if allowed.startswith(".") and host.endswith(allowed):
            return True
        if host == allowed:
            return True
    return False


def is_non_production_host(request) -> bool:
    host = _normalized_host(request.get_host())
    dev_hosts = {"localhost", "127.0.0.1", "0.0.0.0"}
    if host in dev_hosts:
        return True
    return host.endswith(".github.dev") or host.endswith(".app.github.dev")


def is_indexable_environment(request) -> bool:
    if settings.DEBUG:
        return False
    if is_non_production_host(request):
        return False
    return is_production_host(request)


def robots_directive(request, force_private: bool = False) -> str:
    if force_private or is_private_or_transactional_path(request.path):
        return "noindex, nofollow"
    if not is_indexable_environment(request):
        return "noindex, nofollow"
    return "index, follow"


def default_seo(request) -> dict:
    url = canonical_url(request)
    return {
        "site_name": DEFAULT_SITE_NAME,
        "title": DEFAULT_SITE_NAME,
        "description": DEFAULT_DESCRIPTION,
        "canonical_url": url,
        "robots": robots_directive(request),
        "og_type": "website",
        "og_title": DEFAULT_SITE_NAME,
        "og_description": DEFAULT_DESCRIPTION,
        "og_url": url,
        "og_image": absolute_static_url("img/home/createeye.jpeg"),
        "twitter_card": "summary_large_image",
        "twitter_title": DEFAULT_SITE_NAME,
        "twitter_description": DEFAULT_DESCRIPTION,
        "twitter_image": absolute_static_url("img/home/createeye.jpeg"),
        "json_ld": "",
    }


def build_seo(request, **overrides) -> dict:
    seo = default_seo(request)
    seo.update({k: v for k, v in overrides.items() if v is not None})

    seo["og_title"] = seo.get("og_title") or seo["title"]
    seo["og_description"] = seo.get("og_description") or seo["description"]
    seo["og_url"] = seo.get("og_url") or seo["canonical_url"]
    seo["twitter_title"] = seo.get("twitter_title") or seo["title"]
    seo["twitter_description"] = seo.get("twitter_description") or seo["description"]
    seo["twitter_image"] = seo.get("twitter_image") or seo.get("og_image")
    seo["site_name"] = DEFAULT_SITE_NAME
    return seo


def homepage_json_ld() -> str:
    homepage = f"{canonical_base_url()}/"
    graph = [
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Kim Piffy",
            "url": homepage,
            "inLanguage": "en-GB",
        },
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Kim Piffy",
            "url": homepage,
            "jobTitle": "Multidisciplinary Artist, Creative Practitioner and Web Designer",
            "description": (
                "UK-based multidisciplinary artist, creative practitioner and web designer "
                "working across immersive installation, sensory and light-based artwork, "
                "creative health, participatory practice and distinctive digital experiences."
            ),
            "email": "mailto:piffyinfo@gmail.com",
            "sameAs": [
                "https://www.linkedin.com/in/kimpiffy",
                "https://www.instagram.com/kimpiffy",
                "https://github.com/kimpiffy",
            ],
            "knowsAbout": [
                "immersive installation",
                "light art",
                "sensory art",
                "UV-responsive artwork",
                "conceptual art",
                "creative health",
                "participatory arts",
                "community arts",
                "SEND arts practice",
                "accessible arts",
                "web design",
                "web development",
                "immersive digital experiences",
            ],
            "areaServed": [
                "Ledbury",
                "Herefordshire",
                "Worcestershire",
                "Three Counties",
                "United Kingdom",
            ],
        },
    ]
    return json.dumps(graph, ensure_ascii=False)
