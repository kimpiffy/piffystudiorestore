import { makeWarpSVG } from "../../digital/blob/svg.js";
import { createBlobModel, computePathFromModel } from "../../digital/blob/model.js";

export function renderMobileOne({ blobLayer, projects, index, dir, onProjectClick }) {
  blobLayer.classList.remove("portfolio-mosaic-host");
  blobLayer.classList.remove("blob-gallery", "static-grid");
  blobLayer.innerHTML = "";

  const mobileWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const isGridLayout = mobileWidth >= 768 && mobileWidth < 1200;
  const columnCount = mobileWidth >= 992 ? 3 : mobileWidth >= 768 ? 2 : 1;
  const gridCardSize = columnCount === 1 ? 400 : 350;
  const gridWidth = columnCount === 1
    ? "min(100%, calc(100vw - 18px))"
    : columnCount === 2
      ? "min(100%, calc(100vw - 72px))"
      : "min(100%, calc(100vw - clamp(88px, 10vw, 140px)))";

  blobLayer.style.display = isGridLayout ? "grid" : "flex";
  blobLayer.style.gridTemplateColumns = isGridLayout ? `repeat(${columnCount}, minmax(0, 1fr))` : "none";
  blobLayer.style.flexDirection = isGridLayout ? "row" : "column";
  blobLayer.style.alignItems = isGridLayout ? "start" : "center";
  blobLayer.style.justifyItems = isGridLayout ? "center" : "normal";
  blobLayer.style.gap = isGridLayout ? "2rem 1.2rem" : "1rem";
  blobLayer.style.width = "100%";
  blobLayer.style.maxWidth = gridWidth;
  blobLayer.style.margin = "0 auto";
  blobLayer.style.overflow = "visible";
  blobLayer.style.minHeight = "auto";
  blobLayer.style.paddingBottom = "2.5rem";

  const stack = projects.map((project) => {
    const uid = `b_${String(project.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random() * 1e9)}`;
    const model = createBlobModel(project.id);
    const initialD = computePathFromModel(model, performance.now() * 0.001);
    const cover = project.cover || project.image || project.src || project.thumbnail || "";

    const item = document.createElement("div");
    item.className = "mobile-blob-stack-item";
    item.style.display = "flex";
    item.style.flexDirection = "column";
    item.style.alignItems = "center";
    item.style.width = "100%";
    item.style.maxWidth = isGridLayout ? `${gridCardSize}px` : "100%";
    item.style.overflow = "visible";
    item.style.margin = "0 auto 0.25rem";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-art-blob";
    button.setAttribute("data-id", String(project.id));
    button.setAttribute("aria-label", project.title || `Project ${project.id}`);
    button.style.width = isGridLayout ? `${gridCardSize}px` : "min(100vw, 400px)";
    button.style.height = isGridLayout ? `${gridCardSize}px` : "min(100vw, 400px)";
    button.style.maxWidth = isGridLayout ? `${gridCardSize}px` : "400px";
    button.style.maxHeight = isGridLayout ? `${gridCardSize}px` : "400px";
    button.style.border = "0";
    button.style.background = "transparent";
    button.style.padding = "0";
    button.style.cursor = "pointer";
    button.style.display = "block";
    button.style.overflow = "visible";
    button.style.position = "relative";
    button.innerHTML = makeWarpSVG({ uid, cover, title: project.title, initialD, focusY: project.cover_focus_y });

    const title = document.createElement("button");
    title.type = "button";
    title.className = "mobile-art-title";
    title.style.display = "block";
    title.style.width = "100%";
    title.style.margin = "0.65rem 0 0";
    title.style.border = "0";
    title.style.background = "transparent";
    title.style.padding = "0";
    title.style.cursor = "pointer";
    title.textContent = project.title || "Untitled";

    button.setAttribute("data-project-id", String(project.id));
    button.setAttribute("data-id", String(project.id));
    title.setAttribute("data-project-id", String(project.id));
    title.setAttribute("data-id", String(project.id));

    button.addEventListener("click", () => onProjectClick(project.id));
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onProjectClick(project.id);
      }
    });

    title.addEventListener("click", () => onProjectClick(project.id));
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onProjectClick(project.id);
      }
    });

    item.appendChild(button);
    item.appendChild(title);
    blobLayer.appendChild(item);
    return item;
  });

  return { items: stack };
}
