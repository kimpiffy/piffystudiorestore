from django.shortcuts import render, redirect
from django.contrib import messages

from .forms import ContactMessageForm
from .models import NewsletterSubscriber


def home(request):
    return render(request, "pages/home.html")


def about(request):
    return render(request, "pages/about.html")


def contact(request):
    if request.method == "POST":
        form = ContactMessageForm(request.POST)
        if form.is_valid():
            contact_message = form.save(commit=False)

            wants_newsletter = form.cleaned_data.get("newsletter", False)
            if wants_newsletter:
                subscriber, _created = NewsletterSubscriber.objects.get_or_create(
                    email=contact_message.email
                )
                contact_message.subscriber = subscriber

            contact_message.save()

            messages.success(
                request,
                "Thanks — your message has been sent.",
                extra_tags="contact-success"
            )
            return redirect("pages:contact")
        else:
            messages.error(
                request,
                "Please check the form and try again.",
                extra_tags="contact-error"
            )
    else:
        form = ContactMessageForm()

    return render(request, "pages/contact.html", {"form": form})