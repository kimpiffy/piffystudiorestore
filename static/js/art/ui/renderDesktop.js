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
  const uniform = isTablet() ? 380 : 440;  // Blob size

  blobLayer.innerHTML = set.map((p) => {
    const cover = coverUrl(p);

    const uid = `b_${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random()*1e9)}`;
    const model = createBlobModel(p.id);
    const initialD = computePathFromModel(model, 0, { neighbors: [] });

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

  // Fixed grid layout - no drifting, just fixed positions
  const segments = buttons.map((btn, idx) => {
    const id = btn.getAttribute("data-id") || "";
    const size = btn.getBoundingClientRect().width || uniform;

    // Grid-based fixed positioning (centered, tight packing)
    const cols = Math.ceil(Math.sqrt(set.length));
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const cellW = r0.width / cols;
    const cellH = r0.height / cols;

    // Center blob in cell (fixed position)
    const x = (col + 0.5) * cellW;
    const y = (row + 0.5) * cellH;

    return {
      btn, id, x, y,
      radius: size / 2,  // Half the blob size = its radius
      col, row
    };
  });

  // Position blobs in grid
  segments.forEach(seg => {
    seg.btn.style.transform =
      `translate(${(seg.x - seg.radius).toFixed(2)}px, ${(seg.y - seg.radius).toFixed(2)}px)`;
  });

  return { segments };
}
