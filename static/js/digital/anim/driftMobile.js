import { isMobile } from "../state.js";

export function createMobileDrift() {
  let raf = null;
  let running = false;
  let last = performance.now();

  // a single “particle”
  let innerEl = null;
  let x = 0, y = 0;
  let vx = 0, vy = 0;

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    innerEl = null;
  }

  function start(blobLayer, targetInnerEl) {
    if (!isMobile()) return; // mobile drift only
    stop();

    if (!blobLayer || !targetInnerEl) return;

    innerEl = targetInnerEl;
    running = true;
    last = performance.now();

    // Reset drift state each render
    x = 0; y = 0;
    vx = (Math.random() - 0.5) * 0.35;
    vy = (Math.random() - 0.5) * 0.35;

    // Bounds are relative to the center, in px
    // (keeps it subtle and avoids smashing into UI)
    function bounds() {
      const r = blobLayer.getBoundingClientRect();
      const margin = Math.max(16, Math.min(40, r.width * 0.08));
      const maxX = (r.width  * 0.5) - margin;
      const maxY = (r.height * 0.5) - margin;
      // keep it gentle: use a fraction of those
      return { maxX: maxX * 0.18, maxY: maxY * 0.18 };
    }

    const cfg = {
      accelNoise: 0.10,   // random “breeze”
      noiseSpeed: 0.0012, // slow noise phase
      damping: 0.985,
      maxSpeed: 0.55,
      edgePush: 0.022
    };

    function frame(now) {
      if (!running || !innerEl) return;

      let dt = (now - last) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = Math.max(0.008, Math.min(0.033, dt));
      last = now;

      const t = now * cfg.noiseSpeed;

      // soft pseudo-noise forces (deterministic enough visually)
      const ax = (Math.sin(t * 1.7) + Math.sin(t * 2.3 + 1.2) + Math.cos(t * 1.1 + 0.7)) * cfg.accelNoise;
      const ay = (Math.cos(t * 1.5) - Math.cos(t * 2.1 + 0.4) + Math.sin(t * 1.2 + 2.1)) * cfg.accelNoise;

      vx += ax * dt * 60;
      vy += ay * dt * 60;

      // damping
      vx *= cfg.damping;
      vy *= cfg.damping;

      // clamp speed
      const sp = Math.hypot(vx, vy) || 0.0001;
      if (sp > cfg.maxSpeed) {
        vx = (vx / sp) * cfg.maxSpeed;
        vy = (vy / sp) * cfg.maxSpeed;
      }

      x += vx;
      y += vy;

      const b = bounds();

      // push back from edges
      if (x < -b.maxX) vx += (-b.maxX - x) * cfg.edgePush;
      if (x >  b.maxX) vx -= (x - b.maxX) * cfg.edgePush;
      if (y < -b.maxY) vy += (-b.maxY - y) * cfg.edgePush;
      if (y >  b.maxY) vy -= (y - b.maxY) * cfg.edgePush;

      // apply drift
      innerEl.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  return { start, stop };
}
