import { createBlobModel, computePathFromModel } from "../blob/model.js";

export function createEdgePressure(blobLayer) {
  let raf = null;
  let running = false;
  let blobVisuals = [];
  let segments = null;

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
      visuals.push({ id, model, pathEl, outlineEl });
    }

    blobVisuals = visuals;
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    blobVisuals = [];
    segments = null;
  }

  function start(segmentArray = null) {
    stop();
    running = true;
    segments = segmentArray;

    function frame(now) {
      if (!running) return;

      if (!blobVisuals.length) rebuildFromDOM();
      if (!blobVisuals.length || !segments) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const t = now * 0.001;

      // Calculate neighbor compression for each segment
      const neighborData = {};
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        neighborData[seg.id] = [];

        // Find neighbors (adjacent in grid)
        for (let j = 0; j < segments.length; j++) {
          if (i === j) continue;
          const other = segments[j];

          const dx = other.x - seg.x;
          const dy = other.y - seg.y;
          const dist = Math.hypot(dx, dy);
          const minDist = seg.radius + other.radius + 2; // Small gap

          // Only consider neighbors that are close enough
          if (dist < minDist * 1.3) {
            const angle = Math.atan2(dy, dx);
            const overlap = Math.max(0, minDist - dist);
            const compression = Math.min(1, overlap / (minDist * 0.3));

            neighborData[seg.id].push({
              angle,
              compression,
              dist
            });
          }
        }
      }

      // Update blob edges based on neighbor pressure
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
