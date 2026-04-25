from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")

    def __str__(self) -> str:  # pragma: no cover - display helper
        return self.display_name or self.username or self.email


class Service(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    subtitle = models.CharField(max_length=255, blank=True, default="")
    short_description = models.TextField(blank=True, default="")
    full_description = models.TextField(blank=True, default="")
    duration = models.CharField(max_length=120, blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_text = models.CharField(max_length=120, blank=True, default="")
    includes = models.JSONField(default=list, blank=True)
    image_url = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return self.title


class PluginProduct(models.Model):
    CATEGORY_VST_MIXING = "vst_mixing"
    CATEGORY_VSTI_INSTRUMENT = "vsti_instrument"
    CATEGORY_CHOICES = [
        (CATEGORY_VST_MIXING, "VST - Для сведения"),
        (CATEGORY_VSTI_INSTRUMENT, "VSTi - Для звукоизвлечения"),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    category = models.CharField(
        max_length=32, choices=CATEGORY_CHOICES, default=CATEGORY_VST_MIXING
    )
    tag = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    discount = models.CharField(max_length=32, blank=True, default="")
    image_url = models.URLField(blank=True, default="")
    image_file = models.FileField(upload_to="plugins/", blank=True, default="")
    archive_file = models.FileField(upload_to="plugin_archives/", blank=True, default="")
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return self.name


class DemoTrack(models.Model):
    KIND_BEFORE = "before"
    KIND_AFTER = "after"
    KIND_CHOICES = [
        (KIND_BEFORE, "До сведения"),
        (KIND_AFTER, "После сведения"),
    ]

    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    pair_key = models.SlugField(
        max_length=120,
        help_text="Одинаковый ключ ставит треки 'до' и 'после' в одну строку.",
    )
    audio_file = models.FileField(upload_to="demo_tracks/", blank=True, default="")
    audio_url = models.URLField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "pair_key", "kind", "id"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"{self.title} ({self.get_kind_display()})"


class Booking(models.Model):
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    service = models.ForeignKey(
        Service, on_delete=models.PROTECT, related_name="bookings"
    )
    client_name = models.CharField(max_length=200, blank=True, default="")
    client_contact = models.CharField(max_length=120, blank=True, default="")
    scheduled_at = models.DateTimeField()
    duration_hours = models.DecimalField(
        max_digits=4, decimal_places=1, default=1.0, help_text="Duration in hours"
    )
    notes = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"{self.service.title} @ {self.scheduled_at}"


class RequestLead(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    message = models.TextField(blank=True, default="")
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads"
    )
    source = models.CharField(max_length=100, blank=True, default="site")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"Lead {self.name} ({self.phone})"


class CartItem(models.Model):
    PRODUCT_SERVICE = "service"
    PRODUCT_PLUGIN = "plugin"
    PRODUCT_CHOICES = [
        (PRODUCT_SERVICE, "Service"),
        (PRODUCT_PLUGIN, "Plugin"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    product_type = models.CharField(max_length=20, choices=PRODUCT_CHOICES)
    product_id = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "product_type", "product_id")

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"{self.title} x{self.quantity}"


class Order(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PENDING = "pending_payment"
    STATUS_PAID = "paid"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PENDING, "Pending payment"),
        (STATUS_PAID, "Paid"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=32, blank=True, default="")
    payment_provider = models.CharField(max_length=50, blank=True, default="yookassa")
    payment_id = models.CharField(max_length=120, blank=True, default="")
    payment_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"Order {self.id} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_type = models.CharField(
        max_length=20, choices=CartItem.PRODUCT_CHOICES, default=CartItem.PRODUCT_PLUGIN
    )
    product_id = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    license_codes = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"{self.title} x{self.quantity}"


class Review(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews"
    )
    name = models.CharField(max_length=150, blank=True, default="")
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    content = models.TextField()
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews"
    )
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"Review {self.id}"


class FAQ(models.Model):
    question = models.CharField(max_length=250)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return self.question
