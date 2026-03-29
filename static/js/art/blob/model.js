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
    amps: [1.0 + rnd()*0.6, 0.7 + rnd()*0.5, 0.5 + rnd()*0.4, 0.35 + rnd()*0.35, 0.25 + rnd()*0.25],
    freqs: [2 + Math.floor(rnd()*4), 4 + Math.floor(rnd()*5), 7 + Math.floor(rnd()*6), 11 + Math.floor(rnd()*7), 16 + Math.floor(rnd()*7)],
    phases: [rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2],
    speeds: [2.1 + rnd()*1.2, 1.8 + rnd()*1.1, 1.4 + rnd()*1.0, 1.2 + rnd()*0.9, 1.0 + rnd()*0.8],
    strength: 0.5 + rnd()*0.3  // Reduced ripple strength
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

export function computePathFromModel(model, timeSec, options = {}) {
  const cx = 50, cy = 50;
  const pts = [];
  const { N, angles, baseR, rip } = model;
  const { neighbors = [] } = options;

  for (let i = 0; i < N; i++) {
    const a = angles[i];
    let r = baseR[i];

    // Ripple animation
    let dr = 0;
    for (let k = 0; k < rip.amps.length; k++) {
      dr += Math.sin(a * rip.freqs[k] + rip.phases[k] + timeSec * rip.speeds[k]) * rip.amps[k];
    }

    r += dr * rip.strength;

    // Synergistic neighbor interaction
    // Edges compress inward where neighbors push, but also "push back" with ripples
    if (neighbors.length > 0) {
      for (const neighbor of neighbors) {
        const angleToNeighbor = neighbor.angle;
        const compression = neighbor.compression;

        // Calculate how much this point faces the neighbor
        const angleDiff = Math.abs(a - angleToNeighbor);
        const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

        // Direct compression where edges face neighbors
        if (normalizedDiff < Math.PI * 0.35) {
          const facingStrength = 1 - (normalizedDiff / (Math.PI * 0.35));
          r -= facingStrength * compression * 24;  // Strong inward push
        }

        // Reciprocal "push back" - edges on opposite side push outward (reaction)
        const oppositeSide = normalizedDiff > Math.PI * 0.65; // Far side from neighbor
        if (oppositeSide && compression > 0.2) {
          const reactStrength = 1 - ((normalizedDiff - Math.PI * 0.65) / (Math.PI * 0.35));
          if (reactStrength > 0.1) {
            r += reactStrength * compression * 12;  // Push outward in reaction
          }
        }

        // Ripple propagation - create wave that spreads across edge
        const wavePhase = timeSec * 3 + Math.sin(angleToNeighbor * 2) * Math.PI;
        const wave = Math.sin(a * 3 + wavePhase) * compression * 8;
        r += wave * Math.max(0, 1 - normalizedDiff / (Math.PI * 0.5));
      }
    }

    r = Math.max(26, Math.min(52, r));
    pts.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r });
  }

  const smooth = chaikin(pts, 2);
  return pointsToBezier(smooth);
}
