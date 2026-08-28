from pathlib import Path

from django.http import FileResponse, Http404
from django.shortcuts import redirect
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.clickjacking import xframe_options_sameorigin

from pages.seo import build_seo


COMMUNITY_PROJECT_DETAILS = {
    "wishing-tree": {
        "template": "portfolio/community_wishing_tree.html",
        "slug": "wishing-tree",
        "title": "The Wishing Tree",
        "subtitle": "Participatory Sensory Installation",
        "hero_image": "/static/img/community/wishingtreehero.png",
        "description": (
            "The Wishing Tree is a large-scale immersive installation centred around "
            "a 3m fluorescent sculptural tree, designed to create a calming, "
            "sensory-led environment within a public library setting. Activated "
            "through UV light and soft material contrasts, the work invited visitors "
            "to pause, reflect, and contribute their own written wishes, which were "
            "physically integrated into the structure over time. This simple but "
            "effective interaction transformed the piece into an evolving archive of "
            "collective thought, capturing hope, uncertainty, and imagination from a "
            "broad cross-section of the community. Co-created with SEND school groups "
            "and accessible to a wide public audience, the installation prioritised "
            "inclusivity through tactile engagement, low-pressure participation, and "
            "a non-verbal entry point into expression. The result is both a visually "
            "striking environment and a socially embedded artwork, where authorship "
            "is distributed and the meaning is continuously reshaped by those who "
            "encounter it."
        ),
        "metadata": [
            ["Year", "2026"],
            ["Location", "The Hive Library, Worcester"],
            ["Format", "Sensory calming UV installation"],
            ["Focus", "Community co-creation"],
            [
                "Participants",
                "Regent Centre, Fort Royal School, and the wider local community",
            ],
            ["Commissioner", "Scala Worcester"],
        ],
        "gallery": [
            "/static/img/community/wishingtree1.png",
            "/static/img/community/wishingtree2.jpg",
            "/static/img/community/wishingtree3.webp",
            "/static/img/community/wishingtree4.jpg",
        ],
        "process": [
            "Early process work explored how lighting, texture and sound could create a welcoming sensory rhythm for different access needs.",
            "Community responses were gathered through facilitated sessions and translated into hanging elements and projected fragments.",
        ],
        "credits": [
            "Artist and Lead Designer: Kim Piffy",
            "Community Partners: Placeholder Organisation",
            "Production Support: Placeholder Team",
        ],
        "blurb": (
            "An immersive, sensory calming space with public participation inside The Hive "
            "Library for The Festival of Play hosted by Scala, Worcester."
        ),
        "stack": ["Installation", "Community"],
    },
    "imagining-a-bright-future": {
        "template": "portfolio/community_imagining_a_bright_future.html",
        "slug": "imagining-a-bright-future",
        "title": "Imagining a Bright Future",
        "subtitle": "Light-Based Community Collaboration",
        "hero_image": "/static/img/community/bridgesoflighthero.jpg",
        "cover_focus_y": "Max",
        "description": (
            "Imagining a Bright Future is an immersive UV installation "
            "developed through a series of workshops, culminating in a "
            "vibrant, large-scale environment built from collectively "
            "produced materials and ideas. Using fluorescent paint, "
            "symbolic forms, and layered visual elements, the installation "
            "created an engaging and accessible space that encouraged "
            "audiences to actively participate rather than passively "
            "observe. Visitors contributed drawings, messages, and "
            "responses reflecting their hopes and visions for the future, "
            "embedding personal narratives directly into the fabric of the "
            "work. This ongoing accumulation of contributions formed a "
            "dynamic, evolving output, part artwork, part archive, "
            "capturing a wide range of voices and perspectives. Balancing "
            "bold visual impact with meaningful social engagement, the "
            "project demonstrates a strong commitment to co-creation, "
            "accessibility, and the use of art as a tool for collective "
            "reflection and imaginative possibility."
        ),
        "metadata": [
            ["Year", "2025"],
            [
                "Location",
                "Henry Sandon Hall, Worcester Porcelain during the Bridges of Light Festival",
            ],
            ["Format", "Immersive participatory UV installation"],
            [
                "Focus",
                "Community-led future thinking and creative expression",
            ],
            [
                "Participants",
                "Dines Green Youth Club, The Monday Night Club and the wider local community.",
            ],
            ["Commissioner", "Severn Arts, Worcester"],
        ],
        "gallery": [
            "/static/img/community/bridgesoflight1.jpg",
            "/static/img/community/bridgesoflight2.jpg",
            "/static/img/community/bridgesoflight3.jpg",
            "/static/img/community/bridgesoflight4.jpg",
        ],
        "process": [
            "Workshops focused on colour and story prompts, generating source visuals and words used throughout the projection system.",
            "Prototype tests were staged in low-light settings to tune scale, pacing and legibility for mixed-age audiences.",
        ],
        "credits": [
            "Artist and Facilitation: Kim Piffy",
            "Community Co-creators: Placeholder Group",
            "Technical Support: Placeholder Partner",
        ],
        "blurb": (
            "An immersive light installation created with local community groups, "
            "for Severn Arts in Worcester."
        ),
        "stack": ["Light", "Community"],
    },
    "elgar-at-the-asylum": {
        "template": "portfolio/community_elgar_at_the_asylum.html",
        "slug": "elgar-at-the-asylum",
        "title": "Elgar at the Asylum",
        "subtitle": "Monday Night Club / Shadowlight",
        "hero_image": "/static/img/community/elgar1.jpg",
        "description": (
            "As Visual Arts Lead on Elgar at the Asylum, I designed and delivered "
            "a structured programme of accessible workshops for members of Monday "
            "Night Club, supporting learning disabled adults to create high-quality "
            "visual work within a collaborative, interdisciplinary production. The "
            "workshops were carefully developed to balance openness with clear "
            "visual outcomes using repeatable processes that enabled participants "
            "to build confidence while producing cohesive, professional material "
            "suitable for integration into film and performance. Through methods "
            "including layered printmaking, stencil work, and shadow-based image-"
            "making, participants generated a body of visual content that directly "
            "informed the film created by Shadowlight (Film Oxford) and the wider "
            "live performance. These artworks were embedded within the scenography "
            "and visual language of the production, ensuring that participant "
            "contributions were central rather than supplementary. The project "
            "culminated in a public presentation at Malvern Theatres, bringing "
            "together visual art, film, and live performance in a unified outcome. "
            "The project demonstrates a strong commitment to accessibility without "
            "reducing artistic ambition developing systems that support meaningful "
            "participation while maintaining a clear aesthetic direction. By "
            "structuring the process around collective authorship and translation "
            "across mediums, the work foregrounds the creative agency of "
            "participants within a complex, professional production context."
        ),
        "metadata": [
            ["Year", "2026"],
            ["Location", "Malvern Theatres, Worcestershire"],
            ["Format", "Workshops, Artworks, Film, Live Performances"],
            ["Focus", "Accessible co-creation and interdisciplinary practice"],
            ["Participants", "Monday Night Club"],
            [
                "Collaborators",
                "Shadowlight (Film Oxford), C&T, Worcester, Vamos Theatre, DanceFest",
            ],
            ["Role", "Visual Arts Lead"],
        ],
        "gallery": [
            "/static/img/community/elgar4.jpg",
            "/static/img/community/elgar2.jpg",
            "/static/img/community/elgar3.jpg",
            "/static/img/community/elgarhero.jpg",
        ],
        "process": [
            "Image development sessions combined archival prompts with contemporary drawing and collage experiments.",
            "Final banner compositions were scaled through iterative mockups to balance visibility in the theatre approach.",
        ],
        "credits": [
            "Lead Artist: Kim Piffy",
            "Collaborators: The Monday Night Club",
            "Venue Partner: Placeholder Venue Team",
        ],
        "blurb": (
            "Accessible co-created visual arts, film, and live performance project with "
            "Monday Night Club and Shadowlight."
        ),
        "stack": ["Visual Arts", "Interdisciplinary"],
    },
    "digitalis-1-0": {
        "template": "portfolio/community_digitalis_1_0.html",
        "slug": "digitalis-1-0",
        "title": "Digitalis 1.0",
        "subtitle": "Interactive Community Digital Installation",
        "hero_image": "/static/img/community/digitaliscover.png",
        "description": (
            "Digitalis 1.0 responds to the RSA Apply AI brief by exploring how AI could become "
            "accessible, community-owned infrastructure for local climate action. Inspired by "
            "mycelial networks, a reclaimed cyberdeck and redundant telephone box become a "
            "physical community node for connecting, sensing, exchanging and transforming local "
            "knowledge; asking how technology might reconnect people with place, nature and one "
            "another.\n\nChallenging the position that AI is a bureaucratic, centralised system, "
            "Digitalis 1.0 imagines it as something that can instead be localised: situated, "
            "tangible and collectively encountered. By repurposing obsolete technology and "
            "equally obsolete pre-existing public infrastructure, the concept explores how "
            "technology could support community-led responses to local climate challenges by "
            "encouraging holistic thinking, participation, exchange and a renewed awareness of "
            "the environments we inhabit."
        ),
        "metadata": [
            ["Year", "2026"],
            ["Format", "Interactive, Interruptive, Installation Concept"],
            ["Tools", "Raspberry Pi, Reclaimed Electronics, AI"],
            ["Audience", "Local Communities / Intergenerational"],
        ],
        "gallery": [
            "/static/img/community/digitalis1.png",
            "/static/img/community/digitalis2.JPG",
            "/static/img/community/digitalis3.JPG",
            "/static/img/community/digitalis4.png",
        ],
        "process": [
            "Prototypes tested responsive triggers and accessibility-friendly interaction patterns in low-pressure settings.",
            "Content pipelines were structured for easy swap-in of participant visuals and text for future versions.",
        ],
        "credits": [
            "Creative Direction: Kim Piffy",
            "Interaction Prototyping: Placeholder Developer",
            "Community Input: Placeholder Collective",
        ],
        "blurb": "Interactive community-focused digital installation project.",
        "stack": ["Digital", "Community"],
    },
}


