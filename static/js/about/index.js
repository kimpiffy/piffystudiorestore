// static/js/about/index.js
import { $ } from "./utils.js";
import { injectWobbleFilter } from "./wobbleFilter.js";
import { createOverlay } from "./overlay.js";
import { createPortraitController } from "./portrait.js";
import { createOrbitController } from "./orbit.desktop.js";
import { createCarouselController } from "./carousel.mobile.js";

document.addEventListener("DOMContentLoaded", () => {
  const stage = $("aboutStage");
  const portraitBlob = $("portraitBlob");
  const wordsLayer = $("aboutWords");

  const mobilePrev = $("mobilePrev");
  const mobileNext = $("mobileNext");
  const mobileArcText = $("mobileArcText");

  if (!stage || !portraitBlob || !wordsLayer) return;

  // URLs from template dataset
  const routes = {
    art: stage.dataset.urlArt,
    digital: stage.dataset.urlDigital,
    people: stage.dataset.urlPeople,
    contact: stage.dataset.urlContact,
    cv: stage.dataset.urlCv,
  };

  injectWobbleFilter();

  const overlay = createOverlay({
    overlay: $("overlay"),
    backdrop: $("overlayBackdrop"),
    closeBtn: $("overlayClose"),
    content: $("overlayContent"),
  });

  const portrait = createPortraitController(portraitBlob);
  portrait.mount();

  const mq = window.matchMedia("(max-width: 767px)");
  let controller = null;

  function mountByMode() {
    controller?.destroy?.();
    controller = null;

    if (mq.matches) {
      if (!mobilePrev || !mobileNext || !mobileArcText) return;
      controller = createCarouselController({
        overlay,
        routes,
        arcTextEl: mobileArcText,
        prevBtn: mobilePrev,
        nextBtn: mobileNext,
      });
    } else {
      controller = createOrbitController({
        stage,
        overlay,
        routes,
        wordsLayer,
      });
    }

    controller?.mount?.();
  }

  mountByMode();
  mq.addEventListener("change", mountByMode);
});
