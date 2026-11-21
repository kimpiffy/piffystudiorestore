from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from shop.models import Category, Product, ProductImage


class StaffAccessTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="regularuser",
            password="testpass123",
        )
        self.staff_user = get_user_model().objects.create_user(
            username="staffuser",
            password="testpass123",
            is_staff=True,
        )

    def test_non_staff_cannot_access_shop_management(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("shop:manage_products"))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/accounts/login/")

    def test_staff_can_access_shop_management(self):
        self.client.force_login(self.staff_user)
        response = self.client.get(reverse("shop:manage_products"))
        self.assertEqual(response.status_code, 200)


class SeedShopCommandTests(TestCase):
    def test_seed_command_is_idempotent(self):
        call_command("seed_shop")
        first_count = Product.objects.count()
        first_image_count = ProductImage.objects.count()

        call_command("seed_shop")

        self.assertEqual(Product.objects.count(), first_count)
        self.assertEqual(Product.objects.count(), 13)
        self.assertEqual(ProductImage.objects.count(), first_image_count)
        self.assertGreaterEqual(ProductImage.objects.count(), 24)
        self.assertEqual(Category.objects.count(), 5)

    def test_seed_command_deletes_retired_products(self):
        call_command("seed_shop")

        retired_slugs = [
            "match-my-freak-badges",
            "division",
            "communion",
            "antagony",
            "solastalgia",
            "paroxysm",
            "goldberry-postcard",
            "mudra-mandala-sticker",
            "dragon-postcard",
            "tantra-mandala-sticker",
        ]
        self.assertFalse(Product.objects.filter(slug__in=retired_slugs).exists())

    def test_seed_command_replaces_existing_placeholder_images(self):
        product = Product.objects.get(slug="try-and-stop-me-t-shirt")
        ProductImage.objects.filter(product=product).delete()
        ProductImage.objects.create(
            product=product,
            image="products/placeholder-product.svg",
            position=0,
        )

        call_command("seed_shop")
        product.refresh_from_db()

        self.assertEqual(product.description, "")
        self.assertTrue(product.images.exists())
        self.assertFalse(product.images.filter(image__icontains="placeholder-product").exists())

    def test_seed_command_populates_gallery_images_for_real_products(self):
        call_command("seed_shop")

        for slug in ["nature-vs-machine-diptych", "tune-in-hoodie", "try-and-stop-me-t-shirt"]:
            product = Product.objects.get(slug=slug)
            self.assertGreaterEqual(product.images.count(), 4)
            self.assertFalse(product.images.filter(image__icontains="placeholder-product").exists())

    def test_seed_command_prefers_webp_gallery_files_over_png_duplicates(self):
        call_command("seed_shop")

        product = Product.objects.get(slug="try-and-stop-me-t-shirt")
        images = list(product.images.order_by("position").values_list("image", flat=True))

        self.assertTrue(images)
        self.assertTrue(all(".webp" in image.lower() for image in images))
        self.assertFalse(any(".png" in image.lower() for image in images))

    def test_shop_pages_render_with_local_placeholder_media(self):
        call_command("seed_shop")
        product = Product.objects.get(slug="try-and-stop-me-t-shirt")

        shop_response = self.client.get(reverse("shop:shop_index"))
        self.assertEqual(shop_response.status_code, 200)
        self.assertContains(shop_response, product.title)
        self.assertNotContains(shop_response, "placeholder-product")
        self.assertNotContains(shop_response, "blob")
        self.assertContains(shop_response, "product-main-image")
        self.assertContains(shop_response, "product-alt-image")
        self.assertNotContains(shop_response, "Match My Freak! Badges")
        self.assertNotContains(shop_response, "Division")
        self.assertNotContains(shop_response, "Communion")
        self.assertNotContains(shop_response, "Antagony")
        self.assertNotContains(shop_response, "Solastalgia")
        self.assertNotContains(shop_response, "Paroxysm")
        self.assertNotContains(shop_response, "Goldberry Postcard")
        self.assertNotContains(shop_response, "Mudra Mandala Sticker")
        self.assertNotContains(shop_response, "Dragon Postcard")
        self.assertNotContains(shop_response, "Tantra Mandala Sticker")

        detail_response = self.client.get(
            reverse("shop:product_detail", args=[product.slug])
        )
        self.assertEqual(detail_response.status_code, 200)
        self.assertContains(detail_response, product.title)
        self.assertNotContains(detail_response, "placeholder-product")

        staff_user = get_user_model().objects.create_user(
            username="staffpageuser",
            password="testpass123",
            is_staff=True,
        )
        self.client.force_login(staff_user)
        management_response = self.client.get(reverse("shop:manage_products"))
        self.assertEqual(management_response.status_code, 200)
        self.assertContains(management_response, "Products")


class StripeCheckoutConfigurationTests(TestCase):
    def test_checkout_redirects_cleanly_when_stripe_is_unconfigured(self):
        session = self.client.session
        session["cart"] = {
            "1": {
                "title": "Test Artwork",
                "price": "49.99",
                "quantity": 1,
            }
        }
        session.save()

        with self.settings(STRIPE_SECRET_KEY=None):
            response = self.client.post(reverse("shop:create_checkout_session"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("shop:cart"))
        messages = list(response.wsgi_request._messages)
        self.assertTrue(any("Stripe" in str(message) for message in messages))


class ContactMessageTests(TestCase):
    def test_contact_submission_renders_visible_success_banner(self):
        response = self.client.post(
            reverse("pages:contact"),
            {
                "full_name": "Test Person",
                "email": "person@example.com",
                "telephone": "123456",
                "location": "London",
                "query_related": "art",
                "other_specify": "",
                "message": "Hello there",
                "newsletter": "on",
                "_gotcha": "",
            },
            follow=True,
            HTTP_HOST="localhost:8000",
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "contact-success-banner")
        self.assertContains(response, "Thanks — your message has been sent.")
