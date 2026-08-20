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

    if (project.coming_soon) {
      overlayContent.innerHTML = `
        <div style="min-height: 220px; display: grid; place-items: center; text-align: center; padding: 32px 12px 40px;">
          <h2 style="margin: 0; font-size: clamp(2.5rem, 7vw, 5rem); line-height: 0.95; font-family: picnic, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; text-transform: lowercase;">${title}</h2>
          <div class="cta-row" style="margin-top: 12px; width: 100%; display: flex; justify-content: center;">${learnMoreCta}</div>
        </div>
      `;
    } else {
      overlayContent.innerHTML = `
        <h2 style="font-size: 3rem; margin:0 0 10px 0; font-family: picnic; text-transform: lowercase; display: flex; justify-content: center;">${title}</h2>
        ${blurb ? `<p style="margin:18px 0 12px 0; opacity:.75; display: flex; justify-content: center; text-align:center;">${blurb}</p>` : ""}

        <div class="cta-row">
          ${url ? `<a class="btn project-cta lilac" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View project</a>` : ""}
          ${learnMoreCta}
        </div>
      `;
    }

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
