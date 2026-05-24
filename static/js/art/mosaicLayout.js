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
const VOID_INSET_SCALE = 0.93;
const ROUNDING_RATIO = 0.24;
const VOID_ROUNDING_RATIO = 0.28;
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

function vectorLength(vector) {
  return Math.hypot(vector.x, vector.y);
}

function normalizeVector(vector) {
  const length = vectorLength(vector);

  if (length <= EPSILON) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
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

function polygonPath(points) {
  if (points.length < 3) {
    return "";
  }

  const smoothedPoints = chaikinSmoothClosed(points, 1);
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

function buildVoronoiSpecs() {
  return VORONOI_SITES.map((site, index) => {
    let polygon = rectPolygon(VORONOI_BOUNDS);

    VORONOI_SITES.forEach((otherSite, otherIndex) => {
      if (otherIndex !== index) {
        polygon = clipPolygonWithBisector(polygon, site, otherSite);
      }
    });

    const insetScale = site.isVoid ? VOID_INSET_SCALE : INSET_SCALE;
    const roundingRatio = site.isVoid ? VOID_ROUNDING_RATIO : ROUNDING_RATIO;
    polygon = insetPolygon(polygon, insetScale);

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
        x="0"
        y="0"
        width="${spec.width}"
        height="${spec.height}"
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
  const repeatedProjects = artworkSpecs.map((_, index) => projects[index % projects.length]);
  let artworkIndex = 0;

  return `
    <svg class="portfolio-mosaic" viewBox="0 0 ${MOSAIC_VIEWBOX.width} ${MOSAIC_VIEWBOX.height}" preserveAspectRatio="xMidYMid slice" aria-label="Portfolio mosaic">
      ${MOSAIC_SPECS.map((spec) => {
        if (spec.isVoid) {
          return buildVoidCell(spec);
        }

        const project = repeatedProjects[artworkIndex];
        const cell = buildCell(project, spec, artworkIndex);
        artworkIndex += 1;
        return cell;
      }).join("")}
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
