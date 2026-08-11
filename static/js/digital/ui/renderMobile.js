import { escapeHtml, mod, setTransformImportant, setTransitionImportant } from "../utils.js";
import { makeWarpSVG } from "../blob/svg.js";
import { createBlobModel, computePathFromModel } from "../blob/model.js";

const MOBILE_TRANSITION = "transform 420ms cubic-bezier(.4,0,.2,1)";

function coverUrl(p) {
  const candidate = p && (p.cover || p.image || p.src || p.thumbnail || "");
  return String(candidate).trim();
}

/**
 * Returns { innerEl } for mobile drift to animate.
 */
export function renderMobileOne({ blobLayer, projects, index, dir, onProjectClick, mobileSizeVw = 104 }) {
  const mobileIndex = mod(index, projects.length);
  const p = projects[mobileIndex];
  const cover = coverUrl(p);

  const uid = `b_${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random()*1e9)}`;
  const model = createBlobModel(p.id);
  const initialD = computePathFromModel(model, performance.now() * 0.001);
  const focusY = p.cover_focus_y;

  // layer setup (same as your current logic)
  blobLayer.style.position = "absolute";
  blobLayer.style.left = "0";
  blobLayer.style.right = "0";
  blobLayer.style.top = "0";
  blobLayer.style.bottom = "0";
  blobLayer.style.height = "auto";
  blobLayer.style.overflow = "visible";

  // OUTER = slide (transform)
  // INNER = drift (transform)
  blobLayer.innerHTML = `
<div class="blob-outer"
  style="
    position:absolute;
    left:0;
    right:0;
    top:0;
    height:fit-content;

    display:flex;
    flex-direction:column;        /* important */
    justify-content:center;       /* vertical centering on mobile */
    align-items:center;           /* horizontal centering */

    padding-top: var(--mobile-blob-top, 0px);
    will-change: transform;
  "
>

      <button class="blob-inner"
        type="button"
        data-id="${escapeHtml(p.id)}"
        style="
          position:relative;
          width:${mobileSizeVw}vw;
          height:${mobileSizeVw}vw;
          display:flex;
          align-items:center;
          justify-content:center;
          will-change: transform;
          background: transparent;
          border: 0;
          padding: 0;
        "
        aria-label="${escapeHtml(p.title)}"
      >
        ${makeWarpSVG({ uid, cover, title: p.title, initialD, focusY })}
      </button>
    </div>
  `;

  const outer = blobLayer.querySelector(".blob-outer");
  const inner = blobLayer.querySelector(".blob-inner");

  if (inner) {
    inner.addEventListener("click", () => onProjectClick(p.id));
  }

  // slide animation on OUTER
  if (outer) {
    setTransitionImportant(outer, MOBILE_TRANSITION);

    if (dir === 0) {
      setTransformImportant(outer, "translate3d(0,0,0)");
    } else {
      setTransformImportant(outer, `translate3d(${dir > 0 ? "100vw" : "-100vw"},0,0)`);
      requestAnimationFrame(() => {
        setTransformImportant(outer, "translate3d(0,0,0)");
      });
    }
  }

  return { innerEl: inner };
}
