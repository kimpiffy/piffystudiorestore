// ---- seeded RNG ----
function hashToSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Chaikin smoothing ----
function chaikin(points, iterations = 2) {
  let pts = points.slice();
  for (let it = 0; it < iterations; it++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = out;
  }
  return pts;
}

// ---- closed quadratic path ----
function pointsToClosedPath(points) {
  if (!points.length) return "";
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const start = mid(points[0], points[1]);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} `;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const m = mid(curr, next);
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${m.x.toFixed(2)} ${m.y.toFixed(2)} `;
  }

  return d + "Z";
}

// ---- blob model: less uniform + more wiggly ----
function buildModel(id) {
  const rnd = mulberry32(hashToSeed(id || "contact"));
  const N = 9; // fewer points = more irregular silhouette

  const baseR = 54 + rnd() * 6;   // BIGGER blob in the 0..100 viewBox
  const amp1  = 7 + rnd() * 6;    // stronger base lopsidedness
  const amp2  = 5 + rnd() * 5;
  const f1    = 2 + Math.floor(rnd() * 4);
  const f2    = 5 + Math.floor(rnd() * 5);
  const p1    = rnd() * Math.PI * 2;
  const p2    = rnd() * Math.PI * 2;

  const angles = [];
  const radii  = [];

  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    angles.push(a);

    let r =
      baseR +
      Math.sin(a * f1 + p1) * amp1 +
      Math.sin(a * f2 + p2) * amp2;

    // allow big swings (can spill)
    r = Math.max(44, Math.min(72, r));
    radii.push(r);
  }

  // ripple = noticeably wiggly edge
  const rip = {
    amps:     [3.2 + rnd()*1.6, 2.3 + rnd()*1.2, 1.7 + rnd()*1.0, 1.2 + rnd()*0.9],
    freqs:    [2 + Math.floor(rnd()*4), 4 + Math.floor(rnd()*5), 7 + Math.floor(rnd()*6), 11 + Math.floor(rnd()*7)],
    phases:   [rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2],
    speeds:   [1.6 + rnd()*0.9, 1.2 + rnd()*0.8, 0.95 + rnd()*0.7, 0.75 + rnd()*0.6],
    strength: 1.25 + rnd()*0.55
  };

  return { N, angles, radii, rip };
}

function computeBlobPath(model, tSec) {
  const cx = 50, cy = 50;
  const pts = [];

  for (let i = 0; i < model.N; i++) {
    const a = model.angles[i];
    let r = model.radii[i];

    let dr = 0;
    for (let k = 0; k < model.rip.amps.length; k++) {
      dr += Math.sin(a * model.rip.freqs[k] + model.rip.phases[k] + tSec * model.rip.speeds[k]) * model.rip.amps[k];
    }

    r += dr * model.rip.strength;

    // IMPORTANT: don’t let it pinch inward too hard (protect content)
    r = Math.max(44, Math.min(78, r));

    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }

  const smooth = chaikin(pts, 2);
  return pointsToClosedPath(smooth);
}

// ---- animate blob ----
(() => {
  const path = document.getElementById("blobFill");
  if (!path) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const model = buildModel("contact");

  function frame(now) {
    const t = now / 1000;
    path.setAttribute("d", computeBlobPath(model, t));
    if (!prefersReduced) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();

// ---- "other" dropdown logic ----
(() => {
  const select = document.getElementById("query_related");
  const otherWrap = document.getElementById("otherWrap");
  const otherInput = document.getElementById("other_specify");
  if (!select || !otherWrap || !otherInput) return;

  function sync() {
    const isOther = select.value === "other";
    otherWrap.classList.toggle("is-hidden", !isOther);

    if (isOther) {
      otherInput.setAttribute("required", "required");
    } else {
      otherInput.removeAttribute("required");
      otherInput.value = "";
    }
  }

  select.addEventListener("change", sync);
  sync();
})();
