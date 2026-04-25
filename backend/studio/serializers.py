import re
import time
from urllib.parse import urlsplit

from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.db import OperationalError, transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .booking import has_slot_conflict, is_hour_slot
from .models import (
    Booking,
    CartItem,
    DemoTrack,
    FAQ,
    Order,
    OrderItem,
    PluginProduct,
    RequestLead,
    Review,
    Service,
    User,
)
from .yookassa import YooKassaError, create_yookassa_payment
from .services import send_admin_order_created_notification

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(value: str) -> str:
    if not isinstance(value, str):
        return value
    return _HTML_TAG_RE.sub("", value).strip()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "display_name", "phone")

    def validate_username(self, value):
        username = _strip_html(value)[:150]
        if not username:
            raise serializers.ValidationError("Имя пользователя не может быть пустым.")
        queryset = User.objects.filter(username__iexact=username)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return username

    def validate_email(self, value):
        email = _strip_html(value).lower()
        if not email:
            raise serializers.ValidationError("Укажите почту.")
        queryset = User.objects.filter(email__iexact=email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Пользователь с такой почтой уже существует.")
        return email

    def validate_display_name(self, value):
        return _strip_html(value)[:150]

    def validate_phone(self, value):
        return _strip_html(value)[:32]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "display_name", "phone")

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_username(self, value):
        return _strip_html(value)

    def validate_display_name(self, value):
        return _strip_html(value)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class EmailOrUsernameTokenSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].required = False
        self.fields["email"] = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        email_or_username = attrs.get("email") or attrs.get("username")
        password = attrs.get("password")

        if not email_or_username or not password:
            raise serializers.ValidationError(_("Нужны email или username, а также пароль"))

        user_obj = None
        if email_or_username:
            try:
                user_obj = User.objects.get(email=email_or_username)
                username = user_obj.username
            except User.DoesNotExist:
                username = email_or_username
        else:
            username = attrs.get("username")

        credentials = {"username": username, "password": password}
        user = authenticate(**credentials)
        if user is None and user_obj:
            user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError(_("Неверные учетные данные"))

        data = super().validate({"username": user.username, "password": password})
        data["user"] = UserSerializer(user).data
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return _strip_html(value).lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"detail": "Ссылка восстановления недействительна."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"detail": "Ссылка восстановления недействительна."})

        validate_password(attrs["new_password"], user)
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = (
            "id",
            "title",
            "slug",
            "subtitle",
            "short_description",
            "full_description",
            "duration",
            "price",
            "price_text",
            "includes",
            "image_url",
        )


class PluginProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = PluginProduct
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "category_label",
            "tag",
            "description",
            "price",
            "old_price",
            "discount",
            "image_url",
            "image_file",
            "image",
            "features",
        )

    def get_image(self, obj):
        if obj.image_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            return obj.image_file.url
        return obj.image_url


class DemoTrackSerializer(serializers.ModelSerializer):
    audio = serializers.SerializerMethodField()

    class Meta:
        model = DemoTrack
        fields = (
            "id",
            "title",
            "kind",
            "pair_key",
            "audio_file",
            "audio_url",
            "audio",
            "order",
        )

    def get_audio(self, obj):
        if obj.audio_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return obj.audio_file.url
        return obj.audio_url


class BookingSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        source="service", queryset=Service.objects.filter(is_active=True), write_only=True
    )
    client_name = serializers.CharField(required=False, allow_blank=True)
    client_contact = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "service",
            "service_id",
            "client_name",
            "client_contact",
            "scheduled_at",
            "duration_hours",
            "notes",
            "status",
            "total_price",
            "created_at",
        )
        read_only_fields = ("status", "total_price", "created_at")

    def validate_client_name(self, value):
        return _strip_html(value)[:200]

    def validate_client_contact(self, value):
        return _strip_html(value)[:120]

    def validate_notes(self, value):
        return _strip_html(value)[:1000]

    def validate(self, attrs):
        service = attrs.get("service") or getattr(self.instance, "service", None)
        scheduled_at = attrs.get("scheduled_at") or getattr(self.instance, "scheduled_at", None)
        duration_hours = attrs.get("duration_hours") or getattr(self.instance, "duration_hours", None)

        if service and service.slug != "recording":
            raise serializers.ValidationError(
                {"service_id": "Онлайн-бронирование доступно только для услуги записи вокала."}
            )

        if scheduled_at and timezone.is_naive(scheduled_at):
            scheduled_at = timezone.make_aware(scheduled_at, timezone.get_current_timezone())
            attrs["scheduled_at"] = scheduled_at

        if scheduled_at and scheduled_at <= timezone.now():
            raise serializers.ValidationError({"scheduled_at": "Можно выбрать только будущее время."})

        if scheduled_at and not is_hour_slot(scheduled_at):
            raise serializers.ValidationError(
                {"scheduled_at": "Онлайн-бронирование доступно только на целый час: 10:00, 11:00 и т.д."}
            )

        if duration_hours and float(duration_hours) != 1.0:
            raise serializers.ValidationError(
                {"duration_hours": "Сейчас онлайн-бронирование работает с шагом в 1 час."}
            )

        if service and scheduled_at and has_slot_conflict(service, scheduled_at, getattr(self.instance, "pk", None)):
            raise serializers.ValidationError(
                {"scheduled_at": "Этот слот уже занят. Выберите другое время."}
            )

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        service = validated_data["service"]
        total_price = service.price or 0
        validated_data["user"] = user
        if not validated_data.get("client_name"):
            validated_data["client_name"] = user.display_name or user.username
        if not validated_data.get("client_contact"):
            validated_data["client_contact"] = user.phone or user.email
        validated_data["total_price"] = total_price
        return super().create(validated_data)


class RequestLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestLead
        fields = ("id", "name", "email", "phone", "message", "service", "source", "created_at")
        read_only_fields = ("created_at",)

    def validate_name(self, value):
        return _strip_html(value)

    def validate_phone(self, value):
        return _strip_html(value)

    def validate_message(self, value):
        return _strip_html(value)[:2000]


def _resolve_product(product_type: str, product_id: int):
    if product_type == CartItem.PRODUCT_SERVICE:
        product = Service.objects.filter(pk=product_id, is_active=True).first()
        if not product:
            raise serializers.ValidationError("Услуга не найдена или выключена")
        return product.title, product.price or 0

    if product_type == CartItem.PRODUCT_PLUGIN:
        product = PluginProduct.objects.filter(pk=product_id, is_active=True).first()
        if not product:
            raise serializers.ValidationError("Плагин не найден или выключен")
        return product.name, product.price

    raise serializers.ValidationError("Неверный тип продукта")


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = (
            "id",
            "product_type",
            "product_id",
            "title",
            "price",
            "quantity",
            "created_at",
        )
        read_only_fields = ("title", "price", "created_at")

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Количество должно быть не меньше 1")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        product_type = validated_data["product_type"]
        product_id = validated_data["product_id"]
        title, price = _resolve_product(product_type, product_id)

        obj, created = CartItem.objects.get_or_create(
            user=user,
            product_type=product_type,
            product_id=product_id,
            defaults={
                "title": title,
                "price": price,
                "quantity": validated_data.get("quantity", 1),
            },
        )
        if not created:
            obj.quantity += validated_data.get("quantity", 1)
            obj.save(update_fields=["quantity"])
        return obj

    def update(self, instance, validated_data):
        if "product_type" in validated_data or "product_id" in validated_data:
            raise serializers.ValidationError("Нельзя менять продукт у позиции")
        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "product_type",
            "product_id",
            "title",
            "price",
            "quantity",
            "license_codes",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "total_amount",
            "contact_email",
            "contact_phone",
            "payment_provider",
            "payment_id",
            "payment_url",
            "items",
            "created_at",
        )
        read_only_fields = (
            "status",
            "total_amount",
            "payment_provider",
            "payment_id",
            "payment_url",
            "items",
            "created_at",
        )


