gsap.registerPlugin(Observer);

(() => {
  const container = document.querySelector(".tiles");
  const panels = gsap.utils.toArray(".tile");
  if (!container || panels.length < 2) return;

  // Always start at top (prevents weird reload states)
  window.scrollTo(0, 0);

  let index = 0;
  let animating = false;

  // 1) Lay the panels out vertically (create on top, build below, connect below)
  // This is the missing step that fixes “only last slide visible”.
  gsap.set(panels, {
    yPercent: (i) => i * 100
  });

  function dispatchPanelEnter(i) {
    window.dispatchEvent(new CustomEvent("panelEnter", { detail: i }));
  }

  function goTo(i) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    if (i === index || animating) return;

    animating = true;
    const prev = index;
    index = i;

    // 2) Animate all panels to their new positions
    // panel i should sit at 0%, others at +/-100% etc.
    gsap.to(panels, {
      yPercent: (pIndex) => (pIndex - index) * 100,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => {
        animating = false;
      }
    });

    // Tell Blotter a step happened (so it can trigger once per swish)
    dispatchPanelEnter(index);
  }

  // Fire once on load so Blotter can sync if needed
  dispatchPanelEnter(0);

  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    tolerance: 6,
    preventDefault: true,
    allowClicks: true,

    onDown: () => goTo(index + 1),
    onUp: () => goTo(index - 1),
  });

  window.addEventListener("resize", () => {
    // keep current index positioning correct on resize
    gsap.set(panels, { yPercent: (pIndex) => (pIndex - index) * 100 });
  });
})();
