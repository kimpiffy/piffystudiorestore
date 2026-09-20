import json
import re
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from shop.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = "Seed the shop with the current product lineup from seed_data/shop_products.json."

    @staticmethod
    def resolve_image_source(base_dir, image_value, placeholder_source):
        if not image_value:
            return placeholder_source

        candidate = Path(image_value)
        if candidate.is_absolute():
            return candidate if candidate.exists() else placeholder_source

        candidate_str = str(candidate)
        options = [
            base_dir / candidate,
            base_dir / "static" / candidate.relative_to("static") if candidate_str.startswith("static/") else None,
            base_dir / candidate_str.lstrip("/"),
        ]
        for option in options:
            if option is not None and option.exists():
                return option
        return placeholder_source

    @staticmethod
    def canonical_gallery_key(path):
        stem = path.stem
        while True:
            stripped = re.sub(r"_[A-Za-z0-9]+$", "", stem)
            if stripped == stem:
                break
            stem = stripped
        return stem.lower()

    @staticmethod
    def slug_prefixes(slug):
        slug_tokens = [token for token in re.findall(r"[a-z0-9]+", slug.lower()) if token and len(token) > 1]
        if not slug_tokens:
            return set()

        prefixes = {"".join(slug_tokens)}
        running = ""
        for token in slug_tokens:
            running += token
            prefixes.add(running)
        return prefixes

    @staticmethod
    def find_gallery_paths(base_dir, slug):
        slug_prefixes = Command.slug_prefixes(slug)
        if not slug_prefixes:
            return []

        candidates = []
        media_dir = base_dir / "media" / "products"
        if media_dir.exists():
            for path in sorted(media_dir.iterdir()):
                if not path.is_file():
                    continue
                key = Command.canonical_gallery_key(path)
                if not key:
                    continue
                if any(key.startswith(prefix) or prefix.startswith(key) for prefix in slug_prefixes):
                    candidates.append(path)

        deduped = {}
        for path in candidates:
            key = Command.canonical_gallery_key(path)
            current = deduped.setdefault(key, [])
            current.append(path)

        unique_paths = []
        for key, matches in deduped.items():
            selected = min(
                matches,
                key=lambda p: (
                    0 if p.stem == key else 1,
                    len(p.name),
                    p.name.lower(),
                ),
            )
            unique_paths.append(selected)

        if unique_paths:
            def sort_key(path):
                match = re.search(r"(\d+)", path.name)
                if match:
                    return (0, int(match.group(1)))
                return (1, path.name.lower())
            return sorted(dict.fromkeys(unique_paths), key=sort_key)

        return []

    @staticmethod
    def save_canonical_image(product_image, image_path):
        target_name = image_path.name
        target_relative = f"products/{target_name}"
        current_name = product_image.image.name if product_image.image else ""

        if current_name and current_name != target_relative and product_image.image.storage.exists(current_name):
            product_image.image.storage.delete(current_name)

        # The canonical gallery file already exists in media/products and should be referenced as-is.
        # Copying it back through ImageField.save() creates hash-suffixed duplicates in Django.
        product_image.image.name = target_relative
        if product_image.pk:
            product_image.save(update_fields=["image"])
        return product_image

    def handle(self, *args, **options):
        root_dir = Path(__file__).resolve().parents[3]
        base_dir = root_dir
        seed_file = root_dir / "shop" / "seed_data" / "shop_products.json"
        placeholder_source = root_dir / "shop" / "seed_data" / "placeholder-product.svg"

        if not seed_file.exists():
            raise FileNotFoundError(f"Seed file not found: {seed_file}")

        if not placeholder_source.exists():
            raise FileNotFoundError(f"Placeholder image not found: {placeholder_source}")

        with seed_file.open("r", encoding="utf-8") as fh:
            products = json.load(fh)

        created = 0
        updated = 0

        for item in products:
            slug = (item.get("slug") or slugify(item["title"])).strip()
            if not slug:
                raise ValueError(f"Seed product missing a usable slug: {item}")

            category_name = item.get("category") or "Uncategorized"
            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={"slug": slugify(category_name), "description": ""},
            )

            product, created_flag = Product.objects.update_or_create(
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
            if created_flag:
                created += 1
            else:
                updated += 1

            product.images.filter(image__icontains="placeholder-product").delete()

            gallery_paths = self.find_gallery_paths(base_dir, slug)
            if gallery_paths:
                keep_ids = []
                for position, image_path in enumerate(gallery_paths):
                    product_image = product.images.filter(position=position).first()
                    if product_image is None:
                        product_image = ProductImage(product=product, position=position)
                    self.save_canonical_image(product_image, image_path)
                    product_image.position = position
                    product_image.product = product
                    product_image.save()
                    keep_ids.append(product_image.pk)

                product.images.exclude(pk__in=keep_ids).delete()
                continue

            image_source = self.resolve_image_source(
                base_dir,
                item.get("image"),
                placeholder_source,
            )

            if not image_source.exists() or image_source == placeholder_source:
                product.images.exclude(image__icontains="placeholder-product").delete()
                continue

            has_live_gallery = product.images.exclude(
                image__icontains="placeholder-product"
            ).exists()
            if has_live_gallery:
                continue

            primary_image = product.images.order_by("position").first()
            if primary_image is None:
                primary_image = ProductImage(product=product, position=0)

            self.save_canonical_image(primary_image, image_source)
            primary_image.position = 0
            primary_image.product = product
            primary_image.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created} new products. Refreshed {updated} existing products."
            )
        )
