"""Data migration: add 5 product images to Manifesto Zine.

Adds 5 product images for the manifesto-zine product, showing pages from the zine.
"""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def add_manifesto_zine_images(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    shop_dir = Path(__file__).resolve().parents[1]
    repo_root = shop_dir.parent

    # Find the manifesto-zine product
    product = Product.objects.filter(slug='manifesto-zine').first()
    if not product:
        return

    # Clear any existing images first
    ProductImage.objects.filter(product=product).delete()

    # Add the 5 product images in order
    image_files = [
        'manifestozine1.webp',
        'manifestozine1-2.webp',
        'manifestozine2.webp',
        'manifestozine3.webp',
        'manifestozine4.webp',
    ]

    for position, image_filename in enumerate(image_files):
        image_path = repo_root / 'media' / 'products' / image_filename
        if image_path.exists():
            product_image = ProductImage(product=product, position=position)
            with image_path.open('rb') as fh:
                product_image.image.save(
                    image_filename,
                    ContentFile(fh.read()),
                    save=True,
                )


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0009_add_grumpy_green_man_sticker'),
    ]

    operations = [
        migrations.RunPython(add_manifesto_zine_images, migrations.RunPython.noop),
    ]
