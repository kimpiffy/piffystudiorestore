import { escapeHtml } from "../utils.js";
import { isTablet } from "../state.js";
import { makeWarpSVG } from "../blob/svg.js";
import { createBlobModel, computePathFromModel } from "../blob/model.js";
import { hashToSeed, mulberry32 } from "../blob/rng.js";

function coverUrl(p) {
  return (p && p.cover ? String(p.cover) : "").trim();
}

function getSet(projects, setIndex) {
  // For art mosaic, show all projects on desktop
  return projects;
}

export function renderDesktopBlobs({ blobLayer, projects, setIndex, onProjectClick }) {
  const set = getSet(projects, setIndex);
  const uniform = isTablet() ? 450 : 500;  // Larger blobs to fill screen

  blobLayer.innerHTML = set.map((p) => {
    const cover = coverUrl(p);

    const uid = `b_${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random()*1e9)}`;
    const model = createBlobModel(p.id);
    const initialD = computePathFromModel(model, performance.now() * 0.001);

    return `
      <button class="blob" type="button" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.title)}"
        style="width:${uniform}px;height:${uniform}px;left:0;top:0;"
      >
        ${makeWarpSVG({ uid, cover, title: p.title, initialD })}
      </button>
    `;
  }).join("");

  const buttons = Array.from(blobLayer.querySelectorAll(".blob"));
  buttons.forEach(btn => {
    const id = btn.getAttribute("data-id");
    btn.addEventListener("click", () => onProjectClick(id));
  });

  const r0 = blobLayer.getBoundingClientRect();

  // Initialize particles in a loose grid pattern for mosaic effect
  const particles = buttons.map((btn, idx) => {
    const id = btn.getAttribute("data-id") || "";
    const rnd = mulberry32(hashToSeed(id));
    const size = btn.getBoundingClientRect().width || uniform;

    // Distribute blobs across the container in rows
    const cols = Math.ceil(Math.sqrt(set.length));
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const cellW = r0.width / cols;
    const cellH = r0.height / cols;

    // Place blob in center of cell, with minimal randomness for tight packing
    const gridX = (col + 0.5) * cellW + (rnd() - 0.5) * cellW * 0.05;
    const gridY = (row + 0.5) * cellH + (rnd() - 0.5) * cellH * 0.05;

    return {
      btn, id,
      x: gridX,
      y: gridY,
      vx: (rnd()-0.5)*0.10,
      vy: (rnd()-0.5)*0.10,
      radius: size * (0.42 + rnd()*0.04),
      grabbed: false,
      px: rnd()*1000,
      py: rnd()*1000,
      ph: rnd()*Math.PI*2,
      biasX: (rnd()-0.5)*0.04,   // Reduced bias for more stable mosaic
      biasY: (rnd()-0.5)*0.04
    };
  });

  particles.forEach(p => {
    const b = p.btn;
    const grab = () => { p.grabbed = true; };
    const rel  = () => { p.grabbed = false; };
    b.addEventListener("mouseenter", grab);
    b.addEventListener("mouseleave", rel);
    b.addEventListener("focus", grab);
    b.addEventListener("blur", rel);
    b.addEventListener("touchstart", grab, { passive:true });
    b.addEventListener("touchend", rel, { passive:true });
  });

  return { particles };
}
