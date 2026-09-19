"""Data migration: add Grumpy Green Man Sticker with 2 product images.

Adds the grumpy green man holographic sticker (grumpy-green-man-sticker slug)
with 2 product images (grumpygreenmansticker1.webp and grumpygreenmansticker2.webp).
"""
import json
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations
from django.utils.text import slugify


def add_grumpy_green_man_sticker(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    shop_dir = Path(__file__).resolve().parents[1]
    repo_root = shop_dir.parent

    # Product details
    slug = "grumpy-green-man-sticker"
    category_name = "Badges & Stickers"
    title = "Grumpy Green Man Sticker"
    description = "*With the state of things, no wonder he's grumpy.*\n\nA super-shiny **holographic sticker featuring this very cute Green Man** — a bit fed up with the world, but still sparkling! Approx. **3 inches tall x 2.4 inches wide**."
    price = "4.00"
    stock = 30
    featured = True

    # Get or create category
    category, _ = Category.objects.get_or_create(
        name=category_name,
        defaults={"slug": slugify(category_name), "description": ""},
    )

    # Upsert product
    product, created = Product.objects.update_or_create(
        slug=slug,
        defaults={
            "title": title,
            "category": category,
            "description": description,
            "price": price,
            "stock": stock,
            "featured": featured,
        },
    )

    # Only add images if this is a new product or has no existing images
    if created or not ProductImage.objects.filter(product=product).exists():
        # Clear any existing images first (if updating)
        ProductImage.objects.filter(product=product).delete()

        # Add the 2 product images
        image_files = [
            "grumpygreenmansticker1.webp",
            "grumpygreenmansticker2.webp",
        ]

        for position, image_filename in enumerate(image_files):
            image_path = repo_root / "media" / "products" / image_filename
            if image_path.exists():
                product_image = ProductImage(product=product, position=position)
                with image_path.open("rb") as fh:
                    product_image.image.save(
                        image_filename,
                        ContentFile(fh.read()),
                        save=True,
                    )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0008_update_shop_lineup_2025"),
    ]

    operations = [
        migrations.RunPython(add_grumpy_green_man_sticker, migrations.RunPython.noop),
    ]
