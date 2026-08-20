import { escapeHtml } from "../utils.js";

export function createOverlay(nodes, { onOpen, onClose }) {
  const { overlay, overlayBackdrop, overlayClose, overlayContent } = nodes;
  const hasOverlay = !!(overlay && overlayBackdrop && overlayClose && overlayContent);

  if (!hasOverlay) return { hasOverlay: false, open: () => {}, close: () => {} };

  overlayClose.classList.remove("orange");
  overlayClose.textContent = "x";

  function setMosaicSelection(projectId) {
    const mosaic = document.querySelector(".portfolio-mosaic");
    if (!mosaic) return;
    mosaic.classList.add("is-dimmed");
    mosaic.querySelectorAll(".portfolio-cell").forEach((cell) => {
      cell.classList.toggle("is-selected", cell.getAttribute("data-id") === String(projectId));
    });
  }

  function clearMosaicSelection() {
    const mosaic = document.querySelector(".portfolio-mosaic");
    if (!mosaic) return;
    mosaic.classList.remove("is-dimmed");
    mosaic.querySelectorAll(".portfolio-cell.is-selected").forEach((cell) => cell.classList.remove("is-selected"));
  }

  function open(project) {
    onOpen?.();

    const title = escapeHtml(project.title);
    const blurb = escapeHtml(project.description || project.blurb || project.tagline || "");
    const learnMoreLabel = escapeHtml(project.learn_more_label || "Learn More");
    const learnMoreHref = project.learn_more_url ? escapeHtml(project.learn_more_url) : "";
    const learnMoreCta = learnMoreHref
      ? `<div class="cta-row"><a class="btn project-cta lilac" href="${learnMoreHref}">${learnMoreLabel}</a></div>`
      : "";

    overlayContent.innerHTML = `
      <div class="overlay-card">
        <div class="overlay-card__body">
          <h2 class="overlay-title">${title}</h2>
          ${blurb ? `<p class="overlay-desc">${blurb}</p>` : ""}
          ${learnMoreCta}
        </div>
      </div>
    `;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    overlayBackdrop.classList.add("is-visible");
    setMosaicSelection(project.id);

    requestAnimationFrame(() => {
      overlay.classList.add("is-opened");
      const shell = overlayContent.querySelector(".overlay-preview-shell");
      if (shell) shell.classList.add("is-visible");
    });
  }

  function close() {
    overlayBackdrop.classList.remove("is-visible");
    overlay.classList.remove("is-open", "is-opened");
    overlay.setAttribute("aria-hidden", "true");
    clearMosaicSelection();
    overlayContent.innerHTML = "";
    onClose?.();
  }

  overlayBackdrop.addEventListener("click", close);
  overlayClose.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  return { hasOverlay: true, open, close };
}