class CheckoutSerializer(serializers.Serializer):
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(required=False, allow_blank=True)
    return_url = serializers.CharField(required=False, allow_blank=True)

    def validate_return_url(self, value):
        if not value:
            return ""
        parts = urlsplit(value)
        if parts.scheme not in ("http", "https") or not parts.netloc:
            raise serializers.ValidationError("Некорректная ссылка возврата после оплаты.")
        return value

    @transaction.atomic
    def save(self, **kwargs):
        user = self.context["request"].user
        cart_items = CartItem.objects.filter(user=user)
        if not cart_items.exists():
            raise serializers.ValidationError("Корзина пуста")

        total = sum(item.price * item.quantity for item in cart_items)
        order = Order.objects.create(
            user=user,
            total_amount=total,
            contact_email=self.validated_data["contact_email"],
            contact_phone=self.validated_data.get("contact_phone", ""),
            status=Order.STATUS_PENDING,
            payment_provider="yookassa",
        )
        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product_type=item.product_type,
                    product_id=item.product_id,
                    title=item.title,
                    price=item.price,
                    quantity=item.quantity,
                )
                for item in cart_items
            ]
        )

        try:
            payment = create_yookassa_payment(
                order,
                return_url=self.validated_data.get("return_url") or None,
            )
        except YooKassaError as exc:
            raise serializers.ValidationError({"payment": str(exc)}) from exc

        order.payment_id = payment["payment_id"]
        order.payment_url = payment["payment_url"]
        order.save(update_fields=["payment_id", "payment_url"])
        cart_items.delete()
        send_admin_order_created_notification(
            Order.objects.select_related("user").prefetch_related("items").get(pk=order.pk)
        )
        return order


class ResilientCheckoutSerializer(CheckoutSerializer):
    def _create_checkout_order(self, user):
        cart_items = CartItem.objects.filter(user=user)
        if not cart_items.exists():
            raise serializers.ValidationError("Корзина пуста")

        with transaction.atomic():
            total = sum(item.price * item.quantity for item in cart_items)
            order = Order.objects.create(
                user=user,
                total_amount=total,
                contact_email=self.validated_data["contact_email"],
                contact_phone=self.validated_data.get("contact_phone", ""),
                status=Order.STATUS_PENDING,
                payment_provider="yookassa",
            )
            OrderItem.objects.bulk_create(
                [
                    OrderItem(
                        order=order,
                        product_type=item.product_type,
                        product_id=item.product_id,
                        title=item.title,
                        price=item.price,
                        quantity=item.quantity,
                    )
                    for item in cart_items
                ]
            )

            try:
                payment = create_yookassa_payment(
                    order,
                    return_url=self.validated_data.get("return_url") or None,
                )
            except YooKassaError as exc:
                raise serializers.ValidationError({"payment": str(exc)}) from exc

            order.payment_id = payment["payment_id"]
            order.payment_url = payment["payment_url"]
            order.save(update_fields=["payment_id", "payment_url"])
            cart_items.delete()
            send_admin_order_created_notification(
                Order.objects.select_related("user").prefetch_related("items").get(pk=order.pk)
            )
            return order

    def save(self, **kwargs):
        user = self.context["request"].user
        max_attempts = 3

        for attempt in range(max_attempts):
            try:
                return self._create_checkout_order(user)
            except OperationalError as exc:
                if "database is locked" not in str(exc).lower():
                    raise
                if attempt == max_attempts - 1:
                    api_exc = APIException(
                        "База данных занята. Попробуйте оформить заказ ещё раз через пару секунд."
                    )
                    api_exc.status_code = 503
                    raise api_exc from exc
                time.sleep(0.25 * (attempt + 1))


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        source="service", queryset=Service.objects.all(), write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "name",
            "rating",
            "content",
            "service",
            "service_id",
            "is_public",
            "created_at",
        )
        read_only_fields = ("is_public", "created_at", "user", "service")

    def validate_name(self, value):
        return _strip_html(value)[:150]

    def validate_content(self, value):
        return _strip_html(value)[:2000]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        if not validated_data.get("name"):
            validated_data["name"] = validated_data["user"].display_name or validated_data["user"].username
        return super().create(validated_data)


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ("id", "question", "answer", "order")
