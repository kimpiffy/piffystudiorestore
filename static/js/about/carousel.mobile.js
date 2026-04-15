// static/js/about/carousel.mobile.js
import { BIO_TEXT, NAV_ORDER } from "./config.js";

export function createCarouselController({ overlay, routes, arcTextEl, prevBtn, nextBtn }) {
  let idx = 0;

  function key() {
    return NAV_ORDER[idx];
  }

  function setWord(k) {
    arcTextEl.style.opacity = "0";
    window.setTimeout(() => {
      arcTextEl.textContent = k;
      arcTextEl.style.opacity = "1";
    }, 140);
  }

  function go(dir) {
    idx = (idx + dir + NAV_ORDER.length) % NAV_ORDER.length;
    setWord(key());
  }

  function openBio() {
    const contactHref = routes?.contact || "/contact/";
    overlay.open(`
      <h2 style="font-family: wakaba; font-size: 3rem; margin:0 0 10px 0; text-align:center;">artist, web designer & mother...</h2>
      <p style="opacity:.85; margin: 0 auto 14px auto; line-height:1.55; white-space:pre-line;">
        ${BIO_TEXT}
      </p>
      <div style="display:flex; justify-content:center; margin-top: 14px;">
        <a class="btn project-cta lilac"
           href="${contactHref}"
           style="font-family: wakaba; font-size: 2rem; text-decoration:none;">
          contact
        </a>
      </div>
    `, { reason: "bio" });
  }

  function navigateTo(k) {
    const href =
      k === "art" ? routes?.art :
      k === "digital" ? routes?.digital :
      k === "people" ? routes?.people :
      null;

    if (href) window.location.assign(href);
  }

  function select() {
    const k = key();
    if (k === "bio") openBio();
    else navigateTo(k);
  }

  function mount() {
    setWord(key());
    prevBtn.addEventListener("click", () => go(-1));
    nextBtn.addEventListener("click", () => go(1));
    arcTextEl.addEventListener("click", select);
  }

  // Minimal destroy (we can tidy later)
  function destroy() {}

  return { mount, destroy };
}
