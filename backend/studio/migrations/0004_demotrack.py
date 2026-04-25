from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0003_pluginproduct_image_file"),
    ]

    operations = [
        migrations.CreateModel(
            name="DemoTrack",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("kind", models.CharField(choices=[("before", "До сведения"), ("after", "После сведения")], max_length=20)),
                ("pair_key", models.SlugField(help_text="Одинаковый ключ ставит треки 'до' и 'после' в одну строку.", max_length=120)),
                ("audio_file", models.FileField(blank=True, default="", upload_to="demo_tracks/")),
                ("audio_url", models.URLField(blank=True, default="")),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["order", "pair_key", "kind", "id"],
            },
        ),
    ]
