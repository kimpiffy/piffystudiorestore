from django.shortcuts import render


def people(request):
    projects = [
        {
            "id": "wishing-tree",
            "title": "The Wishing Tree",
            "blurb": (
                "An immersive, sensory calming space with public participation "
                "inside The Hive Library for The Festival of Play hosted by Scala, Worcester."
            ),
            "stack": ["Installation", "Community"],
        },
        {
            "id": "imagining-bright-future",
            "title": "Imagining a Bright Future",
            "blurb": (
                "An immersive light installation created with local community groups, for Severn Arts in Worcester."
            ),
            "stack": ["Light", "Community"],
        },
        {
            "id": "elgar-at-the-asylum",
            "title": "Elgar at the Asylum",
            "blurb": (
                "Visual Arts with The Monday Night Club, culminating in a triptych of banners installed at Malvern Theatres."
            ),
            "stack": ["Visual Arts", "Public Installation"],
        },
    ]

    return render(request, "portfolio/people.html", {"projects": projects})


def digital(request):
    projects = [
        {
            "id": "piffy-studio",
            "title": "Piffy Studio",
            "tagline": "Self-built static portfolio site",
            "blurb": (
                "A simple, static portfolio website for an artist "
                "transitioning into web development. "
                "A simple, personal site with clear presentation, "
                "layout fundamentals, and a focus on learning-by-doing."
            ),
            "stack": ["HTML", "CSS", "JavaScript"],
            "cover": "/static/img/digital/piffy.png",
            "url": "https://piffy.studio",
            "github": "",
        },
        {
            "id": "webdevination",
            "title": "WebDevination",
            "tagline": "Web-based tarot game + digital divination tool",
            "blurb": (
                "A browser-based tarot reading experience with a "
                "retro-futuristic terminal style design, playful "
                "interactions and an AI-powered oracle. "
                "Built with JavaScript and API integrations to "
                "generate entertaining insights."
            ),
            "stack": ["JavaScript", "APIs", "HTML", "CSS"],
            "cover": "/static/img/digital/wd.png",
            "url": "https://webdevination.onrender.com",
            "github": "",
        },
        {
            "id": "the-english-studio",
            "title": "The English Studio",
            "tagline": (
                "Modern full-stack website for an English language "
                "school in Corvetto, Milan."
            ),
            "blurb": (
                "A full-stack website for an English language school "
                "in Corvetto, Milan. Designed to create a clear and "
                "intuitive user experience. Custom backend functionality "
                "lets the school manage their content easily, avoiding "
                "unnecessary complexity."
            ),
            "stack": ["Django", "Python", "HTML", "CSS", "JavaScript"],
            "cover": "/static/img/digital/tes.png",
            "url": "https://theenglishstudiocorvetto.com",
            "github": "",
        },
        {
            "id": "phoebe-collins-tattoo",
            "title": "Phoebe Collins Tattoo",
            "tagline": "Static site with Instagram-fed galleries",
            "blurb": (
                "A lightweight portfolio site for a tattoo artist, "
                "designed to stay fresh without constant manual updates. "
                "Gallery content is pulled from Instagram so new work "
                "appears automatically, saving time and keeping the "
                "site current."
            ),
            "stack": ["HTML", "CSS", "JavaScript"],
            "cover": "/static/img/digital/phoebecollins.png",
            "url": "https://phoebecollins.co.uk/",
            "github": "",
        },
        {
            "id": "think-english",
            "title": "Think English",
            "tagline": "Professional website + branding for an academy",
            "blurb": (
                "A simple, professional web presence for an English "
                "language academy in Vigevano, Italy. Handling both "
                "the website build and the brand direction creates a "
                "consistent, confident online identity."
            ),
            "stack": ["HTML", "CSS", "JavaScript"],
            "cover": "/static/img/digital/thinkeng.png",
            "url": "https://thinkeng.it/",
            "github": "",
        },
        {
            "id": "finding-myself",
            "title": "Finding Myself",
            "tagline": (
                "Creative-coded self-portrait (conceptual web artwork)"
            ),
            "blurb": (
                "A conceptual, coded self-portrait using astrological "
                "placements as data sources. The piece visualizes "
                "identity through an interactive sonar dial; blending "
                "symbolism, and design."
            ),
            "stack": ["JavaScript", "Creative Coding", "HTML", "CSS"],
            "cover": "/static/img/digital/findmyself.jpeg",
            "url": "https://kimpiffy.github.io/grimiore/",
            "github": "",
        },
    ]

    return render(request, "portfolio/digital.html", {"projects": projects})


def art(request):
    projects = [
        {
            "id": "piece-one",
            "title": "Untitled I",
            "description": "A series exploring color dialogue and form.",
            "cover": "/static/img/art/piece-one.jpg",
            "slug": "untitled-i",
        },
        {
            "id": "piece-two",
            "title": "Transition",
            "description": (
                "Digital exploration of movement and transformation."
            ),
            "cover": "/static/img/art/piece-two.jpg",
            "slug": "transition",
        },
        {
            "id": "piece-three",
            "title": "Luminescence",
            "description": "Mixed media study on light and perception.",
            "cover": "/static/img/art/piece-three.jpg",
            "slug": "luminescence",
        },
        {
            "id": "piece-four",
            "title": "Fragments",
            "description": "Conceptual work examining broken systems.",
            "cover": "/static/img/art/piece-four.jpg",
            "slug": "fragments",
        },
        {
            "id": "piece-five",
            "title": "Emergence",
            "description": "Organic forms responding to audio data.",
            "cover": "/static/img/art/piece-five.jpg",
            "slug": "emergence",
        },
        {
            "id": "piece-six",
            "title": "Flux",
            "description": (
                "Interactive installation exploring fluid dynamics."
            ),
            "cover": "/static/img/art/piece-six.jpg",
            "slug": "flux",
        },
    ]

    return render(request, "portfolio/art.html", {"projects": projects})
