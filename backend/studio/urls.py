from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookingViewSet,
    CartItemViewSet,
    DemoTrackViewSet,
    CheckoutView,
    EmailOrUsernameTokenView,
    FAQViewSet,
    HealthView,
    MeView,
    OrderViewSet,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PluginViewSet,
    RegisterView,
    RequestLeadViewSet,
    ReviewViewSet,
    ServiceViewSet,
    YooKassaWebhookView,
)

router = DefaultRouter()
router.register("services", ServiceViewSet, basename="services")
router.register("plugins", PluginViewSet, basename="plugins")
router.register("demo-tracks", DemoTrackViewSet, basename="demo-tracks")
router.register("bookings", BookingViewSet, basename="bookings")
router.register("leads", RequestLeadViewSet, basename="leads")
router.register("cart/items", CartItemViewSet, basename="cart-items")
router.register("orders", OrderViewSet, basename="orders")
router.register("reviews", ReviewViewSet, basename="reviews")
router.register("faq", FAQViewSet, basename="faq")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/login/", EmailOrUsernameTokenView.as_view(), name="login"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("health/", HealthView.as_view(), name="health"),
    path("cart/checkout/", CheckoutView.as_view(), name="checkout"),
    path("payments/yookassa/webhook/", YooKassaWebhookView.as_view(), name="yookassa-webhook"),
    path("", include(router.urls)),
]
