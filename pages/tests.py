from pathlib import Path

from django.test import TestCase
from django.urls import reverse


class HomepageNavigationTests(TestCase):
    def test_homepage_bio_modal_keeps_live_links_without_styles(self):
        response = self.client.get(reverse("pages:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "data-url-art=")
        self.assertContains(response, "data-url-digital=")
        self.assertContains(response, "data-url-community=")
        self.assertContains(response, "data-url-contact=")
        self.assertNotContains(response, "data-url-style=")

        for route_name in (
            "portfolio:art",
            "portfolio:digital",
            "portfolio:people",
            "pages:contact",
        ):
            with self.subTest(route=route_name):
                linked_page = self.client.get(reverse(route_name))
                self.assertEqual(linked_page.status_code, 200)

        project_root = Path(__file__).resolve().parent.parent
        for script in (
            "static/js/about/orbit.desktop.js",
            "static/js/about/orbit.mobile.static.js",
        ):
            source = (project_root / script).read_text()
            self.assertNotIn("/work/styles/", source)
            self.assertNotIn("styleLink", source)
