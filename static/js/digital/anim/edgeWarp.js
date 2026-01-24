import { createBlobModel, computePathFromModel } from "../blob/model.js";

export function createEdgeWarp(blobLayer) {
  let raf = null;
  let running = false;
  let blobVisuals = [];

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
      visuals.push({ model, pathEl, outlineEl });
    }

    blobVisuals = visuals;
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    blobVisuals = [];
  }

  function start() {
    stop();
    running = true;

    function frame(now) {
      if (!running) return;

      if (!blobVisuals.length) rebuildFromDOM();
      if (!blobVisuals.length) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const t = now * 0.001;
      for (const bv of blobVisuals) {
        const d = computePathFromModel(bv.model, t);
        bv.pathEl.setAttributeNS(null, "d", d);
        bv.outlineEl.setAttributeNS(null, "d", d);
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  return { start, stop, rebuildFromDOM };
}
