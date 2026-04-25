from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="license_codes",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
