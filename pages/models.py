from django.db import models
from django.utils import timezone


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.email


class ContactMessage(models.Model):
    QUERY_CHOICES = [
        ("art", "Art"),
        ("web design", "Web Design"),
        ("community projects", "Community Projects"),
        ("creative facilitation", "Creative Facilitation"),
        ("collaboration", "Collaboration"),
        ("other", "Other"),
    ]

    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    telephone = models.CharField(max_length=40, blank=True)
    location = models.CharField(max_length=120, blank=True)

    query_related = models.CharField(max_length=40, choices=QUERY_CHOICES)
    other_specify = models.CharField(max_length=120, blank=True)

    message = models.TextField()

    # Optional relationship to subscriber if they opted in
    subscriber = models.ForeignKey(
        NewsletterSubscriber,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="messages",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)
    is_replied = models.BooleanField(default=False)
    replied_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)

    def mark_replied(self):
        self.is_replied = True
        self.replied_at = timezone.now()
        self.save(update_fields=["is_replied", "replied_at"])

    def __str__(self):
        return f"{self.full_name} — {self.subject_line()}"

    def subject_line(self):
        # mirrors the “Query related to” as a subject-ish label
        if self.query_related == "other" and self.other_specify:
            return f"Other: {self.other_specify}"
        return self.query_related