import { createBlobModel, computePathFromModel } from "./digital/blob/model.js";

function fitPathElToBox(pathEl, boxSize = 300, pad = 4) {
  if (!pathEl) return null;

  pathEl.setAttribute("transform", "");

  let bb;
  try {
    bb = pathEl.getBBox();
  } catch {
    return null;
  }

  const avail = boxSize - pad * 2;
  const sx = avail / (bb.width || 1);
  const sy = avail / (bb.height || 1);
  const s = Math.min(sx, sy);

  const cx = bb.x + bb.width / 2;
  const cy = bb.y + bb.height / 2;
  const tx = boxSize / 2;
  const ty = boxSize / 2;

  pathEl.setAttribute(
    "transform",
    `translate(${tx} ${ty}) scale(${s}) translate(${-cx} ${-cy})`
  );

  return bb;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function samplePathScreenPoints(pathEl, sampleCount) {
  const pts = [];
  let len = 0;

  try {
    len = pathEl.getTotalLength();
  } catch {
    return pts;
  }
  if (!Number.isFinite(len) || len <= 0) return pts;

  const ctm = pathEl.getScreenCTM();
  if (!ctm) return pts;

  for (let i = 0; i < sampleCount; i++) {
    const at = (i / sampleCount) * len;
    const p = pathEl.getPointAtLength(at);

    const x = p.x * ctm.a + p.y * ctm.c + ctm.e;
    const y = p.x * ctm.b + p.y * ctm.d + ctm.f;
    pts.push({ x, y });
  }
  return pts;
}

function minDistBetweenPointSets(A, B) {
  let min2 = Infinity;
  let ax = 0, ay = 0, bx = 0, by = 0;

  for (let i = 0; i < A.length; i++) {
    const p = A[i];
    for (let j = 0; j < B.length; j++) {
      const q = B[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < min2) {
        min2 = d2;
        ax = p.x; ay = p.y;
        bx = q.x; by = q.y;
      }
    }
  }
  return { d: Math.sqrt(min2), ax, ay, bx, by };
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const orbit = document.getElementById("orbit");
  if (!orbit) return;

  // === Feel knobs ===
  const GAP_PX = 38;             // desired edge gap
  const SAMPLES = 120;           // more samples = smoother min distance
  const SOLVER_ITERS = 3;        // keep low to avoid jitter (we smooth output)

  // How strongly they "yield" when too close
  const YIELD = 0.085;

  // Scale limits (keep subtle)
  const G_MIN = 0.90;
  const G_MAX = 1.00;
  const AX_MIN = 0.86;
  const AX_MAX = 1.03;

  // Smoothing (important for unified fluid)
  const SMOOTH = 0.08;

  // Shared morph driver (unifies motion)
  const sharedModel = createBlobModel("home-shared");
  const TIME_OFFSETS = [0.0, 0.0, 0.0]; // related, not identical

  const links = Array.from(orbit.querySelectorAll(".blob-link"));
  const svgs = Array.from(orbit.querySelectorAll(".blob-svg"));

  const blobs = svgs.map((svg, idx) => {
    const label = svg.getAttribute("data-label") || `b${idx}`;
    const imgUrl = svg.getAttribute("data-img");
    const shapeEl = svg.querySelector(".blob-shape");
    const imgEl = svg.querySelector(".blob-img");
    const linkEl = links[idx] || svg.closest(".blob-link");

    if (imgEl && imgUrl) {
      imgEl.setAttribute("href", imgUrl);
      imgEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", imgUrl);
      imgEl.setAttribute("x", "0");
      imgEl.setAttribute("y", "0");
      imgEl.setAttribute("width", "300");
      imgEl.setAttribute("height", "300");
      imgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    }

    return {
      label,
      shapeEl,
      linkEl,
      tOff: TIME_OFFSETS[idx % TIME_OFFSETS.length],

      // sampled points each frame
      pts: [],

      // center each frame
      cx: 0,
      cy: 0,

      // current & target deformation
      g: 1, tg: 1,
      sx: 1, tsx: 1,
      sy: 1, tsy: 1,
    };
  });

  function updateCenters() {
    for (const b of blobs) {
      const r = b.linkEl?.getBoundingClientRect();
      if (!r) continue;
      b.cx = r.left + r.width / 2;
      b.cy = r.top + r.height / 2;
    }
  }

  function resetTargets() {
    for (const b of blobs) {
      b.tg = 1;
      b.tsx = 1;
      b.tsy = 1;
    }
  }

  function applyPairYield(A, B, overlap, dirX, dirY) {
    // overlap in px. dir is unit vector pointing from B -> A (screen space).
    // We "squish" both along the approach axis, and slightly expand perpendicular.
    const k = clamp(overlap / GAP_PX, 0, 1);

    // axis weights in screen frame (stable + good enough visually)
    const wx = Math.abs(dirX);
    const wy = Math.abs(dirY);

    const s = YIELD * k;

    // squish toward each other
    const shrinkX = 1 - s * wx;
    const shrinkY = 1 - s * wy;

    // tiny compensate perpendicular (keeps "liquid volume" feeling)
    const expandX = 1 + (s * 0.45) * wy;
    const expandY = 1 + (s * 0.45) * wx;

    A.tsx = clamp(A.tsx * shrinkX * expandX, AX_MIN, AX_MAX);
    A.tsy = clamp(A.tsy * shrinkY * expandY, AX_MIN, AX_MAX);
    B.tsx = clamp(B.tsx * shrinkX * expandX, AX_MIN, AX_MAX);
    B.tsy = clamp(B.tsy * shrinkY * expandY, AX_MIN, AX_MAX);

    // gentle global shrink fallback
    const gDrop = (YIELD * 0.55) * k;
    A.tg = clamp(A.tg * (1 - gDrop), G_MIN, G_MAX);
    B.tg = clamp(B.tg * (1 - gDrop), G_MIN, G_MAX);
  }

  let raf = 0;
  const t0 = performance.now();

  function frame(now) {
    const t = (now - t0) / 1000;

    // 1) Morph: use shared model so motion is unified
    for (const b of blobs) {
      if (!b.shapeEl) continue;
      b.shapeEl.setAttribute("d", computePathFromModel(sharedModel, t + b.tOff));
      fitPathElToBox(b.shapeEl, 300, 4);
    }

    // 2) sample edges AFTER morph (positions come from CSS orbit)
    updateCenters();
    for (const b of blobs) {
      if (!b.shapeEl) continue;
      b.pts = samplePathScreenPoints(b.shapeEl, SAMPLES);
    }

    // 3) solve yields
    resetTargets();

    for (let iter = 0; iter < SOLVER_ITERS; iter++) {
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const A = blobs[i];
          const B = blobs[j];
          if (!A.pts.length || !B.pts.length) continue;

          const { d, ax, ay, bx, by } = minDistBetweenPointSets(A.pts, B.pts);
          const overlap = GAP_PX - d;
          if (overlap <= 0) continue;

          let dx = ax - bx;
          let dy = ay - by;
          const mag = Math.hypot(dx, dy) || 1;
          dx /= mag; dy /= mag;

          applyPairYield(A, B, overlap, dx, dy);
        }
      }
    }

    // 4) smooth application (THIS is what makes it feel like one fluid)
    for (const b of blobs) {
      if (!b.linkEl) continue;

      b.g = lerp(b.g, b.tg, SMOOTH);
      b.sx = lerp(b.sx, b.tsx, SMOOTH);
      b.sy = lerp(b.sy, b.tsy, SMOOTH);

      b.linkEl.style.setProperty("--blob-scale", b.g.toFixed(4));
      b.linkEl.style.setProperty("--sx", b.sx.toFixed(4));
      b.linkEl.style.setProperty("--sy", b.sy.toFixed(4));
    }

    body.classList.add("home-ready");
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  setTimeout(() => body.classList.add("home-rotate"), 200);

  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
});