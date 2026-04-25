import time
from collections import defaultdict
from django.http import JsonResponse


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("Content-Security-Policy", "frame-ancestors 'none'")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("X-Frame-Options", "DENY")
        response.setdefault("X-XSS-Protection", "1; mode=block")
        response.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(self)",
        )
        response.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
        response.headers.pop("Server", None)
        return response


class RateLimitMiddleware:
    RATE_LIMITED_PREFIXES = [
        "/api/auth/login/",
        "/api/auth/register/",
        "/api/auth/password-reset/",
        "/api/auth/password-reset/confirm/",
        "/api/leads/",
        "/api/cart/checkout/",
    ]
    MAX_REQUESTS = 20
    WINDOW_SECONDS = 60

    def __init__(self, get_response):
        self.get_response = get_response
        self._requests = defaultdict(list)

    def _get_client_ip(self, request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

    def _is_rate_limited(self, path):
        return any(path.startswith(prefix) for prefix in self.RATE_LIMITED_PREFIXES)

    def __call__(self, request):
        if request.method == "POST" and self._is_rate_limited(request.path):
            ip = self._get_client_ip(request)
            now = time.time()
            key = f"{ip}:{request.path}"

            self._requests[key] = [
                t for t in self._requests[key]
                if now - t < self.WINDOW_SECONDS
            ]

            if len(self._requests[key]) >= self.MAX_REQUESTS:
                return JsonResponse(
                    {"detail": "Слишком много запросов. Подождите минуту."},
                    status=429,
                )

            self._requests[key].append(now)

        return self.get_response(request)
