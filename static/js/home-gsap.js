gsap.registerPlugin(Observer);

(() => {
  const container = document.querySelector(".tiles");
  const panels = gsap.utils.toArray(".tile");
  if (!container || panels.length < 2) return;

  window.scrollTo(0, 0);

  const bgs = panels.map((p) => p.querySelector(".tile__bg"));

  const N = panels.length;
  const wrapIndex = gsap.utils.wrap(0, N);

  let index = 0;
  let animating = false;

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function getPanelPx() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--panel")
      .trim();
    const vh = parseFloat(raw);
    if (!Number.isFinite(vh)) return window.innerHeight * 0.9;
    return (vh / 100) * window.innerHeight;
  }

  function ringDistance(i, current) {
    let d = i - current;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    return d;
  }

  const DURATION = 0.42;
  const EASE = "power3.out";
  const PARALLAX_PX = 26;

  // stack feel
  const MAX_BEHIND = 3;
  const BEHIND_SHIFT = 18;
  const BEHIND_SCALE = 0.985;

  // no scaling on peek card (prevents black fringe)
  const NEXT_SCALE = 1;

  const FAR_HIDE_Y = 140;

  function dispatchPanelEnter(nextIndex, dir) {
    window.dispatchEvent(
      new CustomEvent("panelEnter", { detail: { index: nextIndex, dir } })
    );
  }

  // At rest: peek card (d=1) ABOVE active (d=0)
  function setZ(restIndex) {
    panels.forEach((panel, i) => {
      const d = ringDistance(i, restIndex);

      let z;
      if (d === 1) z = 1200;
      else if (d === 0) z = 1100;
      else if (d < 0) z = 1000 + d;
      else z = 100 - d;

      panel.style.zIndex = String(z);
    });
  }

  function targetY(i, activeIndex, step) {
    const d = ringDistance(i, activeIndex);
    if (d === 0) return 0;
    if (d === 1) return step;
    if (d < 0 && d >= -MAX_BEHIND) return d * BEHIND_SHIFT;
    return step + FAR_HIDE_Y;
  }

  function targetScale(i, activeIndex) {
    const d = ringDistance(i, activeIndex);
    if (d === 0) return 1;
    if (d === 1) return NEXT_SCALE;
    if (d < 0 && d >= -MAX_BEHIND) return Math.pow(BEHIND_SCALE, -d);
    return 0.98;
  }

  function targetOpacity(i, activeIndex) {
    const d = ringDistance(i, activeIndex);
    if (d === 0) return 1;
    if (d === 1) return 1;
    if (d < 0 && d >= -MAX_BEHIND) return 1;
    return 0;
  }

  // Set the CSS variable that drives the peek lip shadow
  function setPeekLip(restIndex) {
    panels.forEach((el, i) => {
      const d = ringDistance(i, restIndex);
      el.style.setProperty("--peekLip", d === 1 ? "1" : "0");
    });
  }

  function layoutPanels(instant = true) {
    const step = getPanelPx();
    const fn = instant ? gsap.set : gsap.to;

    setZ(index);
    setPeekLip(index);

    fn(panels, {
      duration: instant ? 0 : DURATION,
      ease: EASE,
      y: (i) => targetY(i, index, step),
      scale: (i) => targetScale(i, index),
      opacity: (i) => targetOpacity(i, index),
      force3D: true,
    });

    gsap.set(bgs, { y: 0, scale: 1.05, force3D: true });
  }

  layoutPanels(true);

  function goTo(nextIndex) {
    if (animating) return;

    const prevIndex = index;
    const next = wrapIndex(nextIndex);
    if (next === prevIndex) return;

    const d = ringDistance(next, prevIndex);
    const dir = d > 0 ? 1 : -1;

    animating = true;
    dispatchPanelEnter(next, dir);

    const step = getPanelPx();

    // base order from current
    setZ(prevIndex);

    // ✅ set lip instantly for destination (no class flip repaint)
    setPeekLip(next);

    // force style flush (keeps first frame consistent on some GPUs)
    container.offsetHeight;

    const tl = gsap.timeline({
      defaults: { duration: DURATION, ease: EASE, overwrite: true },
      onComplete: () => {
        index = next;
        gsap.set(bgs, { y: 0 });
        setZ(index);
        setPeekLip(index);
        animating = false;
      },
    });

    // keep incoming top-most during transition
    tl.set(panels[next], { zIndex: 1300 }, 0);

    tl.to(
      panels,
      {
        y: (i) => targetY(i, next, step),
        scale: (i) => targetScale(i, next),
        opacity: (i) => targetOpacity(i, next),
        force3D: true,
      },
      0
    );

    tl.to(bgs, { y: -dir * PARALLAX_PX, force3D: true }, 0);
    tl.to(bgs, { y: 0, force3D: true }, ">-0.12");
  }

  dispatchPanelEnter(0, 1);

  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    allowClicks: true,
    tolerance: isTouchDevice ? 18 : 8,

    onDown: () => {
      if (animating) return;
      goTo(isTouchDevice ? index - 1 : index + 1);
    },
    onUp: () => {
      if (animating) return;
      goTo(isTouchDevice ? index + 1 : index - 1);
    },
  });

  window.addEventListener("resize", () => layoutPanels(true), { passive: true });
})();
