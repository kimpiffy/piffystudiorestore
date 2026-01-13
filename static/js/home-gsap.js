gsap.registerPlugin(Observer);

(() => {
  const container = document.querySelector(".tiles");
  const panels = gsap.utils.toArray(".tile");
  if (!container || panels.length < 2) return;

  // Always start from panel 0 on load
  window.scrollTo(0, 0);

  // Stack order (panel 0 visually on top)
  panels.forEach((panel, i) => {
    panel.style.zIndex = String(panels.length - i);
  });

  const bgs = panels.map((p) => p.querySelector(".tile__bg"));

  const N = panels.length;
  const wrapIndex = gsap.utils.wrap(0, N);

  let index = 0;
  let animating = false;

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Read --panel (in vh) from CSS and convert to px.
  // Example: --panel: 90vh -> 0.9 * window.innerHeight
  function getPanelPx() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--panel")
      .trim();
    const vh = parseFloat(raw);
    if (!Number.isFinite(vh)) return window.innerHeight * 0.9;
    return (vh / 100) * window.innerHeight;
  }

  // Shortest signed distance around a ring, so we can wrap seamlessly.
  // Returns a number in roughly [-N/2, N/2].
  function ringDistance(i, current) {
    let d = i - current;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    return d;
  }

  // Initial layout: stack panels vertically by panel height (so next one peeks)
  function layoutPanels() {
    const step = getPanelPx();
    gsap.set(panels, { y: (i) => ringDistance(i, index) * step });
    gsap.set(bgs, { y: 0, scale: 1.05 });
  }

  layoutPanels();

  const DURATION = 0.42;      // swish timing
  const EASE = "power3.out";  // smooth curve
  const PARALLAX_PX = 26;     // subtle parallax

  function dispatchPanelEnter(nextIndex, dir) {
    window.dispatchEvent(
      new CustomEvent("panelEnter", { detail: { index: nextIndex, dir } })
    );
  }

  function goTo(nextIndex) {
    if (animating) return;

    const prevIndex = index;
    const next = wrapIndex(nextIndex); // <-- wraps 0..N-1
    if (next === prevIndex) return;

    // Direction based on shortest route around the ring
    const d = ringDistance(next, prevIndex);
    const dir = d > 0 ? 1 : -1;

    animating = true;
    index = next;

    dispatchPanelEnter(index, dir);

    const step = getPanelPx();

    const tl = gsap.timeline({
      defaults: { duration: DURATION, ease: EASE, overwrite: true },
      onComplete: () => {
        gsap.set(bgs, { y: 0 });
        animating = false;
      },
    });

    // Panels move by panel height (px) so preview is always visible
    tl.to(
      panels,
      {
        y: (i) => ringDistance(i, index) * step,
      },
      0
    );

    // Subtle parallax during swish
    tl.to(
      bgs,
      {
        y: -dir * PARALLAX_PX,
      },
      0
    );

    // Settle back to rest
    tl.to(bgs, { y: 0 }, ">-0.12");
  }

  // Initial event for slide 0 so Blotter can sync
  dispatchPanelEnter(0, 1);

  // One gesture = one slide
  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    allowClicks: true,
    tolerance: isTouchDevice ? 18 : 8,

    // Desktop wheel feels normal; touch feel corrected.
    onDown: () => {
      if (animating) return;
      goTo(isTouchDevice ? index - 1 : index + 1);
    },
    onUp: () => {
      if (animating) return;
      goTo(isTouchDevice ? index + 1 : index - 1);
    },
  });

  // Keep stable on rotation / resize
  window.addEventListener("resize", layoutPanels);
})();
