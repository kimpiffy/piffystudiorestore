(() => {
  const holders = Array.from(document.querySelectorAll(".tile__word"));
  if (!holders.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const fontReady = document.fonts?.ready || Promise.resolve();

  // Responsive sizing for Blotter text (canvas text, so we must rebuild when size changes)
  function clamp(min, v, max) {
    return Math.max(min, Math.min(max, v));
  }

  function getConfig() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Text size tuned for single-word, centered, full-screen panels
    // (bigger on desktop, still bold on mobile)
    const size = Math.round(clamp(56, w * 0.16, 170));

    // Padding keeps the canvas from clipping edges
    const padX = Math.round(clamp(18, w * 0.05, 70));
    const padY = Math.round(clamp(14, h * 0.04, 60));

    // Keep motion calmer on small screens (still active, just less janky)
    const mobileFactor = w < 480 ? 0.75 : w < 768 ? 0.85 : 1;

    return {
      size,
      padX,
      padY,
      mobileFactor,
    };
  }

  // Small debounce helper
  function debounce(fn, wait = 180) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  fontReady.then(() => {
    // Per tile state: we keep the same material so motion feels continuous,
    // but we rebuild the text/canvas when size or case changes.
    const items = holders.map((holder) => ({
      holder,
      base: (holder.dataset.text || "").toLowerCase(),
      isUpper: false,
      material: null,
      lastSize: null,
      lastPadX: null,
      lastPadY: null,
      // for scroll end handling:
      scrollTimer: null,
    }));

    function ensureMaterial(item, mobileFactor) {
      if (item.material) return;

      const m = new Blotter.LiquidDistortMaterial();

      // IDLE motion baseline (always moving)
      m.uniforms.uSpeed.value = 0.22 * mobileFactor;
      m.uniforms.uVolatility.value = 0.10 * mobileFactor;
      m.uniforms.uSeed.value = Math.random();

      item.material = m;
    }

    function render(item, { useUpper, size, padX, padY, mobileFactor }) {
      // Avoid rebuild if nothing relevant changed
      if (
        item.isUpper === useUpper &&
        item.lastSize === size &&
        item.lastPadX === padX &&
        item.lastPadY === padY
      ) {
        return;
      }

      item.holder.innerHTML = "";

      ensureMaterial(item, mobileFactor);

      const value = useUpper ? item.base.toUpperCase() : item.base;

      const text = new Blotter.Text(value, {
        family: "wakaba",
        size,
        fill: "#f2f2f2",
        paddingLeft: padX,
        paddingRight: padX,
        paddingTop: padY,
        paddingBottom: padY,
      });

      const blotter = new Blotter(item.material, { texts: text });
      blotter.forText(text).appendTo(item.holder);

      item.isUpper = useUpper;
      item.lastSize = size;
      item.lastPadX = padX;
      item.lastPadY = padY;
    }

    // Apply config + render all
    let cfg = getConfig();
    items.forEach((item) => render(item, { useUpper: false, ...cfg }));

    // Distortion tuning
    const MAX_V = 90;

    // Base (idle) motion
    let BASE_SPEED = 0.22;
    let BASE_VOL = 0.10;

    // Scroll boosts (added on top of idle)
    let SCROLL_SPEED_BOOST = 1.1;
    let SCROLL_VOL_BOOST = 0.35;

    function applyMobileTuning() {
      cfg = getConfig();

      // scale motion with mobileFactor so it stays smooth on small devices
      const f = cfg.mobileFactor;

      BASE_SPEED = 0.22 * f;
      BASE_VOL = 0.10 * f;

      SCROLL_SPEED_BOOST = 1.1 * f;
      SCROLL_VOL_BOOST = 0.35 * f;

      // Update baseline immediately (keeps idle alive after resize)
      items.forEach((item) => {
        if (!item.material) return;
        item.material.uniforms.uSpeed.value = BASE_SPEED;
        item.material.uniforms.uVolatility.value = BASE_VOL;
      });
    }

    applyMobileTuning();

    // Scroll behaviour: uppercase while scrolling + stronger distortion
    let lastY = window.scrollY;
    let velocity = 0;
    let rafId = null;

    const SCROLL_END_DELAY_MS = 220;

    function setUppercaseAll(on) {
      items.forEach((item) => render(item, { useUpper: on, ...cfg }));
    }

    function onScroll() {
      const y = window.scrollY;
      velocity += y - lastY;
      lastY = y;

      // Any scroll activity -> uppercase
      setUppercaseAll(true);

      // Revert to lowercase after scroll stops
      items.forEach((item) => {
        if (item.scrollTimer) clearTimeout(item.scrollTimer);
        item.scrollTimer = setTimeout(() => {
          setUppercaseAll(false);
        }, SCROLL_END_DELAY_MS);
      });

      if (!rafId) rafId = requestAnimationFrame(updateDistortion);
    }

    function updateDistortion() {
      rafId = null;

      const absV = Math.min(MAX_V, Math.abs(velocity));
      const strength = absV / MAX_V;

      items.forEach((item) => {
        const m = item.material;
        if (!m) return;

        m.uniforms.uSpeed.value = BASE_SPEED + strength * SCROLL_SPEED_BOOST;
        m.uniforms.uVolatility.value = BASE_VOL + strength * SCROLL_VOL_BOOST;
      });

      // Ease down
      velocity *= 0.86;

      if (Math.abs(velocity) > 0.25) {
        rafId = requestAnimationFrame(updateDistortion);
      } else {
        // Snap back to idle motion baseline
        items.forEach((item) => {
          const m = item.material;
          if (!m) return;
          m.uniforms.uSpeed.value = BASE_SPEED;
          m.uniforms.uVolatility.value = BASE_VOL;
        });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // Rebuild on resize / orientation change (debounced)
    const onResize = debounce(() => {
      const oldCfg = cfg;
      cfg = getConfig();

      // Re-render with new size/padding (preserve current case)
      items.forEach((item) => render(item, { useUpper: item.isUpper, ...cfg }));

      // Retune motion for new screen size
      applyMobileTuning();

      // If we were mid-scroll animation, keep it alive
      if (Math.abs(velocity) > 0.25 && !rafId) {
        rafId = requestAnimationFrame(updateDistortion);
      }
    }, 180);

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
  });
})();
