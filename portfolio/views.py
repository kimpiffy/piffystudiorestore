from pathlib import Path

from django.http import FileResponse, Http404
from django.shortcuts import redirect
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.utils.safestring import mark_safe
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
        "subtitle": "Bilateral Drawing Series",
        "hero_image": "/static/img/art/polycephaly/polycephaly1.webp",
        # Grid blob cover and the top-left gallery square both use polycephaly2cover.
        "cover": "/static/img/art/polycephaly/polycephaly2cover.webp",
        # Zoom out the cover image within the blob (not the blob itself).
        "grid_image_scale": 0.85,
        # Nudge the cover image within the blob (not the blob itself): right 30px, up 40px.
        "grid_image_offset_x": 30,
        "grid_image_offset_y": -40,
        "description": (
            "A continuing series of bilateral drawings exploring multiplicity and "
            "symmetry, with a specific focus on recurring faces. Emerging "
            "intuitively, this drawing practice operates somewhere between "
            "self-portraiture, independent archetypes or entities, and "
            "psychological architecture.\n\n"
            "As an autobiographical artist, I utilise the process almost "
            "meditatively: giving internal complexity reflective capacity — a "
            "form capable of looking back. It is a method through which I "
            "continuously reorganise the self through making."
        ),
        "modal_description": (
            "An ongoing series of bilateral drawings exploring symmetry, "
            "multiplicity and recurring faces. The intuitive drawing process "
            "functions as a meditative form of autobiographical and "
            "psychological enquiry."
        ),
        "metadata": [
            ["Status", "Ongoing"],
            ["Type", "Drawing series"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/polycephaly/polycephaly2cover.webp",
            "/static/img/art/polycephaly/polycephaly3.webp",
            "/static/img/art/polycephaly/polycephaly4.webp",
            "/static/img/art/polycephaly/polycephaly5.webp",
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
        # Nudge the cover image within the blob (not the blob itself): up 100px.
        "grid_image_offset_y": -100,
        "description": "Placeholder study in tactile, resin-like structure and rhythm.",
        "modal_description": (
            "A collection exploring ecological interdependence across scales, "
            "from tree and soil to mycelium and cell. The work considers "
            "perceived human separation from nature as fundamental to its "
            "destruction."
        ),
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
        "subtitle": "Tapestry & Mixed-Media Collage",
        "hero_image": "/static/img/art/piffy/prophecy.webp",
        # UV swap only happens on the detail-page hero; the grid blob cover stays the normal-light Prophecy image.
        "hero_uv": "/static/img/art/piffy/prophecy-uv.webp",
        "grid_image_scale": 1.3,
        "description": (
            "piffy /\u02c8p\u026afi/\n"
            "informal, dialect British\n"
            "verb — to wait around uselessly, aimlessly, or in a state of "
            "frustrated helplessness.\n\n"
            "Piffy was the first point at which I consolidated my practice into "
            "a resolved body of work for exhibition. It brings together a "
            "tapestry and seven mixed-media collages assembled from a decade of "
            "accumulated fabric scraps, drawings, paintings and written "
            "fragments.\n\n"
            "Moving between autobiography and symbolism, the works explore "
            "self-awareness, the subconscious and the construction of meaning. "
            "Esoteric symbols, language, fluorescent colour and imagery "
            "revealed under ultraviolet light translate internal experience "
            "into a shifting visual system of contradictions, associations and "
            "double meanings."
        ),
        "modal_description": (
            "A tapestry and seven mixed-media collages assembled from a decade "
            "of accumulated materials. The exhibition explores autobiography, "
            "the subconscious, symbolism and the construction of meaning."
        ),
        "metadata": [
            ["Status", "Exhibited"],
            ["Type", "Tapestry & mixed-media collage"],
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
        # Display title is the correctly spelled "Matrescence"; slug/key kept as-is to avoid breaking existing links.
        "title": "Matrescence",
        "subtitle": "Textile & Print Series",
        "hero_image": "/static/img/art/matrascence/treeoflife.webp",
        # Grid blob cover uses Mother Wound; the detail-page hero uses Tree of Life.
        "cover": "/static/img/art/matrascence/motherwound.webp",
        # Zoom the cover image in an extra 25% within the art-grid blob shape only.
        "grid_image_scale": 1.25,
        # Nudge the cover image within the blob (not the blob itself): up 60px, right 10px.
        "grid_image_offset_x": 10,
        "grid_image_offset_y": -60,
        "description": (
            "Textiles became a practical medium during my early experiences of "
            "motherhood: they could be worked on around a baby, in bed and "
            "through constant interruption. The works produced during this "
            "period explore matrescence as a psychological restructuring of "
            "identity and attachment.\n\n"
            "Alongside three tapestries, a digitally altered print of my "
            "placenta reimagines the organ as the Tree of Life — positioning "
            "myself as microcosm in relation to Earth as the macrocosmic "
            "mother. I buried my placenta beneath an apple tree in a ritual "
            "commemorating the cyclical process of birth, death and "
            "regeneration.\n\n"
            "The final piece, a mandala-shaped textile portal constructed "
            "partly from knitwear made by my mother, became an object through "
            "which to explore maternal inheritance and enmeshment. Its "
            "eventual ritual burning directly confronted attachment and "
            "material impermanence, symbolically closing \u201cthe womb door\u201d "
            "and transforming unmaking into an act of separation, release and "
            "interruption of inherited patterns."
        ),
        "modal_description": (
            "Textile and mixed-media works made during early motherhood, "
            "exploring changes in identity, attachment and maternal "
            "inheritance. The series uses personal materials and ritual "
            "processes to examine regeneration, separation and release."
        ),
        "metadata": [
            ["Status", "Complete"],
            ["Type", "Textile & print series"],
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
        "subtitle": "Surface Pattern & Wearable Objects",
        "hero_image": "/static/img/art/clothing/clothingcover.webp",
        # Hover swap only happens on the detail-page hero, not the art-grid blob.
        "hero_uv": "/static/img/art/clothing/clothingcoverhover.webp",
        "cover": "/static/img/art/clothing/clothes.webp",
        "grid_image_scale": 1,
        "grid_image_offset_x": 0,
        "grid_image_offset_y": 0,
        "description": (
            "Between 2018 and 2022, I experimented with clothing and surface "
            "pattern design, translating my illustrations into repeat "
            "patterns, textiles and wearable objects. Although I eventually "
            "realised that fashion itself was not where my interest lay, the "
            "process established relationships between illustration, "
            "repetition, symbolism and material that continue throughout my "
            "practice.\n\n"
            "Surface pattern became another way of allowing an image to move "
            "beyond the singular artwork \u2014 repeating, accumulating and "
            "becoming recognisable across different objects and contexts. "
            "This experimentation fed directly into my continuing use of "
            "textiles, collage and visual systems, as well as my later "
            "interest in semiotics, branding and visual communication.\n\n"
            "Managing the clothing independently also taught me how to move "
            "between creative and pragmatic thinking: developing an idea while "
            "simultaneously considering production, budgets, suppliers, "
            "photography, communication and delivery. I continue to approach "
            "surface pattern as part of my visual vocabulary, with the "
            "potential to move between artwork, textile, object and "
            "application."
        ),
        "modal_description": (
            "Clothing and surface-pattern work produced between 2018 and 2022, "
            "translating illustration into repeat patterns, textiles and "
            "wearable objects. The practice established lasting interests in "
            "pattern, production, branding and the movement of images across "
            "different applications."
        ),
        "metadata": [
            ["Status", "Complete"],
            ["Type", "Surface pattern & clothing design"],
            ["Year", "2018\u20132022"],
            ["Location", "TBC"],
        ],
        "gallery": [
            {
                "src": "/static/img/art/clothing/piffytrickout-2019.webp",
                "full_width": True,
            },
            {
                "src": "/static/img/art/clothing/piffytrickout-2020.webp",
                "full_width": True,
            },
            {
                "src": "/static/img/art/clothing/piffytrickout-2021.webp",
                "full_width": True,
            },
        ],
    },
    "ars-lapsu": {
        "template": "portfolio/community_project_detail.html",
        "slug": "ars-lapsu",
        "title": "Paradigm",
        "subtitle": "Tapestry & Mixed-Media Installation",
        "hero_image": "/static/img/art/ars-lapsu/larsapsuprojectcover.webp",
        # Grid blob cover uses the separate art-grid cover image, not the detail-page hero.
        "cover": "/static/img/art/ars-lapsu/larsapsucover.webp",
        "description": (
            "Paradigm explores the Fall of Man within a new technological "
            "milieu, using religious iconography, mythology and contemporary "
            "technological symbols to reconsider narratives of knowledge, "
            "temptation and consequence.\n\n"
            "At its centre is The Loom of Fate, a large-scale Jacquard tapestry "
            "whose material construction forms part of its commentary: the "
            "punched-card systems developed for Jacquard weaving became an "
            "important precursor to later computational technologies. "
            "Elsewhere, the Apple logo collapses the forbidden fruit into the "
            "contemporary technological object, connecting humanity\u2019s "
            "pursuit of knowledge with its continuing desire to exceed its own "
            "limitations.\n\n"
            "The series also reconsiders Eve from a feminist perspective. "
            "Rather than positioning her acquisition of knowledge simply as "
            "humanity\u2019s downfall, Paradigm asks whether leaving Eden might "
            "also represent an awakening \u2014 the painful exchange of "
            "innocence for knowledge, agency and a more truthful encounter "
            "with reality."
        ),
        "modal_description": (
            "A series exploring technology through the iconography of the Fall "
            "of Man. Jacquard weaving, the Apple symbol and a feminist "
            "reconsideration of Eve connect technological progress with "
            "recurring questions of knowledge, agency and consequence."
        ),
        "metadata": [
            ["Status", "Complete"],
            ["Type", "Tapestry & mixed-media installation"],
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
        "subtitle": "Hereford College of Arts",
        "hero_image": "/static/img/art/hca/hcacover.webp",
        # UV/hover swap only on the detail-page hero.
        "hero_uv": "/static/img/art/hca/hcacoverhover.webp",
        "grid_image_scale": 0.75,
        "grid_image_offset_x": 15,
        "grid_image_offset_y": -95,
        "grid_image_rotate": 0,
        "description": (
            "I began my Foundation Diploma at Hereford College of Arts partly "
            "from a fear that becoming a mother might mean ceasing to practise "
            "as an artist. I gave birth during my final assessment period, "
            "making my time on the course a literal negotiation between "
            "motherhood and maintaining a creative practice.\n\n"
            "After graduating in 2024, I was invited back to create "
            "Everything I Ever Made (Almost) \u2014 a solo exhibition in the "
            "campus halls to welcome the next cohort of higher education "
            "students.\n\n"
            "The course marked my transition from predominantly intuitive "
            "making towards a more deliberate consideration of experimentation, "
            "collaboration, process and communication, culminating in an "
            "internal award for collaboration."
        ),
        "modal_description": (
            "Work spanning my Foundation Diploma at Hereford College of Arts "
            "and the subsequent exhibition Everything I Ever Made (Almost). "
            "This period marked a transition from predominantly intuitive "
            "making towards more deliberate experimentation, collaboration and "
            "communication."
        ),
        "metadata": [
            ["Status", "Complete"],
            ["Type", "Foundation Diploma"],
            ["Year", "2024"],
            ["Location", "Hereford College of Arts"],
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
        "title": "Falmouth",
        "subtitle": "BA (Hons) Visual Communication",
        "hero_image": "/static/img/art/falmouth-university/unicover.webp",
        # Hover swap only happens on the detail-page hero, not the art-grid blob.
        "hero_uv": "/static/img/art/falmouth-university/unicoverhover.webp",
        # Grid blob cover uses finalunicover; detail-page hero stays unicover.
        "cover": "/static/img/art/falmouth-university/finalunicover.webp",
        "description": (
            "I study Visual Communication at Falmouth University as a way of "
            "bringing conceptual practice into dialogue with practical "
            "communication. My work explores how image, language, systems and "
            "experience can communicate complex ideas in the clearest way "
            "possible.\n\n"
            "The degree provides a framework through which I can balance "
            "conceptual enquiry with pragmatic communication, with the aim of "
            "building towards further psychological and interdisciplinary "
            "research."
        ),
        "modal_description": (
            "Ongoing Visual Communication work produced at Falmouth "
            "University. The work combines conceptual enquiry with practical "
            "approaches to communicating complex ideas through image, "
            "language and experience."
        ),
        "metadata": [
            ["Status", "Ongoing"],
            ["Type", "Academic study"],
            ["Year", "TBC"],
            ["Location", "Falmouth University"],
        ],
        "gallery": [
            "/static/img/art/falmouth-university/uni1.webp",
            "/static/img/art/falmouth-university/uni2.webp",
            {
                "src": "/static/img/art/falmouth-university/uni4.webp",
                "full_width": True,
            },
            {
                "src": "/static/img/art/falmouth-university/uni5.webp",
                "full_width": True,
            },
        ],
    },
    "portals": {
        "template": "portfolio/community_project_detail.html",
        "slug": "portals",
        "title": "Portals",
        "subtitle": "Circular Collage Series",
        "hero_image": "/static/img/art/portals/portals1-turbulence.webp",
        # Grid blob cover uses portals6-reflections.
        "cover": "/static/img/art/portals/portals6-reflections.webp",
        # Cancel the renderer's 1.26x base overscan so the blob image renders at 1x.
        "grid_image_scale": 1 / 1.26,
        # Nudge the cover image within the blob (not the blob itself): down 130px.
        "grid_image_offset_y": 130,
        "description": mark_safe(
            "A series of small-scale collages housed within circular frames, "
            "each approximately 20cm in diameter. Conceived as small apertures "
            "into my mind, the works use fragments of drawings, photographs, "
            "text and found imagery, layered intuitively to construct dense "
            "compositions through visual association.\n\n"
            "These works were my earliest experiments with a collage technique "
            "that would later develop into larger and more complex bodies of "
            "work, including "
            '<a href="/work/art/piffy/" class="project-inline-link">Piffy</a>.'
        ),
        "modal_description": (
            "Small-scale circular collages conceived as apertures into the "
            "mind. These early experiments in layering and visual association "
            "established techniques later developed across larger bodies of "
            "work."
        ),
        "metadata": [
            ["Status", "Complete"],
            ["Type", "Collage series"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        # Single row of 4 images side by side instead of the usual 2x2 grid.
        "gallery_columns": 4,
        "gallery": [
            "/static/img/art/portals/portals5-insignia.webp",
            "/static/img/art/portals/portals4-dissipation.webp",
            "/static/img/art/portals/portals3-spaceships.webp",
            "/static/img/art/portals/portals6-reflections.webp",
        ],
    },
    "illustration": {
        "template": "portfolio/community_project_detail.html",
        "slug": "illustration",
        "title": "Illustration",
        "subtitle": "Drawing Practice",
        "hero_image": "/static/img/art/illustration/illustrationcover.webp",
        # Cancel the renderer's 1.26x base overscan so the blob image renders at 1x.
        "grid_image_scale": 1 / 1.26,
        "description": mark_safe(
            "Illustration forms the foundation of my practice. Influenced by "
            "tattoo culture, symbolism and graphic image-making, drawing "
            "provides a visual vocabulary that continually resurfaces "
            "throughout my wider work.\n\n"
            "Much of my contemporary illustration is produced digitally on an "
            "iPad \u2014 a medium whose immediacy and portability has made "
            "drawing particularly accommodating alongside child-rearing. "
            "These illustrations frequently become source material for "
            "collage and other mixed-media works, while drawing also provides "
            "the basis for my continuing "
            '<a href="/work/art/polycephaly/" class="project-inline-link">Polycephaly</a> series.'
        ),
        "modal_description": (
            "Drawing is the foundation of my practice and a continual source "
            "of imagery for my wider work. Influenced by tattoo culture and "
            "symbolism, illustrations move between digital drawing, collage "
            "and the ongoing Polycephaly series."
        ),
        "metadata": [
            ["Status", "Ongoing"],
            ["Type", "Drawing practice"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/illustration/illustration1.webp",
            "/static/img/art/illustration/illustration2.webp",
            "/static/img/art/illustration/illustration3.webp",
            "/static/img/art/illustration/illustration4.webp",
        ],
    },
    "simulacra": {
        "template": "portfolio/community_project_detail.html",
        "slug": "simulacra",
        "title": "Simulacra",
        "subtitle": "AI-Generated Image Series",
        "hero_image": "/static/img/art/simulacra/simulacra1.webp",
        # Grid blob cover uses the dedicated blob image; detail-page hero stays simulacra1.
        "cover": "/static/img/art/simulacra/simulacrablob.webp",
        # Cancel the renderer's 1.26x base overscan so the blob image renders at 1x.
        "grid_image_scale": 1 / 1.26,
        # Nudge the cover image within the blob (not the blob itself): up 30px.
        "grid_image_offset_y": -30,
        "description": (
            "Created in 2021, Simulacra is an early series of AI-generated "
            "works produced from thirty original inputs spanning my collage, "
            "graffiti, painting and digital practice. The resulting images "
            "reproduce the visual language of my work without corresponding "
            "to any physical original \u2014 facsimiles of things that never "
            "existed.\n\n"
            "The collection explores representation becoming increasingly "
            "detached from an original referent, until the distinction between "
            "copy and reality begins to collapse. Created immediately before "
            "generative AI entered widespread cultural use, the works pre-empt "
            "many of the questions raised by this superfluous technology: "
            "authorship, replication, and the emergence of a technological "
            "reality increasingly constructed through representations of "
            "representations.\n\n"
            "The individual works are named after the rivers of the Greek "
            "underworld, framing this technological threshold as a crossing "
            "into uncertain and potentially detrimental new territory."
        ),
        "modal_description": (
            "AI-generated works created in 2021 from thirty original "
            "artworks. The series explores authorship, replication and the "
            "increasingly unstable distinction between original, copy and "
            "simulation."
        ),
        "metadata": [
            ["Status", "Complete"],
            ["Type", "AI-generated image series"],
            ["Year", "2021"],
            ["Location", "TBC"],
        ],
        # Two rows of 3 images.
        "gallery_columns": 3,
        "gallery": [
            "/static/img/art/simulacra/simulacra2.webp",
            "/static/img/art/simulacra/simulacra3.webp",
            "/static/img/art/simulacra/simulacra4.webp",
            "/static/img/art/simulacra/simulacra5.webp",
            "/static/img/art/simulacra/simulacra6.webp",
            "/static/img/art/simulacra/simulacra7.webp",
        ],
    },
    "semiotics": {
        "template": "portfolio/community_project_detail.html",
        "slug": "semiotics",
        "title": "Semiotics",
        "subtitle": "Artist Mark & Symbol System",
        "hero_image": "/static/img/art/semiotics/semioticscover.webp",
        "description": (
            "Semiotics is a constant consideration throughout my practice: an "
            "exploration of how meaning is constructed, compressed and "
            "communicated through symbols. At its centre is a recurring "
            "emblem developed as my artist mark \u2014 simultaneously a logo, "
            "motif and container beneath which otherwise disparate areas of "
            "my practice can coexist.\n\n"
            "Repeated across artworks, clothing, print and digital contexts, "
            "the symbol accumulates associations rather than retaining a "
            "single fixed meaning. This ongoing enquiry bridges my fine art "
            "practice with my interest in branding, graphic design and visual "
            "communication, asking how complex ideas can be distilled into "
            "pragmatic and recognisable visual forms."
        ),
        "modal_description": (
            "An ongoing investigation into how symbols accumulate and "
            "communicate meaning. It connects my artist mark and fine-art "
            "practice with branding, graphic design and visual "
            "communication."
        ),
        "metadata": [
            ["Status", "Ongoing"],
            ["Type", "Symbol / mark system"],
            ["Year", "TBC"],
            ["Location", "TBC"],
        ],
        "gallery": [
            "/static/img/art/semiotics/semiotics1.webp",
            "/static/img/art/semiotics/semiotics2.webp",
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
        "portals",
        "semiotics",
        "clothing",
        "ars-lapsu",
        "pine",
        "falmouth-university",
        "piffy",
        "illustration",
        "polycephaly",
        "hca",
        "matrascence",
        "simulacra",
    ]

    for slug in art_order:
        item = ART_PROJECT_DETAILS[slug]
        projects.append(
            {
                "id": item["slug"],
                "title": item["title"],
                "description": item.get("modal_description", item["description"]),
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
