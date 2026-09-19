"""Data migration: restore the complete Try and Stop Me T-shirt gallery order."""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def rebuild_gallery(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    product = Product.objects.filter(slug="try-and-stop-me-t-shirt").first()
    if not product:
        return

    repo_root = Path(__file__).resolve().parents[2]
    image_files = [
        "tryandstopme1.webp",
        "tryandstopme2.webp",
        "tryandstopme3.webp",
        "tryandstopme4.webp",
        "tryandstopme5.webp",
    ]

    ProductImage.objects.filter(product=product).delete()
    for position, image_filename in enumerate(image_files):
        image_path = repo_root / "media" / "products" / image_filename
        if not image_path.exists():
            continue

        product_image = ProductImage(product=product, position=position)
        with image_path.open("rb") as image_file:
            product_image.image.save(
                image_filename,
                ContentFile(image_file.read()),
                save=True,
            )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0019_add_try_and_stop_me_second_image"),
    ]

    operations = [
        migrations.RunPython(rebuild_gallery, migrations.RunPython.noop),
    ]