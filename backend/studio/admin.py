from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField, UserChangeForm as DjangoUserChangeForm
from django.utils.html import format_html, format_html_join
from unfold.admin import ModelAdmin, TabularInline

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

admin.site.site_header = "Phase Records Admin"
admin.site.site_title = "Phase Records Admin"
admin.site.index_title = "Управление сайтом, бронированиями и заказами"


class UserChangeForm(DjangoUserChangeForm):
    password = ReadOnlyPasswordHashField(
        label="\u041f\u0430\u0440\u043e\u043b\u044c",
        help_text="\u041f\u0430\u0440\u043e\u043b\u044c \u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f \u0432 \u0437\u0430\u0449\u0438\u0449\u0451\u043d\u043d\u043e\u043c \u0432\u0438\u0434\u0435. \u0415\u0441\u043b\u0438 \u043d\u0443\u0436\u043d\u043e, \u043d\u0438\u0436\u0435 \u043c\u043e\u0436\u043d\u043e \u0437\u0430\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u044b\u0439.",
    )

    class Meta(DjangoUserChangeForm.Meta):
        model = User
        fields = "__all__"

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    form = UserChangeForm
    list_display = (
        "id",
        "username",
        "email",
        "display_name",
        "phone",
        "is_staff",
        "is_active",
    )
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "display_name", "phone")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Профиль", {"fields": ("display_name", "phone")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Профиль", {"fields": ("display_name", "phone")}),
    )


@admin.register(Service)
class ServiceAdmin(ModelAdmin):
    list_display = ("title", "slug", "price", "duration", "is_active", "created_at")
    list_editable = ("price", "is_active")
    list_filter = ("is_active", "created_at")
    search_fields = ("title", "slug", "subtitle", "short_description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at",)
    save_on_top = True
    fieldsets = (
        ("Публичная карточка", {"fields": ("title", "slug", "subtitle", "image_url")}),
        (
            "Описание",
            {"fields": ("short_description", "full_description", "includes")},
        ),
        ("Продажа", {"fields": ("price", "price_text", "duration", "is_active")}),
        ("Служебное", {"fields": ("created_at",)}),
    )


