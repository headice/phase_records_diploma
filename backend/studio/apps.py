from django.apps import AppConfig


class StudioConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "studio"
    verbose_name = "Phase Records"

    def ready(self):
        from . import db  # noqa: F401
