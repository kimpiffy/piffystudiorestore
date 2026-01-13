gsap.registerPlugin(Observer);

(() => {
  const container = document.querySelector(".tiles");
  const panels = gsap.utils.toArray(".tile");
  if (!container || panels.length < 2) return;

  // Always start from panel 0 on load (prevents cached scroll weirdness)
  window.scrollTo(0, 0);

  // Stack order (top-most should be panel 0 initially)
  panels.forEach((panel, i) => {
    panel.style.zIndex = String(panels.length - i);
  });

  const bgs = panels.map((p) => p.querySelector(".tile__bg"));

  let index = 0;
  let animating = false;

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Lay panels in a vertical stack:
  // panel 0 at 0, panel 1 below, panel 2 below...
  gsap.set(panels, { yPercent: (i) => i * 100 });

  // Make images ready for parallax (CSS already has will-change, but we set baseline scale)
  gsap.set(bgs, { y: 0, scale: 1.05 });

  const DURATION = 0.42;             // swish timing
  const EASE = "power3.out";         // smoother than power2
  const PARALLAX_PX = 26;            // subtle: 18–34 feels good

  function dispatchPanelEnter(nextIndex, dir) {
    window.dispatchEvent(
      new CustomEvent("panelEnter", { detail: { index: nextIndex, dir } })
    );
  }

  function goTo(nextIndex) {
    nextIndex = Math.max(0, Math.min(panels.length - 1, nextIndex));
    if (nextIndex === index || animating) return;

    animating = true;
    const prevIndex = index;
    const dir = nextIndex > prevIndex ? 1 : -1;
    index = nextIndex;

    // Tell Blotter (and anything else) exactly which slide is active and direction
    dispatchPanelEnter(index, dir);

    // Swish + parallax timeline
    const tl = gsap.timeline({
      defaults: { duration: DURATION, ease: EASE, overwrite: true },
      onComplete: () => {
        // Return backgrounds to neutral so resting state is crisp
        gsap.set(bgs, { y: 0 });
        animating = false;
      },
    });

    // Panels move (this creates the swish / stacking)
    tl.to(panels, {
      yPercent: (pIndex) => (pIndex - index) * 100,
    }, 0);

    // Parallax: images counter-move slightly during the swish
    // Directional: going down makes image drift up a touch, and vice versa
    tl.to(bgs, {
      y: -dir * PARALLAX_PX,
    }, 0);

    // Ease image back to neutral at the end (feels expensive)
    tl.to(bgs, { y: 0 }, ">-0.12");
  }

  // Initial event for slide 0 so Blotter can be in sync
  dispatchPanelEnter(0, 1);

  // One gesture = one slide
  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    allowClicks: true,

    tolerance: isTouchDevice ? 18 : 8,

    // ✅ Desktop wheel feels normal
    // ✅ Touch direction corrected (iOS feels "reversed" otherwise)
    onDown: () => {
      if (animating) return;
      goTo(isTouchDevice ? index - 1 : index + 1);
    },
    onUp: () => {
      if (animating) return;
      goTo(isTouchDevice ? index + 1 : index - 1);
    },
  });

  // Keep things stable on rotation / resize
  window.addEventListener("resize", () => {
    gsap.set(panels, { yPercent: (pIndex) => (pIndex - index) * 100 });
    gsap.set(bgs, { y: 0, scale: 1.05 });
  });
})();
