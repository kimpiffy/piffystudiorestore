// static/js/about/orbit.desktop.js
import { escapeHtml } from "./utils.js";
import { BIO_TEXT, NAV_ORDER } from "./config.js";

export function createOrbitController({ stage, overlay, routes, wordsLayer }) {
  let raf = null;
  let paused = false;
  let theta = 0;
  let last = performance.now();

  let collapsing = false;
  let collapseT = 0; // 0..1
  let afterCollapse = null;

  // Ensure we use the existing HTML buttons, ordered as desired
  const nodes = [...wordsLayer.querySelectorAll(".about-word")];
  const byKey = new Map(nodes.map((el) => [el.dataset.key, el]));
  const ordered = NAV_ORDER.map((k) => byKey.get(k)).filter(Boolean);

  const tilts = {
    bio: -12,
    art: 14,
    digital: -6,
    community: 8,
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function openBio() {
    const contactHref = routes?.contact || "/contact/";
    const cvHref = routes?.cv || "#";
    const styleHref = routes?.style || "/work/industry/";
    const styleLink =
      styleHref && styleHref !== "#"
        ? `
          <a class="btn project-cta lilac"
             href="${escapeHtml(styleHref)}"
             style="font-family: picnic; font-size: 2rem; text-decoration:none;">
            styles
          </a>`
        : "";
    const cvLink =
      cvHref && cvHref !== "#"
        ? `
          <a class="btn project-cta lilac"
             href="${escapeHtml(cvHref)}"
             target="_blank" rel="noopener noreferrer"
             style="font-family: picnic; font-size: 2rem; text-decoration:none;">
            c.v
          </a>`
        : "";

    overlay.open(
      `
      <h2 class="bio-modal-title" style="font-family: picnic; font-size: 3rem; margin:0 0 6px 0; text-align:center;">i'm kim</h2>
      <p class="bio-modal-copy" style="opacity:.85; margin: 0 auto 14px auto; line-height:1.55; white-space:pre-line;">
        ${escapeHtml(BIO_TEXT)}
      </p>
      <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top: 12px;">
        ${styleLink}
        ${cvLink}
        <a class="btn project-cta lilac"
           href="${escapeHtml(contactHref)}"
           style="font-family: picnic; font-size: 2rem; text-decoration:none;">
          contact
        </a>
      </div>
    `,
      { reason: "bio" }
    );
  }

  function navigateTo(key) {
    const href =
      key === "art"
        ? routes?.art
        : key === "digital"
        ? routes?.digital
        : key === "community"
        ? routes?.community
        : null;

    if (href) window.location.assign(href);
  }

  function startCollapse(action) {
    collapsing = true;
    collapseT = 0;
    paused = true;
    afterCollapse = action;

    window.setTimeout(() => {
      collapsing = false;
      collapseT = 0;
      const fn = afterCollapse;
      afterCollapse = null;
      fn?.();
      paused = false;
    }, 260);
  }

  function onClick(key) {
    startCollapse(() => {
      if (key === "bio") openBio();
      else navigateTo(key);
    });
  }

  function pauseAll(on) {
    paused = on;
  }

  ordered.forEach((el) => {
    el.addEventListener("mouseenter", () => pauseAll(true));
    el.addEventListener("mouseleave", () => pauseAll(false));
    el.addEventListener("focus", () => pauseAll(true));
    el.addEventListener("blur", () => pauseAll(false));
    el.addEventListener("click", () => onClick(el.dataset.key));
  });

  function tick(now) {
    const dt = now - last;
    last = now;

    if (!paused) theta += dt * 0.00009;
    if (collapsing) collapseT = Math.min(1, collapseT + dt / 260);

    const rect = stage.getBoundingClientRect();
    const blobEl = document.getElementById("portraitBlob");
    const blobRect = blobEl ? blobEl.getBoundingClientRect() : null;

    const blobSize = blobRect
      ? Math.min(blobRect.width, blobRect.height)
      : Math.min(rect.width, rect.height) * 0.6;

    const baseRx = blobSize * 0.78;
    const baseRy = blobSize * 0.62;

    const shrink = collapsing ? 1 - collapseT : 1;
    const rx = baseRx * shrink;
    const ry = baseRy * shrink;

    const halfW = rect.width / 2;
    const halfH = rect.height / 2;

    // Larger pad because rotation + wobble can clip
    const pad = 34;

    ordered.forEach((el, i) => {
      const key = el.dataset.key;
      const phase = theta + Math.PI * 2 * (i / ordered.length);

      // ------------------------------------
      // NEW: gentle bob + sway + pulse
      // ------------------------------------
      const bob = Math.sin(phase * 0.6 + now * 0.0012) * 8;       // px
      const sway = Math.sin(phase * 0.9 + now * 0.0010) * 1.8;    // deg
      const pulse = 1 + Math.sin(phase * 0.7 + now * 0.0011) * 0.025; // scale
      // ------------------------------------

      // Top-half lift: only applies when word is on upper arc
      const topBias =
        Math.sin(phase) < 0
          ? Math.sin(phase) * -18
          : 0;

      const wobX =
        Math.sin(phase * (6.6 + i * 0.7)) * 18 +
        Math.sin(phase * (12.4 + i * 0.9)) * 7;

      const wobY =
        Math.cos(phase * (8.1 + i * 0.8)) * 12 +
        Math.cos(phase * (11.2 + i * 0.6)) * 6;

      const bias = key === "bio" ? 1.08 : key === "community" ? 1.06 : 1;

      // Use real on-screen size (includes font rendering + rotation effects)
      const rEl = el.getBoundingClientRect();

      // Safety multiplier because rotation can extend beyond rect between frames
      const ew = Math.max(10, rEl.width) * 1.15;
      const eh = Math.max(10, rEl.height) * 1.15;

      // Available space from center to each edge
      const availX = Math.max(10, halfW - ew - pad);
      const availY = Math.max(10, halfH - eh - pad);

      const centerYOffset = rect.height * 0.05;

      // Shrink orbit radii so this element never has a target outside viewport
      const rxEff = Math.min(rx * bias, availX);
      const ryEff = Math.min(ry * bias, availY);

      let x = Math.cos(phase) * rxEff + wobX * shrink;
      let y =
        Math.sin(phase) * ryEff +
        wobY * shrink -
        centerYOffset +
        topBias +
        bob; // NEW: add bob

      // Final clamp (belt + braces)
      x = clamp(x, -availX, availX);
      y = clamp(y, -availY, availY);

      const tilt = tilts[key] ?? 0;

      if (collapsing) {
        el.style.opacity = String(1 - collapseT);
        el.style.filter = `blur(${(8 * collapseT).toFixed(2)}px)`;
      } else {
        el.style.opacity = "1";
        el.style.filter = "url(#wobbleFilter)";
      }

      // NEW: add sway rotation + pulse scale (safe because it’s all one transform)
      el.style.transform = `
        translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)
        rotate(${(tilt + sway).toFixed(2)}deg)
        scale(${pulse.toFixed(4)})
      `;
    });

    raf = requestAnimationFrame(tick);
  }

  function mount() {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  return { mount, destroy };
}
