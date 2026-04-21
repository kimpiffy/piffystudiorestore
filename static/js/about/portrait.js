// static/js/about/portrait.js
import { escapeHtml } from "./utils.js";
import { ABOUT_LOOP_VIDEO } from "./config.js";
import { createBlobModel, computePathFromModel } from "./blob/model.js";

export function createPortraitController(portraitBtn) {
  const uid = "about-portrait";
  const model = createBlobModel(uid);
  const stage = portraitBtn.closest(".about-stage") || document.body;

  let edgeRAF = null;
  let maskFillEl = null;
  let holeEdgeEl = null;

  // Layout: tablet gets your hero scale; big desktops get extra scale
  function applyLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const isLandscape = w > h;

    const isPhone = Math.min(w, h) < 700;

    // Tablet-like: coarse pointer OR no hover, plus a decent minimum size
    const isTabletLike =
      (window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(hover: none)").matches) &&
      Math.min(w, h) >= 700;

    const isLaptopUp = !isTabletLike && w >= 1024;
    const isLargeDesktop = !isTabletLike && w >= 1440;

    const base = Math.min(w, h);

    let scale =
      isTabletLike && isLandscape ? 1.04 :
      isTabletLike ? 1.02 :
      1;

    // Big screens: make the blob feel properly massive.
    if (!isTabletLike) {
      if (base >= 1400) scale = 1.03;
      if (base >= 1800) scale = 1.06;
      if (base >= 2200) scale = 1.1;
    }

    const top =
      isPhone && isLandscape ? "40%" :
      isPhone ? "35%" :
      isLargeDesktop ? "45.5%" :
      isLaptopUp ? "47%" :
      "49%";

    portraitBtn.style.left = "50%";
    portraitBtn.style.top = top;
    portraitBtn.style.transform = `translate(-50%, -50%) scale(${scale})`;
    portraitBtn.style.transformOrigin = "center center";
  }

  function renderSVG() {
    const d0 = computePathFromModel(model, performance.now() * 0.001);
    const shaped0 = shapeBlobPath(d0);

    const existing = stage.querySelector(`#${uid}_layers`);
    if (existing) existing.remove();

    const layers = document.createElement("div");
    layers.id = `${uid}_layers`;
    layers.className = "about-blob-layers";
    layers.innerHTML = `
      <div class="blob-media" id="${uid}_media" aria-hidden="true">
        <video
          class="blob-video"
          id="${uid}_video"
          autoplay
          loop
          muted
          playsinline
          webkit-playsinline
          preload="auto"
          aria-hidden="true"
        >
          <source src="${escapeHtml(ABOUT_LOOP_VIDEO)}" type="video/mp4">
        </video>
      </div>
      <div class="blob-mask" id="${uid}_mask" aria-hidden="true">
        <svg class="blob-mask-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path class="blob-mask-fill" id="${uid}_maskFill" d="${toOverlayMaskPath(shaped0)}" fill-rule="evenodd"></path>
        </svg>
      </div>
    `;
    stage.appendChild(layers);

    const media = stage.querySelector(`#${uid}_media`);
    if (media) media.setAttribute("data-blob-media", "true");

    maskFillEl = stage.querySelector(`#${uid}_maskFill`);
    holeEdgeEl = null;

    const video = stage.querySelector(`#${uid}_video`);
    if (video) {
      video.loop = true;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

      const tryPlay = () => {
        const playback = video.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(() => {});
        }
      };

      video.addEventListener("canplay", tryPlay, { once: true });
      video.addEventListener("loadeddata", tryPlay, { once: true });
      window.requestAnimationFrame(tryPlay);
    }
  }

  function startEdgeWarp() {
    stopEdgeWarp();

    function frame(now) {
      const t = now * 0.001;
      const d = computePathFromModel(model, t);
      const shaped = shapeBlobPath(d);

      if (maskFillEl) maskFillEl.setAttribute("d", toOverlayMaskPath(shaped));

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

    window.addEventListener("resize", applyLayout);
    window.addEventListener("orientationchange", applyLayout);
  }

  function destroy() {
    stopEdgeWarp();
    const layers = stage.querySelector(`#${uid}_layers`);
    if (layers) layers.remove();
    maskFillEl = null;
    holeEdgeEl = null;
    window.removeEventListener("resize", applyLayout);
    window.removeEventListener("orientationchange", applyLayout);
  }

  return { mount, destroy };
}

function toOverlayMaskPath(holePath) {
  return `M 0 0 H 100 V 100 H 0 Z ${holePath}`;
}

function shapeBlobPath(d) {
  // Taller/plumper silhouette while preserving center anchoring.
  return scalePathDataXY(d, 0.9, 1.22, 50, 50);
}

function scalePathDataXY(d, sx, sy, cx = 50, cy = 50) {
  let index = 0;
  return d.replace(/-?\d*\.?\d+/g, (token) => {
    const n = Number(token);
    const isX = index % 2 === 0;
    index += 1;
    const c = isX ? cx : cy;
    const s = isX ? sx : sy;
    return ((n - c) * s + c).toFixed(2);
  });
}
