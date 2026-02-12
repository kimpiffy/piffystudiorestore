from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.utils import timezone
import csv

from pages.models import ContactMessage, NewsletterSubscriber


def staff_required(view_func):
    """
    Staff-only pages for your custom dashboard sections.
    You can loosen this to login_required later if you want.
    """
    return user_passes_test(lambda u: u.is_authenticated and u.is_staff)(view_func)


@login_required
def dashboard(request):
    return render(request, "accounts/dashboard.html")


@staff_required
def dashboard_messages(request):
    qs = ContactMessage.objects.order_by("-created_at")
    return render(request, "accounts/dashboard_messages.html", {"messages_qs": qs})


@staff_required
def dashboard_message_detail(request, pk):
    msg = get_object_or_404(ContactMessage, pk=pk)

    # Mark read on view
    if not msg.is_read:
        msg.is_read = True
        msg.save(update_fields=["is_read"])

    if request.method == "POST":
        msg.admin_notes = request.POST.get("admin_notes", "")

        # checkbox returns "1" if checked
        mark_replied = request.POST.get("mark_replied") == "1"
        if mark_replied and not msg.is_replied:
            msg.is_replied = True
            msg.replied_at = timezone.now()

        msg.save()
        return redirect("dashboard_message_detail", pk=msg.pk)

    return render(request, "accounts/dashboard_message_detail.html", {"msg": msg})


@staff_required
def dashboard_message_delete(request, pk):
    msg = get_object_or_404(ContactMessage, pk=pk)
    if request.method == "POST":
        msg.delete()
        return redirect("dashboard_messages")
    return render(request, "accounts/dashboard_message_delete.html", {"msg": msg})


@staff_required
def dashboard_newsletter(request):
    qs = NewsletterSubscriber.objects.order_by("-created_at")
    return render(request, "accounts/dashboard_newsletter.html", {"subs_qs": qs})


@staff_required
def dashboard_newsletter_delete(request, pk):
    sub = get_object_or_404(NewsletterSubscriber, pk=pk)
    if request.method == "POST":
        sub.delete()
        return redirect("dashboard_newsletter")
    return render(request, "accounts/dashboard_newsletter_delete.html", {"sub": sub})


@staff_required
def dashboard_newsletter_export_csv(request):
    """
    CSV export to upload to Mailchimp.
    """
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="newsletter_subscribers.csv"'

    writer = csv.writer(response)
    writer.writerow(["email", "created_at", "is_active"])

    for sub in NewsletterSubscriber.objects.order_by("-created_at"):
        writer.writerow([sub.email, sub.created_at.isoformat(), sub.is_active])

    return response