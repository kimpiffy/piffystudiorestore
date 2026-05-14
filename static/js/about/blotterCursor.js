// static/js/about/blotterCursor.js
export function initBlotterCursor(holders, {
  color = "#141515",
  font = "picnic",
  baseSize = 120,
  padX = 26,
  padY = 18,
  maxVol = 0.11,
  maxSpeed = 0.25,
  radius = 260,
} = {}) {
  if (!holders?.length) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const clamp = (min, v, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const items = holders.map((holder) => {
    const material = new Blotter.LiquidDistortMaterial();
    material.uniforms.uSpeed.value = 0;
    material.uniforms.uVolatility.value = 0;
    material.uniforms.uSeed.value = Math.random();

    const text = new Blotter.Text(holder.dataset.text || "", {
      family: font,
      size: baseSize,
      fill: color,
      paddingLeft: padX,
      paddingRight: padX,
      paddingTop: padY,
      paddingBottom: padY,
    });

    const blotter = new Blotter(material, { texts: text });
    blotter.forText(text).appendTo(holder);

    return { holder, material };
  });

  let mouseX = -9999, mouseY = -9999;
  let raf = null;

  function tick() {
    // update each item based on cursor proximity
    items.forEach(({ holder, material }) => {
      const r = holder.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const d = Math.hypot(dx, dy);

      // 1 near, 0 far
      const k = clamp(0, 1 - d / radius, 1);

      const targetVol = k * maxVol;
      const targetSpd = k * maxSpeed;

      material.uniforms.uVolatility.value = lerp(material.uniforms.uVolatility.value, targetVol, 0.12);
      material.uniforms.uSpeed.value      = lerp(material.uniforms.uSpeed.value, targetSpd, 0.12);
    });

    raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    mouseX = t.clientX;
    mouseY = t.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  return () => {
    window.removeEventListener("mousemove", onMove);
    if (raf) cancelAnimationFrame(raf);
  };
}
