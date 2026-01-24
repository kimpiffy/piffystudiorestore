// static/js/about/overlay.js
export function createOverlay({ overlay, backdrop, closeBtn, content }) {
  function open(html, { reason = "generic" } = {}) {
    if (!overlay || !content) return;
    content.innerHTML = html;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    overlay.dispatchEvent(new CustomEvent("overlay:open", { detail: { reason } }));
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.dispatchEvent(new CustomEvent("overlay:close"));
  }

  backdrop?.addEventListener("click", close);
  closeBtn?.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay?.classList.contains("is-open")) close();
  });

  return { open, close, el: overlay };
}
