import { escapeHtml } from "../utils.js";

export function makeWarpSVG({ uid, cover, title, initialD, focusY = "Mid" }) {
  const hasCover = !!(cover && String(cover).trim().length);

  return `
    <svg class="blob-svg" viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(title)}" data-uid="${uid}" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="${uid}_clip">
          <path id="${uid}_path" d="${initialD}"></path>
        </clipPath>
      </defs>

      <g clip-path="url(#${uid}_clip)">
        ${hasCover
          ? `<image href="${escapeHtml(cover)}" xlink:href="${escapeHtml(cover)}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMid${escapeHtml(focusY)} slice" class="blob-img"></image>`
          : `<rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.12)"></rect>`
        }
        <!-- Purple overlay that hides on hover -->
        <rect x="0" y="0" width="100" height="100" class="blob-shade"></rect>
      </g>

      ${!hasCover
        ? `<text x="50" y="54" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="7" font-family="picnic">${escapeHtml(title)}</text>`
        : ""
      }

      <path id="${uid}_outline" d="${initialD}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"></path>
    </svg>
  `;
}