@admin.register(PluginProduct)
class PluginProductAdmin(ModelAdmin):
    list_display = ("name", "slug", "category", "tag", "price", "old_price", "discount", "is_active")
    list_editable = ("price", "old_price", "discount", "is_active")
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("name", "slug", "tag", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at",)
    save_on_top = True
    fieldsets = (
        ("Карточка плагина", {"fields": ("name", "slug", "category", "tag", "description")}),
        ("Изображение", {"fields": ("image_file", "image_url")}),
        ("ZIP архив плагина", {"fields": ("archive_file",)}),
        ("Продажа", {"fields": ("price", "old_price", "discount", "features", "is_active")}),
        ("Служебное", {"fields": ("created_at",)}),
    )


@admin.action(description="Подтвердить выбранные бронирования")
def mark_bookings_confirmed(modeladmin, request, queryset):
    queryset.update(status=Booking.STATUS_CONFIRMED)


@admin.action(description="Отменить выбранные бронирования")
def mark_bookings_cancelled(modeladmin, request, queryset):
    queryset.update(status=Booking.STATUS_CANCELLED)


@admin.register(Booking)
class BookingAdmin(ModelAdmin):
    list_display = (
        "id",
        "scheduled_at",
        "service",
        "client_name",
        "client_contact",
        "user",
        "status_badge",
        "total_price",
    )
    list_filter = ("status", "service", "scheduled_at")
    search_fields = (
        "client_name",
        "client_contact",
        "user__username",
        "user__email",
        "notes",
    )
    autocomplete_fields = ("user", "service")
    readonly_fields = ("created_at", "total_price")
    list_select_related = ("user", "service")
    date_hierarchy = "scheduled_at"
    save_on_top = True
    actions = (mark_bookings_confirmed, mark_bookings_cancelled)
    fieldsets = (
        ("Клиент", {"fields": ("user", "client_name", "client_contact")}),
        ("Сессия", {"fields": ("service", "scheduled_at", "duration_hours", "status")}),
        ("Оплата и комментарии", {"fields": ("total_price", "notes", "created_at")}),
    )

    @admin.display(description="Статус")
    def status_badge(self, obj):
        colors = {
            Booking.STATUS_PENDING: "#f59e0b",
            Booking.STATUS_CONFIRMED: "#22c55e",
            Booking.STATUS_CANCELLED: "#ef4444",
        }
        color = colors.get(obj.status, "#a1a1aa")
        return format_html(
            '<strong style="color: {}; font-weight: 700;">{}</strong>',
            color,
            obj.get_status_display(),
        )


@admin.register(RequestLead)
class RequestLeadAdmin(ModelAdmin):
    list_display = ("name", "phone", "email", "service", "source", "created_at")
    search_fields = ("name", "phone", "email", "message")
    list_filter = ("source", "service", "created_at")
    autocomplete_fields = ("service",)
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    fields = (
        "item_type_display",
        "title",
        "price",
        "quantity",
        "license_codes_display",
    )
    readonly_fields = fields

    @admin.display(description="Тип")
    def item_type_display(self, obj):
        if obj.product_type == CartItem.PRODUCT_SERVICE:
            return "Услуга"
        if obj.product_type == CartItem.PRODUCT_PLUGIN:
            return "Плагин"
        return obj.product_type or "—"

    @admin.display(description="Лицензионные коды")
    def license_codes_display(self, obj):
        if not obj.license_codes:
            return "—"
        return format_html("<br>".join(obj.license_codes))


class OrderTypeFilter(admin.SimpleListFilter):
    title = "Тип заказа"
    parameter_name = "order_type"

    def lookups(self, request, model_admin):
        return (
            ("service", "Услуга"),
            ("plugin", "Плагин"),
            ("mixed", "Смешанный"),
            ("empty", "Без позиций"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "service":
            return queryset.filter(items__product_type=CartItem.PRODUCT_SERVICE).distinct()
        if value == "plugin":
            return queryset.filter(items__product_type=CartItem.PRODUCT_PLUGIN).distinct()
        if value == "mixed":
            return queryset.filter(
                items__product_type=CartItem.PRODUCT_SERVICE
            ).filter(items__product_type=CartItem.PRODUCT_PLUGIN).distinct()
        if value == "empty":
            return queryset.filter(items__isnull=True)
        return queryset


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = (
        "id",
        "created_at",
        "user",
        "client_contact_display",
        "order_type_display",
        "items_summary",
        "status",
        "total_amount",
        "payment_provider",
        "payment_id",
    )
    list_filter = (OrderTypeFilter, "status", "payment_provider", "created_at")
    search_fields = ("user__username", "user__email", "user__phone", "contact_email", "contact_phone", "payment_id")
    readonly_fields = ("created_at", "client_contact_display", "order_type_display", "items_summary")
    autocomplete_fields = ("user",)
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("items")

    @admin.display(description="Контакты")
    def client_contact_display(self, obj):
        phone = obj.contact_phone or getattr(obj.user, "phone", "") or "—"
        return format_html(
            "<div><strong>{}</strong></div><div style='color:#a1a1aa;'>{}</div>",
            obj.contact_email,
            phone,
        )

    @admin.display(description="Тип заказа")
    def order_type_display(self, obj):
        product_types = {item.product_type for item in obj.items.all()}
        if product_types == {CartItem.PRODUCT_SERVICE}:
            label = "Услуга"
            color = "#38bdf8"
        elif product_types == {CartItem.PRODUCT_PLUGIN}:
            label = "Плагин"
            color = "#a78bfa"
        elif product_types:
            label = "Смешанный"
            color = "#f59e0b"
        else:
            label = "Без позиций"
            color = "#a1a1aa"

        return format_html(
            '<span style="display:inline-flex;align-items:center;border:1px solid {};'
            'color:{};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700;">{}</span>',
            color,
            color,
            label,
        )

    @admin.display(description="Что купили")
    def items_summary(self, obj):
        items = list(obj.items.all())
        if not items:
            return "—"

        rows = []
        for item in items:
            if item.product_type == CartItem.PRODUCT_SERVICE:
                item_type = "Услуга"
                color = "#38bdf8"
            elif item.product_type == CartItem.PRODUCT_PLUGIN:
                item_type = "Плагин"
                color = "#a78bfa"
            else:
                item_type = item.product_type or "Позиция"
                color = "#a1a1aa"

            quantity = f" × {item.quantity}" if item.quantity != 1 else ""
            rows.append((color, item_type, item.title, quantity))

        return format_html_join(
            "",
            '<div style="margin:2px 0;"><strong style="color:{};">{}</strong>: {}{}</div>',
            rows,
        )


@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ("id", "name", "rating", "service", "is_public", "created_at")
    list_filter = ("is_public", "rating", "service")
    search_fields = ("name", "content", "user__username")
    autocomplete_fields = ("service", "user")
    readonly_fields = ("created_at",)


@admin.register(FAQ)
class FAQAdmin(ModelAdmin):
    list_display = ("question", "order", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("question", "answer")


@admin.register(CartItem)
class CartItemAdmin(ModelAdmin):
    list_display = ("id", "user", "product_type", "title", "quantity", "created_at")
    list_filter = ("product_type", "created_at")
    search_fields = ("title", "user__username", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at",)


@admin.register(DemoTrack)
class DemoTrackAdmin(ModelAdmin):
    list_display = ("title", "kind", "pair_key", "order", "is_active", "created_at")
    list_editable = ("order", "is_active")
    list_filter = ("kind", "is_active", "created_at")
    search_fields = ("title", "pair_key", "audio_url")
    readonly_fields = ("created_at",)
    save_on_top = True
    fieldsets = (
        ("Трек", {"fields": ("title", "kind", "pair_key", "order", "is_active")}),
        ("Аудио", {"fields": ("audio_file", "audio_url")}),
        ("Служебное", {"fields": ("created_at",)}),
    )
