(() => {
  const holders = [...document.querySelectorAll(".tile__word")];
  if (!holders.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const fontReady = document.fonts?.ready || Promise.resolve();
  const clamp = (min, v, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function getConfig() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      // bigger text, but not insane
      size: Math.round(clamp(120, w * 0.26, 300)),
      padX: Math.round(clamp(24, w * 0.06, 90)),
      padY: Math.round(clamp(20, h * 0.05, 80)),
      motionScale: w < 768 ? 0.75 : 1
    };
  }

  fontReady.then(() => {
    let cfg = getConfig();

    const items = holders.map(holder => {
      const material = new Blotter.RollingDistortMaterial();

      // wave character (does nothing when amplitude=0)
      material.uniforms.uSineDistortSpread.value = 0.18;     // wider, smoother
      material.uniforms.uSineDistortCycleCount.value = 1.6;  // fewer waves = less noise

      // TRUE rest: perfectly clean
      material.uniforms.uSineDistortAmplitude.value = 0;
      material.uniforms.uSpeed.value = 0;
      material.uniforms.uRotation.value = 0;

      const text = new Blotter.Text(holder.dataset.text || "", {
        family: "wakaba",
        size: cfg.size,
        fill: "#f2f2f2",
        paddingLeft: cfg.padX,
        paddingRight: cfg.padX,
        paddingTop: cfg.padY,
        paddingBottom: cfg.padY
      });

      const blotter = new Blotter(material, { texts: text });
      blotter.forText(text).appendTo(holder);

      return { material, amp: 0, speed: 0, rot: 0 };
    });

    let lastY = window.scrollY;
    let v = 0;
    let raf = null;

    const MAX_V = 120;

    // Much calmer targets (wave > “distort”)
    const AMP_MAX = 0.28;   // lower = calmer
    const SPD_MAX = 0.35;   // lower = smoother

    const EPS_V = 0.12;
    const EPS_U = 0.001;

    function snapRest() {
      items.forEach(it => {
        it.amp = 0; it.speed = 0; it.rot = 0;
        it.material.uniforms.uSineDistortAmplitude.value = 0;
        it.material.uniforms.uSpeed.value = 0;
        it.material.uniforms.uRotation.value = 0;
      });
    }

    function tick() {
      const dir = Math.sign(v) || 1;
      const absV = clamp(0, Math.abs(v), MAX_V);
      const strength = absV / MAX_V;

      // targets
      const targetAmp = strength * AMP_MAX * cfg.motionScale;
      const targetSpeed = dir * strength * SPD_MAX * cfg.motionScale;
      const targetRot = dir < 0 ? 180 : 0;

      items.forEach(it => {
        // smooth ease (slow = liquid)
        it.amp = lerp(it.amp, targetAmp, 0.10);
        it.speed = lerp(it.speed, targetSpeed, 0.10);
        it.rot = lerp(it.rot, targetRot, 0.08);

        it.material.uniforms.uSineDistortAmplitude.value = it.amp;
        it.material.uniforms.uSpeed.value = it.speed;
        it.material.uniforms.uRotation.value = it.rot;
      });

      // decay → guarantees return to clean
      v *= 0.86;

      const maxAmp = Math.max(...items.map(x => Math.abs(x.amp)));
      const maxSpd = Math.max(...items.map(x => Math.abs(x.speed)));

      if (Math.abs(v) < EPS_V && maxAmp < EPS_U && maxSpd < EPS_U) {
        snapRest();
        raf = null;
        return;
      }

      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      v += (y - lastY);
      lastY = y;

      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    window.addEventListener("resize", () => {
      // safest rebuild while you iterate
      location.reload();
    }, { passive: true });
  });
})();
