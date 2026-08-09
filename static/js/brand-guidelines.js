const pagesRoot = document.getElementById("pdfPages");
const pageMeta = document.getElementById("pdfPageMeta");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

const PDFJS_SOURCES = [
  {
    module: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs",
    worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs",
  },
  {
    module: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs",
    worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs",
  },
  {
    module: "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.min.mjs",
    worker: "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs",
  },
];

let pdfDoc = null;
let currentPage = 1;
let isRendering = false;
let pendingPage = null;
let canvas = null;
let pdfjsLib = null;
let useIframeFallback = false;

function setMeta(text, hidden = false) {
  if (!pageMeta) return;
  pageMeta.textContent = text;
  pageMeta.classList.toggle("is-hidden", hidden);
}

function updateControls() {
  if (useIframeFallback) {
    if (prevBtn) {
      prevBtn.style.display = "inline-block";
      prevBtn.disabled = currentPage <= 1;
    }

    if (nextBtn) {
      nextBtn.style.display = "inline-block";
      nextBtn.disabled = false;
    }

    setMeta(`Page ${currentPage}`);
    return;
  }

  const totalPages = pdfDoc?.numPages || 0;
  const hasMultiple = totalPages > 1;

  if (prevBtn) {
    prevBtn.style.display = hasMultiple ? "inline-block" : "none";
    prevBtn.disabled = !hasMultiple || currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.style.display = hasMultiple ? "inline-block" : "none";
    nextBtn.disabled = !hasMultiple || currentPage >= totalPages;
  }

  if (!totalPages) {
    setMeta("", true);
    return;
  }

  setMeta(`Page ${currentPage} of ${totalPages}`);
}

function getPageViewport(page) {
  const availableWidth = Math.max(pagesRoot.clientWidth - 24, 280);
  const availableHeight = Math.max(pagesRoot.clientHeight - 16, 200);

  const baseViewport = page.getViewport({ scale: 1 });
  const widthScale = availableWidth / baseViewport.width;
  const heightScale = availableHeight / baseViewport.height;
  const scale = Math.max(Math.min(widthScale, heightScale), 0.2);

  return page.getViewport({ scale });
}

async function renderPage(pageNumber) {
  if (!pdfDoc || !pagesRoot) return;

  isRendering = true;

  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = getPageViewport(page);

    if (!canvas) {
      pagesRoot.innerHTML = "";

      const pageWrap = document.createElement("section");
      pageWrap.className = "pdf-page";
      pageWrap.setAttribute("aria-label", "Brand guidelines page");

      canvas = document.createElement("canvas");
      canvas.className = "pdf-canvas";

      pageWrap.appendChild(canvas);
      pagesRoot.appendChild(pageWrap);
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    await page.render({ canvasContext: context, viewport }).promise;

    currentPage = pageNumber;
    updateControls();
  } catch (error) {
    enableIframeFallback();
  } finally {
    isRendering = false;

    if (pendingPage !== null) {
      const targetPage = pendingPage;
      pendingPage = null;
      renderPage(targetPage);
    }
  }
}

function queueRender(pageNumber) {
  if (useIframeFallback) {
    const boundedPage = Math.max(pageNumber, 1);
    renderIframePage(boundedPage);
    return;
  }

  const totalPages = pdfDoc?.numPages || 0;
  if (!totalPages) return;

  const boundedPage = Math.min(Math.max(pageNumber, 1), totalPages);
  if (isRendering) {
    pendingPage = boundedPage;
    return;
  }

  renderPage(boundedPage);
}

async function loadPdfJs() {
  for (const source of PDFJS_SOURCES) {
    try {
      const imported = await import(source.module);
      if (imported?.getDocument) {
        imported.GlobalWorkerOptions.workerSrc = source.worker;
        return imported;
      }
    } catch (error) {
      // Try the next CDN source.
    }
  }

  return null;
}

function renderIframePage(pageNumber) {
  if (!pagesRoot) return;

  const pdfUrl = pagesRoot.dataset.pdfUrl;
  if (!pdfUrl) return;

  currentPage = Math.max(pageNumber, 1);
  pagesRoot.innerHTML = `
    <section class="pdf-page" aria-label="Brand guidelines page">
      <iframe
        class="pdf-iframe"
        title="Brand guidelines PDF"
        src="${pdfUrl}#page=${currentPage}&view=FitH"
      ></iframe>
    </section>
  `;

  updateControls();
}

function enableIframeFallback() {
  useIframeFallback = true;
  renderIframePage(1);
}

function bindEvents() {
  prevBtn?.addEventListener("click", () => queueRender(currentPage - 1));
  nextBtn?.addEventListener("click", () => queueRender(currentPage + 1));

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") queueRender(currentPage - 1);
    if (event.key === "ArrowRight") queueRender(currentPage + 1);
  });

  window.addEventListener("resize", () => {
    if (!pdfDoc) return;
    queueRender(currentPage);
  });
}

async function renderPdfPages() {
  if (!pagesRoot) return;

  const pdfUrl = pagesRoot.dataset.pdfUrl;
  if (!pdfUrl) {
    pagesRoot.innerHTML = '<p class="pdf-error">Document URL is missing.</p>';
    setMeta("", true);
    return;
  }

  try {
    pdfjsLib = await loadPdfJs();
    if (!pdfjsLib) {
      enableIframeFallback();
      return;
    }

    const task = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: true });
    pdfDoc = await task.promise;
    currentPage = 1;

    bindEvents();
    updateControls();
    queueRender(currentPage);
  } catch (err) {
    enableIframeFallback();
    console.error("PDF render failed", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderPdfPages);
} else {
  renderPdfPages();
}
