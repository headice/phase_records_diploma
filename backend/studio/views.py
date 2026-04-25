from datetime import date, timedelta
from ipaddress import ip_address, ip_network

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .booking import BOOKING_DAYS_AHEAD, generate_service_slots
from .models import (
    Booking,
    CartItem,
    DemoTrack,
    FAQ,
    Order,
    PluginProduct,
    RequestLead,
    Review,
    Service,
    User,
)
from .serializers import (
    BookingSerializer,
    CartItemSerializer,
    DemoTrackSerializer,
    ResilientCheckoutSerializer,
    EmailOrUsernameTokenSerializer,
    FAQSerializer,
    OrderItemSerializer,
    OrderSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PluginProductSerializer,
    RegisterSerializer,
    RequestLeadSerializer,
    ReviewSerializer,
    ServiceSerializer,
    UserSerializer,
)
from .services import (
    DatabaseBusyError,
    EmailDeliveryError,
    cancel_order_payment,
    confirm_order_payment,
    send_booking_notification,
    send_request_lead_notification,
)

YOOKASSA_WEBHOOK_IPS = (
    "185.71.76.0/27",
    "185.71.77.0/27",
    "77.75.153.0/25",
    "77.75.154.128/25",
    "2a02:5180::/32",
)


def _get_request_ip(request):
    forwarded_for = (request.META.get("HTTP_X_FORWARDED_FOR") or "").split(",")[0].strip()
    return forwarded_for or request.META.get("REMOTE_ADDR") or ""


def _is_trusted_yookassa_ip(raw_ip):
    if not raw_ip:
        return False

    try:
        current_ip = ip_address(raw_ip)
    except ValueError:
        return False

    return any(current_ip in ip_network(network) for network in YOOKASSA_WEBHOOK_IPS)


class EmailOrUsernameTokenView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password/{uid}/{token}"
            send_mail(
                subject="Phase Records - восстановление пароля",
                message=(
                    "Вы запросили восстановление пароля для аккаунта Phase Records.\n\n"
                    f"Чтобы задать новый пароль, откройте ссылку:\n{reset_url}\n\n"
                    "Если вы не запрашивали восстановление, просто проигнорируйте это письмо."
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response({"detail": "Если почта есть в системе, мы отправим ссылку для восстановления."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Пароль обновлён."})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    @action(detail=True, methods=["get"])
    def slots(self, request, slug=None):
        target_date_raw = request.query_params.get("date")
        if not target_date_raw:
            return Response(
                {"detail": "Нужен параметр date в формате YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_date = date.fromisoformat(target_date_raw)
        except ValueError:
            return Response(
                {"detail": "Некорректная дата. Используйте формат YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = date.today()
        latest_date = today + timedelta(days=BOOKING_DAYS_AHEAD)
        if target_date < today or target_date > latest_date:
            return Response(
                {"detail": f"Бронь доступна на {BOOKING_DAYS_AHEAD} дней вперёд."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = self.get_object()
        return Response(
            {
                "service": {
                    "id": service.id,
                    "slug": service.slug,
                    "title": service.title,
                },
                "date": target_date.isoformat(),
                "slots": generate_service_slots(service, target_date),
            }
        )


class PluginViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PluginProduct.objects.filter(is_active=True)
    serializer_class = PluginProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class DemoTrackViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DemoTrack.objects.filter(is_active=True)
    serializer_class = DemoTrackSerializer
    permission_classes = [permissions.AllowAny]


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "patch"]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related("service")

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        send_booking_notification(booking)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = Booking.STATUS_CANCELLED
        booking.save(update_fields=["status"])
        return Response(self.get_serializer(booking).data)


class RequestLeadViewSet(viewsets.ModelViewSet):
    serializer_class = RequestLeadSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["post", "get"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return RequestLead.objects.all()
        return RequestLead.objects.none()

    def perform_create(self, serializer):
        lead = serializer.save()
        send_request_lead_notification(lead)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["delete"])
    def clear(self, request):
        count, _ = CartItem.objects.filter(user=request.user).delete()
        return Response({"deleted": count})


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ResilientCheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    @action(detail=True, methods=["post"])
    def confirm_payment(self, request, pk=None):
        order = self.get_object()
        try:
            confirmed_order = confirm_order_payment(order)
        except DatabaseBusyError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except EmailDeliveryError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(self.get_serializer(confirmed_order).data)


class YooKassaWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        source_ip = _get_request_ip(request)
        if not _is_trusted_yookassa_ip(source_ip):
            return Response(
                {"detail": "Untrusted webhook source."},
                status=status.HTTP_403_FORBIDDEN,
            )

        event = request.data.get("event")
        payment_object = request.data.get("object") or {}
        payment_id = payment_object.get("id", "")
        metadata = payment_object.get("metadata") or {}
        order_id = metadata.get("order_id")

        if not payment_id or not order_id:
            return Response(
                {"detail": "Webhook payload is missing payment_id or order_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.prefetch_related("items").get(
                pk=order_id, payment_id=payment_id
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order was not found for this payment."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            if event == "payment.succeeded":
                confirm_order_payment(order)
            elif event == "payment.canceled":
                cancel_order_payment(order)
        except DatabaseBusyError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except EmailDeliveryError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"status": "ok"})


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        qs = Review.objects.filter(is_public=True)
        if self.request.user.is_authenticated:
            qs = qs | Review.objects.filter(user=self.request.user)
        return qs.select_related("service").distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FAQSerializer
    permission_classes = [permissions.AllowAny]
    queryset = FAQ.objects.filter(is_active=True)


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})
