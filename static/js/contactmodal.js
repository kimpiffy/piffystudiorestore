// contactmodal.js
// Opens only when Django messages exist (modal rendered with data-has-messages="true").
// Closes on X, backdrop click, or ESC. Unlocks scroll. Removes from DOM after transition.

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("contactModal");
  if (!modal) return;

  // Only activate when server signalled messages
  if (modal.dataset.hasMessages !== "true") return;

  const closeBtn = document.getElementById("contactModalClose");

  // open after paint
  requestAnimationFrame(() => {
    modal.classList.add("is-active");
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
    document.body.style.overflow = "hidden";
  });

  function closeModal() {
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");

    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
    document.body.style.overflow = "";

    // match your CSS transition duration
    window.setTimeout(() => {
      modal.remove();
    }, 400);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  // backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-active")) {
      closeModal();
    }
  });
});