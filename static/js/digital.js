// static/js/digital.js
// Desktop/tablet: blobs drift forever + edge ripple.
// Mobile: SINGLE-SLIDE carousel (one blob visible at a time) + edge ripple + wrap.
// This avoids all flex/track width/max-width fights on small screens.
//
// IMPORTANT CHANGE: we FORCE transforms via style.setProperty(..., 'important')
// so even if your CSS still has `transform: none !important` on mobile blobs,
// arrow clicks will still move slides.

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

  // Core nodes
  const dataEl = $("projects-data");
  const blobLayer = $("blobLayer");
  const navArrows = $("navArrows");
  const prevBtn = $("prevSet");
  const nextBtn = $("nextSet");

  // Overlay nodes (optional)
  const overlay = $("overlay");
  const overlayBackdrop = $("overlayBackdrop");
  const overlayClose = $("overlayClose");
  const overlayContent = $("overlayContent");
  const hasOverlay = !!(overlay && overlayBackdrop && overlayClose && overlayContent);

  // ensure initial visual state: no orange class, plain lowercase x
  if (overlayClose) {
    overlayClose.classList.remove("orange");
    overlayClose.textContent = "x";
  }

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

  function coverUrl(p) {
    return (p && p.cover ? String(p.cover) : "").trim();
  }

  // Breakpoints
  const mqMobile = window.matchMedia("(max-width: 767px)");
  const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");
  const isMobile = () => mqMobile.matches;
  const isTablet = () => mqTablet.matches;

  // Paging state
  const DESKTOP_PAGE_SIZE = 7; // change to 8 later
  let setIndex = 0;            // desktop pages
  let mobileIndex = 0;         // mobile slide index

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  // FORCE style helpers (beats CSS !important)
  function setImportant(el, prop, value) {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  }
  function setTransformImportant(el, value) {
    setImportant(el, "transform", value);
  }
  function setTransitionImportant(el, value) {
    setImportant(el, "transition", value);
  }

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
  // Geometry helpers
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

    const rip = {
      amps: [2.0 + rnd()*1.2, 1.4 + rnd()*1.0, 1.0 + rnd()*0.8, 0.75 + rnd()*0.7, 0.55 + rnd()*0.55],
      freqs: [2 + Math.floor(rnd()*4), 4 + Math.floor(rnd()*5), 7 + Math.floor(rnd()*6), 11 + Math.floor(rnd()*7), 16 + Math.floor(rnd()*7)],
      phases: [rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2, rnd()*Math.PI*2],
      speeds: [2.1 + rnd()*1.2, 1.8 + rnd()*1.1, 1.4 + rnd()*1.0, 1.2 + rnd()*0.9, 1.0 + rnd()*0.8],
      strength: 1.25 + rnd()*0.60
    };

    return { radii, rip };
  }

  function createBlobModel(id) {
    const N = 10;
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
      r = Math.max(26, Math.min(52, r));
      pts.push({ x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r });
    }

    const smooth = chaikin(pts, 2);
    return pointsToBezier(smooth);
  }

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
  // Loops
  // ----------------------------
  let edgeRAF = null;
  let moveRAF = null;
  let edgeRunning = false;
  let moveRunning = false;

  let blobVisuals = [];
  let particles = [];
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
  }

  function startEdgeLoop() {
    stopEdgeLoop();
    edgeRunning = true;

    function frame(now) {
      if (!edgeRunning) return;

      if (!blobVisuals || blobVisuals.length === 0) rebuildBlobVisualsFromDOM();
      if (!blobVisuals || blobVisuals.length === 0) {
        edgeRAF = requestAnimationFrame(frame);
        return;
      }

      const t = now * 0.001;
      for (const bv of blobVisuals) {
        const d = computePathFromModel(bv.model, t);
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
      offLeft: -140,
      offRight: -140,
      offTop: -180,
      offBottom: -30,
      padding: 10,
      edgePush: 0.020,
      flowStrength: 0.26,
      swirlStrength: 0.10,
      noiseStrength: 0.14,
      maxSpeed: 0.60,
      damping: 0.992,
      minSpeed: 0.22,
      repel: 0.12,
      centerPull: 0.0009,
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

        // center pull + avoid top-left
        p.vx += (cx - p.x) * cfg.centerPull;
        p.vy += (cy - p.y) * cfg.centerPull;

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

        // bounds
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
    if (!hasOverlay) return;

    stopMoveLoop();

    const title = escapeHtml(project.title);
    const blurb = escapeHtml(project.blurb || project.tagline || "");
    const url = project.url || "";
    const stack = Array.isArray(project.stack) ? project.stack : [];

    overlayContent.innerHTML = `
      <h2 style="font-size: 3rem; margin:0 0 10px 0; font-family: wakaba; text-transform: lowercase; display: flex; justify-content: center;">${title}</h2>
      ${blurb ? `<p style="margin:18px 0 12px 0; opacity:.75; display: flex; justify-content: center; text-align:justify;">${blurb}</p>` : ""}

      ${stack.length ? `
        <div style="display:flex; justify-content: center; gap:8px; flex-wrap:wrap; margin: 5px 0 5px 0;">
          ${stack.map(s => `<span style="padding:6px 10px; border:1px solid #f2f2f2; border-radius:999px; font-size: 13px;">${escapeHtml(s)}</span>`).join("")}
        </div>
      ` : ""}

      <div class="cta-row">
        ${url ? `<a class="btn project-cta lilac" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View project</a>` : ""}
      </div>
    `;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    // ensure close button default state
    const closeBtn = document.getElementById("overlayClose");
    if (closeBtn) {
      closeBtn.classList.remove("orange");
      closeBtn.textContent = "x";
    }
  }

  function closeOverlay() {
    if (!hasOverlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    const closeBtn = document.getElementById("overlayClose");
    if (closeBtn) closeBtn.classList.remove("orange");
    if (!isMobile()) startMoveLoop(blobLayer);
  }

  if (hasOverlay) {
    overlayBackdrop.addEventListener("click", closeOverlay);
    overlayClose.addEventListener("click", closeOverlay);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeOverlay();
    });
  }

  // ----------------------------
  // Visibility rules for arrows
  // ----------------------------
  function updateArrowVisibility() {
    if (!navArrows) return;
    if (isMobile()) {
      navArrows.style.display = "flex";
    } else {
      navArrows.style.display = (projects.length > DESKTOP_PAGE_SIZE) ? "flex" : "none";
    }
  }

  // ----------------------------
  // Mobile single-slide carousel (bulletproof + CSS-override-proof)
  // ----------------------------
  const MOBILE_TRANSITION = "transform 420ms cubic-bezier(.4,0,.2,1)";

  function renderMobileSlides() {
    stopMoveLoop();
    stopEdgeLoop();

    blobLayer.style.position = "absolute";
    blobLayer.style.inset = "0";
    blobLayer.style.overflow = "hidden";

    blobLayer.innerHTML = projects.map((p, i) => {
      const cover = coverUrl(p);
      const uid = `b_${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random()*1e9)}`;
      const model = createBlobModel(p.id);
      const initialD = computePathFromModel(model, performance.now() * 0.001);

      return `
        <button class="blob"
          type="button"
          data-id="${escapeHtml(p.id)}"
          data-index="${i}"
          style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            will-change: transform;
          "
        >
          ${makeWarpSVG({ uid, cover, title: p.title, initialD })}
        </button>
      `;
    }).join("");

    // bind click → overlay
    Array.from(blobLayer.querySelectorAll(".blob")).forEach(btn => {
      const id = btn.getAttribute("data-id");
      btn.addEventListener("click", () => {
        const proj = projects.find(x => x.id === id);
        if (proj) openOverlay(proj);
      });
    });

    // FORCE initial positions + transition with !important
    const blobs = Array.from(blobLayer.querySelectorAll(".blob"));
    blobs.forEach((b, i) => {
      setTransitionImportant(b, MOBILE_TRANSITION);
      if (i === mobileIndex) setTransformImportant(b, "translate3d(0,0,0)");
      else setTransformImportant(b, "translate3d(100vw,0,0)");
    });

    rebuildBlobVisualsFromDOM();
    startEdgeLoop();
  }

  function updateMobileSlides(dir) {
    const blobs = Array.from(blobLayer.querySelectorAll(".blob"));
    const count = blobs.length;
    if (!count) return;

    const prev = mobileIndex;
    mobileIndex = mod(mobileIndex + dir, count);

    blobs.forEach((b, i) => {
      setTransitionImportant(b, MOBILE_TRANSITION);

      if (i === mobileIndex) {
        setTransformImportant(b, "translate3d(0,0,0)");
      } else if (i === prev) {
        setTransformImportant(b, `translate3d(${dir > 0 ? "-100vw" : "100vw"},0,0)`);
      } else {
        setTransformImportant(b, `translate3d(${dir > 0 ? "100vw" : "-100vw"},0,0)`);
      }
    });
  }

  // ----------------------------
  // Desktop paging
  // ----------------------------
  function perSet() {
    if (isTablet()) return Math.min(5, projects.length);
    return Math.min(DESKTOP_PAGE_SIZE, projects.length);
  }

  function getSet(i) {
    const n = perSet();
    if (projects.length <= n) return projects;

    const start = (i * n) % projects.length;
    const end = start + n;
    const slice = projects.slice(start, end);
    if (slice.length < n) return slice.concat(projects.slice(0, n - slice.length));
    return slice;
  }

  // ----------------------------
  // Render desktop/tablet blobs
  // ----------------------------
  function renderDesktopBlobs() {
    stopEdgeLoop();
    stopMoveLoop();

    const set = getSet(setIndex);
    const uniform = isTablet() ? 520 : 560;

    blobLayer.innerHTML = set.map((p) => {
      const cover = coverUrl(p);
      const size = uniform;

      const uid = `b_${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "_")}_${Math.floor(Math.random()*1e9)}`;
      const model = createBlobModel(p.id);
      const initialD = computePathFromModel(model, performance.now() * 0.001);

      return `
        <button class="blob" type="button" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.title)}"
          style="width:${size}px;height:${size}px;left:0;top:0;"
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

    startEdgeLoop();
    startMoveLoop(blobLayer);
  }

  function renderAll() {
    updateArrowVisibility();

    if (isMobile()) {
      mobileIndex = mod(mobileIndex, projects.length);
      renderMobileSlides();
    } else {
      renderDesktopBlobs();
    }
  }

  // ----------------------------
  // Arrow actions
  // ----------------------------
  prevBtn.addEventListener("click", () => {
    if (isMobile()) {
      updateMobileSlides(-1);
      return;
    }
    setIndex = Math.max(0, setIndex - 1);
    renderAll();
  });

  nextBtn.addEventListener("click", () => {
    if (isMobile()) {
      updateMobileSlides(1);
      return;
    }
    setIndex += 1;
    renderAll();
  });

  // Swipe on mobile
  let touchX0 = null;
  let touchY0 = null;

  blobLayer.addEventListener("touchstart", (e) => {
    if (!isMobile()) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    touchX0 = t.clientX;
    touchY0 = t.clientY;
  }, { passive: true });

  blobLayer.addEventListener("touchend", (e) => {
    if (!isMobile() || touchX0 == null || touchY0 == null) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - touchX0;
    const dy = t.clientY - touchY0;

    touchX0 = null;
    touchY0 = null;

    if (Math.abs(dy) > Math.abs(dx)) return;

    const threshold = 40;
    if (dx > threshold) prevBtn.click();
    else if (dx < -threshold) nextBtn.click();
  }, { passive: true });

  // Re-render on breakpoint changes
  mqMobile.addEventListener?.("change", () => {
    stopMoveLoop();
    mobileIndex = 0;
    renderAll();
  });
  mqTablet.addEventListener?.("change", renderAll);

  window.addEventListener("resize", () => {
    // on mobile, re-render to keep 100vw transforms consistent
    renderAll();
  });

  // Boot
  renderAll();
});
