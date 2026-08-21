import { escapeHtml } from "../utils.js";

export function createOverlay(nodes, { onOpen, onClose, ctaLabel = "", ctaHref = "" } = {}) {
  const { overlay, overlayBackdrop, overlayClose, overlayContent } = nodes;
  const hasOverlay = !!(overlay && overlayBackdrop && overlayClose && overlayContent);

  if (!hasOverlay) return { hasOverlay:false, open:()=>{}, close:()=>{} };

  overlayClose.classList.remove("orange");
  overlayClose.textContent = "x";

  function open(project) {
    onOpen?.();

    const title = escapeHtml(project.overlay_title || project.title);
    const blurb = escapeHtml(project.blurb || project.tagline || "");
    const url = project.url || "";
    const learnMoreLabel = project.learn_more_label || ctaLabel;
    const learnMoreHref = project.learn_more_url || ctaHref;
    const learnMoreCta =
      learnMoreLabel && learnMoreHref
        ? `<a class="btn project-cta lilac" href="${escapeHtml(learnMoreHref)}">${escapeHtml(learnMoreLabel)}</a>`
        : "";

    const actionContent = `
      <div class="cta-row">
        ${url ? `<a class="btn project-cta lilac" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View project</a>` : ""}
        ${learnMoreCta}
      </div>
    `;

    overlayContent.innerHTML = `
      <div class="overlay-card">
        <h2 class="overlay-title">${title}</h2>
        ${blurb ? `<p class="overlay-desc">${blurb}</p>` : ""}
        ${project.coming_soon ? "" : actionContent}
        ${project.coming_soon && learnMoreCta ? `<div class="cta-row">${learnMoreCta}</div>` : ""}
      </div>
    `;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    overlayClose.classList.remove("orange");
    overlayClose.textContent = "x";
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlayClose.classList.remove("orange");
    onClose?.();
  }

  overlayBackdrop.addEventListener("click", close);
  overlayClose.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  return { hasOverlay:true, open, close };
}
