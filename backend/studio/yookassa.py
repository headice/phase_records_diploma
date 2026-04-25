import base64
import json
import uuid
from urllib import error, request
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from django.conf import settings


class YooKassaError(Exception):
    pass


def _get_required_setting(name):
    value = (getattr(settings, name, "") or "").strip()
    if not value:
        raise YooKassaError(f"YooKassa is not configured: missing {name}.")
    return value


def _build_auth_header(shop_id, secret_key):
    token = base64.b64encode(f"{shop_id}:{secret_key}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def _extract_error_message(raw_body):
    if not raw_body:
        return ""
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return raw_body
    description = payload.get("description")
    if description:
        return description
    return payload.get("type") or raw_body


def _build_return_url(base_url, order):
    parts = urlsplit(base_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["payment"] = "success"
    query["order_id"] = str(order.id)
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )


def create_yookassa_payment(order, return_url=None):
    shop_id = _get_required_setting("YOOKASSA_SHOP_ID")
    secret_key = _get_required_setting("YOOKASSA_SECRET_KEY")
    return_url = _build_return_url(
        return_url or _get_required_setting("YOOKASSA_RETURN_URL"),
        order,
    )

    payload = {
        "amount": {
            "value": format(order.total_amount, ".2f"),
            "currency": "RUB",
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": return_url,
        },
        "description": f"Phase Records order #{order.id}",
        "metadata": {
            "order_id": str(order.id),
            "user_id": str(order.user_id),
        },
    }

    payment_request = request.Request(
        settings.YOOKASSA_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": _build_auth_header(shop_id, secret_key),
            "Content-Type": "application/json",
            "Idempotence-Key": str(uuid.uuid4()),
        },
        method="POST",
    )

    try:
        with request.urlopen(payment_request, timeout=20) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        message = _extract_error_message(exc.read().decode("utf-8", "ignore"))
        raise YooKassaError(f"YooKassa rejected the payment: {message or exc.reason}.") from exc
    except error.URLError as exc:
        raise YooKassaError("Could not reach YooKassa. Check the network and API credentials.") from exc

    payment_id = response_payload.get("id", "")
    confirmation_url = response_payload.get("confirmation", {}).get("confirmation_url", "")
    if not payment_id or not confirmation_url:
        raise YooKassaError("YooKassa returned an incomplete payment response.")

    return {
        "payment_id": payment_id,
        "payment_url": confirmation_url,
        "status": response_payload.get("status", ""),
    }
