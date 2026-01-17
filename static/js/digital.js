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

  if (!window.flubber) {
    console.error("[digital] Flubber not found. Load flubber.min.js BEFORE digital.js.");
  }

  // DOM
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

  let idleTimer = null;
  let interactionCooldown = null;
  let isInteracting = false;

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
  // Smooth splat path generator (NO spikes)
  // - less extreme dents
  // - tighter radius clamp
  // - smoother spline (higher tension)
  // ----------------------------
  function catmullRomToBezier(points, closed = true, tension = 0.85) {
    const pts = points.slice();
    const n = pts.length;

    function get(i) {
      if (closed) return pts[(i + n) % n];
      return pts[Math.max(0, Math.min(n - 1, i))];
    }

    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

    for (let i = 0; i < n; i++) {
      const p0 = get(i - 1);
      const p1 = get(i);
      const p2 = get(i + 1);
      const p3 = get(i + 2);

      const t = tension;

      const c1x = p1.x + (p2.x - p0.x) * t / 6;
      const c1y = p1.y + (p2.y - p0.y) * t / 6;
      const c2x = p2.x - (p3.x - p1.x) * t / 6;
      const c2y = p2.y - (p3.y - p1.y) * t / 6;

      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    if (closed) d += " Z";
    return d;
  }

  function generateSmoothSplatPath(rnd) {
    const cx = 50, cy = 50;

    const n = Math.floor(12 + rnd() * 10);   // 12–22 points (complex but smooth)
    const baseR = 32 + rnd() * 7;            // 32–39

    // reduced amplitudes to avoid spikes
    const amp1 = 8 + rnd() * 10;             // 8–18
    const amp2 = 4 + rnd() * 8;              // 4–12

    const f1 = Math.floor(3 + rnd() * 5);    // 3–7
    const f2 = Math.floor(6 + rnd() * 6);    // 6–11

    const p1 = rnd() * Math.PI * 2;
    const p2 = rnd() * Math.PI * 2;

    // fewer, softer dents
    const dentChance = 0.18 + rnd() * 0.12;  // ~0.18–0.30

    const points = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;

      let r = baseR
        + Math.sin(a * f1 + p1) * amp1
        + Math.sin(a * f2 + p2) * amp2;

      // gentle dents only (no spikes)
      if (rnd() < dentChance) {
        r *= (0.88 + rnd() * 0.18);          // 0.88–1.06
      }

      // tighter clamp => no pointy extremes
      r = Math.max(24, Math.min(46, r));

      points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }

    // higher tension => rounder curves
    return catmullRomToBezier(points, true, 0.92);
  }

  function pickSplatPair(id) {
    const rnd = mulberry32(hashToSeed(id || "x"));
    const a = generateSmoothSplatPath(rnd);
    const b = generateSmoothSplatPath(rnd);
    return { a, b, rnd };
  }

  // ----------------------------
  // SVG with morphable clipPath
  // ----------------------------
  function makeWarpSVG({ id, cover, title, initialD }) {
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uid = `warp_${safeId}_${Math.floor(Math.random() * 1e9)}`;

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

        <path id="${uid}_outline" d="${initialD}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1.0"></path>
      </svg>
    `;
  }

  // Morph controllers
  let morphStops = [];
  function stopMorphs() {
    for (const m of morphStops) { try { m?.stop?.(); } catch {} }
    morphStops = [];
  }

  // Smoother morphing: smaller maxSegmentLength removes kinks/spikes
  function startWarp(pathEl, outlineEl, id) {
    if (!window.flubber) return null;

    const { a, b, rnd } = pickSplatPair(id);

    const interpAB = window.flubber.interpolate(a, b, { maxSegmentLength: 2.2 });
    const interpBA = window.flubber.interpolate(b, a, { maxSegmentLength: 2.2 });

    const duration = 1400 + rnd() * 1900;
    const stagger = rnd() * 900;

    let start = performance.now() + stagger;
    let dir = 1;
    let running = true;

    function ease(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }

    function step(now) {
      if (!running) return;

      const t = (now - start) / duration;
      const p = ease(Math.min(1, Math.max(0, t)));
      const d = (dir === 1) ? interpAB(p) : interpBA(p);

      pathEl.setAttribute("d", d);
      if (outlineEl) outlineEl.setAttribute("d", d);

      if (t >= 1) {
        dir *= -1;
        start = now;
      }
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    return { stop: () => { running = false; } };
  }

  // ----------------------------
  // Wiggly drift swarm (same as your current good one)
  // ----------------------------
  let swarm = null;
  particles = [];

  function stopSwarm() {
    swarm?.stop?.();
    swarm = null;
    particles = [];
  }

  function startSwarm(containerEl, blobButtons) {
    if (isMobile()) return;

    const rect = () => containerEl.getBoundingClientRect();
    const cr0 = rect();

    particles = blobButtons.map(btn => {
      const id = btn.getAttribute("data-id") || "";
      const rnd = mulberry32(hashToSeed(id));
      const size = btn.getBoundingClientRect().width || 420;

      return {
        btn,
        id,
        x: rnd() * cr0.width,
        y: rnd() * cr0.height,
        vx: (rnd() - 0.5) * 0.35,
        vy: (rnd() - 0.5) * 0.35,
        radius: size * (0.40 + rnd()*0.06),

        grabbed: false,

        moving: rnd() > 0.5,
        phaseEndsAt: performance.now() + (1500 + rnd()*4200),
        moveForMs: 1600 + rnd()*2200,
        restForMs: 3200 + rnd()*5200,

        px: rnd()*1000,
        py: rnd()*1000,
        turn: (rnd() - 0.5) * 0.018,
        kickAt: performance.now() + (2500 + rnd()*6500),
      };
    });

    for (const p of particles) {
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
    }

    let running = true;
    let raf = null;

    const cfg = {
      allowOffscreen: true,
      padding: 10,
      maxSpeed: 0.40,
      repel: 0.10,
      edgePush: 0.016,
      centerPull: 0.0008,
      wiggle: 0.14,
      curvature: 0.10,
      jerk: 0.018,
    };

    function tick(now) {
      if (!running) return;

      const cr = rect();
      const W = cr.width, H = cr.height;
      const cx = W/2, cy = H/2;

      for (const p of particles) {
        if (now >= p.phaseEndsAt) {
          p.moving = !p.moving;
          p.phaseEndsAt = now + (p.moving ? p.moveForMs : p.restForMs);
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const min = a.radius + b.radius;

          if (dist < min) {
            const overlap = (min - dist) / min;
            const nx = dx / dist, ny = dy / dist;
            const push = overlap * cfg.repel * (a.moving || b.moving ? 70 : 45);

            if (!a.grabbed) { a.vx -= nx*push; a.vy -= ny*push; }
            if (!b.grabbed) { b.vx += nx*push; b.vy += ny*push; }
          }
        }
      }

      for (const p of particles) {
        const t = now * 0.00055;
        const fx =
          Math.sin(t * 1.6 + p.px * 0.01) +
          Math.sin(t * 2.3 + (p.y + p.py) * 0.006) +
          Math.cos(t * 0.9 + (p.x + p.px) * 0.004);

        const fy =
          Math.cos(t * 1.4 + p.py * 0.01) -
          Math.cos(t * 2.1 + (p.x + p.px) * 0.006) +
          Math.sin(t * 1.1 + (p.y + p.py) * 0.004);

        if (now >= p.kickAt && !p.grabbed) {
          p.vx += (Math.random()-0.5) * cfg.jerk * 18;
          p.vy += (Math.random()-0.5) * cfg.jerk * 18;
          p.kickAt = now + (2500 + Math.random()*7500);
        }

        const cos = Math.cos(p.turn);
        const sin = Math.sin(p.turn);
        const rvx = p.vx * cos - p.vy * sin;
        const rvy = p.vx * sin + p.vy * cos;
        p.vx = rvx; p.vy = rvy;

        if (p.grabbed) {
          p.vx *= 0.55;
          p.vy *= 0.55;
        } else if (p.moving) {
          p.vx += fx * cfg.wiggle * 0.06;
          p.vy += fy * cfg.wiggle * 0.06;

          const sp = Math.hypot(p.vx, p.vy) || 0.0001;
          p.vx += (-p.vy / sp) * cfg.curvature * 0.02;
          p.vy += ( p.vx / sp) * cfg.curvature * 0.02;

          p.vx += (cx - p.x) * cfg.centerPull;
          p.vy += (cy - p.y) * cfg.centerPull;
        } else {
          p.vx *= 0.88;
          p.vy *= 0.88;
          p.vx += fx * 0.0025;
          p.vy += fy * 0.0025;
        }

        const off = cfg.allowOffscreen ? -160 : 0;
        const minX = off + cfg.padding;
        const maxX = W - off - cfg.padding;
        const minY = off + cfg.padding;
        const maxY = H - off - cfg.padding;

        if (p.x < minX) p.vx += (minX - p.x) * cfg.edgePush;
        if (p.x > maxX) p.vx -= (p.x - maxX) * cfg.edgePush;
        if (p.y < minY) p.vy += (minY - p.y) * cfg.edgePush;
        if (p.y > maxY) p.vy -= (p.y - maxY) * cfg.edgePush;

        const sp2 = Math.hypot(p.vx, p.vy);
        const maxS = p.moving ? cfg.maxSpeed : cfg.maxSpeed * 0.35;
        if (sp2 > maxS) {
          p.vx = (p.vx/sp2) * maxS;
          p.vy = (p.vy/sp2) * maxS;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.btn.style.transform = `translate(${p.x - p.btn.offsetWidth/2}px, ${p.y - p.btn.offsetHeight/2}px)`;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    swarm = { stop: () => { running = false; cancelAnimationFrame(raf); } };
  }

  // ----------------------------
  // Overlay
  // ----------------------------
  function openOverlay(project) {
    stopSwarm();

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

    if (currentMode === "A" && !isMobile()) {
      const buttons = Array.from(blobLayer.querySelectorAll(".blob"));
      startSwarm(blobLayer, buttons);
    }
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
      resetIdleSwap();
    } else {
      modeA.classList.remove("is-active");
      modeB.classList.add("is-active");

      toggleModeBtn.classList.add("is-close");
      toggleModeBtn.setAttribute("aria-label", "Close");
      toggleModeBtn.textContent = "X";

      stopMorphs();
      stopSwarm();
      renderAllProjects();
      stopIdleSwap();
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
  // Render blobs
  // ----------------------------
  function renderBlobs() {
    stopMorphs();
    stopSwarm();

    const set = getSet(setIndex);

    if (isMobile()) {
      blobLayer.innerHTML = set.map(p => {
        const cover = coverUrl(p);
        const { a } = pickSplatPair(p.id);
        return `
          <button class="blob" type="button" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.title)}">
            ${makeWarpSVG({ id: p.id, cover, title: p.title, initialD: a })}
          </button>
        `;
      }).join("");

      blobLayer.querySelectorAll(".blob").forEach(btn => {
        const id = btn.getAttribute("data-id");
        btn.addEventListener("click", () => {
          if (currentMode !== "A") return;
          const proj = projects.find(x => x.id === id);
          if (proj) openOverlay(proj);
        });

        const svg = btn.querySelector("svg[data-uid]");
        if (!svg) return;
        const uid = svg.getAttribute("data-uid");
        const path = svg.querySelector(`#${uid}_path`);
        const outline = svg.querySelector(`#${uid}_outline`);
        if (path) {
          const ctrl = startWarp(path, outline, id);
          if (ctrl) morphStops.push(ctrl);
        }
      });

      return;
    }

    const sizes = isTablet()
      ? [420, 380, 460, 400, 360]
      : [560, 480, 620, 420, 500, 440, 380];

    blobLayer.innerHTML = set.map((p, idx) => {
      const cover = coverUrl(p);
      const size = sizes[idx % sizes.length];
      const { a } = pickSplatPair(p.id);

      return `
        <button class="blob" type="button" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.title)}"
                style="width:${size}px;height:${size}px;left:0;top:0;">
          ${makeWarpSVG({ id: p.id, cover, title: p.title, initialD: a })}
        </button>
      `;
    }).join("");

    const buttons = Array.from(blobLayer.querySelectorAll(".blob"));

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
      const path = svg.querySelector(`#${uid}_path`);
      const outline = svg.querySelector(`#${uid}_outline`);
      if (path) {
        const ctrl = startWarp(path, outline, id);
        if (ctrl) morphStops.push(ctrl);
      }
    });

    startSwarm(blobLayer, buttons);
  }

  // ----------------------------
  // Idle swap
  // ----------------------------
  function stopIdleSwap() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
  }

  function resetIdleSwap() {
    stopIdleSwap();
    if (isMobile()) return;

    idleTimer = setTimeout(() => {
      if (!overlay.classList.contains("is-open") && currentMode === "A" && !isInteracting) {
        setIndex += 1;
        renderBlobs();
      }
      resetIdleSwap();
    }, 14000);
  }

  function markInteracting() {
    isInteracting = true;
    if (interactionCooldown) clearTimeout(interactionCooldown);
    interactionCooldown = setTimeout(() => { isInteracting = false; }, 900);
    if (currentMode === "A") resetIdleSwap();
  }

  ["mousemove","touchstart","scroll","keydown"].forEach(evt => {
    window.addEventListener(evt, markInteracting, { passive: true });
  });

  function rerenderOnBreakpoint() {
    if (currentMode === "A") { renderBlobs(); resetIdleSwap(); }
  }

  mqMobile.addEventListener?.("change", rerenderOnBreakpoint);
  mqTablet.addEventListener?.("change", rerenderOnBreakpoint);
  window.addEventListener("resize", rerenderOnBreakpoint);

  // Boot
  renderAllProjects();
  setMode("A");
});
