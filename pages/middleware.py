from django.conf import settings

from .seo import robots_directive


class RobotsTagMiddleware:
    """Attach X-Robots-Tag for environment-aware indexing control."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.path.startswith(settings.STATIC_URL) or request.path.startswith(settings.MEDIA_URL):
            return response

        response["X-Robots-Tag"] = robots_directive(request)
        return response
