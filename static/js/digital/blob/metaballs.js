// Metaball / implicit field + marching squares contour extraction (browser-friendly)

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Simple metaball kernel (radius-like influence)
function metaballKernel(dx, dy, r) {
  const d2 = dx * dx + dy * dy;
  // Avoid singularity; kernel ~ r^2 / (d^2 + eps)
  const eps = 1e-6;
  return (r * r) / (d2 + eps);
}

/**
 * Build scalar field sampler from N centers.
 * F(x,y) = Σ (ri^2 / (|x-ci|^2 + eps))  - bias
 */
export function createMetaballField(centers, opts) {
  const {
    radii = centers.map(() => 70),
    bias = 1.0,
  } = opts ?? {};

  return function sample(x, y) {
    let v = 0;
    for (let i = 0; i < centers.length; i++) {
      const c = centers[i];
      const r = radii[i] ?? radii[0] ?? 70;
      v += metaballKernel(x - c.x, y - c.y, r);
    }
    return v - bias;
  };
}

/**
 * Marching squares: Extract isolines for f(x,y)=0
 * Returns an array of polylines, each polyline is [{x,y}, ...]
 */
export function marchingSquaresContours(sample, bounds, grid, iso = 0) {
  const { x0, y0, x1, y1 } = bounds;
  const { cols, rows } = grid;

  const dx = (x1 - x0) / cols;
  const dy = (y1 - y0) / rows;

  // Pre-sample scalar field at grid vertices
  const values = Array.from({ length: rows + 1 }, () => new Array(cols + 1));
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = x0 + i * dx;
      const y = y0 + j * dy;
      values[j][i] = sample(x, y) - iso;
    }
  }

  // Edge interpolation helper
  function interp(xa, ya, va, xb, yb, vb) {
    const t = va === vb ? 0.5 : (0 - va) / (vb - va);
    return { x: xa + (xb - xa) * t, y: ya + (yb - ya) * t };
  }

  // For each cell generate line segments (at most 2)
  const segments = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * dx;
      const y = y0 + j * dy;

      const v0 = values[j][i];       // top-left
      const v1 = values[j][i + 1];   // top-right
      const v2 = values[j + 1][i + 1]; // bottom-right
      const v3 = values[j + 1][i];   // bottom-left

      // case index
      const c0 = v0 > 0 ? 1 : 0;
      const c1 = v1 > 0 ? 1 : 0;
      const c2 = v2 > 0 ? 1 : 0;
      const c3 = v3 > 0 ? 1 : 0;
      const idx = (c0 << 3) | (c1 << 2) | (c2 << 1) | c3;

      if (idx === 0 || idx === 15) continue;

      // cell corners
      const x0c = x,       y0c = y;
      const x1c = x + dx,  y1c = y;
      const x2c = x + dx,  y2c = y + dy;
      const x3c = x,       y3c = y + dy;

      // edge points (top, right, bottom, left)
      const eTop = interp(x0c, y0c, v0, x1c, y1c, v1);
      const eRight = interp(x1c, y1c, v1, x2c, y2c, v2);
      const eBottom = interp(x3c, y3c, v3, x2c, y2c, v2);
      const eLeft = interp(x0c, y0c, v0, x3c, y3c, v3);

      // Standard marching squares lookup (disambiguation ignored; fine for metaballs)
      // Returns segments as pairs of points
      switch (idx) {
        case 1:  segments.push([eLeft, eBottom]); break;
        case 2:  segments.push([eBottom, eRight]); break;
        case 3:  segments.push([eLeft, eRight]); break;
        case 4:  segments.push([eTop, eRight]); break;
        case 5:  segments.push([eTop, eLeft]); segments.push([eBottom, eRight]); break;
        case 6:  segments.push([eTop, eBottom]); break;
        case 7:  segments.push([eTop, eLeft]); break;
        case 8:  segments.push([eTop, eLeft]); break;
        case 9:  segments.push([eTop, eBottom]); break;
        case 10: segments.push([eTop, eRight]); segments.push([eLeft, eBottom]); break;
        case 11: segments.push([eTop, eRight]); break;
        case 12: segments.push([eLeft, eRight]); break;
        case 13: segments.push([eBottom, eRight]); break;
        case 14: segments.push([eLeft, eBottom]); break;
        default: break;
      }
    }
  }

  // Stitch segments into polylines
  const eps2 = (Math.max(dx, dy) * 0.75) ** 2;
  function key(p) {
    // quantize to grid-ish so endpoints match
    const qx = Math.round(p.x / (Math.max(dx, dy) * 0.25));
    const qy = Math.round(p.y / (Math.max(dx, dy) * 0.25));
    return `${qx},${qy}`;
  }

  const startMap = new Map(); // key -> array of segment indices starting there
  const endMap = new Map();   // key -> array of segment indices ending there
  segments.forEach((seg, si) => {
    const a = seg[0], b = seg[1];
    const ka = key(a), kb = key(b);
    if (!startMap.has(ka)) startMap.set(ka, []);
    if (!endMap.has(kb)) endMap.set(kb, []);
    startMap.get(ka).push(si);
    endMap.get(kb).push(si);
  });

  const used = new Array(segments.length).fill(false);
  const polylines = [];

  function dist2(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  for (let si = 0; si < segments.length; si++) {
    if (used[si]) continue;
    used[si] = true;

    const line = [segments[si][0], segments[si][1]];

    // extend forward
    while (true) {
      const tail = line[line.length - 1];
      const kt = key(tail);
      const candidates = startMap.get(kt) ?? [];
      let next = -1;
      for (const ci of candidates) {
        if (used[ci]) continue;
        const a = segments[ci][0];
        if (dist2(a, tail) <= eps2) { next = ci; break; }
      }
      if (next < 0) break;
      used[next] = true;
      line.push(segments[next][1]);
    }

    // extend backward
    while (true) {
      const head = line[0];
      const kh = key(head);
      const candidates = endMap.get(kh) ?? [];
      let prev = -1;
      for (const ci of candidates) {
        if (used[ci]) continue;
        const b = segments[ci][1];
        if (dist2(b, head) <= eps2) { prev = ci; break; }
      }
      if (prev < 0) break;
      used[prev] = true;
      line.unshift(segments[prev][0]);
    }

    // Close if nearly closed
    if (line.length > 3 && dist2(line[0], line[line.length - 1]) <= eps2) {
      line[line.length - 1] = line[0];
    }

    polylines.push(line);
  }

  return polylines;
}

export function polylineToSvgPath(polyline, close = true) {
  if (!polyline?.length) return "";
  const pts = polyline;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  if (close) d += " Z";
  return d;
}