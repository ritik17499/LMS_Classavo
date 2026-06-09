"""
Django settings for the LMS backend.

All secrets and environment-specific values are read from a .env file via
python-decouple. Copy .env.example to .env before running.

AUTH_USER_MODEL is declared here, before any app processes its models,
which is the only safe location for this setting.
"""

from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# ──────────────────────────────────────────────────────────────────────────────
# Core
# ──────────────────────────────────────────────────────────────────────────────

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# Must be registered before any migration or model import. Django resolves the
# swappable model at startup; declaring it late causes an inconsistent migration state.
AUTH_USER_MODEL = 'users.User'

ROOT_URLCONF = 'lms.urls'

WSGI_APPLICATION = 'lms.wsgi.application'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────────────────────────────────────
# Applications
# ──────────────────────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    # Required for ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    # Local
    'apps.users.apps.UsersConfig',
    'apps.courses.apps.CoursesConfig',
]

# ──────────────────────────────────────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    # CorsMiddleware must appear before any response-generating middleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise must come directly after SecurityMiddleware to serve static
    # files efficiently in production without a separate CDN or web server.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ──────────────────────────────────────────────────────────────────────────────
# Templates (required for Django admin)
# ──────────────────────────────────────────────────────────────────────────────

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

# ──────────────────────────────────────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────────────────────────────────────

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='lms_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        # Reuse DB connections for the duration of each request cycle
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Password Validation
# ──────────────────────────────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ──────────────────────────────────────────────────────────────────────────────
# Internationalization
# ──────────────────────────────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────────────────────────────────────
# Static files
# ──────────────────────────────────────────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise: serve compressed, content-hashed static files directly from Django
# in production. CompressedManifestStaticFilesStorage raises an error at collectstatic
# time if any referenced file is missing — catches broken asset references before deploy.
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # Require authentication on all endpoints by default.
        # Views that need anonymous access must explicitly declare AllowAny.
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Group non-field validation errors under a consistent key
    'NON_FIELD_ERRORS_KEY': 'errors',
}

# ──────────────────────────────────────────────────────────────────────────────
# SimpleJWT
# ──────────────────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),

    # One-time-use refresh tokens: each rotation issues a new refresh token
    # and blacklists the previous one. Defeats replay attacks on stolen refresh tokens.
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,

    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    # Wire the custom serializer that embeds 'role', 'email', and 'full_name' claims
    'TOKEN_OBTAIN_SERIALIZER': 'apps.users.serializers.LMSTokenObtainPairSerializer',
}

# ──────────────────────────────────────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────────────────────────────────────

_cors_raw = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000', cast=Csv())
CORS_ALLOWED_ORIGINS = [o if o.startswith('http') else f'https://{o}' for o in _cors_raw]
# Required so browsers include the httpOnly refresh-token cookie on cross-origin requests
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────────────────────────────────────
# Upload guard — backs up SlateDocumentField node-count validation at the HTTP layer
# ──────────────────────────────────────────────────────────────────────────────

DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5 MB

# ──────────────────────────────────────────────────────────────────────────────
# Production security hardening (only active when DEBUG=False)
# ──────────────────────────────────────────────────────────────────────────────

if not DEBUG:
    # Render (and most PaaS) terminate TLS at the load balancer and forward
    # plain HTTP to the container.  Without this, Django sees every request as
    # HTTP and SECURE_SSL_REDIRECT issues a 301 — breaking the health check.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    # Use the proxy-supplied Host header so ALLOWED_HOSTS matches correctly.
    USE_X_FORWARDED_HOST = True

    # Wildcard covers all *.onrender.com subdomains so Render's health checker
    # is never rejected by ALLOWED_HOSTS regardless of how the Host header
    # is set during deployment (env var may not resolve on first boot).
    if '.onrender.com' not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append('.onrender.com')

    SECURE_HSTS_SECONDS = 31_536_000          # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_SSL_REDIRECT = True
    # Render's internal health checker hits /health/ over plain HTTP.
    # Without this exemption Django issues a 301 redirect and Render marks
    # the deployment as failed.
    SECURE_REDIRECT_EXEMPT = [r'^health/$']
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
