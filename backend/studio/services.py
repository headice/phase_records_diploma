import secrets
import smtplib
import threading
import time
from decimal import Decimal
import logging

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.db import OperationalError, transaction
from django.utils import timezone

from .models import Booking, CartItem, Order, OrderItem, PluginProduct, RequestLead

logger = logging.getLogger(__name__)
_order_payment_locks = {}
_order_payment_locks_guard = threading.Lock()


class EmailDeliveryError(Exception):
    pass


class DatabaseBusyError(Exception):
    pass


def _get_order_payment_lock(order_id: int):
    with _order_payment_locks_guard:
        lock = _order_payment_locks.get(order_id)
        if lock is None:
            lock = threading.Lock()
            _order_payment_locks[order_id] = lock
        return lock


def _build_license_code(order: Order, item: OrderItem, index: int) -> str:
    token = secrets.token_hex(3).upper()
    return f"PHASE-{order.id:04d}-{item.id:04d}-{index + 1:02d}-{token}"


def _ensure_item_license_codes(item: OrderItem):
    existing_codes = list(item.license_codes or [])
    if item.product_type != CartItem.PRODUCT_PLUGIN:
        return []

    while len(existing_codes) < item.quantity:
        existing_codes.append(_build_license_code(item.order, item, len(existing_codes)))

    if existing_codes != list(item.license_codes or []):
        item.license_codes = existing_codes
        item.save(update_fields=["license_codes"])

    return existing_codes


def _format_amount(value: Decimal) -> str:
    return f"{value:,.2f}".replace(",", " ").replace(".00", "") + " ₽"


def _build_receipt_lines(order: Order) -> str:
    lines = []
    for item in order.items.all():
        line_total = item.price * item.quantity
        lines.append(f"- {item.title} × {item.quantity}: {_format_amount(line_total)}")
    return "\n".join(lines)


def _build_license_section(order: Order) -> str:
    sections = []
    for item in order.items.all():
        codes = _ensure_item_license_codes(item)
        if not codes:
            continue
        joined_codes = "\n".join(f"  • {code}" for code in codes)
        sections.append(f"{item.title}:\n{joined_codes}")
    return "\n\n".join(sections)


def _get_plugin_archive_files(order: Order):
    plugin_ids = [
        item.product_id
        for item in order.items.all()
        if item.product_type == CartItem.PRODUCT_PLUGIN
    ]
    if not plugin_ids:
        return []

    products = PluginProduct.objects.filter(pk__in=plugin_ids).only("id", "archive_file")
    return [product.archive_file for product in products if product.archive_file]


def _has_service_items(order: Order) -> bool:
    return any(item.product_type == CartItem.PRODUCT_SERVICE for item in order.items.all())


def _build_order_email_body(order: Order) -> str:
    receipt_lines = _build_receipt_lines(order)
    license_section = _build_license_section(order)
    has_service_items = _has_service_items(order)

    body_parts = [
        "Спасибо за покупку в Phase Records.",
        "",
        f"Заказ: #{order.id}",
        f"Сумма: {_format_amount(order.total_amount)}",
        "",
        "Чек:",
        receipt_lines or "- Позиции заказа отсутствуют",
    ]

    if license_section:
        body_parts.extend(
            [
                "",
                "Ваши лицензионные коды:",
                license_section,
                "",
                "Если возникнут вопросы по активации, просто ответьте на это письмо.",
            ]
        )

    if has_service_items:
        body_parts.extend(
            [
                "",
                "По услугам из заказа мы свяжемся с вами отдельно, чтобы уточнить детали и дальнейшие шаги.",
            ]
        )

    if not license_section and not has_service_items:
        body_parts.extend(
            [
                "",
                "Спасибо за заказ. Если появятся вопросы, просто ответьте на это письмо.",
            ]
        )

    body_parts.extend(
        [
            "",
            "Phase Records",
        ]
    )
    return "\n".join(body_parts)


def _humanize_email_delivery_error(exc: Exception) -> str:
    message = str(exc)
    if isinstance(exc, smtplib.SMTPAuthenticationError) or "Application password is REQUIRED" in message:
        return (
            "Почта не настроена для отправки. "
            "mail.ru требует пароль приложения: укажите реальный пароль приложения в EMAIL_HOST_PASSWORD."
        )
    return (
        "Не удалось отправить письмо с заказом. "
        "Проверьте EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD и настройки SMTP."
    )


def _notification_recipients():
    return list(getattr(settings, "ADMIN_NOTIFICATION_RECIPIENTS", []) or [])


def _is_placeholder_customer_email(email: str) -> bool:
    return (email or "").strip().lower().endswith("@phase.studio")


def _notifications_are_async() -> bool:
    return bool(getattr(settings, "EMAIL_NOTIFICATIONS_ASYNC", False))


