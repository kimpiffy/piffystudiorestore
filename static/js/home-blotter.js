(() => {
  const holders = [...document.querySelectorAll(".tile__word")];
  if (!holders.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const fontReady = document.fonts?.ready || Promise.resolve();
  const clamp = (min, v, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function getConfig() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      size: Math.round(clamp(220, w * 0.45, 560)),
      padX: Math.round(clamp(26, w * 0.07, 130)),
      padY: Math.round(clamp(22, h * 0.06, 120)),
      motionScale: w < 768 ? 0.75 : 1,
    };
  }

  fontReady.then(() => {
    let cfg = getConfig();

    const items = holders.map((holder) => {
      const material = new Blotter.LiquidDistortMaterial();

      material.uniforms.uSpeed.value = 0;
      material.uniforms.uVolatility.value = 0;
      material.uniforms.uSeed.value = Math.random();

      const text = new Blotter.Text(holder.dataset.text || "", {
        family: "wakaba",
        size: cfg.size,
        fill: "#faf9dfff",
        paddingLeft: cfg.padX,
        paddingRight: cfg.padX,
        paddingTop: cfg.padY,
        paddingBottom: cfg.padY,
      });

      const blotter = new Blotter(material, { texts: text });
      blotter.forText(text).appendTo(holder);

      return { material };
    });

    // -----------------------------
    // Phrase Animator (fixed intensity)
    // -----------------------------
    let energy = 0;
    const ENERGY_KICK = 0.85;
    const ENERGY_DECAY = 0.3;

    let raf = null;

    const DURATION = 700;
    let phaseStart = 0;

    const PEAK_VOL = 0.08;
    const PEAK_SPD = 0.1;

    const COOLDOWN_MS = 320;
    let lastTriggerAt = 0;

    // direction supplied by GSAP swish
    let currentDir = 1;

    function setRest() {
      items.forEach(({ material }) => {
        material.uniforms.uSpeed.value = 0;
        material.uniforms.uVolatility.value = 0;
      });
    }

    function tick(now) {
      if (!phaseStart) phaseStart = now;

      let t = (now - phaseStart) / DURATION;
      if (t > 1) t = 1;

      const bump =
        t < 0.5 ? easeInOutCubic(t * 2) : easeInOutCubic((1 - t) * 2);

      const e = clamp(0, energy, 1) * cfg.motionScale;

      const dir = currentDir;

      const speed = bump * PEAK_SPD * e * dir;
      const vol = bump * PEAK_VOL * e;

      items.forEach(({ material }) => {
        material.uniforms.uSpeed.value = lerp(material.uniforms.uSpeed.value, speed, 0.18);
        material.uniforms.uVolatility.value = lerp(material.uniforms.uVolatility.value, vol, 0.18);
      });

      if (t >= 1) {
        energy *= ENERGY_DECAY;

        if (energy < 0.02) {
          setRest();
          raf = null;
          phaseStart = 0;
          return;
        }

        phaseStart = now;
      }

      raf = requestAnimationFrame(tick);
    }

    function triggerPhrase() {
      const now = performance.now();
      if (now - lastTriggerAt < COOLDOWN_MS) return;
      lastTriggerAt = now;

      energy = Math.max(energy, ENERGY_KICK);

      if (!raf) {
        phaseStart = 0;
        raf = requestAnimationFrame(tick);
      }
    }

    // ✅ Trigger ONLY from slide changes
    window.addEventListener("panelEnter", (e) => {
      const detail = e.detail || {};
      if (typeof detail.dir === "number") currentDir = detail.dir || 1;
      triggerPhrase();
    });

    window.addEventListener("resize", () => location.reload(), { passive: true });
  });
})();
