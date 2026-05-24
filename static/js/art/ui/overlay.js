import { escapeHtml } from "../utils.js";
import { buildPreviewMarkup } from "../mosaicLayout.js";

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

  function open(project, spec) {
    onOpen?.();

    const title = escapeHtml(project.title);
    const blurb = escapeHtml(project.description || project.blurb || project.tagline || "");

    overlayContent.innerHTML = `
      <div class="overlay-grid">
        <div class="overlay-left">
          <div class="overlay-preview-shell">
            ${buildPreviewMarkup(project, spec)}
          </div>
        </div>
        <div class="overlay-right">
          <div class="overlay-info">
            <h2 class="overlay-title">${title}</h2>
            ${blurb ? `<p class="overlay-desc">${blurb}</p>` : ""}
          </div>
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