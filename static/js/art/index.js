import { $, safeJsonParse, mod } from "./utils.js";
import { isMobile, isMasonryDesktop, mqMobile, mqTablet, DESKTOP_PAGE_SIZE } from "./state.js";

import { createEdgeWarp } from "../digital/anim/edgeWarp.js";
import { createMobileDrift } from "../digital/anim/driftMobile.js";

import { createOverlay } from "./ui/overlay.js";
import { renderDesktopBlobs } from "./ui/renderDesktop.js";
import { renderMobileOne } from "./ui/renderMobile.js";
import { bindControls } from "./ui/controls.js";
import { getMosaicSpec } from "./mosaicLayout.js";

document.addEventListener("DOMContentLoaded", () => {
  const dataEl = $("projects-data");
  const blobLayer = $("blobLayer");
  const navArrows = $("navArrows");
  const prevBtn = $("prevSet");
  const nextBtn = $("nextSet");

  if (!dataEl || !blobLayer || !prevBtn || !nextBtn) {
    console.warn("[art] Missing core DOM nodes; aborting.");
    return;
  }

  const projects = safeJsonParse(dataEl);
  if (!Array.isArray(projects) || projects.length === 0) {
    blobLayer.innerHTML = `<p style="opacity:.7; position:relative; z-index:2;">No projects found.</p>`;
    if (navArrows) navArrows.style.display = "none";
    return;
  }

  // state
  let setIndex = 0;
  let mobileIndex = 0;

  const edgeWarp = createEdgeWarp(blobLayer);
  const mobileDrift = createMobileDrift();

  function stopAll() {
    mobileDrift.stop();
    edgeWarp.stop();
  }

  function updateArrowVisibility() {
    if (!navArrows) return;
    navArrows.style.display = isMobile() ? "flex" : "none";
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

  function onProjectClick(id, project, spec) {
    const proj = project || projects.find(x => String(x.id) === String(id));
    if (!proj) return;

    const resolvedSpec = spec || getMosaicSpec(mobileIndex);
    overlay.open(proj, resolvedSpec);
  }

  function render(dir = 0) {
    updateArrowVisibility();
    stopAll();

    const useGridLayout = window.innerWidth >= 768 && window.innerWidth < 1200;

    if (isMobile()) {
      const { innerEl } = renderMobileOne({
        blobLayer,
        projects,
        index: mobileIndex,
        dir,
        onProjectClick: (id) => {
          const proj = projects.find((item) => String(item.id) === String(id));
          if (proj) overlay.open(proj, getMosaicSpec(mobileIndex));
        },
        mobileSizeVw: 130
      });

      edgeWarp.start();
      mobileDrift.start(blobLayer, innerEl);
      return;
    }

    if (useGridLayout) {
      const { innerEl } = renderMobileOne({
        blobLayer,
        projects,
        index: mobileIndex,
        dir,
        onProjectClick: (id) => {
          const proj = projects.find((item) => String(item.id) === String(id));
          if (proj) overlay.open(proj, getMosaicSpec(mobileIndex));
        },
        mobileSizeVw: 130
      });

      edgeWarp.start();
      mobileDrift.start(blobLayer, innerEl);
      return;
    }

    if (isMasonryDesktop()) {
      const { particles } = renderDesktopBlobs({
        blobLayer,
        projects,
        setIndex,
        onProjectClick
      });

      edgeWarp.start();
      return;
    }

    const { innerEl } = renderMobileOne({
      blobLayer,
      projects,
      index: mobileIndex,
      dir,
      onProjectClick: (id) => {
        const proj = projects.find((item) => String(item.id) === String(id));
        if (proj) overlay.open(proj, getMosaicSpec(mobileIndex));
      },
      mobileSizeVw: 130
    });

    edgeWarp.start();
    mobileDrift.start(blobLayer, innerEl);
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
