import { isMobile } from "../state.js";

export function createDesktopDrift() {
  let raf = null;
  let running = false;
  let particles = [];
  let lastMove = performance.now();

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    particles = [];
  }

  function start(containerEl, seededParticles) {
    if (isMobile()) return; // desktop drift only
    stop();

    particles = seededParticles || [];
    if (!containerEl || particles.length === 0) return;

    running = true;
    lastMove = performance.now();

    const rect = () => containerEl.getBoundingClientRect();

    const cfg = {
      offLeft: -140,
      offRight: -140,
      offTop: -180,
      offBottom: -30,
      padding: 10,
      edgePush: 0.020,
      flowStrength: 0.15,
      swirlStrength: 0.05,
      noiseStrength: 0.12,
      maxSpeed: 0.30,
      damping: 0.992,
      repel: 0.55,           // Much stronger repulsion - squeeze them together
      centerPull: 0.0008,    // Stronger centering for tighter pack
      avoidTLStrength: 0.028,
      avoidTLRadiusFrac: 0.40
    };

    function safeNumber(v, fallback) {
      return Number.isFinite(v) ? v : fallback;
    }

    function frame(now) {
      if (!running) return;

      let dt = (now - lastMove) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = Math.max(0.008, Math.min(0.033, dt));
      lastMove = now;

      const cr = rect();
      const W = cr.width, H = cr.height;
      const cx = W * 0.50;
      const cy = H * 0.50;

      // repulsion - ensures blobs don't overlap
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const min = a.radius + b.radius;
          if (dist < min) {
            const overlap = (min - dist) / min;
            const nx = dx / dist, ny = dy / dist;
            const push = overlap * cfg.repel * 80;
            if (!a.grabbed) { a.vx -= nx * push; a.vy -= ny * push; }
            if (!b.grabbed) { b.vx += nx * push; b.vy += ny * push; }
          }
        }
      }

      const tlx = W * 0.18;
      const tly = H * 0.18;
      const tlR = Math.min(W, H) * cfg.avoidTLRadiusFrac;

      for (const p of particles) {
        const t = now * 0.00055;

        const fx =
          Math.sin(t * 1.7 + p.px * 0.01) +
          Math.sin(t * 2.6 + (p.y + p.py) * 0.006) +
          Math.cos(t * 1.1 + (p.x + p.px) * 0.004);

        const fy =
          Math.cos(t * 1.5 + p.py * 0.01) -
          Math.cos(t * 2.3 + (p.x + p.px) * 0.006) +
          Math.sin(t * 1.2 + (p.y + p.py) * 0.004);

        const dxC = p.x - cx;
        const dyC = p.y - cy;
        const swirlX = -dyC * 0.00065;
        const swirlY =  dxC * 0.00065;

        const wigX = Math.sin(t * 5.2 + p.ph) * cfg.noiseStrength;
        const wigY = Math.cos(t * 4.9 + p.ph) * cfg.noiseStrength;

        if (p.grabbed) {
          p.vx *= 0.75;
          p.vy *= 0.75;
        } else {
          p.vx += (fx * cfg.flowStrength + swirlX * cfg.swirlStrength + wigX + p.biasX) * dt * 60;
          p.vy += (fy * cfg.flowStrength + swirlY * cfg.swirlStrength + wigY + p.biasY) * dt * 60;
        }

        // center pull + avoid top-left
        p.vx += (cx - p.x) * cfg.centerPull;
        p.vy += (cy - p.y) * cfg.centerPull;

        const dxTL = p.x - tlx;
        const dyTL = p.y - tly;
        const dTL = Math.hypot(dxTL, dyTL) || 0.0001;
        if (dTL < tlR) {
          const push = (1 - dTL / tlR) * cfg.avoidTLStrength * 60;
          p.vx += (dxTL / dTL) * push;
          p.vy += (dyTL / dTL) * push;
        }

        p.vx *= cfg.damping;
        p.vy *= cfg.damping;

        const minX = cfg.offLeft + cfg.padding;
        const maxX = W - cfg.offRight - cfg.padding;
        const minY = cfg.offTop + cfg.padding;
        const maxY = H - cfg.offBottom - cfg.padding;

        if (p.x < minX) p.vx += (minX - p.x) * cfg.edgePush;
        if (p.x > maxX) p.vx -= (p.x - maxX) * cfg.edgePush;
        if (p.y < minY) p.vy += (minY - p.y) * cfg.edgePush;
        if (p.y > maxY) p.vy -= (p.y - maxY) * cfg.edgePush;

        const sp = Math.hypot(p.vx, p.vy) || 0.0001;
        if (sp > cfg.maxSpeed) {
          p.vx = (p.vx / sp) * cfg.maxSpeed;
          p.vy = (p.vy / sp) * cfg.maxSpeed;
        }

        p.vx = safeNumber(p.vx, 0.2);
        p.vy = safeNumber(p.vy, 0.2);
        p.x  = safeNumber(p.x + p.vx, Math.random()*W);
        p.y  = safeNumber(p.y + p.vy, Math.random()*H);

        p.btn.style.transform =
          `translate(${(p.x - p.btn.offsetWidth/2).toFixed(2)}px, ${(p.y - p.btn.offsetHeight/2).toFixed(2)}px)`;
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  return { start, stop };
}
