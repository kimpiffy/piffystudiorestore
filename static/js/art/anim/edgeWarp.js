import { createBlobModel, computePathFromModel } from "../blob/model.js";

export function createEdgeWarp(blobLayer) {
  let raf = null;
  let running = false;
  let blobVisuals = [];
  let particles = null;  // Reference to drift particles for position data

  function rebuildFromDOM() {
    const buttons = Array.from(blobLayer.querySelectorAll('button[data-id]'));
    const visuals = [];

    for (const btn of buttons) {
      const id = btn.getAttribute("data-id");
      const svg = btn.querySelector("svg[data-uid]");
      if (!id || !svg) continue;

      const uid = svg.getAttribute("data-uid");
      const pathEl = svg.querySelector(`#${uid}_path`);
      const outlineEl = svg.querySelector(`#${uid}_outline`);
      if (!uid || !pathEl || !outlineEl) continue;

      const model = createBlobModel(id);
      visuals.push({ id, model, pathEl, outlineEl, btn });
    }

    blobVisuals = visuals;
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    blobVisuals = [];
    particles = null;
  }

  function start(particleArray = null) {
    stop();
    running = true;
    particles = particleArray;

    function frame(now) {
      if (!running) return;

      if (!blobVisuals.length) rebuildFromDOM();
      if (!blobVisuals.length) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const t = now * 0.001;

      // Build neighbor data if we have particle positions
      const neighborData = {};
      if (particles) {
        for (let i = 0; i < blobVisuals.length; i++) {
          const bv = blobVisuals[i];
          const p = particles[i];
          if (!p) continue;

          neighborData[bv.id] = [];

          // Find neighbors and calculate compression angle/force
          for (let j = 0; j < blobVisuals.length; j++) {
            if (i === j) continue;
            const other = particles[j];
            if (!other) continue;

            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.hypot(dx, dy);
            const minDist = p.radius + other.radius;

            // If close, calculate compression
            if (dist < minDist * 1.2) {
              const angle = Math.atan2(dy, dx);
              const overlap = Math.max(0, minDist - dist);
              const compression = Math.min(1, overlap / (minDist * 0.3));

              neighborData[bv.id].push({
                angle,
                compression,
                dist
              });
            }
          }
        }
      }

      // Render blobs with neighbor deformation
      for (const bv of blobVisuals) {
        const neighbors = neighborData[bv.id] || [];
        const d = computePathFromModel(bv.model, t, { neighbors });
        bv.pathEl.setAttributeNS(null, "d", d);
        bv.outlineEl.setAttributeNS(null, "d", d);
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  return { start, stop, rebuildFromDOM };
}
