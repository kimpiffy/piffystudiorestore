from django.test import TestCase
from django.urls import reverse

from .forms import LoginForm


class LoginFormRegressionTests(TestCase):
    def test_login_form_disables_autocapitalization(self):
        form = LoginForm()
        self.assertEqual(form.fields["username"].widget.attrs["autocapitalize"], "none")
        self.assertEqual(form.fields["username"].widget.attrs["autocorrect"], "off")
        self.assertEqual(form.fields["username"].widget.attrs["spellcheck"], "false")
        self.assertEqual(form.fields["username"].widget.attrs["autocomplete"], "username")

    def test_login_page_renders_custom_form_attributes(self):
        response = self.client.get(reverse("login"))
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        self.assertIn('autocapitalize="none"', html)
        self.assertIn('autocomplete="username"', html)
