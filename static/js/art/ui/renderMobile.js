import { makeWarpSVG } from "../../digital/blob/svg.js";
import { createBlobModel, computePathFromModel } from "../../digital/blob/model.js";

export function renderMobileOne({ blobLayer, projects, index, dir, onProjectClick }) {
  blobLayer.classList.remove("portfolio-mosaic-host");
  blobLayer.classList.remove("blob-gallery", "static-grid");
  blobLayer.innerHTML = "";
  blobLayer.style.display = "flex";
  blobLayer.style.flexDirection = "column";
  blobLayer.style.alignItems = "center";
  blobLayer.style.gap = "1rem";
  blobLayer.style.width = "100%";
  blobLayer.style.overflow = "visible";

  const stack = projects.map((project) => {
    const uid = `b_${String(project.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random() * 1e9)}`;
    const model = createBlobModel(project.id);
    const initialD = computePathFromModel(model, performance.now() * 0.001);
    const cover = project.cover || project.image || project.src || project.thumbnail || "";

    const item = document.createElement("div");
    item.className = "mobile-blob-stack-item";
    item.style.display = "block";
    item.style.width = "100%";
    item.style.overflow = "visible";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-art-blob";
    button.setAttribute("data-id", String(project.id));
    button.setAttribute("aria-label", project.title || `Project ${project.id}`);
    button.style.width = "min(100vw, 400px)";
    button.style.height = "min(100vw, 400px)";
    button.style.maxWidth = "400px";
    button.style.maxHeight = "400px";
    button.style.border = "0";
    button.style.background = "transparent";
    button.style.padding = "0";
    button.style.cursor = "pointer";
    button.style.display = "block";
    button.style.overflow = "visible";
    button.style.position = "relative";
    button.innerHTML = makeWarpSVG({ uid, cover, title: project.title, initialD, focusY: project.cover_focus_y });

    const title = document.createElement("h3");
    title.className = "mobile-art-title";
    title.style.display = "block";
    title.style.width = "100%";
    title.style.margin = "0.65rem 0 0";
    title.textContent = project.title || "Untitled";

    button.addEventListener("click", () => onProjectClick(project.id));
    button.addEventListener("keydown", (event) => {
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
