"""Data migration: add Nature vs Machine Diptych product images."""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def add_nature_vs_machine_images(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    product = Product.objects.filter(slug="nature-vs-machine-diptych").first()
    if not product:
        return

    repo_root = Path(__file__).resolve().parents[2]
    image_files = [
        "naturevsmachine1.webp",
        "naturevsmachine2.webp",
        "naturevsmachine3.webp",
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
        ("shop", "0015_update_nature_vs_machine_diptych"),
    ]

    operations = [
        migrations.RunPython(
            add_nature_vs_machine_images,
            migrations.RunPython.noop,
        ),
    ]