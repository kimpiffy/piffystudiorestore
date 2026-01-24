import { $, safeJsonParse, mod } from "./utils.js";
import { isMobile, mqMobile, mqTablet, DESKTOP_PAGE_SIZE } from "./state.js";

import { createEdgeWarp } from "./anim/edgeWarp.js";
import { createDesktopDrift } from "./anim/driftDesktop.js";
import { createMobileDrift } from "./anim/driftMobile.js";

import { createOverlay } from "./ui/overlay.js";
import { renderDesktopBlobs } from "./ui/renderDesktop.js";
import { renderMobileOne } from "./ui/renderMobile.js";
import { bindControls } from "./ui/controls.js";

document.addEventListener("DOMContentLoaded", () => {
  const dataEl = $("projects-data");
  const blobLayer = $("blobLayer");
  const navArrows = $("navArrows");
  const prevBtn = $("prevSet");
  const nextBtn = $("nextSet");

  if (!dataEl || !blobLayer || !prevBtn || !nextBtn) {
    console.warn("[digital] Missing core DOM nodes; aborting.");
    return;
  }

  const projects = safeJsonParse(dataEl);
  if (!Array.isArray(projects) || projects.length === 0) {
    blobLayer.innerHTML = `<p style="opacity:.7; position:relative; z-index:2;">No projects found.</p>`;
    if (navArrows) navArrows.style.display = "none";
    return;
  }

  // services
  const edgeWarp = createEdgeWarp(blobLayer);
  const desktopDrift = createDesktopDrift();
  const mobileDrift = createMobileDrift();

  // state
  let setIndex = 0;
  let mobileIndex = 0;

  function stopAll() {
    desktopDrift.stop();
    mobileDrift.stop();
    edgeWarp.stop();
  }

  function updateArrowVisibility() {
    if (!navArrows) return;
    if (isMobile()) navArrows.style.display = "flex";
    else navArrows.style.display = (projects.length > DESKTOP_PAGE_SIZE) ? "flex" : "none";
  }

  const overlay = createOverlay({
    overlay: $("overlay"),
    overlayBackdrop: $("overlayBackdrop"),
    overlayClose: $("overlayClose"),
    overlayContent: $("overlayContent")
  }, {
    onOpen: () => stopAll(),
    onClose: () => render(0)
  });

  function onProjectClick(id) {
    const proj = projects.find(x => String(x.id) === String(id));
    if (proj) overlay.open(proj);
  }

  function render(dir = 0) {
    updateArrowVisibility();
    stopAll();

    if (isMobile()) {
      const { innerEl } = renderMobileOne({
        blobLayer,
        projects,
        index: mobileIndex,
        dir,
        onProjectClick
      });

      // edge warp animates the blob path
      edgeWarp.start();

      // mobile drift animates inner element position (safe vs slide transform)
      mobileDrift.start(blobLayer, innerEl);

      return;
    }

    const { particles } = renderDesktopBlobs({
      blobLayer,
      projects,
      setIndex,
      onProjectClick
    });

    edgeWarp.start();
    desktopDrift.start(blobLayer, particles);
  }

  bindControls({
    blobLayer, prevBtn, nextBtn, isMobile,
    onPrev: () => {
      if (isMobile()) {
        mobileIndex = mod(mobileIndex - 1, projects.length);
        render(-1);
      } else {
        setIndex = Math.max(0, setIndex - 1);
        render(0);
      }
    },
    onNext: () => {
      if (isMobile()) {
        mobileIndex = mod(mobileIndex + 1, projects.length);
        render(1);
      } else {
        setIndex += 1;
        render(0);
      }
    }
  });

  mqMobile.addEventListener?.("change", () => {
    mobileIndex = 0;
    render(0);
  });

  mqTablet.addEventListener?.("change", () => render(0));
  window.addEventListener("resize", () => render(0));

  render(0);
});
