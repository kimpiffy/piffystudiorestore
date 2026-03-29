import { escapeHtml } from "../utils.js";

export function createOverlay(nodes, { onOpen, onClose }) {
  const { overlay, overlayBackdrop, overlayClose, overlayContent } = nodes;
  const hasOverlay = !!(overlay && overlayBackdrop && overlayClose && overlayContent);

  if (!hasOverlay) return { hasOverlay:false, open:()=>{}, close:()=>{} };

  overlayClose.classList.remove("orange");
  overlayClose.textContent = "x";

  function open(project) {
    onOpen?.();

    const title = escapeHtml(project.title);
    const description = escapeHtml(project.description || "");
    const slug = project.slug || "";

    overlayContent.innerHTML = `
      <h2>${title}</h2>
      ${description ? `<p>${description}</p>` : ""}
      <div class="overlay-cta">
        ${slug ? `<a href="/portfolio/art/${slug}/">View Project</a>` : ""}
      </div>
    `;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    onClose?.();
  }

  overlayBackdrop.addEventListener("click", close);
  overlayClose.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  return { hasOverlay:true, open, close };
}
