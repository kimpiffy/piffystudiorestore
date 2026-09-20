"""Data migration: replace placeholder dev catalogue with the real 2025 product lineup.

Runs automatically as part of `python manage.py migrate` (called from build.sh
on every deploy), so editing shop/seed_data/shop_products.json and pushing is
enough to update the live site's product catalogue.
"""
import json
import re
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
    project_root = shop_dir.parent
    seed_file = shop_dir / "seed_data" / "shop_products.json"
    placeholder_source = shop_dir / "seed_data" / "placeholder-product.svg"

    def resolve_image_source(image_value):
        if not image_value:
            return placeholder_source

        candidate = Path(image_value)
        if candidate.is_absolute():
            return candidate if candidate.exists() else placeholder_source

        candidate_str = str(candidate)
        options = [
            project_root / candidate,
            project_root / "static" / candidate.relative_to("static") if candidate_str.startswith("static/") else None,
            project_root / candidate_str.lstrip("/"),
        ]
        for option in options:
            if option is not None and option.exists():
                return option
        return placeholder_source

    def find_gallery_paths(slug):
        slug_tokens = [token for token in re.findall(r"[a-z0-9]+", slug.lower()) if token]
        if not slug_tokens:
            return []

        candidates = []
        media_dir = project_root / "media" / "products"
        if media_dir.exists():
            for path in sorted(media_dir.iterdir()):
                if not path.is_file():
                    continue
                normalized_name = "".join(ch.lower() for ch in path.name if ch.isalnum())
                slug_normalized = "".join(ch.lower() for ch in slug if ch.isalnum())
                if slug_normalized and slug_normalized in normalized_name:
                    candidates.append(path)
                    continue
                for index in range(1, len(slug_tokens) + 1):
                    prefix = "".join(slug_tokens[:index])
                    if prefix and prefix in normalized_name:
                        candidates.append(path)
                        break

        if candidates:
            def sort_key(path):
                match = re.search(r"(\d+)", path.name)
                if match:
                    return (0, int(match.group(1)))
                return (1, path.name.lower())
            return sorted(dict.fromkeys(candidates), key=sort_key)
        return []

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

        product, _ = Product.objects.update_or_create(
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

        gallery_paths = find_gallery_paths(slug)
        if gallery_paths:
            ProductImage.objects.filter(product=product).delete()
            for position, image_path in enumerate(gallery_paths):
                product_image = ProductImage(product=product, position=position)
                with image_path.open("rb") as fh_img:
                    product_image.image.save(
                        image_path.name,
                        ContentFile(fh_img.read()),
                        save=True,
                    )
                product_image.save()
            continue

        image_source = resolve_image_source(item.get("image"))
        if not image_source.exists():
            continue

        has_live_gallery = ProductImage.objects.filter(
            product=product,
        ).exclude(
            image__icontains="placeholder-product",
        ).exists()
        if has_live_gallery:
            continue

        placeholder_images = ProductImage.objects.filter(
            product=product,
            image__icontains="placeholder-product",
        )
        if placeholder_images.exists():
            placeholder_images.delete()

        primary_image = ProductImage.objects.filter(product=product).order_by(
            "position"
        ).first()
        if primary_image is None:
            primary_image = ProductImage(product=product, position=0)
        with image_source.open("rb") as fh_img:
            primary_image.image.save(
                image_source.name.split("/")[-1],
                ContentFile(fh_img.read()),
                save=True,
            )
        primary_image.position = 0
        primary_image.save()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0007_product_category"),
    ]

    operations = [
        migrations.RunPython(load_lineup, migrations.RunPython.noop),
    ]
