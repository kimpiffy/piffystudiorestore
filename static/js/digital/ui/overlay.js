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
    const blurb = escapeHtml(project.blurb || project.tagline || "");
    const url = project.url || "";
    const stack = Array.isArray(project.stack) ? project.stack : [];

    overlayContent.innerHTML = `
      <h2 style="font-size: 3rem; margin:0 0 10px 0; font-family: wakaba; text-transform: lowercase; display: flex; justify-content: center;">${title}</h2>
      ${blurb ? `<p style="margin:18px 0 12px 0; opacity:.75; display: flex; justify-content: center; text-align:justify;">${blurb}</p>` : ""}

      ${stack.length ? `
        <div style="display:flex; justify-content: center; gap:8px; flex-wrap:wrap; margin: 5px 0 5px 0;">
          ${stack.map(s => `<span style="padding:6px 10px; border:1px solid #141515; border-radius:999px; font-size: 13px;">${escapeHtml(s)}</span>`).join("")}
        </div>
      ` : ""}

      <div class="cta-row">
        ${url ? `<a class="btn project-cta lilac" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View project</a>` : ""}
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
