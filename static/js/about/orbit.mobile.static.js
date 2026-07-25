// static/js/about/orbit.mobile.static.js
import { escapeHtml } from "./utils.js";
import { BIO_TEXT, NAV_ORDER } from "./config.js";

export function createMobileStaticController({ overlay, routes, wordsLayer }) {
  const nodes = [...wordsLayer.querySelectorAll(".about-word")];
  const byKey = new Map(nodes.map((el) => [el.dataset.key, el]));
  const ordered = NAV_ORDER.map((k) => byKey.get(k)).filter(Boolean);

  /* -----------------------------
     Wobble (no transform conflicts)
     - Mobile uses CSS positioning
     - Wobble animates a child span
     ----------------------------- */
  function ensureWobbleSpan(el) {
    if (el.querySelector(".wobble-span")) return;
    const s = document.createElement("span");
    s.className = "wobble-span";
    s.textContent = el.textContent;
    el.textContent = "";
    el.appendChild(s);
  }

  function wobble(el) {
    el.classList.remove("is-wobbling");
    void el.offsetWidth; // restart animation
    el.classList.add("is-wobbling");
  }

  function openBio() {
    const contactHref = routes?.contact || "/contact/";
    const cvHref = routes?.cv || "#";
    const styleHref = routes?.style || "/work/industry/";
    const styleLink =
      styleHref && styleHref !== "#"
        ? `
          <a class="btn project-cta lilac"
             href="${escapeHtml(styleHref)}"
             style="font-family: picnic; font-size: 2rem; text-decoration:none;">
            styles
          </a>`
        : "";
    const cvLink =
      cvHref && cvHref !== "#"
        ? `
          <a class="btn project-cta lilac"
             href="${escapeHtml(cvHref)}"
             target="_blank" rel="noopener noreferrer"
             style="font-family: picnic; font-size: 2rem; text-decoration:none;">
            c.v
          </a>`
        : "";

    overlay.open(
      `
      <h2 class="bio-modal-title" style="font-family: picnic; font-size: 3rem; margin:0 0 6px 0; text-align:center;">i'm kim</h2>
      <p class="bio-modal-copy" style="opacity:.85; margin: 0 auto 14px auto; line-height:1.55; white-space:pre-line;">
        ${escapeHtml(BIO_TEXT)}
      </p>
      <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top: 12px;">
        ${styleLink}
        ${cvLink}
        <a class="btn project-cta lilac"
           href="${escapeHtml(contactHref)}"
           style="font-family: picnic; font-size: 2rem; text-decoration:none;">
          contact
        </a>
      </div>
      `,
      { reason: "bio" }
    );
  }

  function navigateTo(key) {
    const href =
      key === "art"
        ? routes?.art
        : key === "digital"
        ? routes?.digital
        : key === "community"
        ? routes?.community
        : null;

    if (href) window.location.assign(href);
  }

  function mount() {
    // Ensure no leftover orbit transforms if resized down from desktop
    ordered.forEach((el) => {
      ensureWobbleSpan(el);

      // Clean any desktop styles
      el.style.transform = "";
      el.style.filter = "";
      el.style.opacity = "1";

      // Wobble triggers
      el.addEventListener("pointerdown", () => wobble(el), { passive: true });
      el.addEventListener("mouseenter", () => wobble(el));
      el.addEventListener("animationend", (e) => {
        if (e.animationName === "navWobbleTouch") el.classList.remove("is-wobbling");
      });

      // Click behaviour
      el.addEventListener("click", () => {
        const key = el.dataset.key;
        if (key === "bio") openBio();
        else navigateTo(key);
      });
    });
  }

  function destroy() {
    // minimal for now
  }

  return { mount, destroy };
}
