"""Data migration: replace placeholder dev catalogue with the real 2025 product lineup.

Runs automatically as part of `python manage.py migrate` (called from build.sh
on every deploy), so editing shop/seed_data/shop_products.json and pushing is
enough to update the live site's product catalogue.
"""
import json
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations
from django.utils.text import slugify

# Slugs of the old dummy/placeholder dev fixture products being retired.
OLD_PLACEHOLDER_SLUGS = [
    "harbour-light-study",
    "moss-window",
    "tidal-echoes",
    "cinder-bloom",
    "stone-and-salt",
    "field-notes-no-4",
    "river-room",
    "wren-arch",
    "soft-horizon",
    "glass-meadow",
    "evening-quarry",
    "dune-mark",
    "night-garden-fold",
    "salt-line",
    "signal-bloom",
    "liminal-study",
]


def load_lineup(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")

    shop_dir = Path(__file__).resolve().parents[1]
    repo_root = shop_dir.parent
    seed_file = shop_dir / "seed_data" / "shop_products.json"
    placeholder_source = shop_dir / "seed_data" / "placeholder-product.svg"

    if not seed_file.exists():
        return

    # Remove the retired dummy/placeholder catalogue.
    Product.objects.filter(slug__in=OLD_PLACEHOLDER_SLUGS).delete()

    with seed_file.open("r", encoding="utf-8") as fh:
        items = json.load(fh)

    for item in items:
        slug = (item.get("slug") or slugify(item["title"])).strip()
        category_name = item.get("category") or "Uncategorized"
        category, _ = Category.objects.get_or_create(
            name=category_name,
            defaults={"slug": slugify(category_name), "description": ""},
        )

        product, created = Product.objects.update_or_create(
            slug=slug,
            defaults={
                "title": item["title"],
                "category": category,
                "description": item.get("description", ""),
                "price": item["price"],
                "stock": item.get("stock", 1),
                "featured": bool(item.get("featured", False)),
            },
        )

        if not ProductImage.objects.filter(product=product).exists():
            image_rel_path = item.get("image")
            image_source = (
                (repo_root / image_rel_path) if image_rel_path else placeholder_source
            )
            if image_source.exists():
                product_image = ProductImage(product=product, position=0)
                with image_source.open("rb") as fh_img:
                    product_image.image.save(
                        image_source.name,
                        ContentFile(fh_img.read()),
                        save=True,
                    )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0007_product_category"),
    ]

    operations = [
        migrations.RunPython(load_lineup, migrations.RunPython.noop),
    ]
