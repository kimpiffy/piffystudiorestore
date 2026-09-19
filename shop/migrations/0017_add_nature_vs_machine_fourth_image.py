"""Data migration: add the fourth Nature vs Machine Diptych image."""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def add_fourth_image(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    product = Product.objects.filter(slug="nature-vs-machine-diptych").first()
    image_path = Path(__file__).resolve().parents[2] / "media" / "products" / "naturevsmachine4.webp"
    if not product or not image_path.exists():
        return

    ProductImage.objects.filter(product=product, position=3).delete()
    product_image = ProductImage(product=product, position=3)
    with image_path.open("rb") as image_file:
        product_image.image.save(
            "naturevsmachine4.webp",
            ContentFile(image_file.read()),
            save=True,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0016_add_nature_vs_machine_images"),
    ]

    operations = [
        migrations.RunPython(add_fourth_image, migrations.RunPython.noop),
    ]