def _run_email_task(name: str, callback, *args):
    if not _notifications_are_async():
        return callback(*args)

    def task():
        try:
            callback(*args)
        except Exception:
            logger.exception("Background email task failed: %s", name)

    threading.Thread(target=task, name=name, daemon=True).start()
    return True


def _format_datetime(value) -> str:
    if not value:
        return "-"
    return timezone.localtime(value).strftime("%d.%m.%Y %H:%M")


def _format_customer(user) -> str:
    if not user:
        return "-"

    parts = [
        getattr(user, "display_name", "") or getattr(user, "username", ""),
        getattr(user, "email", ""),
        getattr(user, "phone", ""),
    ]
    return " / ".join(part for part in parts if part) or str(user)


def _build_admin_order_body(order: Order) -> str:
    items = []
    for item in order.items.all():
        product_label = "услуга" if item.product_type == CartItem.PRODUCT_SERVICE else "плагин"
        item_total = item.price * item.quantity
        items.append(
            f"- {item.title} ({product_label}) x{item.quantity}: {_format_amount(item_total)}"
        )

    return "\n".join(
        [
            "Новая оплаченная покупка на сайте Phase Records.",
            "",
            f"Заказ: #{order.id}",
            f"Сумма: {_format_amount(order.total_amount)}",
            f"Статус: {order.status}",
            f"Оплата: {order.payment_provider or '-'} / {order.payment_id or '-'}",
            f"Дата создания: {_format_datetime(order.created_at)}",
            "",
            "Клиент:",
            f"- Аккаунт: {_format_customer(order.user)}",
            f"- Email для связи: {order.contact_email}",
            f"- Телефон: {order.contact_phone or '-'}",
            "",
            "Состав заказа:",
            "\n".join(items) or "- Позиции отсутствуют",
            "",
            "Проверьте заказ в админ-панели и свяжитесь с клиентом, если в заказе есть услуги.",
        ]
    )


def _build_admin_order_created_body(order: Order) -> str:
    items = []
    for item in order.items.all():
        product_label = "услуга" if item.product_type == CartItem.PRODUCT_SERVICE else "плагин"
        item_total = item.price * item.quantity
        items.append(
            f"- {item.title} ({product_label}) x{item.quantity}: {_format_amount(item_total)}"
        )

    return "\n".join(
        [
            "Новый заказ оформлен на сайте Phase Records.",
            "",
            f"Заказ: #{order.id}",
            f"Сумма: {_format_amount(order.total_amount)}",
            f"Статус: {order.status}",
            f"Ссылка на оплату: {order.payment_url or '-'}",
            f"Дата создания: {_format_datetime(order.created_at)}",
            "",
            "Клиент:",
            f"- Аккаунт: {_format_customer(order.user)}",
            f"- Email для связи: {order.contact_email}",
            f"- Телефон: {order.contact_phone or '-'}",
            "",
            "Состав заказа:",
            "\n".join(items) or "- Позиции отсутствуют",
        ]
    )


def _build_lead_notification_body(lead: RequestLead) -> str:
    return "\n".join(
        [
            "Новая заявка на сайте Phase Records.",
            "",
            f"Заявка: #{lead.id}",
            f"Дата: {_format_datetime(lead.created_at)}",
            f"Источник: {lead.source or '-'}",
            f"Услуга: {lead.service.title if lead.service else '-'}",
            "",
            "Клиент:",
            f"- Имя: {lead.name}",
            f"- Email: {lead.email or '-'}",
            f"- Телефон: {lead.phone or '-'}",
            "",
            "Сообщение:",
            lead.message or "-",
        ]
    )


def _build_booking_notification_body(booking: Booking) -> str:
    return "\n".join(
        [
            "Новое бронирование студии на сайте Phase Records.",
            "",
            f"Бронь: #{booking.id}",
            f"Дата создания: {_format_datetime(booking.created_at)}",
            f"Дата и время записи: {_format_datetime(booking.scheduled_at)}",
            f"Услуга: {booking.service.title}",
            f"Длительность: {booking.duration_hours} ч.",
            f"Сумма: {_format_amount(booking.total_price)}",
            f"Статус: {booking.status}",
            "",
            "Клиент:",
            f"- Аккаунт: {_format_customer(booking.user)}",
            f"- Имя в брони: {booking.client_name or '-'}",
            f"- Контакт: {booking.client_contact or '-'}",
            "",
            "Комментарий:",
            booking.notes or "-",
        ]
    )


def send_admin_notification(subject: str, message: str) -> bool:
    recipients = _notification_recipients()
    if not recipients:
        logger.warning("Admin notification was skipped: no recipients configured.")
        return False

    def deliver():
        send_mail(
            subject=subject,
            message=message,
            from_email=None,
            recipient_list=recipients,
            fail_silently=False,
        )
        return True

    try:
        return _run_email_task("admin-notification-email", deliver)
    except (smtplib.SMTPException, OSError):
        logger.exception("Failed to send admin notification: %s", subject)
        return False

