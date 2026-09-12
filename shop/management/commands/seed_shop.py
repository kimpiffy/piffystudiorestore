import json
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from shop.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = "Seed the shop with the current product lineup from seed_data/shop_products.json."

    def handle(self, *args, **options):
        base_dir = Path(__file__).resolve().parents[2]
        repo_root = base_dir.parent
        seed_file = base_dir / "seed_data" / "shop_products.json"
        placeholder_source = base_dir / "seed_data" / "placeholder-product.svg"

        if not seed_file.exists():
            raise FileNotFoundError(f"Seed file not found: {seed_file}")

        if not placeholder_source.exists():
            raise FileNotFoundError(f"Placeholder image not found: {placeholder_source}")

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

            # Real product photography, when it exists, is referenced via a
            # repo-relative "image" path; everything else falls back to the
            # temporary placeholder graphic until real assets are supplied.
            image_rel_path = item.get("image")
            image_source = (
                (repo_root / image_rel_path)
                if image_rel_path
                else placeholder_source
            )

            product_image = ProductImage(product=product, position=0)
            with image_source.open("rb") as fh_img:
                product_image.image.save(
                    image_source.name,
                    ContentFile(fh_img.read()),
                    save=True,
                )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created} products. Skipped {skipped} existing products."
            )
        )
