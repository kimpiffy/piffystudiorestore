// static/js/about/blob/model.js
import { hashToSeed, mulberry32 } from "./rng.js";
import { chaikin, pointsToBezier } from "./geometry.js";

function buildBaseRadii(id, N) {
  const rnd = mulberry32(hashToSeed(id || "x"));

  const baseR = 34 + rnd()*5;
  const amp1 = 4 + rnd()*5;
  const amp2 = 2 + rnd()*4;
  const f1 = 3 + Math.floor(rnd()*4);
  const f2 = 6 + Math.floor(rnd()*4);
  const p1 = rnd()*Math.PI*2;
  const p2 = rnd()*Math.PI*2;

  const radii = new Array(N);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let r = baseR
      + Math.sin(a*f1 + p1)*amp1
      + Math.sin(a*f2 + p2)*amp2;
    r = Math.max(30, Math.min(46, r));
    radii[i] = r;
  }

  const rip = {
    amps: [2.0 + rnd()*1.2, 1.4 + rnd()*1.0, 1.0 + rnd()*0.8, 0.75 + rnd()*0.7, 0.55 + rnd()*0.55],
    freqs: [2 + Math.floor(rnd()*4), 4 + Math.floor(rnd()*5), 7 + Math.floor(rnd()*6), 11 + Math.floor(rnd()*7), 16 + Math.floor(rnd()*7)],
    phases: [rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2],
    speeds: [0.3 + rnd()*0.15, 0.25 + rnd()*0.12, 0.2 + rnd()*0.1, 0.15 + rnd()*0.08, 0.1 + rnd()*0.05],
    strength: 1.25 + rnd()*0.60
  };

  return { radii, rip };
}

export function createBlobModel(id) {
  const N = 10;
  const base = buildBaseRadii(id, N);
  const angles = new Array(N);
  for (let i = 0; i < N; i++) angles[i] = (i / N) * Math.PI * 2;
  return { id, N, angles, baseR: base.radii, rip: base.rip };
}

export function computePathFromModel(model, timeSec) {
  const cx = 50, cy = 50;
  const pts = [];
  const { N, angles, baseR, rip } = model;

  for (let i = 0; i < N; i++) {
    const a = angles[i];
    let r = baseR[i];

    let dr = 0;
    for (let k = 0; k < rip.amps.length; k++) {
      dr += Math.sin(a * rip.freqs[k] + rip.phases[k] + timeSec * rip.speeds[k]) * rip.amps[k];
    }

    r += dr * rip.strength;
    r = Math.max(26, Math.min(52, r));
    pts.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r });
  }

  const smooth = chaikin(pts, 2);
  return pointsToBezier(smooth);
}