ART_PROJECT_DETAILS = {
    "polycephaly": {
        "template": "portfolio/community_project_detail.html",
        "slug": "polycephaly",
        "title": "Polycephaly",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/placeholders/polycephaly.svg",
        "description": "Placeholder study exploring layered identities and multiplicity.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/placeholders/polycephaly.svg",
            "/static/img/art/placeholders/polycephaly.svg",
            "/static/img/art/placeholders/polycephaly.svg",
            "/static/img/art/placeholders/polycephaly.svg",
        ],
    },
    "pine": {
        "template": "portfolio/community_project_detail.html",
        "slug": "pine",
        "title": "Pine",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/pine/pinecover.webp",
        # Grid blob cover uses Antagony's normal-light image; detail-page hero uses the supplied pine cover.
        "cover": "/static/img/art/pine/antagony.webp",
        "grid_image_scale": 1.15,
        "description": "Placeholder study in tactile, resin-like structure and rhythm.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            {
                "label": "Solastalgia",
                "normal": "/static/img/art/pine/solastalgia.webp",
                "uv": "/static/img/art/pine/solastalgia-uv.webp",
                "default": "uv",
                "trigger": "hover",
            },
            {
                "label": "Antagony",
                "normal": "/static/img/art/pine/antagony.webp",
                "uv": "/static/img/art/pine/antagony-uv.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "Communion",
                "normal": "/static/img/art/pine/communion.webp",
                "uv": "/static/img/art/pine/communion-uv.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "Division",
                "normal": "/static/img/art/pine/division.webp",
                "uv": "/static/img/art/pine/division-uv.webp",
                "default": "uv",
                "trigger": "hover",
            },
        ],
    },
    "piffy": {
        "template": "portfolio/community_project_detail.html",
        "slug": "piffy",
        "title": "Piffy",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/piffy/prophecy.webp",
        # UV swap only happens on the detail-page hero; the grid blob cover stays the normal-light Prophecy image.
        "hero_uv": "/static/img/art/piffy/prophecy-uv.webp",
        "grid_image_scale": 1.3,
        "description": "Placeholder work using bold repetition and chromatic tension.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            {
                "src": "/static/img/art/piffy/piffy2.webp",
                "full_width": True,
            },
            {
                "src": "/static/img/art/piffy/piffy3.webp",
                "full_width": True,
            },
            {
                "src": "/static/img/art/piffy/piffy4.webp",
                "full_width": True,
            },
        ],
    },
    "matrascence": {
        "template": "portfolio/community_project_detail.html",
        "slug": "matrascence",
        "title": "Matrascence",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/matrascence/treeoflife.webp",
        # Grid blob cover uses Mother Wound; the detail-page hero uses Tree of Life.
        "cover": "/static/img/art/matrascence/motherwound.webp",
        # Zoom the cover image in an extra 25% within the art-grid blob shape only.
        "grid_image_scale": 1.25,
        # Nudge the cover image within the blob (not the blob itself): up 60px, right 10px.
        "grid_image_offset_x": 10,
        "grid_image_offset_y": -60,
        "description": "Placeholder work on transformation, softness and spatial drift.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            {
                "label": "Ambivalence",
                "normal": "/static/img/art/matrascence/ambiv.webp",
                "uv": "/static/img/art/matrascence/ambivalence2.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "The Dark Mother",
                "normal": "/static/img/art/matrascence/thedarkmother.webp",
                "uv": "/static/img/art/matrascence/thedarkmother2.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "Mother Wound",
                "normal": "/static/img/art/matrascence/motherwound.webp",
                "uv": "/static/img/art/matrascence/motherwound-uv.webp",
                "default": "normal",
                "trigger": "hover",
            },
            "/static/img/art/matrascence/loveahaiku.webp",
        ],
    },
    "clothing": {
        "template": "portfolio/community_project_detail.html",
        "slug": "clothing",
        "title": "Clothing",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/clothing/clothingcover.webp",
        # Hover swap only happens on the detail-page hero, not the art-grid blob.
        "hero_uv": "/static/img/art/clothing/clothingcoverhover.webp",
        "cover": "/static/img/art/clothing/clothes.webp",
        "grid_image_scale": 1,
        "grid_image_offset_x": 0,
        "grid_image_offset_y": 0,
        "description": "Placeholder study tracing material language and bodily shape.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            {
                "label": "Clothing 4",
                "normal": "/static/img/art/clothing/clothing4.webp",
                "uv": "/static/img/art/clothing/clothing4hover.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "Clothing 2",
                "normal": "/static/img/art/clothing/clothing2.webp",
                "uv": "/static/img/art/clothing/clothing2hover.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "Clothing 3",
                "normal": "/static/img/art/clothing/clothing3hover.webp",
                "uv": "/static/img/art/clothing/clothing3.webp",
                "default": "normal",
                "trigger": "hover",
            },
            {
                "label": "Clothing 1",
                "normal": "/static/img/art/clothing/clothing1.webp",
                "uv": "/static/img/art/clothing/clothing1hover.webp",
                "default": "normal",
                "trigger": "hover",
            },
        ],
    },
    "ars-lapsu": {
        "template": "portfolio/community_project_detail.html",
        "slug": "ars-lapsu",
        "title": "Paradigm",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/ars-lapsu/larsapsuprojectcover.webp",
        # Grid blob cover uses the separate art-grid cover image, not the detail-page hero.
        "cover": "/static/img/art/ars-lapsu/larsapsucover.webp",
        "description": "Placeholder work exploring rift, echo and threshold forms.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        # Single row of 3 images instead of the usual 2x2 grid.
        "gallery_columns": 3,
        "gallery": [
            "/static/img/art/ars-lapsu/larsapsucover.webp",
            "/static/img/art/ars-lapsu/larsapsu3.webp",
            {
                "label": "Lars Apsu 4",
                "normal": "/static/img/art/ars-lapsu/larsapsu4.webp",
                "uv": "/static/img/art/ars-lapsu/larsapsu4-rollover.webp",
                "default": "normal",
                "trigger": "hover",
            },
        ],
    },
    "hca": {
        "template": "portfolio/community_project_detail.html",
        "slug": "hca",
        "title": "HCA",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/hca/hcacover.webp",
        # UV/hover swap only on the detail-page hero.
        "hero_uv": "/static/img/art/hca/hcacoverhover.webp",
        "grid_image_scale": 0.75,
        "grid_image_offset_x": 15,
        "grid_image_offset_y": -95,
        "grid_image_rotate": 0,
        "description": "Placeholder study for modular structure and visual memory.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/hca/hca1.webp",
            {
                "src": "/static/img/art/hca/hca2.webp",
                # Cropped to match hca1's height rather than averaging the row.
                "crop_to_row": True,
            },
            "/static/img/art/hca/hca3.webp",
            "/static/img/art/hca/hca4.webp",
        ],
    },
    "falmouth-university": {
        "template": "portfolio/community_project_detail.html",
        "slug": "falmouth-university",
        "title": "Falmouth University",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/placeholders/falmouth-university.svg",
        "description": "Placeholder piece considering academic context, process and atmosphere.",
        "metadata": [
            ["Status", "Placeholder"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/placeholders/falmouth-university.svg",
            "/static/img/art/placeholders/falmouth-university.svg",
            "/static/img/art/placeholders/falmouth-university.svg",
            "/static/img/art/placeholders/falmouth-university.svg",
        ],
    },
    "1": {
        "template": "portfolio/community_project_detail.html",
        "slug": "1",
        "title": "1",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/placeholders/1.svg",
        "description": "Placeholder work for the grid.",
        "metadata": [
            ["Status", "Coming soon"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/placeholders/1.svg",
            "/static/img/art/placeholders/1.svg",
            "/static/img/art/placeholders/1.svg",
            "/static/img/art/placeholders/1.svg",
        ],
    },
    "2": {
        "template": "portfolio/community_project_detail.html",
        "slug": "2",
        "title": "2",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/placeholders/2.svg",
        "description": "Placeholder work for the grid.",
        "metadata": [
            ["Status", "Coming soon"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/placeholders/2.svg",
            "/static/img/art/placeholders/2.svg",
            "/static/img/art/placeholders/2.svg",
            "/static/img/art/placeholders/2.svg",
        ],
    },
    "3": {
        "template": "portfolio/community_project_detail.html",
        "slug": "3",
        "title": "3",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/placeholders/3.svg",
        "description": "Placeholder work for the grid.",
        "metadata": [
            ["Status", "Coming soon"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/placeholders/3.svg",
            "/static/img/art/placeholders/3.svg",
            "/static/img/art/placeholders/3.svg",
            "/static/img/art/placeholders/3.svg",
        ],
    },
    "4": {
        "template": "portfolio/community_project_detail.html",
        "slug": "4",
        "title": "4",
        "subtitle": "Placeholder Art Project",
        "hero_image": "/static/img/art/placeholders/4.svg",
        "description": "Placeholder work for the grid.",
        "metadata": [
            ["Status", "Coming soon"],
            ["Type", "Art project"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/placeholders/4.svg",
            "/static/img/art/placeholders/4.svg",
            "/static/img/art/placeholders/4.svg",
            "/static/img/art/placeholders/4.svg",
        ],
    },
}


def people(request):
    title = "Creative Health, SEND & Community Arts Practice | Kim Piffy"
    description = (
        "Explore Kim Piffy's sensory-aware creative-health projects, participatory "
        "workshops and community arts practice with SEND, disabled and autistic participants."
    )
    projects = []
    community_order = [
        "wishing-tree",
        "imagining-a-bright-future",
        "elgar-at-the-asylum",
        "digitalis-1-0",
    ]

    for slug in community_order:
        item = COMMUNITY_PROJECT_DETAILS[slug]
        projects.append(
            {
                "id": item["slug"],
                "title": item["title"],
                "subtitle": item["subtitle"],
                "blurb": item["blurb"],
                "stack": item["stack"],
                "cover": item["hero_image"],
                "cover_focus_y": item.get("cover_focus_y", "Mid"),
                "learn_more_url": reverse(
                    "community_project_detail", kwargs={"slug": slug}
                ),
            }
        )

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


def styles(request):
    title = "Styles | Kim Piffy"
    description = (
        "Browse Kim Piffy's styles publication in an embedded interactive viewer."
    )

    styles_html_dir = (
        Path(__file__).resolve().parent.parent
        / "static" / "styles" / "publication-web-resources" / "html"
    )
    page_count = len(list(styles_html_dir.glob("publication*.html"))) if styles_html_dir.exists() else 0
    styles_page_urls = [
        static(
            "styles/publication-web-resources/html/"
            + ("publication.html" if i == 0 else f"publication-{i}.html")
        )
        for i in range(page_count)
    ]

    return render(
        request,
        "portfolio/styles.html",
        {
            "styles_package_url": static("styles/index.html"),
            "styles_page_urls": styles_page_urls,
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
            ),
            "section_h1": "Styles",
        },
    )


def industry(request):
    return redirect("portfolio:styles", permanent=True)


@xframe_options_sameorigin
def industry_brand_guidelines_pdf(request):
    project_root = Path(__file__).resolve().parent.parent

    preferred_candidates = [
        project_root / "KIM PIFFY WEBSITE - BRAND GUIDLINES.pdf",
        project_root / "KIM PIFFY WEBSITE - BRAND GUIDELINES.pdf",
        project_root / "static" / "docs" / "brand-guidelines.pdf",
        project_root / "kim piffy website guidlines pdf",
        project_root / "kim piffy website guidelines pdf",
    ]

    pdf_path = next((path for path in preferred_candidates if path.exists()), None)

    if pdf_path is None:
        # Last-resort fallback: pick the most recently modified PDF in project root/static/docs.
        fallback_pdfs = []
        for folder in (project_root, project_root / "static" / "docs"):
            if not folder.exists():
                continue
            fallback_pdfs.extend(
                p for p in folder.glob("*.pdf")
                if p.is_file() and "cv" not in p.name.lower()
            )

        if fallback_pdfs:
            pdf_path = max(fallback_pdfs, key=lambda p: p.stat().st_mtime)

    if pdf_path is None:
        raise Http404("Brand guidelines PDF not found")

    response = FileResponse(pdf_path.open("rb"), content_type="application/pdf")
    response["Content-Disposition"] = 'inline; filename="kim-piffy-website-brand-guidelines.pdf"'
    return response


def community_project_detail(request, slug):
    project = COMMUNITY_PROJECT_DETAILS.get(slug)
    if not project:
        raise Http404("Community project not found")

    title = f"{project['title']} | Community Project | Kim Piffy"
    description = (
        f"Explore {project['title']}: {project['subtitle']}. "
        "Project details, process notes, gallery and credits."
    )

    return render(
        request,
        project["template"],
        {
            "project": project,
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
            ),
            "section_h1": project["title"],
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
    projects = []
    art_order = [
        "polycephaly",
        "3",
        "clothing",
        "ars-lapsu",
        "2",
        "pine",
        "piffy",
        "falmouth-university",
        "1",
        "hca",
        "matrascence",
        "4",
    ]

    for slug in art_order:
        item = ART_PROJECT_DETAILS[slug]
        projects.append(
            {
                "id": item["slug"],
                "title": item["title"],
                "description": item["description"],
                "cover": item.get("cover", item["hero_image"]),
                "cover_focus_y": item.get("cover_focus_y", "Mid"),
                "grid_image_scale": item.get("grid_image_scale", 1),
                "grid_image_offset_x": item.get("grid_image_offset_x", 0),
                "grid_image_offset_y": item.get("grid_image_offset_y", 0),
                "grid_image_rotate": item.get("grid_image_rotate", 0),
                "slug": item["slug"],
                "learn_more_label": "Learn More",
                "learn_more_url": reverse(
                    "portfolio:art_project_detail", kwargs={"slug": slug}
                ),
            }
        )

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


def art_project_detail(request, slug):
    project = ART_PROJECT_DETAILS.get(slug)
    if not project:
        raise Http404("Art project not found")

    title = f"{project['title']} | Art Project | Kim Piffy"
    description = (
        f"Explore {project['title']}: {project['subtitle']}. "
        "Project details, process notes, gallery and credits."
    )

    return render(
        request,
        project["template"],
        {
            "project": project,
            "back_url": reverse("portfolio:art"),
            "back_label": "go back",
            "seo": build_seo(
                request,
                title=title,
                description=description,
                og_title=title,
                og_description=description,
                twitter_title=title,
                twitter_description=description,
            ),
            "section_h1": project["title"],
        },
    )