def send_admin_order_paid_notification(order: Order, delivery_note: str = "") -> bool:
    message = _build_admin_order_body(order)
    if delivery_note:
        message = "\n".join([message, "", "Доставка клиенту:", delivery_note])

    return send_admin_notification(
        subject=f"Phase Records - оплаченный заказ #{order.id}",
        message=message,
    )


def send_admin_order_created_notification(order: Order) -> bool:
    return send_admin_notification(
        subject=f"Phase Records - новый заказ #{order.id}",
        message=_build_admin_order_created_body(order),
    )


def send_request_lead_notification(lead: RequestLead) -> bool:
    return send_admin_notification(
        subject=f"Phase Records - новая заявка #{lead.id}",
        message=_build_lead_notification_body(lead),
    )


def send_booking_notification(booking: Booking) -> bool:
    return send_admin_notification(
        subject=f"Phase Records - новое бронирование #{booking.id}",
        message=_build_booking_notification_body(booking),
    )


def send_order_confirmation_email(order: Order):
    try:
        email = EmailMessage(
            subject=f"Phase Records - спасибо за покупку, заказ #{order.id}",
            body=_build_order_email_body(order),
            from_email=None,
            to=[order.contact_email],
        )
        for archive_file in _get_plugin_archive_files(order):
            try:
                archive_file.open("rb")
                email.attach(
                    archive_file.name.rsplit("/", 1)[-1],
                    archive_file.read(),
                    "application/zip",
                )
            finally:
                archive_file.close()
        email.send(fail_silently=False)
    except (smtplib.SMTPException, OSError) as exc:
        raise EmailDeliveryError(_humanize_email_delivery_error(exc)) from exc


def send_order_paid_emails(order: Order):
    delivery_note = "Письмо клиенту отправлено."
    if _is_placeholder_customer_email(order.contact_email):
        delivery_note = "Письмо клиенту не отправлялось."
        logger.warning(
            "Skipped customer email for order %s: placeholder address %s",
            order.pk,
            order.contact_email,
        )
    else:
        try:
            send_order_confirmation_email(order)
        except EmailDeliveryError as exc:
            delivery_note = f"Письмо клиенту НЕ отправлено: {exc}"
            logger.warning(
                "Order confirmation email failed for order %s: %s",
                order.pk,
                exc,
            )

    send_admin_order_paid_notification(order, delivery_note=delivery_note)


def _send_order_paid_emails_by_id(order_id: int):
    order = Order.objects.select_related("user").prefetch_related("items").get(pk=order_id)
    send_order_paid_emails(order)


@transaction.atomic
def _confirm_order_payment_in_transaction(order_id: int):
    order = Order.objects.select_for_update().prefetch_related("items").get(pk=order_id)

    if order.status == Order.STATUS_PAID:
        return order, False

    for item in order.items.all():
        _ensure_item_license_codes(item)

    order.status = Order.STATUS_PAID
    order.save(update_fields=["status"])
    return order, True


@transaction.atomic
def _revert_order_to_pending(order_id: int):
    order = Order.objects.select_for_update().get(pk=order_id)
    if order.status == Order.STATUS_PAID:
        order.status = Order.STATUS_PENDING
        order.save(update_fields=["status"])


def _confirm_order_payment_locked(order: Order):
    last_error = None

    for attempt in range(3):
        try:
            confirmed_order, should_send_email = _confirm_order_payment_in_transaction(order.pk)
            break
        except OperationalError as exc:
            if "database is locked" not in str(exc).lower():
                raise
            last_error = exc
            if attempt == 2:
                raise DatabaseBusyError(
                    "База данных занята. Подтверждение оплаты можно повторить через пару секунд."
                ) from exc
            time.sleep(0.2 * (attempt + 1))

    if not should_send_email:
        return confirmed_order

    if _notifications_are_async():
        _run_email_task(
            f"order-paid-emails-{confirmed_order.pk}",
            _send_order_paid_emails_by_id,
            confirmed_order.pk,
        )
        return confirmed_order

    try:
        send_order_paid_emails(confirmed_order)
    except EmailDeliveryError:
        _revert_order_to_pending(confirmed_order.pk)
        raise

    return confirmed_order


def confirm_order_payment(order: Order):
    lock = _get_order_payment_lock(order.pk)
    with lock:
        return _confirm_order_payment_locked(order)


@transaction.atomic
def cancel_order_payment(order: Order):
    if order.status == Order.STATUS_CANCELLED:
        return order

    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status == Order.STATUS_CANCELLED:
        return order
    if order.status == Order.STATUS_PAID:
        return order

    order.status = Order.STATUS_CANCELLED
    order.save(update_fields=["status"])
    return order
