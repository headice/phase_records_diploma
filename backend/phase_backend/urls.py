from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

from .media import serve_media_file
from studio.views import EmailOrUsernameTokenView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", EmailOrUsernameTokenView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("studio.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="docs",
    ),
]

if settings.DEBUG:
    urlpatterns += [path("media/<path:path>", serve_media_file, name="media")]
