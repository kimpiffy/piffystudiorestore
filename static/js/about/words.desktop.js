// static/js/about/words.desktop.js
import { escapeHtml, clamp } from "./utils.js";
import { ITEMS, BIO_TEXT } from "./config.js";

export function createWordsController({ bioZone, linksZone, overlay, routes }) {
  const particles = [];
  let raf = null;
  let last = performance.now();
  let paused = false;

  const isBio = (k) => k === "bio";

  function zoneSize(zoneEl) {
    return { w: zoneEl.clientWidth, h: zoneEl.clientHeight };
  }
  function measure(p) {
    p.w = Math.max(10, p.el.offsetWidth);
    p.h = Math.max(10, p.el.offsetHeight);
  }
  function bounds(p) {
    const { w: ZW, h: ZH } = zoneSize(p.zone);
    const pad = 8;
    return {
      minX: pad,
      minY: pad,
      maxX: Math.max(pad, ZW - p.w - pad),
      maxY: Math.max(pad, ZH - p.h - pad),
    };
  }
  function bounceIn(p) {
    const b = bounds(p);

    if (p.x <= b.minX) { p.x = b.minX; p.vx = Math.abs(p.vx) * 0.85; }
    if (p.x >= b.maxX) { p.x = b.maxX; p.vx = -Math.abs(p.vx) * 0.85; }
    if (p.y <= b.minY) { p.y = b.minY; p.vy = Math.abs(p.vy) * 0.85; }
    if (p.y >= b.maxY) { p.y = b.maxY; p.vy = -Math.abs(p.vy) * 0.85; }

    p.x = clamp(p.x, b.minX, b.maxX);
    p.y = clamp(p.y, b.minY, b.maxY);
  }

  function repelWithinZone(zoneEl) {
    const zoneParticles = particles.filter(p => p.zone === zoneEl);

    for (let i = 0; i < zoneParticles.length; i++) {
      for (let j = i + 1; j < zoneParticles.length; j++) {
        const a = zoneParticles[i], b = zoneParticles[j];
        if (a.frozen && b.frozen) continue;

        const ax = a.x + a.w/2, ay = a.y + a.h/2;
        const bx = b.x + b.w/2, by = b.y + b.h/2;
        const dx = bx - ax, dy = by - ay;
        const d = Math.hypot(dx, dy) || 0.0001;

        const min = Math.max(a.w, b.w) * 0.85; // Reduced repulsion radius
        if (d < min) {
          const push = (1 - d / min) * 0.020 * 60; // Reduced push force
          const nx = dx / d, ny = dy / d;
          if (!a.frozen) { a.vx -= nx * push; a.vy -= ny * push; }
          if (!b.frozen) { b.vx += nx * push; b.vy += ny * push; }
        }
      }
    }
  }

  function openBioModal() {
  try {
    if (!overlay || typeof overlay.open !== "function") {
      console.error("[about] overlay missing or overlay.open not a function", overlay);
      return;
    }

    const cvHref = routes?.cv || "/static/kimpiffycv.pdf";

    overlay.open(`
      <h2 style="font-family: picnic; font-size: 3rem; margin:0 0 6px 0; text-align:center;">artist, web designer & mother...</h2>
      <p class="bio-modal-copy" style="opacity:.85; margin: 0 auto 14px auto; line-height:1.55; white-space:pre-line;">
        ${escapeHtml(BIO_TEXT)}
      </p>
      <div class="cta-row" style="display:flex; justify-content:center; margin-top: 18px;">
        <a class="btn project-cta lilac"
           href="${escapeHtml(cvHref)}"
           target="_blank" rel="noopener noreferrer"
           style="font-family: picnic; font-size: 2rem; text-decoration:none;">
          c.v
        </a>
      </div>
    `, { reason: "bio" });
  } catch (err) {
    console.error("[about] openBioModal failed:", err);
  }
}


  function makeWord(item) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "about-word";
    el.dataset.key = item.key;
    el.textContent = item.label;

    el.addEventListener("mouseenter", () => {
      const p = particles.find(x => x.el === el);
      if (p) {
        p.frozen = true;
        // Smoothly reduce velocity to prevent glitches
        p.vx *= 0.1;
        p.vy *= 0.1;
      }
    });
    el.addEventListener("mouseleave", () => {
      const p = particles.find(x => x.el === el);
      if (p) {
        p.frozen = false;
        // Give a gentle initial velocity to resume smooth motion
        p.vx = (Math.random() - 0.5) * 0.15;
        p.vy = (Math.random() - 0.5) * 0.15;
      }
    });

    el.addEventListener("click", () => {
      if (item.kind === "bio") return openBioModal();
      if (item.kind === "link") {
        const href = routes[item.routeKey];
        if (href) window.location.assign(href);
      }
    });

    return el;
  }

  function initParticle(el, zone) {
    const p = {
      el, zone,
      x: 0, y: 0,
      vx: (Math.random()-0.5) * 0.25, // Reduced initial velocity
      vy: (Math.random()-0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
      frozen: false,
      transitioning: false, // Add transition state
      w: 120, h: 50
    };

    measure(p);
    const b = bounds(p);

    p.x = b.minX + Math.random() * Math.max(0, b.maxX - b.minX);
    p.y = b.minY + Math.random() * Math.max(0, b.maxY - b.minY);

    bounceIn(p);
    el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
    return p;
  }

  function onResize() {
    for (const p of particles) {
      measure(p);
      bounceIn(p);
      p.el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
    }
  }

  function start() {
    stop();
    last = performance.now();

    function frame(now) {
      if (paused) { raf = requestAnimationFrame(frame); return; }

      let dt = (now - last) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = clamp(dt, 0.008, 0.033);
      last = now;

      repelWithinZone(bioZone);
      repelWithinZone(linksZone);

      const t = now * 0.001;

      const noise = 0.025; // Reduced noise for smoother movement
      const damping = 0.995; // Increased damping for more controlled motion
      const maxSpeed = 0.45; // Reduced max speed

      for (const p of particles) {
        if (!p.frozen) {
          // Add gentle noise for organic movement
          p.vx += Math.sin(t * 0.45 + p.phase) * noise;
          p.vy += Math.cos(t * 0.40 + p.phase) * noise;

          // Apply damping
          p.vx *= damping;
          p.vy *= damping;

          // Speed limiting
          const sp = Math.hypot(p.vx, p.vy) || 0.0001;
          if (sp > maxSpeed) {
            p.vx = (p.vx / sp) * maxSpeed;
            p.vy = (p.vy / sp) * maxSpeed;
          }

          // Update position
          p.x += p.vx * 60 * dt;
          p.y += p.vy * 60 * dt;

          bounceIn(p);
        } else {
          // When frozen, gradually reduce any remaining velocity
          p.vx *= 0.8;
          p.vy *= 0.8;
        }

        p.el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function mount() {
    // build nodes into zones
    for (const item of ITEMS) {
      const el = makeWord(item);
      const zone = isBio(item.key) ? bioZone : linksZone;
      zone.appendChild(el);

      const p = initParticle(el, zone);
      p.key = item.key;
      particles.push(p);
    }

    // freeze words when bio modal open
    overlay.el.addEventListener("overlay:open", (e) => {
      if (e.detail?.reason === "bio") {
        paused = true;
        for (const p of particles) p.frozen = true;
      }
    });
    overlay.el.addEventListener("overlay:close", () => {
      paused = false;
      for (const p of particles) p.frozen = false;
    });

    start();
    window.addEventListener("resize", onResize);
  }

  return { mount };
}
