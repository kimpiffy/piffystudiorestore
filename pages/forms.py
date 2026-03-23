from django import forms
from .models import ContactMessage


class ContactMessageForm(forms.ModelForm):
    # Checkbox only appears on contact form, but we store subscribers separately
    newsletter = forms.BooleanField(required=False)

    # Honeypot (spam trap)
    _gotcha = forms.CharField(required=False, widget=forms.HiddenInput)

    # Dropdown choices (includes placeholder)
    QUERY_CHOICES = [
        ("", "Query related to:"),  
    ("art", "Visual Art"),
    ("web design", "Web Design & Development"),
    ("community projects", "Community Engagement"),
    ("creative facilitation", "Creative Facilitation"),
    ("collaboration", "Collaboration"),
        ("other", "Other"),
    ]

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
        widgets = {
            "full_name": forms.TextInput(attrs={
                "placeholder": "Full name",
                "autocomplete": "name",
            }),
            "location": forms.TextInput(attrs={
                "placeholder": "Location",
                "autocomplete": "address-level2",
            }),
            "email": forms.EmailInput(attrs={
                "placeholder": "Email",
                "autocomplete": "email",
            }),
            "telephone": forms.TextInput(attrs={
                "placeholder": "Phone number",
                "autocomplete": "tel",
                "inputmode": "tel",
            }),
            "query_related": forms.Select(attrs={
                # placeholder-like first choice handles the visible "label"
                # keep attrs minimal so your CSS controls the look
            }),
            "other_specify": forms.TextInput(attrs={
                "placeholder": "Please specify",
            }),
            "message": forms.Textarea(attrs={
                "placeholder": "Message",
                "rows": 6,
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Apply dropdown choices (overrides model choices if any)
        if "query_related" in self.fields:
            self.fields["query_related"].choices = self.QUERY_CHOICES

        # Optional: make sure other_specify isn't required unless "other" selected
        if "other_specify" in self.fields:
            self.fields["other_specify"].required = False

    def clean(self):
        cleaned = super().clean()

        # Honeypot spam check: if filled, treat as invalid
        if cleaned.get("_gotcha"):
            raise forms.ValidationError("Invalid submission.")

        # Enforce a real selection (placeholder is value "")
        if cleaned.get("query_related") in (None, ""):
            self.add_error("query_related", "Please select what your query relates to.")

        # If query_related == other, other_specify must be filled
        if cleaned.get("query_related") == "other" and not cleaned.get("other_specify"):
            self.add_error("other_specify", "Please specify your query.")

        return cleaned