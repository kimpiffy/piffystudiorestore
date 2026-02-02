// New Contact Page Animation: Expanding Blob Intro + Tessellating Dots Background

// ---- seeded RNG ----
function hashToSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Chaikin smoothing ----
function chaikin(points, iterations = 2) {
  let pts = points.slice();
  for (let it = 0; it < iterations; it++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = out;
  }
  return pts;
}

// ---- closed quadratic path ----
function pointsToClosedPath(points) {
  if (!points.length) return "";
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const start = mid(points[0], points[1]);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} `;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const m = mid(curr, next);
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${m.x.toFixed(2)} ${m.y.toFixed(2)} `;
  }

  return d + "Z";
}

// ---- blob model ----
function buildBlobModel(id) {
  const rnd = mulberry32(hashToSeed(id || "contact"));
  const N = 10 + Math.floor(rnd() * 6); // Moderate range (10-16) for good smoothness

  const baseR = 40 + rnd() * 12; // Moderate base radius range (40-52)
  const amp1 = 3 + rnd() * 5; // Moderate amplitudes for variation (3-8)
  const amp2 = 2 + rnd() * 4; // (2-6)
  const amp3 = 1 + rnd() * 3; // Additional amplitude layer (1-4)
  const f1 = 2 + Math.floor(rnd() * 3); // Lower frequency range for smoother curves (2-5)
  const f2 = 3 + Math.floor(rnd() * 3); // (3-6)
  const f3 = 4 + Math.floor(rnd() * 2); // (4-6)
  const p1 = rnd() * Math.PI * 2;
  const p2 = rnd() * Math.PI * 2;
  const p3 = rnd() * Math.PI * 2;

  const angles = [];
  const radii = [];

  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    angles.push(a);

    let r = baseR + 
      Math.sin(a * f1 + p1) * amp1 + 
      Math.sin(a * f2 + p2) * amp2 +
      Math.sin(a * f3 + p3) * amp3;
    r = Math.max(32, Math.min(60, r)); // Tighter radius range to prevent spikes
    radii.push(r);
  }

  const rip = {
    amps: [
      1.5 + rnd() * 2,     // Smaller ripple amplitudes (1.5-3.5)
      1 + rnd() * 1.5,     // (1-2.5)
      0.8 + rnd() * 1.2,   // (0.8-2)
      0.5 + rnd() * 1,     // (0.5-1.5)
      0.3 + rnd() * 0.7    // Additional gentle ripple layer (0.3-1)
    ],
    freqs: [
      2 + Math.floor(rnd() * 2), // Lower frequency range for smoothness (2-4)
      3 + Math.floor(rnd() * 2), // (3-5)
      4 + Math.floor(rnd() * 2), // (4-6)
      5 + Math.floor(rnd() * 3), // (5-8)
      6 + Math.floor(rnd() * 2)  // (6-8)
    ],
    phases: [
      rnd() * Math.PI * 2, 
      rnd() * Math.PI * 2, 
      rnd() * Math.PI * 2, 
      rnd() * Math.PI * 2,
      rnd() * Math.PI * 2
    ],
    speeds: [
      0.15 + rnd() * 0.25, // Slower, smoother speeds (0.15-0.4)
      0.12 + rnd() * 0.23, // (0.12-0.35)
      0.1 + rnd() * 0.2,   // (0.1-0.3)
      0.08 + rnd() * 0.17, // (0.08-0.25)
      0.05 + rnd() * 0.15  // (0.05-0.2)
    ],
    strength: 0.4 + rnd() * 0.4 // Moderate ripple strength (0.4-0.8)
  };

  return { N, angles, radii, rip };
}

function computeBlobPath(model, tSec) {
  const cx = 50, cy = 50;
  const pts = [];

  for (let i = 0; i < model.N; i++) {
    const a = model.angles[i];
    let r = model.radii[i];

    let dr = 0;
    for (let k = 0; k < model.rip.amps.length; k++) {
      dr += Math.sin(a * model.rip.freqs[k] + model.rip.phases[k] + tSec * model.rip.speeds[k]) * model.rip.amps[k];
    }

    r += dr * model.rip.strength;
    r = Math.max(30, Math.min(65, r)); // Moderate range to prevent extremes
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }

  const smooth = chaikin(pts, 3); // More smoothing iterations to eliminate sharp points
  return pointsToClosedPath(smooth);
}

// ---- Main Animation Controller ----
class ContactAnimationController {
  constructor() {
    this.introStage = document.getElementById('introStage');
    this.expandingBlob = document.getElementById('expandingBlob');
    this.introBlobPath = document.getElementById('introBlobPath');
    this.tessellatedBg = document.getElementById('tessellatedBg');
    this.contactContent = document.getElementById('contactContent');
    
    this.model = buildBlobModel('contact-intro');
    this.animationPhase = 'intro';
    this.introStartTime = null;
    this.expandStartTime = null;
    this.tessellateStartTime = null;
    
    this.INTRO_DURATION = 3000; // Longer elaborate wiggling phase
    this.EXPAND_DURATION = 2500; // Slightly longer expansion
    this.FADE_DURATION = 800;
    
    // Check if this is first visit
    this.isFirstVisit = !sessionStorage.getItem('contactVisited');
  }

  init() {
    // Always skip intro animation and go straight to tessellated background
    this.introStage.style.display = 'none';
    this.tessellatedBg.style.opacity = '1';
    this.contactContent.style.opacity = '1';
    this.contactContent.style.pointerEvents = 'auto';
    this.generateTessellatedDots();
    
    this.setupFormLogic();
  }

  startIntro() {
    this.introStartTime = performance.now();
    this.animationPhase = 'intro';
    this.animate();
  }

