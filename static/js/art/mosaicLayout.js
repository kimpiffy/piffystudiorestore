import { escapeHtml } from "./utils.js";

export const MOSAIC_VIEWBOX = {
  width: 1560,
  height: 1020,
};

const VORONOI_BOUNDS = {
  left: -140,
  top: -120,
  right: MOSAIC_VIEWBOX.width + 140,
  bottom: MOSAIC_VIEWBOX.height + 120,
};

const VORONOI_SITES = [
  { x: 172, y: 182, isVoid: true },
  { x: 460, y: 150 },
  { x: 820, y: 132 },
  { x: 1170, y: 172 },
  { x: 1410, y: 150 },
  { x: 320, y: 438 },
  { x: 670, y: 470 },
  { x: 1000, y: 412 },
  { x: 1330, y: 454 },
  { x: 420, y: 766 },
  { x: 780, y: 804 },
  { x: 1120, y: 742 },
  { x: 1430, y: 786 },
];

const INSET_SCALE = 0.91;
// The empty top-left cell follows the exact same Voronoi rules as every
// other blob; it's just shrunk down afterwards so it reads as a small gap.
const VOID_EXTRA_SCALE = 0.5;
const EPSILON = 1e-6;

function rectPolygon(bounds) {
  return [
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom },
  ];
}

function clipPolygonWithBisector(polygon, site, other) {
  const a = 2 * (other.x - site.x);
  const b = 2 * (other.y - site.y);
  const c = other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y;

  const isInside = (point) => a * point.x + b * point.y <= c + EPSILON;
  const intersect = (start, end) => {
    const startValue = a * start.x + b * start.y - c;
    const endValue = a * end.x + b * end.y - c;
    const ratio = startValue / (startValue - endValue);

    return {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
    };
  };

  const clipped = [];

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentInside = isInside(current);
    const previousInside = isInside(previous);

    if (currentInside && !previousInside) {
      clipped.push(intersect(previous, current));
    }

    if (currentInside) {
      clipped.push(current);
    }

    if (!currentInside && previousInside) {
      clipped.push(intersect(previous, current));
    }
  }

  return clipped;
}

function computeCentroid(points) {
  if (!points.length) {
    return { x: 0, y: 0 };
  }

  const totals = points.reduce(
    (accumulator, point) => {
      accumulator.x += point.x;
      accumulator.y += point.y;
      return accumulator;
    },
    { x: 0, y: 0 },
  );

  return {
    x: totals.x / points.length,
    y: totals.y / points.length,
  };
}

function insetPolygon(points, scale) {
  const centroid = computeCentroid(points);

  return points.map((point) => ({
    x: centroid.x + (point.x - centroid.x) * scale,
    y: centroid.y + (point.y - centroid.y) * scale,
  }));
}

function polygonBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function chaikinSmoothClosed(points, iterations) {
  if (points.length < 3) {
    return points.slice();
  }

  let currentPoints = points.slice();

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const nextPoints = [];

    for (let index = 0; index < currentPoints.length; index += 1) {
      const currentPoint = currentPoints[index];
      const nextPoint = currentPoints[(index + 1) % currentPoints.length];

      nextPoints.push({
        x: currentPoint.x * 0.75 + nextPoint.x * 0.25,
        y: currentPoint.y * 0.75 + nextPoint.y * 0.25,
      });
      nextPoints.push({
        x: currentPoint.x * 0.25 + nextPoint.x * 0.75,
        y: currentPoint.y * 0.25 + nextPoint.y * 0.75,
      });
    }

    currentPoints = nextPoints;
  }

  return currentPoints;
}

// Straight edges left over from clipping against the outer viewport bounds
// (e.g. the top/side of edge cells) read as flat; give any edge notably longer
// than the polygon's average a gentle outward bow so the cell reads as a full,
// convex, bulbous blob instead of a flat-sided one.
function bowLongEdges(points) {
  if (points.length < 3) {
    return points;
  }

  const centroid = computeCentroid(points);
  const edgeLengths = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  const averageLength = edgeLengths.reduce((total, length) => total + length, 0) / edgeLengths.length;
  const threshold = averageLength * 1.5;
  const bulgeRatio = 0.07;

  const bowed = [];

  points.forEach((point, index) => {
    bowed.push(point);
    const next = points[(index + 1) % points.length];
    const length = edgeLengths[index];

    if (length > threshold) {
      const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };

      bowed.push({
        x: midpoint.x - (centroid.x - midpoint.x) * bulgeRatio,
        y: midpoint.y - (centroid.y - midpoint.y) * bulgeRatio,
      });
    }
  });

  return bowed;
}

function polygonPath(points) {
  if (points.length < 3) {
    return "";
  }

  const bowedPoints = bowLongEdges(points);
  const smoothedPoints = chaikinSmoothClosed(bowedPoints, 1);
  const midpoint = (firstPoint, secondPoint) => ({
    x: (firstPoint.x + secondPoint.x) / 2,
    y: (firstPoint.y + secondPoint.y) / 2,
  });

  let path = `M ${midpoint(smoothedPoints[smoothedPoints.length - 1], smoothedPoints[0]).x.toFixed(2)} ${midpoint(smoothedPoints[smoothedPoints.length - 1], smoothedPoints[0]).y.toFixed(2)}`;

  for (let index = 0; index < smoothedPoints.length; index += 1) {
    const currentPoint = smoothedPoints[index];
    const nextPoint = smoothedPoints[(index + 1) % smoothedPoints.length];
    const nextMidpoint = midpoint(currentPoint, nextPoint);

    path += ` Q ${currentPoint.x.toFixed(2)} ${currentPoint.y.toFixed(2)} ${nextMidpoint.x.toFixed(2)} ${nextMidpoint.y.toFixed(2)}`;
  }

  return `${path} Z`;
}

