// contactmodal.js
// Handles the "message sent" modal: fade in/out, blackout overlay, scroll lock.

(function () {
  function initContactModal() {
    const modal = document.getElementById("contactModal");
    if (!modal) return;

    // Fade in after paint
    requestAnimationFrame(() => {
      modal.classList.add("is-active");
      document.body.style.overflow = "hidden";
    });

    const closeBtn = document.getElementById("closeContactModal");

    function closeModal() {
      modal.classList.remove("is-active");
      document.body.style.overflow = "";

      // Wait for CSS transition to finish before removing
      window.setTimeout(() => {
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      }, 350);
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // Click outside the modal closes it
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // ESC closes it
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactModal);
  } else {
    initContactModal();
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("contactModal");
  if (!modal) return;

  // Only activate if server set data-has-messages="true"
  if (modal.dataset.hasMessages === "true") {
    requestAnimationFrame(() => {
      modal.classList.add("is-active");
      document.documentElement.classList.add("no-scroll");
      document.body.classList.add("no-scroll");
    });
  }

  const closeBtn = document.getElementById("contactModalClose");

  function closeModal() {
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");

    // optional: remove from DOM after transition
    window.setTimeout(() => {
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    }, 360);
  }

  if (closeBtn) closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-active")) closeModal();
  });
});