import { buildMosaicMarkup, getMosaicSpec } from "../mosaicLayout.js";

export function renderMobileOne({ blobLayer, projects, index, dir, onProjectClick }) {

  blobLayer.classList.remove("blob-gallery", "static-grid");
  blobLayer.classList.add("portfolio-mosaic-host");
  blobLayer.innerHTML = buildMosaicMarkup(projects);

  const cells = Array.from(blobLayer.querySelectorAll(".portfolio-cell"));
  cells.forEach((cell) => {
    const index = Number(cell.getAttribute("data-index") || 0);
    const project = projects[index % projects.length];
    const spec = getMosaicSpec(index);
    const id = cell.getAttribute("data-id");

    cell.addEventListener("click", () => onProjectClick(id, project, spec));
    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onProjectClick(id, project, spec);
      }
    });
  });

  return {};
}
