// static/js/digital.js
// Continuous movement + continuous water-like edge ripples (no discrete states, no pauses).
// - Desktop/tablet: blobs drift forever; they can go offscreen but are pulled back in sooner.
// - Mobile (<768px): vertical list (CSS handles layout), edges still ripple.

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function safeJsonParse(el) {
    try { return JSON.parse(el.textContent); }
    catch (e) { console.error("[digital] JSON parse failed:", e); return []; }
  }

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

  const required = [dataEl, blobLayer, allProjects, modeA, modeB, toggleModeBtn, overlay, overlayBackdrop, overlayClose, overlayContent, prevSetBtn, nextSetBtn];
  if (required.some(x => !x)) {
    console.warn("[digital] Missing DOM nodes; aborting.");
    return;
  }

  const projects = safeJsonParse(dataEl);
  if (!Array.isArray(projects) || projects.length === 0) {
    allProjects.innerHTML = `<p style="opacity:.7;">No projects found.</p>`;
    return;
  }

  function coverUrl(p) {
    return (p && p.cover ? String(p.cover) : "").trim();
  }

  // Breakpoint 768
  const mqMobile = window.matchMedia("(max-width: 767px)");
  const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");
  const isMobile = () => mqMobile.matches;
  const isTablet = () => mqTablet.matches;

  let currentMode = "A";
  let setIndex = 0;

  // ----------------------------
  // Deterministic RNG
  // ----------------------------
  function hashToSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ----------------------------
  // Geometry helpers (super round)
  // ----------------------------
  function chaikin(points, iterations = 2) {
    let pts = points.slice();
    for (let it = 0; it < iterations; it++) {
      const out = [];
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % n];
        out.push(
          { x: 0.75*p0.x + 0.25*p1.x, y: 0.75*p0.y + 0.25*p1.y },
          { x: 0.25*p0.x + 0.75*p1.x, y: 0.25*p0.y + 0.75*p1.y }
        );
      }
      pts = out;
    }
    return pts;
  }

  function pointsToBezier(points) {
    const pts = points;
    const n = pts.length;
    const t = 0.18;
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];

      const c1x = p1.x + (p2.x - p0.x) * t;
      const c1y = p1.y + (p2.y - p0.y) * t;
      const c2x = p2.x - (p3.x - p1.x) * t;
      const c2y = p2.y - (p3.y - p1.y) * t;

      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d + " Z";
  }

  // Base radii + ripple params (make ripple unmistakable)
  function buildBaseRadii(id, N) {
    const rnd = mulberry32(hashToSeed(id || "x"));

    const baseR = 34 + rnd()*5;
    const amp1 = 4 + rnd()*5;
    const amp2 = 2 + rnd()*4;
    const f1 = 3 + Math.floor(rnd()*4);
    const f2 = 6 + Math.floor(rnd()*4);
    const p1 = rnd()*Math.PI*2;
    const p2 = rnd()*Math.PI*2;

    const radii = new Array(N);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      let r = baseR
        + Math.sin(a*f1 + p1)*amp1
        + Math.sin(a*f2 + p2)*amp2;
      r = Math.max(30, Math.min(46, r));
      radii[i] = r;
    }

    // ✅ Stronger, faster, more complex water ripple (still rounded)
    const rip = {
      amps: [
        2.0 + rnd()*1.2,
        1.4 + rnd()*1.0,
        1.0 + rnd()*0.8,
        0.75 + rnd()*0.7,
        0.55 + rnd()*0.55
      ],
      freqs: [
        2 + Math.floor(rnd()*4),   // 2–5
        4 + Math.floor(rnd()*5),   // 4–8
        7 + Math.floor(rnd()*6),   // 7–12
        11 + Math.floor(rnd()*7),  // 11–17
        16 + Math.floor(rnd()*7)   // 16–22
      ],
      phases: [
        rnd()*Math.PI*2,
        rnd()*Math.PI*2,
        rnd()*Math.PI*2,
        rnd()*Math.PI*2,
        rnd()*Math.PI*2
      ],
      speeds: [
        2.1 + rnd()*1.2,
        1.8 + rnd()*1.1,
        1.4 + rnd()*1.0,
        1.2 + rnd()*0.9,
        1.0 + rnd()*0.8
      ],
      strength: 1.25 + rnd()*0.60
    };

    return { radii, rip };
  }

  function createBlobModel(id) {
    const N = 10; // more points = more “water” detail
    const base = buildBaseRadii(id, N);
    const angles = new Array(N);
    for (let i = 0; i < N; i++) angles[i] = (i / N) * Math.PI * 2;
    return { id, N, angles, baseR: base.radii, rip: base.rip };
  }

  function computePathFromModel(model, timeSec) {
    const cx = 50, cy = 50;
    const pts = [];
    const { N, angles, baseR, rip } = model;

    for (let i = 0; i < N; i++) {
      const a = angles[i];
      let r = baseR[i];

      let dr = 0;
      for (let k = 0; k < rip.amps.length; k++) {
        dr += Math.sin(a * rip.freqs[k] + rip.phases[k] + timeSec * rip.speeds[k]) * rip.amps[k];
      }

      r += dr * rip.strength;

      // Allow ripple room but keep round
      r = Math.max(26, Math.min(52, r));

      pts.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r });
    }

    const smooth = chaikin(pts, 2);
    return pointsToBezier(smooth);
  }

  // ----------------------------
  // SVG markup (IMPORTANT: ids must match binder)
  // ----------------------------
  function makeWarpSVG({ uid, cover, title, initialD }) {
    return `
      <svg class="blob-svg" viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(title)}" data-uid="${uid}">
        <defs>
          <clipPath id="${uid}_clip">
            <path id="${uid}_path" d="${initialD}"></path>
          </clipPath>
        </defs>

        <g clip-path="url(#${uid}_clip)">
          ${cover
            ? `<image href="${cover}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"></image>`
            : `<rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.08)"></rect>`
          }
        </g>

        <path id="${uid}_outline" d="${initialD}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1.0"></path>
      </svg>
    `;
  }

  // ----------------------------
  // Continuous loops
  // ----------------------------
  let edgeRAF = null;
  let moveRAF = null;
  let edgeRunning = false;
  let moveRunning = false;

  let blobVisuals = []; // { model, pathEl, outlineEl }
  let particles = [];   // movement particles
  let lastMove = performance.now();

  function rebuildBlobVisualsFromDOM() {
  const buttons = Array.from(blobLayer.querySelectorAll(".blob"));
  const visuals = [];

  for (const btn of buttons) {
    const id = btn.getAttribute("data-id");
    const svg = btn.querySelector("svg[data-uid]");
    if (!id || !svg) continue;

    const uid = svg.getAttribute("data-uid");
    const pathEl = svg.querySelector(`#${uid}_path`);
    const outlineEl = svg.querySelector(`#${uid}_outline`);
    if (!uid || !pathEl || !outlineEl) continue;

    // IMPORTANT: reuse the same model per id each time
    const model = createBlobModel(id);
    visuals.push({ model, pathEl, outlineEl });
  }

  blobVisuals = visuals;
}

  function stopEdgeLoop() {
    edgeRunning = false;
    if (edgeRAF) cancelAnimationFrame(edgeRAF);
    edgeRAF = null;
    blobVisuals = [];
  }

  function stopMoveLoop() {
    moveRunning = false;
    if (moveRAF) cancelAnimationFrame(moveRAF);
    moveRAF = null;
    // keep particles allocated by renderBlobs
  }

 function startEdgeLoop() {
  stopEdgeLoop();
  edgeRunning = true;

  function frame(now) {
    if (!edgeRunning) return;

    // ✅ self-heal binding if it's empty (or if something changed)
    if (!blobVisuals || blobVisuals.length === 0) {
      rebuildBlobVisualsFromDOM();
    }

    // If still nothing, keep trying.
    if (!blobVisuals || blobVisuals.length === 0) {
      edgeRAF = requestAnimationFrame(frame);
      return;
    }

    const t = now * 0.001;

    for (const bv of blobVisuals) {
      const d = computePathFromModel(bv.model, t);

      // Use setAttributeNS for robustness in SVG
      bv.pathEl.setAttributeNS(null, "d", d);
      bv.outlineEl.setAttributeNS(null, "d", d);
    }

    edgeRAF = requestAnimationFrame(frame);
  }

  edgeRAF = requestAnimationFrame(frame);
}


  function startMoveLoop(containerEl) {
    if (isMobile()) return;

    moveRunning = true;
    if (moveRAF) cancelAnimationFrame(moveRAF);
    moveRAF = null;
    lastMove = performance.now();

    const rect = () => containerEl.getBoundingClientRect();

    const cfg = {
      // pull back inward sooner
      offLeft: -140,
      offRight: -140,
      offTop: -180,
      offBottom: -30, // bottom tighter

      padding: 10,
      edgePush: 0.020, // stronger edge push

      // always moving
      flowStrength: 0.26,
      swirlStrength: 0.10,
      noiseStrength: 0.14,
      maxSpeed: 0.60,
      damping: 0.992,
      minSpeed: 0.22,

      repel: 0.12,

      // center pull (brings back in sooner without looking “stuck”)
      centerPull: 0.0009,

      // reduce top-left camping
      avoidTLStrength: 0.028,
      avoidTLRadiusFrac: 0.40
    };

    function safeNumber(v, fallback) {
      return Number.isFinite(v) ? v : fallback;
    }

    function frame(now) {
      if (!moveRunning) return;

      let dt = (now - lastMove) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = Math.max(0.008, Math.min(0.033, dt));
      lastMove = now;

      const cr = rect();
      const W = cr.width, H = cr.height;

      const cx = W * 0.60;
      const cy = H * 0.48;

      // repulsion
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const min = a.radius + b.radius;
          if (dist < min) {
            const overlap = (min - dist) / min;
            const nx = dx / dist, ny = dy / dist;
            const push = overlap * cfg.repel * 80;
            if (!a.grabbed) { a.vx -= nx * push; a.vy -= ny * push; }
            if (!b.grabbed) { b.vx += nx * push; b.vy += ny * push; }
          }
        }
      }

      const tlx = W * 0.18;
      const tly = H * 0.18;
      const tlR = Math.min(W, H) * cfg.avoidTLRadiusFrac;

      for (const p of particles) {
        const t = now * 0.00055;

        const fx =
          Math.sin(t * 1.7 + p.px * 0.01) +
          Math.sin(t * 2.6 + (p.y + p.py) * 0.006) +
          Math.cos(t * 1.1 + (p.x + p.px) * 0.004);

        const fy =
          Math.cos(t * 1.5 + p.py * 0.01) -
          Math.cos(t * 2.3 + (p.x + p.px) * 0.006) +
          Math.sin(t * 1.2 + (p.y + p.py) * 0.004);

        const dxC = p.x - cx;
        const dyC = p.y - cy;
        const swirlX = -dyC * 0.00065;
        const swirlY =  dxC * 0.00065;

        const wigX = Math.sin(t * 5.2 + p.ph) * cfg.noiseStrength;
        const wigY = Math.cos(t * 4.9 + p.ph) * cfg.noiseStrength;

        if (p.grabbed) {
          p.vx *= 0.75;
          p.vy *= 0.75;
        } else {
          p.vx += (fx * cfg.flowStrength + swirlX * cfg.swirlStrength + wigX + p.biasX) * dt * 60;
          p.vy += (fy * cfg.flowStrength + swirlY * cfg.swirlStrength + wigY + p.biasY) * dt * 60;
        }

        // center pull (brings blobs back in)
        p.vx += (cx - p.x) * cfg.centerPull;
        p.vy += (cy - p.y) * cfg.centerPull;

        // avoid top-left
        const dxTL = p.x - tlx;
        const dyTL = p.y - tly;
        const dTL = Math.hypot(dxTL, dyTL) || 0.0001;
        if (dTL < tlR) {
          const push = (1 - dTL / tlR) * cfg.avoidTLStrength * 60;
          p.vx += (dxTL / dTL) * push;
          p.vy += (dyTL / dTL) * push;
        }

        p.vx *= cfg.damping;
        p.vy *= cfg.damping;

        // never-stall injector
        if (!p.grabbed) {
          const sp = Math.hypot(p.vx, p.vy) || 0.0001;
          if (sp < cfg.minSpeed) {
            const dirx = fx + wigX * 0.5 + 0.0001;
            const diry = fy + wigY * 0.5 + 0.0001;
            const dnorm = Math.hypot(dirx, diry) || 1;
            p.vx += (dirx / dnorm) * (cfg.minSpeed - sp) * 0.9;
            p.vy += (diry / dnorm) * (cfg.minSpeed - sp) * 0.9;
          }
        }

        // bounds (pull in sooner)
        const minX = cfg.offLeft + cfg.padding;
        const maxX = W - cfg.offRight - cfg.padding;
        const minY = cfg.offTop + cfg.padding;
        const maxY = H - cfg.offBottom - cfg.padding;

        if (p.x < minX) p.vx += (minX - p.x) * cfg.edgePush;
        if (p.x > maxX) p.vx -= (p.x - maxX) * cfg.edgePush;
        if (p.y < minY) p.vy += (minY - p.y) * cfg.edgePush;
        if (p.y > maxY) p.vy -= (p.y - maxY) * cfg.edgePush;

        const sp2 = Math.hypot(p.vx, p.vy) || 0.0001;
        if (sp2 > cfg.maxSpeed) {
          p.vx = (p.vx / sp2) * cfg.maxSpeed;
          p.vy = (p.vy / sp2) * cfg.maxSpeed;
        }

        p.vx = safeNumber(p.vx, 0.2);
        p.vy = safeNumber(p.vy, 0.2);
        p.x  = safeNumber(p.x + p.vx, Math.random()*W);
        p.y  = safeNumber(p.y + p.vy, Math.random()*H);

        p.btn.style.transform =
          `translate(${(p.x - p.btn.offsetWidth/2).toFixed(2)}px, ${(p.y - p.btn.offsetHeight/2).toFixed(2)}px)`;
      }

      moveRAF = requestAnimationFrame(frame);
    }

    moveRAF = requestAnimationFrame(frame);
  }

  // ----------------------------
  // Overlay
  // ----------------------------
  function openOverlay(project) {
    stopMoveLoop();

    const title = escapeHtml(project.title);
    const blurb = escapeHtml(project.blurb || project.tagline || "");
    const url = project.url || "";
    const stack = Array.isArray(project.stack) ? project.stack : [];

    overlayContent.innerHTML = `
      <h2 style="margin:0 0 6px 0; font-family: WAKABA;">${title}</h2>
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

    const backBtn = document.getElementById("overlayBackBtn");
    if (backBtn) backBtn.addEventListener("click", closeOverlay, { once: true });
  }

  function closeOverlay() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (currentMode === "A" && !isMobile()) startMoveLoop(blobLayer);
  }

  overlayBackdrop.addEventListener("click", closeOverlay);
  overlayClose.addEventListener("click", closeOverlay);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closeOverlay();
  });

  // ----------------------------
  // Mode B cards
  // ----------------------------
  let allProjectsRendered = false;
  function renderAllProjects() {
    if (allProjectsRendered) return;

    allProjects.innerHTML = projects.map(p => {
      const cover = coverUrl(p);
      const url = p.url || "#";
      return `
        <a class="proj" href="${url}" target="_blank" rel="noopener">
          <div class="cover" style="${cover ? `background-image:url('${cover}')` : ""}"></div>
          <div class="proj-meta">
            <div class="proj-title">${escapeHtml(p.title)}</div>
            ${p.tagline ? `<div class="proj-tagline">${escapeHtml(p.tagline)}</div>` : ""}
          </div>
        </a>
      `;
    }).join("");

    allProjectsRendered = true;
  }

  // ----------------------------
  // Modes
  // ----------------------------
  function setMode(nextMode) {
    currentMode = nextMode;

    if (nextMode === "A") {
      modeB.classList.remove("is-active");
      modeA.classList.add("is-active");

      toggleModeBtn.classList.remove("is-close");
      toggleModeBtn.setAttribute("aria-label", "View all");
      toggleModeBtn.textContent = "View all";

      renderBlobs();
    } else {
      modeA.classList.remove("is-active");
      modeB.classList.add("is-active");

      toggleModeBtn.classList.add("is-close");
      toggleModeBtn.setAttribute("aria-label", "Close");
      toggleModeBtn.textContent = "X";

      stopEdgeLoop();
      stopMoveLoop();
      renderAllProjects();
    }
  }

  toggleModeBtn.addEventListener("click", () => setMode(currentMode === "A" ? "B" : "A"));

  // ----------------------------
  // Paging
  // ----------------------------
  function perSet() {
    if (isMobile()) return projects.length;
    if (isTablet()) return Math.min(5, projects.length);
    return Math.min(7, projects.length);
  }

  function getSet(i) {
    const n = perSet();
    if (isMobile()) return projects;
    if (projects.length <= n) return projects;

    const start = (i * n) % projects.length;
    const end = start + n;
    const slice = projects.slice(start, end);
    if (slice.length < n) return slice.concat(projects.slice(0, n - slice.length));
    return slice;
  }

  prevSetBtn.addEventListener("click", () => {
    if (isMobile()) return;
    setIndex = Math.max(0, setIndex - 1);
    renderBlobs();
  });

  nextSetBtn.addEventListener("click", () => {
    if (isMobile()) return;
    setIndex += 1;
    renderBlobs();
  });

  // ----------------------------
  // Render blobs + start loops
  // ----------------------------
  function renderBlobs() {
    stopEdgeLoop();
    stopMoveLoop();

    const set = getSet(setIndex);

    // uniform-ish sizing
    const uniform = isTablet() ? 520 : 560;

    blobLayer.innerHTML = set.map((p) => {
        rebuildBlobVisualsFromDOM();
      const cover = coverUrl(p);
      const size = isMobile() ? 420 : uniform;

      const uid = `b_${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random()*1e9)}`;
      const model = createBlobModel(p.id);
      const initialD = computePathFromModel(model, performance.now() * 0.001);

      return `
        <button class="blob" type="button" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.title)}"
          style="${isMobile() ? "" : `width:${size}px;height:${size}px;left:0;top:0;`}"
        >
          ${makeWarpSVG({ uid, cover, title: p.title, initialD })}
        </button>
      `;
    }).join("");

    const buttons = Array.from(blobLayer.querySelectorAll(".blob"));

    // bind visuals + click
    blobVisuals = [];
    buttons.forEach(btn => {
      const id = btn.getAttribute("data-id");

      btn.addEventListener("click", () => {
        if (currentMode !== "A") return;
        const proj = projects.find(x => x.id === id);
        if (proj) openOverlay(proj);
      });

      const svg = btn.querySelector("svg[data-uid]");
      if (!svg) return;

      const uid = svg.getAttribute("data-uid");
      const pathEl = svg.querySelector(`#${uid}_path`);
      const outlineEl = svg.querySelector(`#${uid}_outline`);
      if (!pathEl || !outlineEl) return;

      const model = createBlobModel(id);
      blobVisuals.push({ model, pathEl, outlineEl });
    });

    // movement particles
    if (!isMobile()) {
      const r0 = blobLayer.getBoundingClientRect();
      particles = buttons.map(btn => {
        const id = btn.getAttribute("data-id") || "";
        const rnd = mulberry32(hashToSeed(id));
        const size = btn.getBoundingClientRect().width || uniform;

        return {
          btn, id,
          x: rnd() * r0.width,
          y: rnd() * r0.height,
          vx: (rnd()-0.5)*0.22,
          vy: (rnd()-0.5)*0.22,
          radius: size * (0.42 + rnd()*0.04),
          grabbed: false,
          px: rnd()*1000,
          py: rnd()*1000,
          ph: rnd()*Math.PI*2,
          biasX: (rnd()-0.5)*0.08,
          biasY: (rnd()-0.5)*0.08
        };
      });

      // hover freeze
      particles.forEach(p => {
        const b = p.btn;
        const grab = () => { p.grabbed = true; };
        const rel  = () => { p.grabbed = false; };
        b.addEventListener("mouseenter", grab);
        b.addEventListener("mouseleave", rel);
        b.addEventListener("focus", grab);
        b.addEventListener("blur", rel);
        b.addEventListener("touchstart", grab, { passive:true });
        b.addEventListener("touchend", rel, { passive:true });
        b.addEventListener("touchcancel", rel, { passive:true });
      });

      // initial spread
      particles.forEach(p => {
        p.btn.style.transform = `translate(${p.x - p.btn.offsetWidth/2}px, ${p.y - p.btn.offsetHeight/2}px)`;
      });
    }

    startEdgeLoop();
    if (!isMobile()) startMoveLoop(blobLayer);
  }

  // Boot
  renderAllProjects();
  setMode("A");
});
