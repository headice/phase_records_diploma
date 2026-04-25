from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0004_demotrack"),
    ]

    operations = [
        migrations.AddField(
            model_name="pluginproduct",
            name="archive_file",
            field=models.FileField(blank=True, default="", upload_to="plugin_archives/"),
        ),
    ]
