// static/js/about/about.js
document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("aboutStage");
  const portraitBtn = document.getElementById("portraitBlob");
  const wordsLayer = document.getElementById("aboutWords");

  const overlay = document.getElementById("overlay");
  const overlayBackdrop = document.getElementById("overlayBackdrop");
  const overlayClose = document.getElementById("overlayClose");
  const overlayContent = document.getElementById("overlayContent");

  if (!stage || !portraitBtn || !wordsLayer) return;

  // ============================
  // EDIT THESE TO MATCH YOUR SITE
  // ============================
  const ROUTES = {
    digital: "/digital/",
    work: "/art/",
    installations: "/installations/",
    contact: "/contact/",
    cv: "/static/files/cv.pdf"
  };

  const BIO_TEXT = `I work with a vivid palette, light-responsive materials, and layered media, creating work that ranges from conceptual fine art and immersive installations to interactive web design.

I am passionate about exploring the intersection of art and technology, and I strive to create experiences that engage and inspire audiences.

To learn more about my work click on the buttons below. You can reach out via the contact page if you'd like to collaborate or learn more.`;

  const PORTRAITS = [
    "/static/img/about/portrait1.JPG",
    "/static/img/about/portrait2.JPG",
    "/static/img/about/portrait3.JPG",
    "/static/img/about/portrait4.jpeg",
    "/static/img/about/portrait5.JPG",
    "/static/img/about/portrait6.JPG",
    "/static/img/about/portrait7.jpeg"
  ];

  const ITEMS = [
    { key: "bio",           label: "bio",           kind: "bio" },
    { key: "work",          label: "work",          kind: "link", href: ROUTES.work, desc: "Studio work + fine art." },
    { key: "digital",       label: "digital",       kind: "link", href: ROUTES.digital, desc: "Interactive web + creative code." },
    { key: "installations", label: "installations", kind: "link", href: ROUTES.installations, desc: "Installations + community projects." },
    { key: "cv",            label: "cv",            kind: "cv" }
  ];
  // ============================

  // ----------------------------
  // Utilities
  // ----------------------------
  const escapeHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));

  function openOverlay(html) {
    if (!overlay || !overlayContent) return;
    overlayContent.innerHTML = html;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  if (overlayBackdrop) overlayBackdrop.addEventListener("click", closeOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay?.classList.contains("is-open")) closeOverlay();
  });

  // ----------------------------
  // Subtle wobble filter for text
  // ----------------------------
  injectWobbleFilter();

  // ----------------------------
  // Blob math (same as your digital style)
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
      let r = baseR + Math.sin(a*f1 + p1)*amp1 + Math.sin(a*f2 + p2)*amp2;
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

  // ----------------------------
  // Portrait blob
  // ----------------------------
  const portraitUid = `p_${Math.floor(Math.random() * 1e9)}`;
  const portraitModel = createBlobModel(portraitUid);
  let portraitIndex = 0;

  // IMPORTANT: "slice" fills blob (no gaps). Crops are expected.
  const PORTRAIT_FIT = "xMidYMid slice";

  function renderPortraitSVG() {
    const d0 = computePathFromModel(portraitModel, performance.now() * 0.001);
    const img = PORTRAITS[portraitIndex];

    portraitBtn.innerHTML = `
      <svg class="blob-svg"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink"
           viewBox="0 0 100 100"
           data-uid="${portraitUid}"
           role="img"
           aria-label="portrait">
        <defs>
          <clipPath id="${portraitUid}_clip">
            <path id="${portraitUid}_path" d="${d0}"></path>
          </clipPath>
        </defs>

        <g clip-path="url(#${portraitUid}_clip)">
          <image id="${portraitUid}_img"
                 href="${escapeHtml(img)}"
                 xlink:href="${escapeHtml(img)}"
                 x="0" y="0" width="100" height="100"
                 preserveAspectRatio="${PORTRAIT_FIT}"></image>
        </g>

        <path class="blob-outline" id="${portraitUid}_outline" d="${d0}" fill="none"></path>
      </svg>
    `;
  }

  function nextPortrait() {
    portraitIndex = (portraitIndex + 1) % PORTRAITS.length;
    const imgEl = portraitBtn.querySelector(`#${portraitUid}_img`);
    if (imgEl) {
      imgEl.setAttribute("href", PORTRAITS[portraitIndex]);
      imgEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", PORTRAITS[portraitIndex]);
    }
  }

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover) portraitBtn.addEventListener("mouseenter", nextPortrait);
  portraitBtn.addEventListener("click", nextPortrait);

  // Edge warp loop
  let edgeRAF = null;
  let edgeRunning = false;
  function startPortraitEdgeLoop() {
    edgeRunning = true;
    function frame(now) {
      if (!edgeRunning) return;
      const t = now * 0.001;
      const d = computePathFromModel(portraitModel, t);
      const pathEl = portraitBtn.querySelector(`#${portraitUid}_path`);
      const outlineEl = portraitBtn.querySelector(`#${portraitUid}_outline`);
      if (pathEl) pathEl.setAttribute("d", d);
      if (outlineEl) outlineEl.setAttribute("d", d);
      edgeRAF = requestAnimationFrame(frame);
    }
    edgeRAF = requestAnimationFrame(frame);
  }

  // Gentle portrait drift
  let driftRAF = null;
  let dx = 0, dy = 0;
  let vx = (Math.random()-0.5)*0.14;
  let vy = (Math.random()-0.5)*0.14;
  let last = performance.now();

  function startPortraitDrift() {
    function frame(now) {
      let dt = (now - last) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = Math.max(0.008, Math.min(0.033, dt));
      last = now;

      const t = now * 0.0011;
      vx += (Math.sin(t*1.7) + Math.cos(t*1.1+0.7)) * 0.008 * dt * 60;
      vy += (Math.cos(t*1.5) + Math.sin(t*1.2+1.3)) * 0.008 * dt * 60;

      vx *= 0.95;
      vy *= 0.95;

      const max = 0.22;
      const sp = Math.hypot(vx, vy) || 0.0001;
      if (sp > max) { vx = (vx/sp)*max; vy = (vy/sp)*max; }

      dx += vx * 60 * dt;
      dy += vy * 60 * dt;

      const bound = 10;
      if (dx < -bound) vx += (-bound - dx)*0.02;
      if (dx >  bound) vx -= (dx - bound)*0.02;
      if (dy < -bound) vy += (-bound - dy)*0.02;
      if (dy >  bound) vy -= (dy - bound)*0.02;

      portraitBtn.style.transform = `translate(-50%, -50%) translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;

      driftRAF = requestAnimationFrame(frame);
    }
    driftRAF = requestAnimationFrame(frame);
  }

  // ----------------------------
  // Words: anchored close to blob
  // ----------------------------
  function makeWordEl(item) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "about-word";
    el.dataset.key = item.key;
    el.textContent = item.label;

    el.addEventListener("click", () => {
      if (item.kind === "bio") {
        openOverlay(`
          <h2 style="font-family: wakaba; font-size: 3rem; margin:0 0 10px 0; text-transform: lowercase; text-align:center;">bio</h2>
          <p style="opacity:.85; max-width: 62ch; margin: 0 auto 14px auto; line-height:1.55; white-space:pre-line;">${escapeHtml(BIO_TEXT)}</p>
          <div class="cta-row" style="display:flex; justify-content:center; gap:10px; margin-top: 14px;">
            <a class="btn project-cta lilac" href="${ROUTES.contact}" style="font-family: wakaba; font-size: 2rem; text-decoration:none;">contact me</a>
          </div>
        `);
        return;
      }

      if (item.kind === "cv") {
        openOverlay(`
          <h2 style="font-family: wakaba; font-size: 3rem; margin:0 0 10px 0; text-transform: lowercase; text-align:center;">cv</h2>
          <p style="opacity:.85; text-align:center; margin:0 0 14px 0;">Download my CV.</p>
          <div class="cta-row" style="display:flex; justify-content:center;">
            <a class="btn project-cta lilac" href="${ROUTES.cv}" download style="font-family: wakaba; font-size: 2rem; text-decoration:none;">download cv</a>
          </div>
        `);
        return;
      }

      if (item.kind === "link") {
        openOverlay(`
          <h2 style="font-family: wakaba; font-size: 3rem; margin:0 0 10px 0; text-transform: lowercase; text-align:center;">${escapeHtml(item.label)}</h2>
          <p style="opacity:.85; text-align:center; margin:0 0 14px 0;">${escapeHtml(item.desc || "")}</p>
          <div class="cta-row" style="display:flex; justify-content:center;">
            <a class="btn project-cta lilac" href="${escapeHtml(item.href)}" style="font-family: wakaba; font-size: 2rem; text-decoration:none;">learn more</a>
          </div>
        `);
      }
    });

    return el;
  }

  const wordNodes = ITEMS.map(makeWordEl);
  wordNodes.forEach(n => wordsLayer.appendChild(n));

  function getPortraitCenter() {
    const rStage = stage.getBoundingClientRect();
    const rBlob = portraitBtn.getBoundingClientRect();
    return {
      cx: (rBlob.left - rStage.left) + rBlob.width / 2,
      cy: (rBlob.top - rStage.top) + rBlob.height / 2,
      blobW: rBlob.width,
      blobH: rBlob.height
    };
  }

  function makeAnchors() {
    const r = stage.getBoundingClientRect();
    const mobile = window.innerWidth < 768;
    const pc = getPortraitCenter();

    if (!mobile) {
      // Desktop: arc hugging right edge of blob
      const cx = pc.cx + pc.blobW * 0.58; // close to blob
      const cy = pc.cy;
      const rad = Math.min(pc.blobW, pc.blobH) * 0.56;

      const order = ["bio", "work", "digital", "installations", "cv"];
      const angles = [-0.85, -0.35, 0.15, 0.65, 1.05];

      const map = new Map();
      order.forEach((k, i) => {
        const a = angles[i];
        map.set(k, { ax: cx + Math.cos(a) * rad, ay: cy + Math.sin(a) * rad });
      });
      return map;
    }

    // Mobile: arc under the blob (not far right)
    const cx = pc.cx;
    const cy = pc.cy + pc.blobH * 0.62;
    const rad = pc.blobW * 0.46;

    const order = ["bio", "work", "digital", "installations", "cv"];
    const angles = [2.95, 2.45, 1.95, 1.45, 0.95]; // left -> right under blob

    const map = new Map();
    order.forEach((k, i) => {
      const a = angles[i];
      map.set(k, { ax: cx + Math.cos(a) * rad, ay: cy + Math.sin(a) * rad });
    });

    return map;
  }

  let anchors = makeAnchors();

  const particles = wordNodes.map((el) => {
    const k = el.dataset.key;
    const an = anchors.get(k) || { ax: 200, ay: 200 };
    return { el, key: k, x: an.ax, y: an.ay, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2 };
  });

  let wordsRAF = null;
  let lastWords = performance.now();

  function startWordsDrift() {
    const mobile = window.innerWidth < 768;

    // SUPER subtle
    const cfg = {
      spring: mobile ? 0.016 : 0.018,
      noise:  mobile ? 0.0016 : 0.0022,
      damping: mobile ? 0.93 : 0.91,
      maxSpeed: mobile ? 0.10 : 0.12,
      repelDist: mobile ? 62 : 78,
      repelStrength: mobile ? 0.012 : 0.016
    };

    function frame(now) {
      let dt = (now - lastWords) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = Math.max(0.008, Math.min(0.033, dt));
      lastWords = now;

      // repel to avoid overlap
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          if (d < cfg.repelDist) {
            const push = (1 - d / cfg.repelDist) * cfg.repelStrength * 60;
            const nx = dx / d, ny = dy / d;
            a.vx -= nx * push; a.vy -= ny * push;
            b.vx += nx * push; b.vy += ny * push;
          }
        }
      }

      const t = now * 0.001;
      for (const p of particles) {
        const an = anchors.get(p.key);
        if (an) {
          p.vx += (an.ax - p.x) * cfg.spring;
          p.vy += (an.ay - p.y) * cfg.spring;
        }

        p.vx += Math.sin(t * 1.1 + p.phase) * cfg.noise;
        p.vy += Math.cos(t * 1.0 + p.phase) * cfg.noise;

        p.vx *= cfg.damping;
        p.vy *= cfg.damping;

        const sp = Math.hypot(p.vx, p.vy) || 0.0001;
        if (sp > cfg.maxSpeed) {
          p.vx = (p.vx / sp) * cfg.maxSpeed;
          p.vy = (p.vy / sp) * cfg.maxSpeed;
        }

        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;

        p.el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
      }

      wordsRAF = requestAnimationFrame(frame);
    }

    wordsRAF = requestAnimationFrame(frame);
  }

  function snapWordsToAnchors() {
    anchors = makeAnchors();
    for (const p of particles) {
      const an = anchors.get(p.key);
      if (an) {
        p.x = an.ax; p.y = an.ay;
        p.vx = 0; p.vy = 0;
        p.el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
      }
    }
  }

  // ----------------------------
  // Boot
  // ----------------------------
  renderPortraitSVG();
  startPortraitEdgeLoop();
  startPortraitDrift();

  // initial anchor snap after layout
  requestAnimationFrame(() => {
    snapWordsToAnchors();
    startWordsDrift();
  });

  window.addEventListener("resize", () => {
    snapWordsToAnchors();
  });

  // ----------------------------
  // Wobble filter
  // ----------------------------
  function injectWobbleFilter() {
    if (document.getElementById("wobbleFilterHost")) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "wobbleFilterHost";
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.style.left = "-9999px";

    svg.innerHTML = `
      <defs>
        <filter id="wobbleFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.010" numOctaves="2" seed="2" result="noise">
            <animate attributeName="baseFrequency" dur="8s" values="0.009;0.011;0.009" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }
});
