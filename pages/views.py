from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib import messages

from .forms import ContactMessageForm
from .models import NewsletterSubscriber
from .seo import (
    build_seo,
    canonical_base_url,
    homepage_json_ld,
    is_indexable_environment,
)


HOME_TITLE = "Kim Piffy | Multidisciplinary Artist, Installation Artist & Web Designer"
HOME_DESCRIPTION = (
    "Kim Piffy is a UK-based multidisciplinary artist and web designer creating "
    "immersive installations, sensory and light-based artwork, creative-health "
    "projects, community workshops and distinctive digital experiences."
)

HOME_INTRO_TEXT = (
    "Kim Piffy is a multidisciplinary artist, creative practitioner and web designer "
    "based near Ledbury and working across the UK. Her practice combines immersive "
    "installation, sensory and light-based artwork, creative health, participatory "
    "projects and distinctive digital environments."
)


def home(request):
    seo = build_seo(
        request,
        title=HOME_TITLE,
        description=HOME_DESCRIPTION,
        og_title=HOME_TITLE,
        og_description=HOME_DESCRIPTION,
        twitter_title=HOME_TITLE,
        twitter_description=HOME_DESCRIPTION,
        json_ld=homepage_json_ld(),
    )
    return render(
        request,
        "pages/about.html",
        {
            "seo": seo,
            "intro_title": "Kim Piffy - Multidisciplinary Artist, Creative Practitioner and Web Designer",
            "intro_text": HOME_INTRO_TEXT,
            "show_home_intro": True,
            "section_label": "home",
        },
    )


def about(request):
    title = "About Kim Piffy | Multidisciplinary Artist & Creative Practitioner"
    description = (
        "Learn about Kim Piffy's multidisciplinary practice across immersive art, "
        "creative health, sensory work, web design, participatory projects and "
        "artist-led commissions in the UK."
    )
    seo = build_seo(
        request,
        title=title,
        description=description,
        og_title=title,
        og_description=description,
        twitter_title=title,
        twitter_description=description,
    )
    return render(
        request,
        "pages/about.html",
        {
            "seo": seo,
            "intro_title": "About Kim Piffy",
            "intro_text": (
                "I wanted to make the world a better place, but all I got was this lateral thinking."
            ),
            "show_home_intro": True,
            "section_label": "bio",
        },
    )


def contact(request):
    title = "Contact Kim Piffy | Art, Installation & Web Design Commissions"
    description = (
        "Contact Kim Piffy about immersive installations, artwork commissions, "
        "creative-health projects, community workshops, collaborations and "
        "distinctive web design."
    )
    seo = build_seo(
        request,
        title=title,
        description=description,
        og_title=title,
        og_description=description,
        twitter_title=title,
        twitter_description=description,
    )

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

    return render(
        request,
        "pages/contact.html",
        {
            "form": form,
            "seo": seo,
        },
    )


def robots_txt(request):
    lines = ["User-agent: *"]
    if is_indexable_environment(request):
        lines.extend(
            [
                "Disallow: /admin/",
                "Disallow: /accounts/",
                "Disallow: /shop/manage/",
                "Disallow: /shop/cart/",
                "Disallow: /shop/create-checkout-session/",
                "Disallow: /shop/thank-you/",
                "Disallow: /shop/cancel/",
                "Disallow: /shop/webhook/",
                "Disallow: /shop/webhooks/",
                "Disallow: /interactions/",
            ]
        )
    else:
        lines.append("Disallow: /")

    lines.append(f"Sitemap: {canonical_base_url()}/sitemap.xml")
    return HttpResponse("\n".join(lines), content_type="text/plain; charset=utf-8")