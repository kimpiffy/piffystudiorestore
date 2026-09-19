"""Data migration: add the second Try and Stop Me T-shirt image."""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def add_second_image(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    product = Product.objects.filter(slug="try-and-stop-me-t-shirt").first()
    image_path = (
        Path(__file__).resolve().parents[2]
        / "media"
        / "products"
        / "tryandstopme2.webp"
    )
    if not product or not image_path.exists():
        return

    ProductImage.objects.filter(product=product, position=1).delete()
    for product_image in ProductImage.objects.filter(
        product=product, position__gte=1
    ).order_by("-position"):
        product_image.position += 1
        product_image.save(update_fields=["position"])

    product_image = ProductImage(product=product, position=1)
    with image_path.open("rb") as image_file:
        product_image.image.save(
            "tryandstopme2.webp",
            ContentFile(image_file.read()),
            save=True,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0018_add_try_and_stop_me_images"),
    ]

    operations = [
        migrations.RunPython(add_second_image, migrations.RunPython.noop),
    ]