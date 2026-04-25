import os
import sys
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
import dj_database_url



load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


USE_SQLITE = os.getenv("DJANGO_USE_SQLITE", "False").lower() == "true"


def _split_csv(value, default=None):
    if not value:
        return default or []
    return [item.strip() for item in value.split(",") if item.strip()]


def _default_dev_origins():
    return [
        "https://phase-records-diploma.onrender.com",
        "https://phase-records-diploma.vercel.app",
    ]


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = _split_csv(os.getenv("DJANGO_ALLOWED_HOSTS"), ["*"] if DEBUG else [])
CSRF_TRUSTED_ORIGINS = _split_csv(os.getenv("CSRF_TRUSTED_ORIGINS"))
if DEBUG and not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = _default_dev_origins()

if DEBUG:
    for host in ("localhost", "127.0.0.1", "testserver"):
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)

INSTALLED_APPS = [
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    "studio",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "studio.middleware.SecurityHeadersMiddleware",
    "studio.middleware.RateLimitMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "phase_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "phase_backend.wsgi.application"


if os.getenv("POSTGRES_DB") and not USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER", "postgres"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
            "HOST": os.getenv("POSTGRES_HOST", "db"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
            "OPTIONS": {
                "timeout": int(os.getenv("SQLITE_TIMEOUT", "20")),
            },
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "studio.exceptions.custom_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Phase Records API",
    "DESCRIPTION": "Backend API for Phase Records studio website",
    "VERSION": "1.0.0",
}

CORS_ALLOWED_ORIGINS = _split_csv(os.getenv("CORS_ALLOWED_ORIGINS"))
if DEBUG and not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = _default_dev_origins()
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_HTTPONLY = True

AUTH_USER_MODEL = "studio.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

def _env_bool(name, default=False):
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


TESTING = "test" in sys.argv


EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "custom").strip().lower()

EMAIL_PROVIDER_PRESETS = {
    "mailru": {
        "host": "smtp.mail.ru",
        "port": 465,
        "use_tls": False,
        "use_ssl": True,
    },
    "gmail": {
        "host": "smtp.gmail.com",
        "port": 587,
        "use_tls": True,
        "use_ssl": False,
    },
    "yandex": {
        "host": "smtp.yandex.ru",
        "port": 465,
        "use_tls": False,
        "use_ssl": True,
    },
    "custom": {
        "host": "",
        "port": 587,
        "use_tls": True,
        "use_ssl": False,
    },
}

_email_preset = EMAIL_PROVIDER_PRESETS.get(
    EMAIL_PROVIDER, EMAIL_PROVIDER_PRESETS["custom"]
)

EMAIL_HOST = os.getenv("EMAIL_HOST", _email_preset["host"]).strip()
EMAIL_PORT = int(os.getenv("EMAIL_PORT", str(_email_preset["port"])))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = _env_bool("EMAIL_USE_TLS", _email_preset["use_tls"])
EMAIL_USE_SSL = _env_bool("EMAIL_USE_SSL", _email_preset["use_ssl"])
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "20"))
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER or "noreply@phase-records.local",
)
ADMIN_NOTIFICATION_EMAIL = os.getenv(
    "ADMIN_NOTIFICATION_EMAIL",
    "phase_records@mail.ru",
).strip()
ADMIN_NOTIFICATION_RECIPIENTS = _split_csv(
    os.getenv("ADMIN_NOTIFICATION_RECIPIENTS"),
    [ADMIN_NOTIFICATION_EMAIL] if ADMIN_NOTIFICATION_EMAIL else [],
)
EMAIL_IS_CONFIGURED = bool(EMAIL_HOST and EMAIL_HOST_USER and EMAIL_HOST_PASSWORD)
EMAIL_NOTIFICATIONS_ASYNC = (
    False if TESTING else _env_bool("EMAIL_NOTIFICATIONS_ASYNC", True)
)

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_IS_CONFIGURED
    else "django.core.mail.backends.console.EmailBackend",
)

YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY", "")
YOOKASSA_RETURN_URL = os.getenv("YOOKASSA_RETURN_URL", "http://localhost:3000/cart?payment=return")
YOOKASSA_API_URL = os.getenv("YOOKASSA_API_URL", "https://api.yookassa.ru/v3/payments")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}

UNFOLD = {
    "SITE_TITLE": "Phase Records",
    "SITE_HEADER": "Phase Records",
    "SITE_SUBHEADER": "Админ-панель студии",
    "SITE_SYMBOL": "graphic_eq",
    "SHOW_VIEW_ON_SITE": False,
    "THEME": "dark",
    "BORDER_RADIUS": "0.9rem",
    "STYLES": [
        "/static/admin_custom/reddit_admin.css",
    ],
    "COLORS": {
        "base": {
            "50": "#f8f4f1",
            "100": "#eee2d7",
            "200": "#dcc5b3",
            "300": "#c3a28b",
            "400": "#a97f62",
            "500": "#8d5f46",
            "600": "#6e4734",
            "700": "#4e3125",
            "800": "#2c1a14",
            "900": "#160d09",
            "950": "#090604",
        },
        "primary": {
            "50": "#fff4ea",
            "100": "#ffe4c9",
            "200": "#ffc58f",
            "300": "#ffa85f",
            "400": "#ff8e3a",
            "500": "#ff7a1a",
            "600": "#f06a00",
            "700": "#c75600",
            "800": "#9f4503",
            "900": "#823a08",
            "950": "#461b02",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Главное",
                "items": [
                    {
                        "title": "Обзор",
                        "icon": "dashboard",
                        "link": "/admin/",
                    },
                ],
            },
            {
                "title": "Работа с клиентами",
                "items": [
                    {
                        "title": "Бронирования",
                        "icon": "event_available",
                        "link": "/admin/studio/booking/",
                    },
                    {
                        "title": "Заявки",
                        "icon": "support_agent",
                        "link": "/admin/studio/requestlead/",
                    },
                    {
                        "title": "Заказы",
                        "icon": "shopping_bag",
                        "link": "/admin/studio/order/",
                    },
                ],
            },
            {
                "title": "Контент",
                "items": [
                    {
                        "title": "Услуги",
                        "icon": "library_music",
                        "link": "/admin/studio/service/",
                    },
                    {
                        "title": "Плагины",
                        "icon": "tune",
                        "link": "/admin/studio/pluginproduct/",
                    },
                    {
                        "title": "Отзывы",
                        "icon": "reviews",
                        "link": "/admin/studio/review/",
                    },
                    {
                        "title": "FAQ",
                        "icon": "quiz",
                        "link": "/admin/studio/faq/",
                    },
                ],
            },
            {
                "title": "Система",
                "collapsible": True,
                "items": [
                    {
                        "title": "Пользователи",
                        "icon": "group",
                        "link": "/admin/studio/user/",
                    },
                    {
                        "title": "Корзина",
                        "icon": "shopping_cart",
                        "link": "/admin/studio/cartitem/",
                    },
                ],
            },
        ],
    },
}
