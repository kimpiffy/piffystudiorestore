(() => {
  const tiles = [...document.querySelectorAll(".tile")];
  if (tiles.length < 2) return;

  // Snap points = real document positions
  function getSnapPoints() {
    return tiles.map((t) => t.offsetTop);
  }

  let snapPoints = getSnapPoints();

  function closestIndex() {
    const y = window.scrollY;
    let best = 0, bestDist = Infinity;
    snapPoints.forEach((p, i) => {
      const d = Math.abs(p - y);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  let locked = false;
  let wheelAccum = 0;
  const THRESHOLD = 18; // sensitivity: lower = easier to trigger

  // Custom smooth scroll (guaranteed finish)
  function animateScrollTo(targetY, duration = 420) {
    const startY = window.scrollY;
    const delta = targetY - startY;
    const startT = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    return new Promise((resolve) => {
      function step(now) {
        const t = Math.min(1, (now - startT) / duration);
        const eased = easeOutCubic(t);
        window.scrollTo(0, startY + delta * eased);

        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  async function goToIndex(i) {
    i = Math.max(0, Math.min(snapPoints.length - 1, i));
    locked = true;
    wheelAccum = 0;

    await animateScrollTo(snapPoints[i], 420);

    // small buffer so we don't immediately re-trigger
    setTimeout(() => { locked = false; }, 60);
  }

  // Wheel paging (one gesture → one step)
  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey) return; // allow pinch zoom
    e.preventDefault();

    if (locked) return;

    wheelAccum += e.deltaY;

    if (Math.abs(wheelAccum) < THRESHOLD) return;

    const dir = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;

    const cur = closestIndex();
    goToIndex(cur + dir);
  }, { passive: false });

  // Keep snap points correct if layout changes
  window.addEventListener("resize", () => {
    snapPoints = getSnapPoints();
  }, { passive: true });

  // Optional: keyboard support (feels nice)
  window.addEventListener("keydown", (e) => {
    if (locked) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      goToIndex(closestIndex() + 1);
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      goToIndex(closestIndex() - 1);
    }
  });
})();
