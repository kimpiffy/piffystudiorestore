from django.shortcuts import render
from django.templatetags.static import static

def installations(request):
    return render(request, "portfolio/installations.html")

def digital(request):
    projects = [
        {
            "id": "piffy-studio",
            "title": "Piffy Studio",
            "tagline": "Self-built static portfolio site",
            "blurb": (
                "A simple, static portfolio website for an artist transitioning into web development. "
                "A simple, personal site with clear presentation, layout fundamentals, and a focus on learning-by-doing."
            ),
            "stack": ["HTML", "CSS", "JavaScript"],
            "cover": static("img/portfoliohero1.webp"),
            "url": "https://piffy.studio",
            "github": "",  # add later
        },
        {
            "id": "webdevination",
            "title": "WebDevination",
            "tagline": "Web-based tarot game + digital divination tool",
            "blurb": (
                "A browser-based tarot reading experience with a retro-futuristic terminal style design, playful interactions and an AI-powered oracle. "
                "Built with JavaScript and API integrations to generate entertaining insights."
            ),
            "stack": ["JavaScript", "APIs", "HTML", "CSS"],
            "cover": static("img/wd.png"),
            "url": "https://webdevination.onrender.com",       # add later if live
            "github": "",    # add later
        },
        {
            "id": "the-english-studio",
            "title": "The English Studio",
            "tagline": "Modern full-stack website for an English language school in Corvetto, Milan.",
            "blurb": (
                "A full-stack website for an English language school in Corvetto, Milan. Designed to create a clear and intuitive user experience. "
                "Custom backend functionality lets the school manage their content easily, avoiding unnecessary complexity."
            ),
            "stack": ["Django", "Python", "HTML", "CSS", "JavaScript"],
            "cover": static("img/tes.png"),
            "url": "https://theenglishstudiocorvetto.com",      # add later if live
            "github": "",   # add later
        },
        {
            "id": "phoebe-collins-tattoo",
            "title": "Phoebe Collins Tattoo",
            "tagline": "Static site with Instagram-fed galleries",
            "blurb": (
                "A lightweight portfolio site for a tattoo artist, designed to stay fresh without constant manual updates. "
                "Gallery content is pulled from Instagram so new work appears automatically, saving time and keeping the site current."
            ),
            "stack": ["HTML", "CSS", "JavaScript"],
            "cover": static("img/pc.png"),
            "url": "https://phoebecollins.co.uk/",
            "github": "",
        },
        {
            "id": "think-english",
            "title": "Think English",
            "tagline": "Professional website + branding for an academy",
            "blurb": (
                "A simple, professional web presence for an English language academy in Vigevano, Italy. "
                "Handling both the website build and the brand direction creates a consistent, confident online identity."
            ),
            "stack": ["HTML", "CSS", "JavaScript"],
            "cover": static("img/thinkeng.png"),
            "url": "https://thinkeng.it/",
            "github": "",
        },
        {
            "id": "finding-myself",
            "title": "Finding Myself",
            "tagline": "Creative-coded self-portrait (conceptual web artwork)",
            "blurb": (
                "A conceptual, coded self-portrait using astrological placements as data sources. "
                "The piece visualizes identity through an interactive sonar dial; blending symbolism, and design."
            ),
            "stack": ["JavaScript", "Creative Coding", "HTML", "CSS"],
            "cover": static("img/bg2.png"),
            "url": "https://kimpiffy.github.io/grimiore/",
            "github": "",
        },
    ]


    return render(
        request,
        "portfolio/digital.html",
        {"projects": projects}
    )

def art(request):
    return render(request, "portfolio/art.html")
