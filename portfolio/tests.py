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

# Create your tests here.