  startExpansion() {
    this.expandStartTime = performance.now();
    this.animationPhase = 'expanding';
  }

  startTessellation() {
    this.tessellateStartTime = performance.now();
    this.animationPhase = 'tessellating';
    
    // Fade in tessellated background
    this.tessellatedBg.style.opacity = '1';
    this.generateTessellatedDots();
    
    // Fade in contact form
    setTimeout(() => {
      this.contactContent.style.opacity = '1';
      this.contactContent.style.pointerEvents = 'auto';
    }, 300);
    
    // Hide intro stage
    setTimeout(() => {
      this.introStage.style.opacity = '0';
      setTimeout(() => {
        this.introStage.style.display = 'none';
      }, 500);
    }, 200);
  }

  animate() {
    const now = performance.now();
    const t = now / 1000;
    
    if (this.animationPhase === 'intro') {
      const elapsed = now - this.introStartTime;
      const progress = elapsed / this.INTRO_DURATION;
      
      // Elaborate blob animation with complex wiggles
      const path = computeBlobPath(this.model, t);
      this.introBlobPath.setAttribute('d', path);
      
      // Complex scaling: starts tiny, wiggles, then grows elaborately
      const baseScale = 0.03;
      const wiggle1 = Math.sin(t * 3) * 0.02;
      const wiggle2 = Math.sin(t * 5.5) * 0.015;
      const wiggle3 = Math.sin(t * 7.2) * 0.01;
      const growth = Math.sin(progress * Math.PI * 0.5) * 0.08; // Gradual growth throughout intro
      const elaborate = Math.sin(t * 1.8) * Math.sin(t * 2.3) * 0.02; // Complex oscillation
      
      const scale = baseScale + wiggle1 + wiggle2 + wiggle3 + growth + elaborate;
      this.expandingBlob.style.transform = `translate(-50%, -50%) scale(${scale})`;
      
      if (elapsed >= this.INTRO_DURATION) {
        this.startExpansion();
      }
      
    } else if (this.animationPhase === 'expanding') {
      const elapsed = now - this.expandStartTime;
      const progress = Math.min(elapsed / this.EXPAND_DURATION, 1);
      
      // Smooth expansion using easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      // Expand from tiny to screen-filling
      const scale = 0.05 + easeProgress * 25; // scales up to 25x (fills screen)
      this.expandingBlob.style.transform = `translate(-50%, -50%) scale(${scale})`;
      
      // Keep blob animating during expansion
      const path = computeBlobPath(this.model, t);
      this.introBlobPath.setAttribute('d', path);
      
      if (progress >= 1) {
        this.startTessellation();
        return; // Stop this animation loop
      }
    }
    
    if (this.animationPhase !== 'tessellating') {
      requestAnimationFrame(() => this.animate());
    }
  }

  generateTessellatedDots() {
    const container = this.tessellatedBg;
    container.innerHTML = ''; // Clear existing dots
    
    const dotSize = 60; // Base size in pixels
    const spacing = 80; // Spacing between dots
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const cols = Math.ceil(viewportWidth / spacing) + 2;
    const rows = Math.ceil(viewportHeight / spacing) + 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dot = this.createTessellatedDot(col, row, spacing, dotSize);
        container.appendChild(dot);
      }
    }
  }

  createTessellatedDot(col, row, spacing, baseSize) {
    const dot = document.createElement('div');
    dot.className = 'tessellated-dot';
    
    // Position
    const x = col * spacing - spacing / 2;
    const y = row * spacing - spacing / 2;
    
    // Offset every other row for tessellation
    const offsetX = row % 2 === 1 ? spacing / 2 : 0;
    
    dot.style.left = `${x + offsetX}px`;
    dot.style.top = `${y}px`;
    dot.style.width = `${baseSize}px`;
    dot.style.height = `${baseSize}px`;
    
    // Create blob SVG for this dot
    const svg = document.createElement('div');
    svg.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="tessellated-dot-path" d="" fill="#ff4fb3"></path>
      </svg>
    `;
    dot.appendChild(svg.firstElementChild);
    
    // Start animation for this dot
    const model = buildBlobModel(`dot-${col}-${row}`);
    const pathElement = dot.querySelector('.tessellated-dot-path');
    
    // Start immediately, no delay
    this.animateTessellatedDot(pathElement, model, baseSize);
    
    return dot;
  }

  animateTessellatedDot(pathElement, model, baseSize) {
    const startTime = performance.now();
    const CYCLE_DURATION = 4000 + Math.random() * 2000; // 4-6 seconds per cycle
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) % CYCLE_DURATION;
      const progress = elapsed / CYCLE_DURATION;
      
      // Scale animation: small -> big -> small
      const scale = 0.3 + Math.sin(progress * Math.PI * 2) * 0.4 + 0.3;
      
      // Update blob shape
      const t = performance.now() / 1000;
      const path = computeBlobPath(model, t);
      pathElement.setAttribute('d', path);
      pathElement.parentElement.style.transform = `scale(${scale})`;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  setupFormLogic() {
    // "other" dropdown logic (preserve existing functionality)
    const select = document.getElementById("query_related");
    const otherWrap = document.getElementById("otherWrap");
    const otherInput = document.getElementById("other_specify");
    
    if (!select || !otherWrap || !otherInput) return;

    function sync() {
      const isOther = select.value === "other";
      otherWrap.classList.toggle("is-hidden", !isOther);

      if (isOther) {
        otherInput.setAttribute("required", "required");
      } else {
        otherInput.removeAttribute("required");
        otherInput.value = "";
      }
    }

    select.addEventListener("change", sync);
    sync();
  }
}

// ---- Initialize when DOM is ready ----
document.addEventListener('DOMContentLoaded', () => {
  const controller = new ContactAnimationController();
  controller.init();
});
