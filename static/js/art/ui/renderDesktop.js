import { escapeHtml } from "../utils.js";
import { perSet, isTablet } from "../state.js";
import { makeWarpSVG } from "../blob/svg.js";
import { createBlobModel, computePathFromModel } from "../blob/model.js";
import { hashToSeed, mulberry32 } from "../blob/rng.js";

function coverUrl(p) {
  return (p && p.cover ? String(p.cover) : "").trim();
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

export function renderDesktopBlobs({ blobLayer, projects, setIndex, onProjectClick }) {
  const set = getSet(projects, setIndex);
  const uniform = isTablet() ? 520 : 560;

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

  const particles = buttons.map(btn => {
    const id = btn.getAttribute("data-id") || "";
    const rnd = mulberry32(hashToSeed(id));
    const size = btn.getBoundingClientRect().width || uniform;

    return {
      btn, id,
      x: rnd() * r0.width,
      y: rnd() * r0.height,
      vx: (rnd()-0.5)*0.22,
      vy: (rnd()-0.5)*0.22,
      radius: size * (0.42 + rnd()*0.04),
      grabbed: false,
      px: rnd()*1000,
      py: rnd()*1000,
      ph: rnd()*Math.PI*2,
      biasX: (rnd()-0.5)*0.08,
      biasY: (rnd()-0.5)*0.08
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
    b.addEventListener("touchcancel", rel, { passive:true });
  });

  particles.forEach(p => {
    p.btn.style.transform = `translate(${p.x - p.btn.offsetWidth/2}px, ${p.y - p.btn.offsetHeight/2}px)`;
  });

  return { particles };
}
