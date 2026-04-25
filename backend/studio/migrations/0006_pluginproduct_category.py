from django.db import migrations, models


def set_initial_plugin_categories(apps, schema_editor):
    plugin_product = apps.get_model("studio", "PluginProduct")
    plugin_product.objects.filter(slug__in=["serum2", "serum-2"]).update(
        category="vsti_instrument"
    )
    plugin_product.objects.filter(slug__in=["fabfilter-bundle"]).update(
        category="vst_mixing"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0005_pluginproduct_archive_file"),
    ]

    operations = [
        migrations.AddField(
            model_name="pluginproduct",
            name="category",
            field=models.CharField(
                choices=[
                    ("vst_mixing", "VST - Для сведения"),
                    ("vsti_instrument", "VSTi - Для звукоизвлечения"),
                ],
                default="vst_mixing",
                max_length=32,
            ),
        ),
        migrations.RunPython(set_initial_plugin_categories, migrations.RunPython.noop),
    ]
