document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  }

  function safeJsonParse(el) {
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.error("[digital] Failed to parse projects-data JSON:", e);
      return [];
    }
  }

  // Required nodes
  const dataEl = $("projects-data");
  const blobLayer = $("blobLayer");
  const allProjects = $("allProjects");

  const modeA = $("modeA");
  const modeB = $("modeB");
  const toggleModeBtn = $("toggleMode");

  const overlay = $("overlay");
  const overlayBackdrop = $("overlayBackdrop");
  const overlayClose = $("overlayClose");
  const overlayContent = $("overlayContent");

  const prevSetBtn = $("prevSet");
  const nextSetBtn = $("nextSet");

  const required = [
    dataEl, blobLayer, allProjects,
    modeA, modeB, toggleModeBtn,
    overlay, overlayBackdrop, overlayClose, overlayContent,
    prevSetBtn, nextSetBtn
  ];

  if (required.some(x => !x)) {
    console.warn("[digital] Missing expected DOM nodes. digital.js will not run on this page.");
    return;
  }

  const projects = safeJsonParse(dataEl);
  console.log("[digital] loaded. projects:", projects.length);

  if (!Array.isArray(projects) || projects.length === 0) {
    allProjects.innerHTML = `<p style="opacity:.7;">No projects found. Add them in your Django view.</p>`;
    return;
  }

  // State
  let currentMode = "A";
  let setIndex = 0;
  const perSetDesktop = 5;

  let idleTimer = null;
  let interactionCooldown = null;
  let isInteracting = false;

  function setMode(nextMode) {
    currentMode = nextMode;

    if (nextMode === "A") {
      modeB.classList.remove("is-active");
      modeA.classList.add("is-active");
      toggleModeBtn.textContent = "View all";
      renderBlobs();
    } else {
      modeA.classList.remove("is-active");
      modeB.classList.add("is-active");
      toggleModeBtn.textContent = "Back to blobs";
      renderAllProjects();
    }
  }

  toggleModeBtn.addEventListener("click", () => {
    setMode(currentMode === "A" ? "B" : "A");
  });

  // Overlay
  function openOverlay(project) {
    const title = escapeHtml(project.title);
    const blurb = escapeHtml(project.blurb || project.tagline || "");
    const url = project.url || "";
    const stack = Array.isArray(project.stack) ? project.stack : [];

    overlayContent.innerHTML = `
      <h2 style="margin:0 0 6px 0;">${title}</h2>
      ${blurb ? `<p style="margin:0 0 12px 0; opacity:.75;">${blurb}</p>` : ""}

      ${stack.length ? `
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin: 0 0 14px 0;">
          ${stack.map(s => `<span style="padding:6px 10px; border:1px solid rgba(0,0,0,0.12); border-radius:999px; font-size: 13px;">${escapeHtml(s)}</span>`).join("")}
        </div>
      ` : ""}

      <div class="cta-row">
        ${url ? `<a class="btn primary" href="${url}" target="_blank" rel="noopener">View project ↗</a>` : ""}
        <button class="btn" type="button" id="overlayBackBtn">Back</button>
      </div>
    `;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    const backBtn = $("overlayBackBtn");
    if (backBtn) backBtn.addEventListener("click", closeOverlay, { once: true });
  }

  function closeOverlay() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  overlayBackdrop.addEventListener("click", closeOverlay);
  overlayClose.addEventListener("click", closeOverlay);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closeOverlay();
  });

  // Cover URL: Django already gives you "/static/img/..."
  function coverUrl(p) {
    return (p.cover || "").trim();
  }

  // Mode B rendering
  let allProjectsRendered = false;

  function renderAllProjects() {
    if (allProjectsRendered) return;

    allProjects.innerHTML = projects.map(p => {
      const cover = coverUrl(p);
      return `
        <div class="proj" data-id="${escapeHtml(p.id)}" role="button" tabindex="0">
          <div class="cover" style="${cover ? `background-image:url('${cover}')` : ""}"></div>
          <div class="proj-meta">
            <div class="proj-title">${escapeHtml(p.title)}</div>
            ${p.tagline ? `<div class="proj-tagline">${escapeHtml(p.tagline)}</div>` : ""}
          </div>
        </div>
      `;
    }).join("");

    allProjects.querySelectorAll(".proj").forEach(el => {
      const open = () => {
        const id = el.getAttribute("data-id");
        const proj = projects.find(x => x.id === id);
        if (proj) openOverlay(proj);
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open();
      });
    });

    allProjectsRendered = true;
  }

  // Blob set math
  function getSet(i) {
    const n = perSetDesktop;
    if (projects.length <= n) return projects;

    const start = (i * n) % projects.length;
    const end = start + n;
    const slice = projects.slice(start, end);
    if (slice.length < n) return slice.concat(projects.slice(0, n - slice.length));
    return slice;
  }

  // Mode A blobs
  function renderBlobs() {
    const set = getSet(setIndex);

    const positions = [
      { left: "6%",  top: "10%", size: 260 },
      { right:"-6%", top: "18%", size: 320 },
      { left: "12%", bottom:"-10%", size: 300 },
      { right:"8%",  bottom:"6%",  size: 240 },
      { left: "42%", top: "6%",   size: 220 },
    ];

    blobLayer.innerHTML = set.map((p, idx) => {
      const pos = positions[idx % positions.length];
      const cover = coverUrl(p);

      const style = `
        ${pos.left ? `left:${pos.left};` : "" }
        ${pos.right ? `right:${pos.right};` : "" }
        ${pos.top ? `top:${pos.top};` : "" }
        ${pos.bottom ? `bottom:${pos.bottom};` : "" }
        width:${pos.size}px; height:${pos.size}px;
      `;

      const shapeStyle = `
        ${cover ? `background-image:url('${cover}');` : ""}
      `;

      return `
        <button class="blob" style="${style}" data-id="${escapeHtml(p.id)}" type="button" aria-label="${escapeHtml(p.title)}">
          <div class="shape" style="${shapeStyle}"></div>
        </button>
      `;
    }).join("");

    blobLayer.querySelectorAll(".blob").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const proj = projects.find(x => x.id === id);
        if (proj) openOverlay(proj);
      });
    });
  }

  prevSetBtn.addEventListener("click", () => {
    setIndex = Math.max(0, setIndex - 1);
    renderBlobs();
  });

  nextSetBtn.addEventListener("click", () => {
    setIndex += 1;
    renderBlobs();
  });

  // Idle swap (Mode A only)
  function resetIdleSwap() {
    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      const overlayOpen = overlay.classList.contains("is-open");
      if (!overlayOpen && currentMode === "A" && !isInteracting) {
        setIndex += 1;
        renderBlobs();
      }
      resetIdleSwap();
    }, 10000);
  }

  function markInteracting() {
    isInteracting = true;
    if (interactionCooldown) clearTimeout(interactionCooldown);
    interactionCooldown = setTimeout(() => {
      isInteracting = false;
    }, 900);
    resetIdleSwap();
  }

  ["mousemove", "touchstart", "scroll", "keydown"].forEach(evt => {
    window.addEventListener(evt, markInteracting, { passive: true });
  });

  // Boot
  renderBlobs();
  renderAllProjects();
  resetIdleSwap();
});