// Every site, including the empty one, is clipped against all its neighbours
// the same way and gets the same inset/bow/smoothing treatment, so it's a
// blob like any other. The empty cell is then shrunk further (around its own
// centroid) so it reads as a small gap rather than a full-size cell.
function buildVoronoiSpecs() {
  return VORONOI_SITES.map((site, index) => {
    let polygon = rectPolygon(VORONOI_BOUNDS);

    VORONOI_SITES.forEach((otherSite, otherIndex) => {
      if (otherIndex === index) return;
      polygon = clipPolygonWithBisector(polygon, site, otherSite);
    });

    polygon = insetPolygon(polygon, INSET_SCALE);

    if (site.isVoid) {
      polygon = insetPolygon(polygon, VOID_EXTRA_SCALE);
    }

    const bounds = polygonBounds(polygon);
    const localPoints = polygon.map((point) => ({
      x: point.x - bounds.left,
      y: point.y - bounds.top,
    }));

    return {
      isVoid: !!site.isVoid,
      className: `work-${(index % 6) + 1}`,
      x: Math.round(bounds.left),
      y: Math.round(bounds.top),
      width: Math.max(1, Math.round(bounds.width)),
      height: Math.max(1, Math.round(bounds.height)),
      path: polygonPath(localPoints),
    };
  });
}

export const MOSAIC_SPECS = buildVoronoiSpecs();
const ARTWORK_SPECS = MOSAIC_SPECS.filter((spec) => !spec.isVoid);

export function getMosaicSpec(index) {
  return ARTWORK_SPECS[index % ARTWORK_SPECS.length];
}

function buildCell(project, spec, index) {
  const clipId = `cellClip_${index}`;
  const imageHref = project?.cover ? String(project.cover) : "";
  const title = escapeHtml(project?.title || "");
  const gridImageScale = Number(project?.grid_image_scale) || 1;
  const imageScale = 1.26 * gridImageScale;
  const offsetX = Number(project?.grid_image_offset_x) || 0;
  const offsetY = Number(project?.grid_image_offset_y) || 0;
  const insetX = spec.width * (imageScale - 1) * 0.5 - offsetX;
  const insetY = spec.height * (imageScale - 1) * 0.5 - offsetY;

  return `
    <svg
      class="portfolio-cell ${spec.className}"
      role="button"
      tabindex="0"
      aria-label="${title}"
      data-id="${escapeHtml(project?.id || String(index))}"
      data-index="${index}"
      x="${spec.x}"
      y="${spec.y}"
      width="${spec.width}"
      height="${spec.height}"
      viewBox="0 0 ${spec.width} ${spec.height}"
      preserveAspectRatio="none"
    >
      <defs>
        <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
          <path d="${spec.path}"></path>
        </clipPath>
      </defs>
      <image
        href="${escapeHtml(imageHref)}"
        x="${-insetX}"
        y="${-insetY}"
        width="${spec.width * imageScale}"
        height="${spec.height * imageScale}"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#${clipId})"
      ></image>
      <path class="cell-hit" d="${spec.path}"></path>
    </svg>
  `;
}

function buildVoidCell(spec) {
  return `
    <svg
      class="portfolio-empty-cell"
      aria-hidden="true"
      x="${spec.x}"
      y="${spec.y}"
      width="${spec.width}"
      height="${spec.height}"
      viewBox="0 0 ${spec.width} ${spec.height}"
      preserveAspectRatio="none"
    >
      <path class="portfolio-void" d="${spec.path}"></path>
    </svg>
  `;
}

export function buildMosaicMarkup(projects) {
  if (!projects.length) {
    return "";
  }

  const artworkSpecs = MOSAIC_SPECS.filter((spec) => !spec.isVoid);
  const voidSpecs = MOSAIC_SPECS.filter((spec) => spec.isVoid);
  const repeatedProjects = artworkSpecs.map((_, index) => projects[index % projects.length]);

  // Void cells are painted last (on top) so they punch a smooth rounded hole
  // out of whichever artwork cell now extends underneath them, instead of the
  // artwork cell's own outline being cut by a straight Voronoi bisector edge.
  return `
    <svg class="portfolio-mosaic" viewBox="0 0 ${MOSAIC_VIEWBOX.width} ${MOSAIC_VIEWBOX.height}" preserveAspectRatio="xMidYMid slice" aria-label="Portfolio mosaic">
      ${artworkSpecs.map((spec, index) => buildCell(repeatedProjects[index], spec, index)).join("")}
      ${voidSpecs.map((spec) => buildVoidCell(spec)).join("")}
    </svg>
  `;
}

export function buildPreviewMarkup(project, spec) {
  const title = escapeHtml(project?.title || "");
  const imageHref = project?.cover ? String(project.cover) : "";

  return `
    <div class="overlay-preview" aria-hidden="true">
      <img class="overlay-preview__image" src="${escapeHtml(imageHref)}" alt="${title}" loading="eager" decoding="async">
    </div>
  `;
}
