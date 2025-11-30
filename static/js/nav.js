const toggle = document.getElementById("nav-toggle");
const menu = document.querySelector(".nav-menu");
const isTouch = window.matchMedia("(pointer: coarse)").matches;

// store input mode on body (not strictly required, but kept)
document.body.dataset.input = isTouch ? "touch" : "mouse";

function isMenuOpen() {
    return menu.classList.contains("open-active") || menu.classList.contains("open-hover");
}

function updateIconState() {
    toggle.classList.toggle("active", isMenuOpen());
}

function updateAnimationState() {
    if (isMenuOpen()) {
        menu.classList.add("alive");
    } else {
        menu.classList.remove("alive");
    }
}

/* =========================================
   CLICK — OPEN / CLOSE
========================================= */
toggle.addEventListener("click", () => {
    const isActive = menu.classList.contains("open-active");

    if (isActive) {
        // CLOSE — fade + scale out
        menu.classList.remove("open-active", "open-hover");
        menu.classList.add("closing");

        setTimeout(() => {
            menu.classList.remove("closing");
        }, 450);

    } else {
        // OPEN — fade in + stagger
        menu.classList.add("open-active");
        menu.classList.remove("open-hover");
    }

    updateIconState();
    updateAnimationState();
});

/* =========================================
   CLOSE WHEN CLICKING A MENU ITEM
========================================= */
menu.addEventListener("click", (event) => {
    const target = event.target;

    if (target.matches(".nav-item, .nav-sub")) {
        // Check for the specific data-link and navigate accordingly
        const link = target.getAttribute("data-link");

        // Debugging: Check if we are getting the correct link
        console.log("Navigating to:", link);

        if (link) {
            // Navigate to the URL defined in the data-link attribute
            window.location.href = link;
        }

        // Close the menu after clicking
        menu.classList.remove("open-active", "open-hover");
        menu.classList.add("closing");

        setTimeout(() => {
            menu.classList.remove("closing");
        }, 450);

        updateIconState();
        updateAnimationState();
    }
});

/* =========================================
   HOVER BEHAVIOUR (DESKTOP)
========================================= */
let hoverCloseTimeout;

if (!isTouch) {
    toggle.addEventListener("mouseenter", () => {
        menu.classList.add("open-hover");
        updateIconState();
        updateAnimationState();
    });

    menu.addEventListener("mouseenter", () => {
        menu.classList.add("open-hover");
        updateIconState();
        updateAnimationState();
    });

    // KEEP MENU OPEN WHILE HOVERING ANYWHERE INSIDE
    menu.addEventListener("mousemove", () => {
        if (!menu.classList.contains("open-active")) {
            menu.classList.add("open-hover");
            updateAnimationState();
        }
    });

    // DELAY CLOSE TO PREVENT DEAD ZONE COLLAPSE
    function closeHoverIfOut() {
        clearTimeout(hoverCloseTimeout);

        hoverCloseTimeout = setTimeout(() => {
            const overToggle = toggle.matches(":hover");
            const overMenu = menu.matches(":hover");
            const hardOpen = menu.classList.contains("open-active");

            if (!overToggle && !overMenu && !hardOpen) {
                menu.classList.remove("open-hover");
                updateIconState();
                updateAnimationState();
            }
        }, 120); // buffer for cursor travel
    }

    toggle.addEventListener("mouseleave", closeHoverIfOut);
    menu.addEventListener("mouseleave", closeHoverIfOut);
}

/* =========================================
   SUBMENU — CLICK TO EXPAND (mobile/tablet)
========================================= */
const submenuToggles = document.querySelectorAll(".submenu-toggle");

submenuToggles.forEach((btn) => {
    btn.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();

        const parentLi = btn.closest(".has-sub");
        if (!parentLi) return;

        const submenu = parentLi.querySelector(".submenu");
        if (!submenu) return;

        submenu.classList.toggle("open");
    });
});

/* =========================================
   LINKING NAV ITEMS TO CORRESPONDING PAGES
========================================= */
const links = {
    shop: "/shop/", // This should be updated if you're using a Django URL name like 'shop:shop_index'
    contact: "/contact/",
    about: "/about/",
    art: "/work/art/",
    digital: "/work/digital/",
    installations: "/work/installations/"
};

// Make the navigation buttons use the correct page links
document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", function() {
        const link = this.getAttribute("data-link");
        
        // Debugging: Log the URL we're navigating to
        console.log("Navigating to:", link);

        // If it's a valid nav item, navigate to its URL
        if (link && links[link]) {
            window.location.href = links[link];
        }
    });
});
