import json
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from shop.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = "Seed the local development shop with a small, conservative set of placeholder products."

    def handle(self, *args, **options):
        base_dir = Path(__file__).resolve().parents[2]
        seed_file = base_dir / "seed_data" / "shop_products.json"
        placeholder_source = base_dir / "seed_data" / "placeholder-product.svg"

        if not seed_file.exists():
            raise FileNotFoundError(f"Seed file not found: {seed_file}")

        if not placeholder_source.exists():
            raise FileNotFoundError(f"Placeholder image not found: {placeholder_source}")

        media_products_dir = Path(settings.MEDIA_ROOT) / "products"
        media_products_dir.mkdir(parents=True, exist_ok=True)

        placeholder_target = media_products_dir / "placeholder-product.svg"
        if not placeholder_target.exists():
            shutil.copy2(placeholder_source, placeholder_target)

        with seed_file.open("r", encoding="utf-8") as fh:
            products = json.load(fh)

        created = 0
        skipped = 0

        for item in products:
            slug = (item.get("slug") or slugify(item["title"])).strip()
            if not slug:
                raise ValueError(f"Seed product missing a usable slug: {item}")

            category_name = item.get("category") or "Uncategorized"
            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={"slug": slugify(category_name), "description": ""},
            )

            if Product.objects.filter(slug=slug).exists():
                skipped += 1
                continue

            product = Product.objects.create(
                title=item["title"],
                slug=slug,
                category=category,
                description=item.get("description", ""),
                price=item["price"],
                stock=item.get("stock", 1),
                featured=bool(item.get("featured", False)),
            )

            ProductImage.objects.create(
                product=product,
                image="products/placeholder-product.svg",
                position=0,
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created} products. Skipped {skipped} existing products."
            )
        )
