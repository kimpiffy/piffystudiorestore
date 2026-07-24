from django.shortcuts import render

from pages.seo import build_seo


def people(request):
    title = "Creative Health, SEND & Community Arts Practice | Kim Piffy"
    description = (
        "Explore Kim Piffy's sensory-aware creative-health projects, participatory "
        "workshops and community arts practice with SEND, disabled and autistic participants."
    )
    projects = [
        {
            "id": "wishing-tree",
            "title": "The Wishing Tree",
            "blurb": (
                "An immersive, sensory calming space with public participation"
                " "
                "inside The Hive Library for The Festival of Play hosted by "
                "Scala, Worcester."
            ),
            "stack": ["Installation", "Community"],
            "cover": "/static/img/home/createeye.jpeg",
        },
        {
            "id": "imagining-bright-future",
            "title": "Imagining a Bright Future",
            "blurb": (
                "An immersive light installation created with local community "
                "groups, for Severn Arts in Worcester."
            ),
            "stack": ["Light", "Community"],
            "cover": "/static/img/home/buildcode.jpeg",
        },
        {
            "id": "elgar-at-the-asylum",
            "title": "Elgar at the Asylum",
            "coming_soon": True,
            "overlay_title": "Coming Soon",
            "blurb": (
                "Visual Arts with The Monday Night Club, culminating in a "
                "triptych of banners installed at Malvern Theatres."
            ),
            "stack": ["Visual Arts", "Public Installation"],
            "cover": "/static/img/home/connection.jpeg",
        },
        {
            "id": "digitalis-1-0",
            "title": "Digitalis 1.0",
            "coming_soon": True,
            "overlay_title": "Coming Soon",
            "blurb": (
                "Interactive community-focused digital installation project."
            ),
            "stack": ["Digital", "Community"],
            "cover": "/static/img/home/buildcode.jpeg",
        },
    ]

    return render(
        request,
        "portfolio/people.html",
        {
            "projects": projects,
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
            ),
            "section_h1": "Creative Health and Participatory Practice",
        },
    )


def industry(request):
    title = "Industry Projects | Kim Piffy"
    description = (
        "Preview upcoming industry-focused projects and commissions by Kim Piffy."
    )
    projects = [
        {
            "id": "industry-coming-soon",
            "title": "Industry",
            "coming_soon": True,
            "overlay_title": "Coming Soon",
            "blurb": (
                "Industrial systems, fabrication, and material studies."
            ),
            "stack": ["Systems", "Process"],
        },
    ]

    return render(
        request,
        "portfolio/industry.html",
        {
            "projects": projects,
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
                robots="noindex, follow",
            ),
            "section_h1": "Industry",
        },
    )


def digital(request):
    title = "Experimental Web Design & Immersive Digital Spaces | Kim Piffy"
    description = (
        "Kim Piffy creates distinctive websites, immersive online spaces and "
        "artist-led digital experiences shaped around each client's visual identity and purpose."
    )
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

    return render(
        request,
        "portfolio/digital.html",
        {
            "projects": projects,
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
            ),
            "section_h1": "Web Design and Immersive Digital Work",
        },
    )


def art(request):
    title = "Immersive Installation, Light Art & Conceptual Work | Kim Piffy"
    description = (
        "Explore immersive installations, UV-responsive artwork, sensory environments, "
        "conceptual art and technology-led commissions by UK multidisciplinary artist Kim Piffy."
    )
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

    return render(
        request,
        "portfolio/art.html",
        {
            "projects": projects,
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
            ),
            "section_h1": "Art, Installations and Sensory Environments",
        },
    )
