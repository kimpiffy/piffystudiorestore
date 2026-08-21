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
  const titleChip = $("projectTitleChip");
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

  function getActiveProject() {
    if (isMobile()) {
      return projects[mobileIndex % projects.length];
    }
    return projects[setIndex % projects.length];
  }

  function updateTitleChip() {
    if (!titleChip) return;

    const project = getActiveProject();
    if (!project) return;

    titleChip.textContent = project.title || "Project";
    titleChip.setAttribute("aria-label", `Open ${project.title}`);
    titleChip.dataset.projectId = String(project.id);
    titleChip.onclick = () => onProjectClick(project.id);
  }

  function getBlobScale() {
    const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const height = window.innerHeight || document.documentElement.clientHeight || screen.height;

    if (width >= 768 && width < 992) {
      const base = Math.min(width * 0.39, height * 0.43);
      const clamped = Math.min(Math.max(base, 300), 390);
      return clamped / 520;
    }

    if (width >= 992 && width < 1200) return 0.75;
    return 1;
  }

  function getMobileBlobSizeVw() {
    const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
    if (width >= 768 && width < 1200) return 75;
    return 100;
  }

  function render(dir = 0) {
    updateArrowVisibility();
    updateTitleChip();
    stopAll();

    if (isMobile()) {
      const { innerEl } = renderMobileOne({
        blobLayer,
        projects,
        index: mobileIndex,
        dir,
        onProjectClick,
        mobileSizeVw: getMobileBlobSizeVw()
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
      blobScale: getBlobScale(),
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

  titleChip?.addEventListener("click", () => {
    const project = getActiveProject();
    if (project) onProjectClick(project.id);
  });

  mqTablet.addEventListener?.("change", () => render(0));
  window.addEventListener("resize", () => render(0));

  render(0);
});
