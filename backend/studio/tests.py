from datetime import datetime, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.tokens import default_token_generator
from django.core.files.base import ContentFile
from django.core import mail
from django.db import OperationalError
from django.test import RequestFactory, TestCase, override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from phase_backend.media import serve_media_file
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Booking, CartItem, DemoTrack, PluginProduct, RequestLead, Service, User, Order
from .serializers import ResilientCheckoutSerializer
from .services import DatabaseBusyError, EmailDeliveryError, confirm_order_payment
from .yookassa import YooKassaError


class MediaRangeTests(TestCase):
    def test_media_file_supports_byte_ranges(self):
        with TemporaryDirectory() as temp_dir:
            media_root = Path(temp_dir)
            track_dir = media_root / "demo_tracks"
            track_dir.mkdir()
            (track_dir / "sample.mp3").write_bytes(b"0123456789")

            request = RequestFactory().get(
                "/media/demo_tracks/sample.mp3",
                HTTP_RANGE="bytes=2-5",
            )

            with override_settings(MEDIA_ROOT=media_root):
                response = serve_media_file(request, "demo_tracks/sample.mp3")

            self.assertEqual(response.status_code, 206)
            self.assertEqual(response["Accept-Ranges"], "bytes")
            self.assertEqual(response["Content-Range"], "bytes 2-5/10")
            self.assertEqual(response["Content-Length"], "4")
            self.assertEqual(b"".join(response.streaming_content), b"2345")


