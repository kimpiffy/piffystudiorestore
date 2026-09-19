"""Data migration: add 5 images to Polycephalic Postcard and update manifesto description.

Adds 5 product images for the polycephalic-postcard product, and updates
the manifesto zine description to say "It's your field notes".
"""
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations


def update_products(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    shop_dir = Path(__file__).resolve().parents[1]
    repo_root = shop_dir.parent

    # Update Manifesto Zine description
    manifesto = Product.objects.filter(slug='manifesto-zine').first()
    if manifesto:
        manifesto.description = "An A5 zine all about the creative process, framed through a transformative, alchemical cycle.\n\nThis isn't your average self-help guide. It's your field notes for moving an idea from an intuitive notion into actualized form.\n\nThe five stages **Unveil, Articulate, Synthesize, Actualise and Distill** give the creative process a symbolic structure to follow, but the writing stays grounded in practice with affirming honesty that will help you to bring your brilliant ideas into reality."
        manifesto.save()

    # Add Polycephalic Postcard images
    polycephalic = Product.objects.filter(slug='polycephalic-postcard').first()
    if polycephalic:
        # Clear existing images
        ProductImage.objects.filter(product=polycephalic).delete()

        # Add the 5 product images
        image_files = [
            'polycephalicpostcard1.webp',
            'polycephalicpostcard2.webp',
            'polycephalicpostcard3.webp',
            'polycephalicpostcard4.webp',
            'polycephalicpostcard5.webp',
        ]

        for position, image_filename in enumerate(image_files):
            image_path = repo_root / 'media' / 'products' / image_filename
            if image_path.exists():
                product_image = ProductImage(product=polycephalic, position=position)
                with image_path.open('rb') as fh:
                    product_image.image.save(
                        image_filename,
                        ContentFile(fh.read()),
                        save=True,
                    )


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0012_update_manifesto_zine_images_and_description'),
    ]

    operations = [
        migrations.RunPython(update_products, migrations.RunPython.noop),
    ]
