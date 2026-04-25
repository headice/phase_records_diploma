from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0002_orderitem_license_codes"),
    ]

    operations = [
        migrations.AddField(
            model_name="pluginproduct",
            name="image_file",
            field=models.FileField(blank=True, default="", upload_to="plugins/"),
        ),
    ]
