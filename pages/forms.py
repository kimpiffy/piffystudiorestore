from django import forms
from .models import ContactMessage


class ContactMessageForm(forms.ModelForm):
    # Checkbox only appears on contact form, but we store subscribers separately
    newsletter = forms.BooleanField(required=False)

    # Honeypot (your existing _gotcha) — optional, but good
    _gotcha = forms.CharField(required=False, widget=forms.HiddenInput)

    class Meta:
        model = ContactMessage
        fields = [
            "full_name",
            "email",
            "telephone",
            "location",
            "query_related",
            "other_specify",
            "message",
        ]

    def clean(self):
        cleaned = super().clean()

        # Honeypot spam check: if filled, treat as invalid
        if cleaned.get("_gotcha"):
            raise forms.ValidationError("Invalid submission.")

        # If query_related == other, other_specify must be filled
        if cleaned.get("query_related") == "other" and not cleaned.get("other_specify"):
            self.add_error("other_specify", "Please specify your query.")
        return cleaned