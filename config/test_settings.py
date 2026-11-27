import os
import tempfile
from pathlib import Path


os.environ["RENDER"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["DJANGO_SECRET_KEY"] = "test-only-not-for-production"

for setting in (
    "CLOUDINARY_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_TEST_PUBLIC_KEY",
    "STRIPE_SUCCESS_URL",
    "STRIPE_CANCEL_URL",
    "STRIPE_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
    "EMAIL_HOST_USER",
    "EMAIL_HOST_PASSWORD",
):
    os.environ[setting] = ""

from .settings import *  # noqa: E402,F403

os.environ.pop("RENDER", None)

DEBUG = True
SECRET_KEY = "test-only-not-for-production"
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

_TEST_TEMP_DIR = tempfile.TemporaryDirectory(prefix="piffy-django-tests-")
_TEST_TEMP_ROOT = Path(_TEST_TEMP_DIR.name)
MEDIA_ROOT = _TEST_TEMP_ROOT / "media"
STATIC_ROOT = _TEST_TEMP_ROOT / "staticfiles"
MEDIA_ROOT.mkdir()
STATIC_ROOT.mkdir()

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
EMAIL_HOST_USER = ""
EMAIL_HOST_PASSWORD = ""
OPENAI_API_KEY = ""
STRIPE_SECRET_KEY = ""
STRIPE_TEST_PUBLIC_KEY = ""
STRIPE_SUCCESS_URL = ""
STRIPE_CANCEL_URL = ""
STRIPE_WEBHOOK_SECRET = ""
CLOUDINARY_URL = ""
CLOUDINARY_CLOUD_NAME = ""
CLOUDINARY_API_KEY = ""
CLOUDINARY_API_SECRET = ""
HAS_CLOUDINARY_CONFIG = False
