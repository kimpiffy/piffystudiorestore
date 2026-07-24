from .seo import default_seo


def seo_defaults(request):
    return {
        "seo": default_seo(request),
        "site_identity": "Kim Piffy",
    }
