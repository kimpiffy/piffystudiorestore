// static/js/about/portrait.js
import { escapeHtml } from "./utils.js";
import { PORTRAITS, HOVER_IMAGE, PORTRAIT_FIT } from "./config.js";
import { createBlobModel, computePathFromModel } from "./blob/model.js";

export function createPortraitController(portraitBtn) {
  const uid = `p_${Math.floor(Math.random() * 1e9)}`;
  const model = createBlobModel(uid);

  let index = 0;
  let edgeRAF = null;
  let isHovering = false;

  const currentPortrait = () => PORTRAITS[index % PORTRAITS.length];

  function setImage(src) {
    const imgEl = portraitBtn.querySelector(`#${uid}_img`);
    if (!imgEl) return;
    imgEl.setAttribute("href", src);
    imgEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", src);
  }

  // iPad/tablet: make blob bigger + slightly higher
  function applyLayout() {
    const isTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 1180px)"
    ).matches;

    // tweak these two numbers to taste
    const scale = isTablet ? 1.35 : 1;
    const top = isTablet ? "46%" : "50%";

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
        </g>

        <path class="blob-outline" id="${uid}_outline" d="${d0}" fill="none"></path>
      </svg>
    `;
  }

  function nextPortrait() {
    index = (index + 1) % PORTRAITS.length;
    if (!isHovering) setImage(currentPortrait());
  }

  function onEnter() {
    isHovering = true;
    if (HOVER_IMAGE) setImage(HOVER_IMAGE);
  }

  function onLeave() {
    isHovering = false;
    setImage(currentPortrait());
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

  function bindInteractions() {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (canHover) {
      portraitBtn.addEventListener("mouseenter", onEnter);
      portraitBtn.addEventListener("mouseleave", onLeave);
    }

    // click cycles portraits
    portraitBtn.addEventListener("click", nextPortrait);
  }

  function mount() {
    renderSVG();
    applyLayout();
    bindInteractions();
    startEdgeWarp();

    window.addEventListener("resize", applyLayout);
    window.addEventListener("orientationchange", applyLayout);
  }

  function destroy() {
    stopEdgeWarp();
    window.removeEventListener("resize", applyLayout);
    window.removeEventListener("orientationchange", applyLayout);
  }

  return { mount, destroy };
}
