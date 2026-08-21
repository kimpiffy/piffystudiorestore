import { escapeHtml } from "../utils.js";
import { perSet, isTablet } from "../state.js";
import { makeWarpSVG } from "../blob/svg.js";
import { createBlobModel, computePathFromModel } from "../blob/model.js";
import { hashToSeed, mulberry32 } from "../blob/rng.js";

function coverUrl(p) {
  const candidate = p && (p.cover || p.image || p.src || p.thumbnail || "");
  return String(candidate).trim();
}

function getSet(projects, setIndex) {
  const n = perSet(projects.length);
  if (projects.length <= n) return projects;

  const start = (setIndex * n) % projects.length;
  const end = start + n;
  const slice = projects.slice(start, end);
  if (slice.length < n) return slice.concat(projects.slice(0, n - slice.length));
  return slice;
}

export function renderDesktopBlobs({ blobLayer, projects, setIndex, onProjectClick, blobScale = 1 }) {
  const set = getSet(projects, setIndex);
  const uniform = (isTablet() ? 520 : 560) * blobScale;

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
  const isMidTablet = r0.width >= 768 && r0.width < 992;

  const particles = [];

  buttons.forEach(btn => {
    const id = btn.getAttribute("data-id") || "";
    const rnd = mulberry32(hashToSeed(id));
    const size = btn.getBoundingClientRect().width || uniform;
    const radius = size * (0.42 + rnd() * 0.04);

    let x = rnd() * r0.width;
    let y = rnd() * r0.height;

    if (isMidTablet) {
      const safeInsetX = Math.max(24, radius * 0.9);
      const safeInsetY = Math.max(24, radius * 0.9);
      const minX = safeInsetX;
      const maxX = Math.max(minX + 20, r0.width - safeInsetX);
      const minY = safeInsetY;
      const maxY = Math.max(minY + 20, r0.height - safeInsetY);
      const centerX = r0.width * 0.53;
      const centerY = r0.height * 0.54;

      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 80) {
        attempts += 1;
        x = centerX + (rnd() - 0.5) * (maxX - minX) * 0.9;
        y = centerY + (rnd() - 0.5) * (maxY - minY) * 0.9;

        x = Math.min(Math.max(x, minX), maxX);
        y = Math.min(Math.max(y, minY), maxY);

        const overlaps = particles.some(other => {
          const dx = x - other.x;
          const dy = y - other.y;
          return Math.hypot(dx, dy) < radius + other.radius + 12;
        });

        if (!overlaps) {
          placed = true;
        }
      }

      if (!placed) {
        x = minX + rnd() * Math.max(1, maxX - minX);
        y = minY + rnd() * Math.max(1, maxY - minY);
      }
    }

    particles.push({
      btn, id,
      x,
      y,
      vx: (rnd()-0.5)*0.22,
      vy: (rnd()-0.5)*0.22,
      radius,
      grabbed: false,
      px: rnd()*1000,
      py: rnd()*1000,
      ph: rnd()*Math.PI*2,
      biasX: (rnd()-0.5)*0.08,
      biasY: (rnd()-0.5)*0.08
    });
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
    b.addEventListener("touchcancel", rel, { passive:true });
  });

  particles.forEach(p => {
    p.btn.style.transform = `translate(${p.x - p.btn.offsetWidth/2}px, ${p.y - p.btn.offsetHeight/2}px)`;
  });

  return { particles };
}
