// static/js/about/portrait.js
import { escapeHtml, clamp, isMobile } from "./utils.js";
import { PORTRAITS, PORTRAIT_FIT } from "./config.js";
import { createBlobModel, computePathFromModel } from "./blob/model.js";

export function createPortraitController(portraitBtn, stageEl) {
  const uid = `p_${Math.floor(Math.random() * 1e9)}`;
  const model = createBlobModel(uid);
  let index = 0;

  let edgeRAF = null;
  let moveRAF = null;

  // desktop roam state
  let x = 0, y = 0, vx = 0.25, vy = 0.18;
  let last = performance.now();

  function renderSVG() {
    const d0 = computePathFromModel(model, performance.now() * 0.001);
    const img = PORTRAITS[index];

    portraitBtn.innerHTML = `
      <svg class="blob-svg"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink"
           viewBox="0 0 100 100"
           data-uid="${uid}"
           role="img"
           aria-label="portrait">
        <defs>
          <clipPath id="${uid}_clip">
            <path id="${uid}_path" d="${d0}"></path>
          </clipPath>
        </defs>

        <g clip-path="url(#${uid}_clip)">
          <image id="${uid}_img"
                 href="${escapeHtml(img)}"
                 xlink:href="${escapeHtml(img)}"
                 x="0" y="0" width="100" height="100"
                 preserveAspectRatio="${PORTRAIT_FIT}"></image>
        </g>

        <path class="blob-outline" id="${uid}_outline" d="${d0}" fill="none"></path>
      </svg>
    `;
  }

  function nextImage() {
    index = (index + 1) % PORTRAITS.length;
    const imgEl = portraitBtn.querySelector(`#${uid}_img`);
    if (imgEl) {
      imgEl.setAttribute("href", PORTRAITS[index]);
      imgEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", PORTRAITS[index]);
    }
  }

  function startEdgeWarp() {
    stopEdgeWarp();
    function frame(now) {
      const t = now * 0.001;
      const d = computePathFromModel(model, t);

      const pathEl = portraitBtn.querySelector(`#${uid}_path`);
      const outlineEl = portraitBtn.querySelector(`#${uid}_outline`);
      if (pathEl) pathEl.setAttribute("d", d);
      if (outlineEl) outlineEl.setAttribute("d", d);

      edgeRAF = requestAnimationFrame(frame);
    }
    edgeRAF = requestAnimationFrame(frame);
  }

  function stopEdgeWarp() {
    if (edgeRAF) cancelAnimationFrame(edgeRAF);
    edgeRAF = null;
  }

  function stageRect() {
    return stageEl.getBoundingClientRect();
  }

  function startMove() {
    stopMove();
    last = performance.now();

    // initial position: somewhere pleasant
    const s = stageRect();
    const bw = portraitBtn.offsetWidth || 420;
    const bh = portraitBtn.offsetHeight || 420;

    x = (s.width * 0.18);
    y = (s.height * 0.30);

    function frame(now) {
      let dt = (now - last) / 1000;
      if (dt > 0.06) dt = 0.016;
      dt = clamp(dt, 0.008, 0.033);
      last = now;

      const s = stageRect();
      const bw = portraitBtn.offsetWidth || 420;
      const bh = portraitBtn.offsetHeight || 420;

      // bounds (keep inside viewport)
      const pad = 10;
      const minX = pad;
      const minY = pad;
      const maxX = Math.max(pad, s.width - bw - pad);
      const maxY = Math.max(pad, s.height - bh - pad);

      // motion tuning
      const t = now * 0.001;
      const noise = isMobile() ? 0.010 : 0.028;     // desktop more alive
      const damping = isMobile() ? 0.985 : 0.992;
      const maxSpeed = isMobile() ? 0.35 : 0.85;
      const edgePush = isMobile() ? 0.020 : 0.030;

      // add gentle “flow”
      vx += (Math.sin(t * 0.7) + Math.cos(t * 0.5 + 0.9)) * noise;
      vy += (Math.cos(t * 0.6) + Math.sin(t * 0.45 + 1.2)) * noise;

      // keep inside via soft push
      if (x < minX) vx += (minX - x) * edgePush;
      if (x > maxX) vx -= (x - maxX) * edgePush;
      if (y < minY) vy += (minY - y) * edgePush;
      if (y > maxY) vy -= (y - maxY) * edgePush;

      vx *= damping;
      vy *= damping;

      // clamp speed
      const sp = Math.hypot(vx, vy) || 0.0001;
      if (sp > maxSpeed) {
        vx = (vx / sp) * maxSpeed;
        vy = (vy / sp) * maxSpeed;
      }

      x += vx * 60 * dt;
      y += vy * 60 * dt;

      x = clamp(x, minX, maxX);
      y = clamp(y, minY, maxY);

      // Desktop: JS controls transform only (CSS left/top = 0)
      // Mobile: you can still let it roam a bit, but it’ll remain within bounds.
      portraitBtn.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      moveRAF = requestAnimationFrame(frame);
    }

    moveRAF = requestAnimationFrame(frame);
  }

  function stopMove() {
    if (moveRAF) cancelAnimationFrame(moveRAF);
    moveRAF = null;
  }

  function bindInteractions() {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (canHover) portraitBtn.addEventListener("mouseenter", nextImage);
    portraitBtn.addEventListener("click", nextImage);
  }

  function mount() {
    renderSVG();
    bindInteractions();
    startEdgeWarp();
    startMove();
    window.addEventListener("resize", startMove);
  }

  function destroy() {
    stopEdgeWarp();
    stopMove();
    window.removeEventListener("resize", startMove);
  }

  return { mount, destroy, nextImage };
}
