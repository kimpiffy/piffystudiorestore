// static/js/about/portrait.js
import { escapeHtml } from "./utils.js";
import { PORTRAITS, PORTRAIT_FIT } from "./config.js";
import { createBlobModel, computePathFromModel } from "./blob/model.js";

export function createPortraitController(portraitBtn) {
  const uid = `p_${Math.floor(Math.random() * 1e9)}`;
  const model = createBlobModel(uid);

  let index = 0;
  let edgeRAF = null;

  let rotateTimer = null;
  const ROTATE_MS = 5000;

  const currentPortrait = () => PORTRAITS[index % PORTRAITS.length];

  function setImage(src) {
    const imgEl = portraitBtn.querySelector(`#${uid}_img`);
    if (!imgEl) return;
    imgEl.setAttribute("href", src);
    imgEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", src);
  }

  // Layout: tablet gets your hero scale; big desktops get extra scale
  function applyLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const isLandscape = w > h;

    // Tablet-like: coarse pointer OR no hover, plus a decent minimum size
    const isTabletLike =
      (window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(hover: none)").matches) &&
      Math.min(w, h) >= 700;

    const base = Math.min(w, h);

    let scale =
      isTabletLike && isLandscape ? 2.15 :
      isTabletLike ? 1.65 :
      1;

    // Big screens: make the blob feel properly massive.
    if (!isTabletLike) {
      if (base >= 1400) scale = 1.18;
      if (base >= 1800) scale = 1.30;
      if (base >= 2200) scale = 1.45;
    }

    const top =
      isTabletLike && isLandscape ? "40%" :
      isTabletLike ? "44%" :
      "50%";

    portraitBtn.style.left = "50%";
    portraitBtn.style.top = top;
    portraitBtn.style.transform = `translate(-50%, -50%) scale(${scale})`;
    portraitBtn.style.transformOrigin = "center center";
  }

  function renderSVG() {
    const d0 = computePathFromModel(model, performance.now() * 0.001);
    const img = currentPortrait();

    portraitBtn.innerHTML = `
      <svg class="blob-svg"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink"
           viewBox="0 0 100 100"
           data-uid="${uid}"
           role="img"
           aria-label="portrait">
        <defs>
          <clipPath id="${uid}_clip">
            <path id="${uid}_path" d="${d0}"></path>
          </clipPath>
        </defs>

        <g clip-path="url(#${uid}_clip)">
          <image id="${uid}_img"
                 href="${escapeHtml(img)}"
                 xlink:href="${escapeHtml(img)}"
                 x="0" y="0" width="100" height="100"
                 preserveAspectRatio="${PORTRAIT_FIT}"></image>
          <rect class="blob-shade" x="0" y="0" width="100" height="100"></rect>
        </g>

        <path class="blob-outline" id="${uid}_outline" d="${d0}" fill="none"></path>
      </svg>
    `;
  }

  function nextPortrait() {
    index = (index + 1) % PORTRAITS.length;
    setImage(currentPortrait());
  }

  function startAutoRotate() {
    stopAutoRotate();

    // If only 0/1 portrait, don't schedule
    if (!PORTRAITS || PORTRAITS.length <= 1) return;

    rotateTimer = window.setInterval(() => {
      nextPortrait();
    }, ROTATE_MS);
  }

  function stopAutoRotate() {
    if (rotateTimer) {
      window.clearInterval(rotateTimer);
      rotateTimer = null;
    }
  }

  function startEdgeWarp() {
    stopEdgeWarp();

    function frame(now) {
      const t = now * 0.001;
      const d = computePathFromModel(model, t);

      const pathEl = portraitBtn.querySelector(`#${uid}_path`);
      const outlineEl = portraitBtn.querySelector(`#${uid}_outline`);
      if (pathEl) pathEl.setAttribute("d", d);
      if (outlineEl) outlineEl.setAttribute("d", d);

      edgeRAF = requestAnimationFrame(frame);
    }

    edgeRAF = requestAnimationFrame(frame);
  }

  function stopEdgeWarp() {
    if (edgeRAF) cancelAnimationFrame(edgeRAF);
    edgeRAF = null;
  }

  function mount() {
    renderSVG();
    applyLayout();
    startEdgeWarp();
    startAutoRotate();

    window.addEventListener("resize", applyLayout);
    window.addEventListener("orientationchange", applyLayout);
  }

  function destroy() {
    stopAutoRotate();
    stopEdgeWarp();
    window.removeEventListener("resize", applyLayout);
    window.removeEventListener("orientationchange", applyLayout);
  }

  return { mount, destroy };
}
