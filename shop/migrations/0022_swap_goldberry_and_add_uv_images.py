"""Data migration: reorder Goldberry A4 images and add UV artwork images."""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def update_print_galleries(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")
    repo_root = Path(__file__).resolve().parents[2]

    goldberry = Product.objects.filter(slug="goldberry-a4-print").first()
    if goldberry:
        first = ProductImage.objects.filter(product=goldberry, position=0).first()
        second = ProductImage.objects.filter(product=goldberry, position=1).first()
        if first and second:
            first.position = 1000000
            first.save(update_fields=["position"])
            second.position = 0
            second.save(update_fields=["position"])
            first.position = 1
            first.save(update_fields=["position"])

    uv_images = {
        "solastalgia": "solastalgia-uv.webp",
        "communion": "communion-uv.webp",
        "division": "division-uv.webp",
        "antagony": "antagony-uv.webp",
    }
    for slug, image_filename in uv_images.items():
        product = Product.objects.filter(slug=slug).first()
        image_path = repo_root / "media" / "products" / image_filename
        if not product or not image_path.exists():
            continue

        ProductImage.objects.filter(product=product, position=1).delete()
        product_image = ProductImage(product=product, position=1)
        with image_path.open("rb") as image_file:
            product_image.image.save(
                image_filename,
                ContentFile(image_file.read()),
                save=True,
            )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0021_add_tune_in_hoodie_images"),
    ]

    operations = [
        migrations.RunPython(
            update_print_galleries,
            migrations.RunPython.noop,
        ),
    ]