"""Data migration: update Nature vs Machine Diptych description."""
from django.db import migrations


def update_product_description(apps, schema_editor):
    Product = apps.get_model("shop", "Product")

    product = Product.objects.filter(slug='nature-vs-machine-diptych').first()
    if product:
        product.description = "**A diptych that collapses the boundaries between natural and artificial systems.**\n\nThis pair of **A3 posters** questions \"nature versus machine,\" with each image containing characteristics we usually associate with the other.\n\nBright, graphic and just a little bit uncanny, the pairing sits comfortably in the ambiguous, holding the tension between opposites."
        product.save()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0014_update_polycephalic_postcard_description'),
    ]

    operations = [
        migrations.RunPython(update_product_description, migrations.RunPython.noop),
    ]
