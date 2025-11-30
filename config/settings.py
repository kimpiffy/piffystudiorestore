from pathlib import Path
import os
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

# Load the .env in the project root explicitly
load_dotenv(BASE_DIR / '.env')

# -------------------------------
# SECURITY
# -------------------------------
# Retrieve the secret key from .env for safety
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or 'unsafe-default-for-dev'

# Debug mode - Don't leave True in production
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# -------------------------------
# STRIPE CONFIGURATION
# -------------------------------
# Use os.getenv (or set up django-environ if you prefer)
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')  # Secret Key (sk_test_...)
STRIPE_TEST_PUBLIC_KEY = os.getenv('STRIPE_TEST_PUBLIC_KEY')  # Public Key (pk_test_...)
STRIPE_SUCCESS_URL = os.getenv('STRIPE_SUCCESS_URL')  # URL after successful payment
STRIPE_CANCEL_URL = os.getenv('STRIPE_CANCEL_URL')  # URL after canceled payment

# -------------------------------
# APPLICATIONS
# -------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'crispy_forms',
    'crispy_bootstrap5',
    'widget_tweaks',

    # Your apps
    'pages',
    'portfolio',
    'interactions',
    'shop',
    'accounts',
]

# -------------------------------
# MIDDLEWARE
# -------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# -------------------------------
# TEMPLATES
# -------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],   # ← IMPORTANT
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# -------------------------------
# DATABASE (SQLite for now)
# -------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# -------------------------------
# PASSWORD VALIDATION
# -------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LOGIN_REDIRECT_URL = '/accounts/dashboard/'
LOGOUT_REDIRECT_URL = '/accounts/login/'

# -------------------------------
# INTERNATIONALIZATION
# -------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# -------------------------------
# STATIC & MEDIA
# -------------------------------
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "static",
]
STATIC_ROOT = BASE_DIR / "staticfiles"   # Used later for deployment

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / "media"

# -------------------------------
# DEFAULT PK
# -------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------------
# CRISPY FORMS
# -------------------------------
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"
