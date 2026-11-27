from django.test import TestCase
from django.urls import reverse


class CommunityProjectTests(TestCase):
    def test_digitalis_is_removed_from_community_projects(self):
        response = self.client.get(reverse("portfolio:people"))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Digitalis 1.0")

        detail_response = self.client.get(
            reverse("community_project_detail", args=["digitalis-1-0"])
        )
        self.assertEqual(detail_response.status_code, 404)


class RetiredStylesPublicationTests(TestCase):
    def test_styles_publication_route_is_removed(self):
        for path in ("/work/styles/", "/work/styles/brand-guidelines.pdf"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)

    def test_industry_route_still_renders_brand_guidelines(self):
        response = self.client.get(reverse("portfolio:industry"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Brand guidelines")
