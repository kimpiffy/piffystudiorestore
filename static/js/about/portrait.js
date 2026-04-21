// static/js/about/portrait.js
import { escapeHtml } from "./utils.js";
import { ABOUT_LOOP_VIDEO } from "./config.js";
import { createBlobModel, computePathFromModel } from "./blob/model.js";

export function createPortraitController(portraitBtn) {
  const uid = `p_${Math.floor(Math.random() * 1e9)}`;
  const model = createBlobModel(uid);

  let edgeRAF = null;

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
      isPhone && isLandscape ? "40%" :
      isPhone ? "35%" :
      "50%";

    portraitBtn.style.left = "50%";
    portraitBtn.style.top = top;
    portraitBtn.style.transform = `translate(-50%, -50%) scale(${scale})`;
    portraitBtn.style.transformOrigin = "center center";
  }

  function renderSVG() {
    const d0 = computePathFromModel(model, performance.now() * 0.001);

    portraitBtn.innerHTML = `
      <svg class="blob-svg"
           xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 100 100"
           data-uid="${uid}"
           aria-hidden="true"
           focusable="false">
        <defs>
          <clipPath id="${uid}_clip">
            <path id="${uid}_path" d="${d0}"></path>
          </clipPath>
        </defs>

        <g clip-path="url(#${uid}_clip)">
          <foreignObject x="0" y="0" width="100" height="100">
            <div xmlns="http://www.w3.org/1999/xhtml" class="blob-media" id="${uid}_media" aria-hidden="true">
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
              <div class="blob-shade" aria-hidden="true"></div>
            </div>
          </foreignObject>
        </g>

        <path class="blob-outline" id="${uid}_outline" d="${d0}" fill="none"></path>
      </svg>
    `;

    const media = portraitBtn.querySelector(`#${uid}_media`);
    if (media) media.setAttribute("data-blob-media", "true");

    const video = portraitBtn.querySelector(`#${uid}_video`);
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