class AuthFlowTests(APITestCase):
    def test_register_and_login(self):
        register_url = reverse("register")
        payload = {
            "username": "tester",
            "email": "tester@example.com",
            "password": "StrongPass123!",
        }
        response = self.client.post(register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login_url = reverse("token_obtain_pair")
        response = self.client.post(
            login_url, {"email": "tester@example.com", "password": "StrongPass123!"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

        token = response.data["access"]
        me_url = reverse("me")
        response = self.client.get(me_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], payload["email"])

        update_payload = {
            "display_name": "Phase Buyer",
            "email": "buyer@example.com",
            "phone": "+79990001122",
        }
        response = self.client.put(
            me_url,
            update_payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["display_name"], update_payload["display_name"])
        self.assertEqual(response.data["email"], update_payload["email"])
        self.assertEqual(response.data["phone"], update_payload["phone"])

        user = User.objects.get(username=payload["username"])
        self.assertEqual(user.phone, update_payload["phone"])

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_request_and_confirm(self):
        user = User.objects.create_user(
            username="forgotten",
            email="forgotten@example.com",
            password="OldPass123!",
        )

        response = self.client.post(
            reverse("password-reset"),
            {"email": user.email},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/reset-password/", mail.outbox[0].body)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        response = self.client.post(
            reverse("password-reset-confirm"),
            {"uid": uid, "token": token, "new_password": "NewPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        login_response = self.client.post(
            reverse("token_obtain_pair"),
            {"email": user.email, "password": "NewPass123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_unknown_email_is_generic(self):
        response = self.client.post(
            reverse("password-reset"),
            {"email": "missing@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)


class BookingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="booker", email="booker@example.com", password="Book12345!"
        )
        self.service = Service.objects.create(
            title="Запись вокала", slug="recording", price=1500
        )
        login_url = reverse("token_obtain_pair")
        resp = self.client.post(
            login_url, {"email": self.user.email, "password": "Book12345!"}
        )
        self.token = resp.data["access"]

    def auth(self):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_create_booking(self):
        url = reverse("bookings-list")
        payload = {
            "service_id": self.service.id,
            "client_name": "Booker",
            "client_contact": "@booker",
            "scheduled_at": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
            "duration_hours": 2,
            "notes": "Тестовая бронь",
        }
        payload["duration_hours"] = 1
        payload["scheduled_at"] = (
            datetime.utcnow().replace(minute=0, second=0, microsecond=0) + timedelta(days=1, hours=2)
        ).isoformat() + "Z"
        response = self.client.post(url, payload, format="json", **self.auth())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(float(response.data["total_price"]), 1500.0)
        self.assertEqual(response.data["client_name"], "Booker")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("новое бронирование", mail.outbox[0].subject.lower())
        self.assertEqual(mail.outbox[0].to, ["phase_records@mail.ru"])

    def test_booking_rejects_busy_slot(self):
        scheduled_at = (
            datetime.utcnow().replace(minute=0, second=0, microsecond=0) + timedelta(days=2, hours=3)
        ).isoformat() + "Z"
        booking_payload = {
            "service_id": self.service.id,
            "client_name": "Booker",
            "client_contact": "@booker",
            "scheduled_at": scheduled_at,
            "duration_hours": 1,
            "notes": "Первый слот",
        }
        first = self.client.post(reverse("bookings-list"), booking_payload, format="json", **self.auth())
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(reverse("bookings-list"), booking_payload, format="json", **self.auth())
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", second.data)
        self.assertIn("scheduled_at", second.data["errors"])

    def test_service_slots_endpoint(self):
        tomorrow = (datetime.utcnow() + timedelta(days=1)).date()
        target_dt = datetime.combine(tomorrow, datetime.min.time()).replace(hour=12)
        self.client.post(
            reverse("bookings-list"),
            {
                "service_id": self.service.id,
                "client_name": "Booker",
                "client_contact": "@booker",
                "scheduled_at": target_dt.isoformat() + "Z",
                "duration_hours": 1,
                "notes": "Занятый слот",
            },
            format="json",
            **self.auth(),
        )

        slots_url = reverse("services-slots", kwargs={"slug": self.service.slug})
        response = self.client.get(
            slots_url,
            {"date": target_dt.date().isoformat()},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("slots", response.data)
        matching_slot = next(
            slot for slot in response.data["slots"] if slot["label"] == target_dt.strftime("%H:%M")
        )
        self.assertFalse(matching_slot["available"])


class RequestLeadTests(APITestCase):
    def setUp(self):
        self.service = Service.objects.create(
            title="Сведение и мастеринг", slug="mix-master", price=3500
        )

    def test_create_lead_sends_admin_notification(self):
        response = self.client.post(
            reverse("leads-list"),
            {
                "name": "Artist",
                "email": "artist@example.com",
                "phone": "+79990000000",
                "message": "Хочу обсудить релиз",
                "service": self.service.id,
                "source": "site",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RequestLead.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("новая заявка", mail.outbox[0].subject.lower())
        self.assertEqual(mail.outbox[0].to, ["phase_records@mail.ru"])


class CheckoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="buyer", email="buyer@example.com", password="Buy12345!"
        )
        self.service = Service.objects.create(
            title="Запись вокала",
            slug="recording-service",
            price=1500,
        )
        self.plugin = PluginProduct.objects.create(
            name="Serum 2",
            slug="serum-2",
            price=3990,
            tag="синтезатор",
            description="Плагин для синтеза",
        )
        login_url = reverse("token_obtain_pair")
        resp = self.client.post(
            login_url, {"email": self.user.email, "password": "Buy12345!"}
        )
        self.token = resp.data["access"]

    def auth(self):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def add_plugin_to_cart(self):
        add_url = reverse("cart-items-list")
        response = self.client.post(
            add_url,
            {
                "product_type": "plugin",
                "product_id": self.plugin.id,
                "quantity": 1,
            },
            format="json",
            **self.auth(),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 1)

    def add_service_to_cart(self):
        add_url = reverse("cart-items-list")
        response = self.client.post(
            add_url,
            {
                "product_type": "service",
                "product_id": self.service.id,
                "quantity": 1,
            },
            format="json",
            **self.auth(),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 1)

    def test_cart_item_quantity_can_be_updated(self):
        self.add_plugin_to_cart()
        item = CartItem.objects.get(user=self.user)

        response = self.client.patch(
            reverse("cart-items-detail", kwargs={"pk": item.id}),
            {"quantity": 3},
            format="json",
            **self.auth(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity"], 3)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 3)

    def test_cart_item_quantity_cannot_be_less_than_one(self):
        self.add_plugin_to_cart()
        item = CartItem.objects.get(user=self.user)

        response = self.client.patch(
            reverse("cart-items-detail", kwargs={"pk": item.id}),
            {"quantity": 0},
            format="json",
            **self.auth(),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 1)

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_checkout_from_cart(self, mock_create_payment):
        self.add_plugin_to_cart()

        checkout_url = reverse("checkout")
        response = self.client.post(
            checkout_url,
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending_payment")
        self.assertEqual(response.data["payment_id"], "pay_test_123")
        self.assertEqual(
            response.data["payment_url"],
            "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        )
        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 0)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("новый заказ", mail.outbox[0].subject.lower())
        self.assertIn("Serum 2", mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ["phase_records@mail.ru"])
        mock_create_payment.assert_called_once()

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_checkout_accepts_localhost_return_url(self, mock_create_payment):
        self.add_plugin_to_cart()

        response = self.client.post(
            reverse("checkout"),
            {
                "contact_email": "buyer@example.com",
                "contact_phone": "+79990000000",
                "return_url": "http://localhost:5173/cart?payment=return",
            },
            format="json",
            **self.auth(),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            mock_create_payment.call_args.kwargs["return_url"],
            "http://localhost:5173/cart?payment=return",
        )

    @patch(
        "studio.serializers.create_yookassa_payment",
        side_effect=YooKassaError("payment failed"),
    )
    def test_checkout_keeps_cart_if_payment_creation_crashes(self, mock_create_payment):
        self.add_plugin_to_cart()

        checkout_url = reverse("checkout")
        response = self.client.post(
            checkout_url,
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
        self.assertIn("payment", response.data["errors"])
        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 1)
        mock_create_payment.assert_called_once()

    def test_checkout_retries_when_sqlite_database_is_locked(self):
        serializer = ResilientCheckoutSerializer(
            data={"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            context={"request": SimpleNamespace(user=self.user)},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        expected_order = SimpleNamespace(id=999)
        with patch.object(
            ResilientCheckoutSerializer,
            "_create_checkout_order",
            side_effect=[OperationalError("database is locked"), expected_order],
        ) as mock_create:
            order = serializer.save()

        self.assertIs(order, expected_order)
        self.assertEqual(mock_create.call_count, 2)

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_confirm_payment_retries_when_sqlite_database_is_locked(self, mock_create_payment):
        self.add_plugin_to_cart()

        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        order = Order.objects.get(pk=checkout_response.data["id"])
        expected_order = Order.objects.get(pk=order.pk)
        expected_order.status = Order.STATUS_PAID

        with patch(
            "studio.services._confirm_order_payment_in_transaction",
            side_effect=[OperationalError("database is locked"), (expected_order, False)],
        ) as mock_confirm:
            confirmed_order = confirm_order_payment(order)

        self.assertEqual(mock_confirm.call_count, 2)
        self.assertEqual(confirmed_order.status, Order.STATUS_PAID)

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_confirm_payment_returns_503_when_database_is_locked(self, mock_create_payment):
        self.add_plugin_to_cart()

        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        order_id = checkout_response.data["id"]

        with patch(
            "studio.views.confirm_order_payment",
            side_effect=DatabaseBusyError(
                "База данных занята. Подтверждение оплаты можно повторить через пару секунд."
            ),
        ):
            response = self.client.post(
                reverse("orders-confirm-payment", kwargs={"pk": order_id}),
                format="json",
                **self.auth(),
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("База данных занята", response.data["detail"])

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_confirm_payment_marks_order_paid_and_sends_email(self, mock_create_payment):
        self.plugin.archive_file.save(
            "serum-2.zip", ContentFile(b"fake zip payload"), save=True
        )
        self.add_plugin_to_cart()

        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
        order_id = checkout_response.data["id"]

        confirm_response = self.client.post(
            reverse("orders-confirm-payment", kwargs={"pk": order_id}),
            format="json",
            **self.auth(),
        )
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_response.data["status"], Order.STATUS_PAID)
        self.assertEqual(len(confirm_response.data["items"][0]["license_codes"]), 1)

        order = Order.objects.get(pk=order_id)
        self.assertEqual(order.status, Order.STATUS_PAID)
        self.assertEqual(len(mail.outbox), 3)
        self.assertIn("спасибо за покупку", mail.outbox[1].subject.lower())
        self.assertIn("лицензионные коды", mail.outbox[1].body.lower())
        self.assertEqual(len(mail.outbox[1].attachments), 1)
        self.assertTrue(mail.outbox[1].attachments[0][0].startswith("serum-2"))
        self.assertTrue(mail.outbox[1].attachments[0][0].endswith(".zip"))
        self.assertEqual(mail.outbox[1].attachments[0][2], "application/zip")
        self.assertIn("оплаченный заказ", mail.outbox[2].subject.lower())
        self.assertEqual(mail.outbox[2].to, ["phase_records@mail.ru"])

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_confirm_payment_stays_paid_and_notifies_admin_if_customer_email_fails(self, mock_create_payment):
        self.add_plugin_to_cart()

        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        order = Order.objects.get(pk=checkout_response.data["id"])

        with patch(
            "studio.services.send_order_confirmation_email",
            side_effect=EmailDeliveryError("smtp failed"),
        ):
            confirm_order_payment(order)

        order.refresh_from_db()
        self.assertEqual(order.status, Order.STATUS_PAID)
        self.assertEqual(len(mail.outbox), 2)
        self.assertIn("новый заказ", mail.outbox[0].subject.lower())
        self.assertIn("оплаченный заказ", mail.outbox[1].subject.lower())
        self.assertIn("НЕ отправлено", mail.outbox[1].body)

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_confirm_payment_for_service_order_sends_followup_email_without_license_codes(self, mock_create_payment):
        self.add_service_to_cart()

        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
        order_id = checkout_response.data["id"]

        confirm_response = self.client.post(
            reverse("orders-confirm-payment", kwargs={"pk": order_id}),
            format="json",
            **self.auth(),
        )
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_response.data["status"], Order.STATUS_PAID)
        self.assertEqual(confirm_response.data["items"][0]["license_codes"], [])

        self.assertEqual(len(mail.outbox), 3)
        self.assertNotIn("лицензионные коды", mail.outbox[1].body.lower())
        self.assertIn("мы свяжемся с вами", mail.outbox[1].body.lower())

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_confirm_payment_is_idempotent_for_paid_orders(self, mock_create_payment):
        self.add_plugin_to_cart()

        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        order_id = checkout_response.data["id"]

        first = self.client.post(
            reverse("orders-confirm-payment", kwargs={"pk": order_id}),
            format="json",
            **self.auth(),
        )
        second = self.client.post(
            reverse("orders-confirm-payment", kwargs={"pk": order_id}),
            format="json",
            **self.auth(),
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.get(pk=order_id).status, Order.STATUS_PAID)
        self.assertEqual(len(mail.outbox), 3)

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_yookassa_webhook_confirms_order_and_sends_email(self, mock_create_payment):
        self.add_plugin_to_cart()
        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        order_id = checkout_response.data["id"]

        webhook_response = self.client.post(
            reverse("yookassa-webhook"),
            {
                "event": "payment.succeeded",
                "object": {
                    "id": "pay_test_123",
                    "metadata": {"order_id": str(order_id)},
                },
            },
            format="json",
            REMOTE_ADDR="185.71.76.5",
        )

        self.assertEqual(webhook_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.get(pk=order_id).status, Order.STATUS_PAID)
        self.assertEqual(len(mail.outbox), 3)

    @patch(
        "studio.serializers.create_yookassa_payment",
        return_value={
            "payment_id": "pay_test_123",
            "payment_url": "https://yoomoney.ru/checkout/payments/v2/contract?order=123",
        },
    )
    def test_yookassa_webhook_can_cancel_unpaid_order(self, mock_create_payment):
        self.add_plugin_to_cart()
        checkout_response = self.client.post(
            reverse("checkout"),
            {"contact_email": "buyer@example.com", "contact_phone": "+79990000000"},
            format="json",
            **self.auth(),
        )
        order_id = checkout_response.data["id"]

        webhook_response = self.client.post(
            reverse("yookassa-webhook"),
            {
                "event": "payment.canceled",
                "object": {
                    "id": "pay_test_123",
                    "metadata": {"order_id": str(order_id)},
                },
            },
            format="json",
            REMOTE_ADDR="185.71.76.5",
        )

        self.assertEqual(webhook_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.get(pk=order_id).status, Order.STATUS_CANCELLED)

    def test_yookassa_webhook_rejects_untrusted_ip(self):
        response = self.client.post(
            reverse("yookassa-webhook"),
            {
                "event": "payment.succeeded",
                "object": {"id": "pay_test_123", "metadata": {"order_id": "1"}},
            },
            format="json",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DemoTrackTests(APITestCase):
    def test_public_demo_tracks_list_exposes_audio_source(self):
        DemoTrack.objects.create(
            title="Leslie - before",
            kind=DemoTrack.KIND_BEFORE,
            pair_key="leslie",
            audio_url="https://example.com/before.mp3",
            order=1,
        )
        DemoTrack.objects.create(
            title="Hidden demo",
            kind=DemoTrack.KIND_AFTER,
            pair_key="hidden",
            audio_url="https://example.com/hidden.mp3",
            is_active=False,
        )

        response = self.client.get(reverse("demo-tracks-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if isinstance(response.data, list) else response.data["results"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["audio"], "https://example.com/before.mp3")
        self.assertEqual(data[0]["kind"], DemoTrack.KIND_BEFORE)
        self.assertEqual(data[0]["pair_key"], "leslie")


@override_settings(
    CORS_ALLOWED_ORIGINS=["http://localhost:3000"],
    CORS_ALLOW_ALL_ORIGINS=False,
    X_FRAME_OPTIONS="DENY",
)
class SecurityHeadersTests(APITestCase):
    def test_health_response_includes_clickjacking_headers(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Frame-Options"], "DENY")
        self.assertEqual(response["Content-Security-Policy"], "frame-ancestors 'none'")

    def test_health_response_allows_only_known_cors_origin(self):
        response = self.client.get(
            reverse("health"),
            HTTP_ORIGIN="http://localhost:3000",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Access-Control-Allow-Origin"], "http://localhost:3000")
