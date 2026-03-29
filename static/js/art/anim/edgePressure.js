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

      // Build shared pressure field - all blobs calculate pressure together
      const pressureField = {};
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const allAdjacent = [];

        // Find all adjacent neighbors
        for (let j = 0; j < segments.length; j++) {
          if (i === j) continue;
          const other = segments[j];

          const dx = other.x - seg.x;
          const dy = other.y - seg.y;
          const dist = Math.hypot(dx, dy);
          const minDist = seg.radius + other.radius + 1;

          // Track distance and angle to all neighbors
          if (dist < minDist * 1.2) {
            allAdjacent.push({
              angle: Math.atan2(dy, dx),
              dist,
              minDist,
              id: other.id,
              other
            });
          }
        }

        // Store unified pressure data
        pressureField[seg.id] = {
          neighbors: allAdjacent,
          avgPressure: allAdjacent.length > 0
            ? allAdjacent.reduce((sum, n) => sum + Math.max(0, (n.minDist - n.dist) / n.minDist), 0) / allAdjacent.length
            : 0
        };
      }

      // Update blob edges with synchronized neighbor data
      for (const bv of blobVisuals) {
        const pressure = pressureField[bv.id] || { neighbors: [], avgPressure: 0 };
        const d = computePathFromModel(bv.model, t, {
          neighbors: pressure.neighbors,
          avgPressure: pressure.avgPressure,
          allPressure: pressureField
        });
        bv.pathEl.setAttributeNS(null, "d", d);
        bv.outlineEl.setAttributeNS(null, "d", d);
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  return { start, stop, rebuildFromDOM };
}
