import { $, safeJsonParse, mod } from "../digital/utils.js";
import { isMobile, mqMobile, mqTablet } from "../digital/state.js";

import { createEdgeWarp } from "../digital/anim/edgeWarp.js";
import { createMobileDrift } from "../digital/anim/driftMobile.js";

import { createOverlay } from "../digital/ui/overlay.js";
import { renderMobileOne } from "../digital/ui/renderMobile.js";
import { bindControls } from "../digital/ui/controls.js";
import { makeWarpSVG } from "../digital/blob/svg.js";
import { createBlobModel, computePathFromModel } from "../digital/blob/model.js";

function getProject(projects, index) {
  return projects[mod(index, projects.length)];
}

function coverUrl(project) {
  const candidate = project && (project.cover || project.image || project.src || project.thumbnail || "");
  return String(candidate).trim();
}

document.addEventListener("DOMContentLoaded", () => {
  const dataEl = $("projects-data");
  const blobLayer = $("blobLayer");
  const navArrows = $("navArrows");
  const titleChip = $("projectTitleChip");
  const prevBtn = $("prevSet");
  const nextBtn = $("nextSet");

  if (!dataEl || !blobLayer || !prevBtn || !nextBtn) {
    console.warn("[people] Missing core DOM nodes; aborting.");
    return;
  }

  const projects = safeJsonParse(dataEl);
  if (!Array.isArray(projects) || projects.length === 0) {
    blobLayer.innerHTML = `<p style="opacity:.7; position:relative; z-index:2;">No projects found.</p>`;
    if (navArrows) navArrows.style.display = "none";
    return;
  }

  const edgeWarp = createEdgeWarp(blobLayer);
  const mobileDrift = createMobileDrift();

  let activeIndex = 0;
  let mobileIndex = 0;
  let carouselSlots = [];
  let carouselReady = false;
  let carouselSlotCount = 0;

  function stopAll() {
    mobileDrift.stop();
    edgeWarp.stop();
  }

  function updateArrowVisibility() {
    if (!navArrows) return;
    navArrows.style.display = projects.length > 1 ? "flex" : "none";
  }

  const overlay = createOverlay({
    overlay: $("overlay"),
    overlayBackdrop: $("overlayBackdrop"),
    overlayClose: $("overlayClose"),
    overlayContent: $("overlayContent")
  }, {
    onOpen: () => stopAll(),
    onClose: () => render(0),
    ctaLabel: "Learn More"
  });

  function openProject(project) {
    if (project) overlay.open(project);
  }

  function updateTitleChip() {
    if (!titleChip) return;

    const project = getProject(projects, isMobile() ? mobileIndex : activeIndex);
    if (!project) return;

    titleChip.textContent = project.title || "Project";
    titleChip.setAttribute("aria-label", `Open ${project.title}`);
    titleChip.dataset.projectId = String(project.id);
    titleChip.onclick = () => openProject(project);
  }

  function getDesktopLayout() {
    return {
      classes: ["people-carousel__slot--left", "people-carousel__slot--center", "people-carousel__slot--right"],
      offsets: [-1, 0, 1]
    };
  }

  function slotSizeForRole(roleClass) {
    if (roleClass.includes("--center")) return "min(87vw, 1188px)";
    return "min(53.125vw, 688px)";
  }

  function ariaLabelForRole(roleClass, project) {
    if (roleClass.includes("--center")) return `Open ${project.title}`;
    if (roleClass.includes("--left")) return `Previous project ${project.title}`;
    return `Next project ${project.title}`;
  }

  function ensureCarouselShell() {
    const { classes } = getDesktopLayout();
    const desiredSlotCount = classes.length;

    if (
      carouselReady &&
      carouselSlotCount === desiredSlotCount &&
      blobLayer.querySelector(".people-carousel__slot")
    ) {
      return;
    }

    blobLayer.classList.remove("mobile-stack");
    blobLayer.classList.add("people-carousel");
    blobLayer.innerHTML = classes
      .map(
        (roleClass) =>
          `<button class="blob people-carousel__slot ${roleClass}" type="button" aria-label="Project"></button>`
      )
      .join("");

    carouselSlots = Array.from(blobLayer.querySelectorAll(".people-carousel__slot"));
    carouselReady = true;
    carouselSlotCount = desiredSlotCount;
  }

  function rotateLeft() {
    carouselSlots.push(carouselSlots.shift());
  }

  function rotateRight() {
    carouselSlots.unshift(carouselSlots.pop());
  }

  function renderDesktop() {
    const { classes: positionClasses, offsets: slotOffsets } = getDesktopLayout();
    ensureCarouselShell();

    carouselSlots.forEach((slot, positionIndex) => {
      const roleClass = positionClasses[positionIndex];
      const slotSize = slotSizeForRole(roleClass);
      const project = getProject(projects, activeIndex + slotOffsets[positionIndex]);
      const uid = `b_${String(project.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random() * 1e9)}`;
      const model = createBlobModel(project.id);
      const initialD = computePathFromModel(model, performance.now() * 0.001);

      slot.className = `blob people-carousel__slot ${roleClass}`;
      slot.style.width = slotSize;
      slot.style.height = slotSize;
      slot.setAttribute("data-id", String(project.id));
      slot.setAttribute("data-role", roleClass);
      slot.setAttribute("aria-label", ariaLabelForRole(roleClass, project));
      slot.innerHTML = makeWarpSVG({ uid, cover: coverUrl(project), title: project.title, initialD, focusY: project.cover_focus_y });

      if (!slot.dataset.bound) {
        slot.addEventListener("click", () => {
          const currentRole = slot.getAttribute("data-role") || "";
          const currentId = slot.getAttribute("data-id") || "";
          const currentProject = projects.find((item) => String(item.id) === String(currentId));

          if (currentRole.includes("people-carousel__slot--left")) {
            activeIndex = mod(activeIndex - 1, projects.length);
            rotateRight();
            render(0);
            return;
          }

          if (currentRole.includes("people-carousel__slot--right")) {
            activeIndex = mod(activeIndex + 1, projects.length);
            rotateLeft();
            render(0);
            return;
          }

          openProject(currentProject);
        });
        slot.dataset.bound = "1";
      }
    });

    edgeWarp.start();
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
        onProjectClick: (id) => {
          const proj = projects.find((x) => String(x.id) === String(id));
          openProject(proj);
        },
        mobileSizeVw: 100
      });

      edgeWarp.start();
      mobileDrift.start(blobLayer, innerEl);
      return;
    }

    renderDesktop();
  }

  bindControls({
    blobLayer,
    prevBtn,
    nextBtn,
    isMobile,
    onPrev: () => {
      if (isMobile()) {
        mobileIndex = mod(mobileIndex - 1, projects.length);
        render(-1);
        return;
      }

      activeIndex = mod(activeIndex - 1, projects.length);
      rotateRight();
      render(0);
    },
    onNext: () => {
      if (isMobile()) {
        mobileIndex = mod(mobileIndex + 1, projects.length);
        render(1);
        return;
      }

      activeIndex = mod(activeIndex + 1, projects.length);
      rotateLeft();
      render(0);
    }
  });

  mqMobile.addEventListener?.("change", () => {
    mobileIndex = 0;
    render(0);
  });

  titleChip?.addEventListener("click", () => {
    const project = getProject(projects, isMobile() ? mobileIndex : activeIndex);
    if (project) openProject(project);
  });

  mqTablet.addEventListener?.("change", () => render(0));
  window.addEventListener("resize", () => render(0));

  render(0);
});
