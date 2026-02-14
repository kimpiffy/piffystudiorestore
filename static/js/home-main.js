import { createBlobModel, computePathFromModel } from "./digital/blob/model.js";
import {
  createMetaballField,
  marchingSquaresContours,
  polylineToSvgPath
} from "./digital/blob/metaballs.js";

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
  const GAP_PX = 38;
  const SAMPLES = 120;
  const SOLVER_ITERS = 4;

  const YIELD = 0.050;

  const G_MIN = 0.92;
  const G_MAX = 1.00;
  const AX_MIN = 0.90;
  const AX_MAX = 1.02;

  const SMOOTH = 0.10;

  const CORRECT_K = 0.52;
  const T_DAMP = 0.90;
  const T_MAX = 55;

  const TIME_SLOW = 0.55;
  const YIELD_DAMP = 0.60;

  const FLOW_AMP = 10;
  const FLOW_SPEED = 0.22;
  const SWIRL_AMP = 7;
  const SWIRL_SPEED = 0.35;
  const SWIRL_DAMP_BY_CONTACT = 0.65;

  const GAP_PRESS = 0.22;
  const GAP_PRESS_MAX = 0.38;

  // ===== Metaballs (single shared field) =====
  // ROLLBACK: disable metaballs to return to stable shared-model rendering
  const USE_METABALLS = false;

  const MB_COLS = 96;
  const MB_ROWS = 96;
  const MB_ISO = 0;
  const MB_BIAS = 1.10;
  const MB_RADIUS = 78;
  const MB_WOB = 6;

  const sharedModel = createBlobModel("home-shared");
  const TIME_OFFSETS = [0.0, 0.0, 0.0];

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
      pts: [],
      cx: 0,
      cy: 0,

      g: 1, tg: 1,
      sx: 1, tsx: 1,
      sy: 1, tsy: 1,

      tx: 0,
      ty: 0,
      stx: 0,
      sty: 0,

      contact: 0,
      tScale: 1,
      stScale: 1,

      // NEW: stable identity number for “dance” phase
      i: idx,
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
      b.contact = 0; // NEW: reset contact each frame
    }
  }

  // Change applyPairYield to accept a per-pair yield multiplier
  function applyPairYield(A, B, overlap, dirX, dirY, yieldMul) {
    const k = clamp(overlap / GAP_PX, 0, 1);
    const wx = Math.abs(dirX);
    const wy = Math.abs(dirY);

    const s = (YIELD * yieldMul) * k;

    const shrinkX = 1 - s * wx;
    const shrinkY = 1 - s * wy;

    const expandX = 1 + (s * 0.45) * wy;
    const expandY = 1 + (s * 0.45) * wx;

    A.tsx = clamp(A.tsx * shrinkX * expandX, AX_MIN, AX_MAX);
    A.tsy = clamp(A.tsy * shrinkY * expandY, AX_MIN, AX_MAX);
    B.tsx = clamp(B.tsx * shrinkX * expandX, AX_MIN, AX_MAX);
    B.tsy = clamp(B.tsy * shrinkY * expandY, AX_MIN, AX_MAX);

    const gDrop = ((YIELD * yieldMul) * 0.55) * k;
    A.tg = clamp(A.tg * (1 - gDrop), G_MIN, G_MAX);
    B.tg = clamp(B.tg * (1 - gDrop), G_MIN, G_MAX);
  }

  function resetTranslationTargets() {
    for (const b of blobs) {
      b.tx *= T_DAMP;
      b.ty *= T_DAMP;
    }
  }

  function applyTranslationStyles() {
    for (const b of blobs) {
      if (!b.linkEl) continue;
      b.stx = lerp(b.stx ?? 0, b.tx, SMOOTH);
      b.sty = lerp(b.sty ?? 0, b.ty, SMOOTH);
      b.linkEl.style.setProperty("--tx", `${b.stx.toFixed(2)}px`);
      b.linkEl.style.setProperty("--ty", `${b.sty.toFixed(2)}px`);
    }
  }

  function recenterCluster() {
    // Make them feel like ONE object: keep centroid of translations at (0,0)
    let mx = 0, my = 0, n = 0;
    for (const b of blobs) {
      mx += b.tx;
      my += b.ty;
      n++;
    }
    if (!n) return;
    mx /= n;
    my /= n;

    for (const b of blobs) {
      b.tx -= mx;
      b.ty -= my;

      b.tx = clamp(b.tx, -T_MAX, T_MAX);
      b.ty = clamp(b.ty, -T_MAX, T_MAX);
    }
  }

  function getLocalCenters300() {
    // Map each blob-link center (screen coords) into its own SVG 0..300 space.
    // We use the current link rect as the local frame.
    return blobs.map((b) => {
      const r = b.linkEl?.getBoundingClientRect();
      if (!r) return { x: 150, y: 150 };

      const nx = (b.cx - r.left) / (r.width || 1);
      const ny = (b.cy - r.top) / (r.height || 1);

      return { x: nx * 300, y: ny * 300 };
    });
  }

  function centroid(poly) {
    let x = 0, y = 0;
    const n = poly?.length || 1;
    for (let i = 0; i < (poly?.length || 0); i++) {
      x += poly[i].x;
      y += poly[i].y;
    }
    return { x: x / n, y: y / n };
  }

  // NEW: make sure frame is defined in the same scope as the helpers
  let raf = 0;
  const t0 = performance.now();

  function frame(now) {
    const t = (now - t0) / 1000;

    // 1) Render shapes (stable path)
    for (const b of blobs) {
      if (!b.shapeEl) continue;

      // Keep a gentle per-blob time scaling if you want
      b.stScale = lerp(b.stScale, b.tScale, 0.12);
      const tLocal = t * (b.stScale || 1) + (b.tOff || 0);

      b.shapeEl.setAttribute("d", computePathFromModel(sharedModel, tLocal));
      fitPathElToBox(b.shapeEl, 300, 4);
    }

    // 2) Update centers + sample points (for collisions if/when you re-enable packing)
    updateCenters();
    for (const b of blobs) {
      if (!b.shapeEl) continue;
      b.pts = samplePathScreenPoints(b.shapeEl, SAMPLES);
    }

    // 3) (Optional) If your old stable version had translation/packing, it would go here.
    // For now, keep it simple and visible:
    // applyTranslationStyles();

    raf = requestAnimationFrame(frame);
  }

  body.classList.add("home-ready");
  raf = requestAnimationFrame(frame);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
});
