gsap.registerPlugin(Observer);

(() => {
  const container = document.querySelector(".tiles");
  const panels = gsap.utils.toArray(".tile");
  if (!container || panels.length < 2) return;

  // Always start at first panel
  window.scrollTo(0, 0);

  let index = 0;
  let animating = false;

  // Put panels in a vertical stack (panel 0 visible, others below)
  gsap.set(panels, { yPercent: (i) => i * 100 });

  function emitPanel(i) {
    window.dispatchEvent(new CustomEvent("panelEnter", { detail: i }));
  }
  emitPanel(0);

  function goTo(i) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    if (i === index || animating) return;

    animating = true;
    index = i;

    gsap.to(panels, {
      yPercent: (pIndex) => (pIndex - index) * 100,
      duration: 0.42,
      ease: "power2.out",
      overwrite: true,
      onStart: () => emitPanel(index),
      onComplete: () => {
        animating = false;
      },
    });
  }

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  Observer.create({
    target: window,
    type: "wheel,touch,pointer",

    // These two are the big mobile fixes:
    allowClicks: true,
    preventDefault: true,

    // Touch needs higher tolerance to avoid accidental triggers
    tolerance: isTouchDevice ? 18 : 8,

    // Stop momentum from triggering multiple times
    onDown: () => {
      if (!animating) goTo(index + 1);
    },
    onUp: () => {
      if (!animating) goTo(index - 1);
    },

    // Optional: this helps iOS feel less "glitchy"
    wheelSpeed: 1,
  });

  // Keep layout consistent on rotation/resize
  window.addEventListener("resize", () => {
    gsap.set(panels, { yPercent: (pIndex) => (pIndex - index) * 100 });
  });
})();
