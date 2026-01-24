// static/js/about/wobbleFilter.js

export function injectWobbleFilter() {
  if (document.getElementById("wobbleFilterHost")) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "wobbleFilterHost";
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.left = "-9999px";

  // Key ideas:
  // - VERY low baseFrequency -> big, slow “pulls”
  // - blur the noise before displacement -> smooth (prevents pixel look)
  // - small scale -> subtle
  svg.innerHTML = `
    <defs>
      <filter id="wobbleFilter" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise"
          baseFrequency="0.004"
          numOctaves="1"
          seed="2"
          result="noise">
          <animate attributeName="baseFrequency" dur="10s" values="0.003;0.005;0.003" repeatCount="indefinite"/>
        </feTurbulence>

        <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise"/>

        <feDisplacementMap in="SourceGraphic" in2="softNoise"
          scale="2.2"
          xChannelSelector="R"
          yChannelSelector="G"/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
}
