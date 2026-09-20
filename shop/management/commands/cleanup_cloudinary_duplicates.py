import re

import cloudinary.api
from django.core.management.base import BaseCommand

from shop.models import ProductImage

# Cloudinary appends a suffix like "_aB3xQ9k" when unique_filename produced a
# random name. Only treat a resource as a duplicate if its public_id is an
# expected canonical name plus exactly this kind of trailing suffix.
SUFFIX_RE = re.compile(r"^_[A-Za-z0-9]{6,}$")


class Command(BaseCommand):
    help = (
        "Find (and optionally delete) Cloudinary assets under media/products/ "
        "that are random-suffixed duplicates of a known canonical ProductImage "
        "filename. Resources whose base name doesn't match any canonical "
        "ProductImage are left untouched. Dry-run by default; pass --delete to "
        "actually remove the matched duplicates."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            action="store_true",
            help="Actually delete the matched duplicates. Without this flag, only lists them.",
        )

    def handle(self, *args, **options):
        do_delete = options["delete"]

        expected_public_ids = set()
        for image_name in ProductImage.objects.values_list("image", flat=True):
            if not image_name:
                continue
            base, _ext = image_name.rsplit(".", 1) if "." in image_name else (image_name, "")
            expected_public_ids.add(f"media/{base}")

        if not expected_public_ids:
            self.stdout.write(self.style.WARNING("No ProductImage rows found; aborting."))
            return

        duplicates = []
        next_cursor = None
        while True:
            kwargs = {
                "type": "upload",
                "resource_type": "image",
                "prefix": "media/products/",
                "max_results": 500,
            }
            if next_cursor:
                kwargs["next_cursor"] = next_cursor
            response = cloudinary.api.resources(**kwargs)

            for resource in response.get("resources", []):
                public_id = resource["public_id"]
                if public_id in expected_public_ids:
                    continue
                for expected in expected_public_ids:
                    if public_id.startswith(expected):
                        remainder = public_id[len(expected):]
                        if SUFFIX_RE.match(remainder):
                            duplicates.append(public_id)
                        break

            next_cursor = response.get("next_cursor")
            if not next_cursor:
                break

        if not duplicates:
            self.stdout.write(self.style.SUCCESS("No duplicate assets found."))
            return

        self.stdout.write(f"Found {len(duplicates)} duplicate asset(s):")
        for public_id in duplicates:
            self.stdout.write(f"  {public_id}")

        if not do_delete:
            self.stdout.write(self.style.WARNING("Dry run only. Re-run with --delete to remove these."))
            return

        result = cloudinary.api.delete_resources(duplicates, resource_type="image", invalidate=True)
        self.stdout.write(self.style.SUCCESS(f"Deleted {len(duplicates)} duplicate asset(s)."))
        self.stdout.write(str(result))
