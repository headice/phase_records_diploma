from datetime import datetime, time, timedelta

from django.utils import timezone

from .models import Booking

BOOKING_OPEN_HOUR = 10
BOOKING_CLOSE_HOUR = 22
BOOKING_DAYS_AHEAD = 21


def active_booking_statuses():
    return [Booking.STATUS_PENDING, Booking.STATUS_CONFIRMED]


def normalize_slot_start(value):
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone.get_current_timezone())
    return timezone.localtime(value)


def is_hour_slot(value):
    slot = normalize_slot_start(value)
    return slot.minute == 0 and slot.second == 0 and slot.microsecond == 0


def has_slot_conflict(service, scheduled_at, exclude_booking_id=None):
    slot = normalize_slot_start(scheduled_at)
    queryset = Booking.objects.filter(
        service=service,
        status__in=active_booking_statuses(),
        scheduled_at=slot,
    )
    if exclude_booking_id:
        queryset = queryset.exclude(pk=exclude_booking_id)
    return queryset.exists()


def generate_service_slots(service, target_date):
    current_tz = timezone.get_current_timezone()
    day_start = timezone.make_aware(
        datetime.combine(target_date, time(hour=BOOKING_OPEN_HOUR)),
        current_tz,
    )
    now = timezone.localtime()
    booked_slots = {
        normalize_slot_start(booking.scheduled_at).strftime("%H:%M")
        for booking in Booking.objects.filter(
            service=service,
            status__in=active_booking_statuses(),
            scheduled_at__date=target_date,
        )
    }

    slots = []
    cursor = day_start
    while cursor.hour < BOOKING_CLOSE_HOUR:
        label = cursor.strftime("%H:%M")
        is_past = cursor <= now
        is_taken = label in booked_slots
        slots.append(
            {
                "label": label,
                "start": cursor.isoformat(),
                "available": not is_past and not is_taken,
                "is_taken": is_taken,
                "is_past": is_past,
            }
        )
        cursor += timedelta(hours=1)
    return slots
