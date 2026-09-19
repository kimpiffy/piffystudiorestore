"""Data migration: add Tune In Hoodie product images."""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def add_tune_in_hoodie_images(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    product = Product.objects.filter(slug="tune-in-hoodie").first()
    if not product:
        return

    repo_root = Path(__file__).resolve().parents[2]
    image_files = [
        "tuneinhoodie1.webp",
        "tuneinhoodie2.webp",
        "tuneinhoodie3.webp",
        "tuneinhoodie4.webp",
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
        ("shop", "0020_rebuild_try_and_stop_me_gallery"),
    ]

    operations = [
        migrations.RunPython(
            add_tune_in_hoodie_images,
            migrations.RunPython.noop,
        ),
    ]