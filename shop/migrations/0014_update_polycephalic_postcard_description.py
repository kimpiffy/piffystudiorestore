"""Data migration: update Polycephalic Postcard description."""
from django.db import migrations


def update_product_description(apps, schema_editor):
    Product = apps.get_model("shop", "Product")

    product = Product.objects.filter(slug='polycephalic-postcard').first()
    if product:
        product.description = "**Four postcards for the price of one!**\n\nNot only are there multiple ways to view each face, there's a different design printed on either side.\n\nDisplay one then, flip it, turn it, reverse it as you please. If you're the kind of person who gets bored easily, this artwork should definitely keep you entertained for a while."
        product.save()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0013_add_polycephalic_postcard_images'),
    ]

    operations = [
        migrations.RunPython(update_product_description, migrations.RunPython.noop),
    ]
