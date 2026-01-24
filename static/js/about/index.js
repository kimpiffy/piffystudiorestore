// static/js/about/index.js
import { $ } from "./utils.js";
import { injectWobbleFilter } from "./wobbleFilter.js";
import { createOverlay } from "./overlay.js";
import { createPortraitController } from "./portrait.js";
import { createWordsController } from "./words.desktop.js";
import { createWordsControllerMobile } from "./words.mobile.js";

document.addEventListener("DOMContentLoaded", () => {
  const stage = $("aboutStage");
  const bioZone = $("bioZone");
  const linksZone = $("linksZone");
  const portraitBlob = $("portraitBlob");

  if (!stage || !bioZone || !linksZone || !portraitBlob) return;

  // real django urls from template
  const routes = {
    art: stage.dataset.urlArt,
    digital: stage.dataset.urlDigital,
    community: stage.dataset.urlCommunity,
    cv: stage.dataset.urlCv,
  };

  injectWobbleFilter();

  const overlay = createOverlay({
    overlay: $("overlay"),
    backdrop: $("overlayBackdrop"),
    closeBtn: $("overlayClose"),
    content: $("overlayContent"),
  });

  // portrait
  const portrait = createPortraitController(portraitBlob, stage);
  portrait.mount();

  // words: separate logic for mobile
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const words = isMobile
    ? createWordsControllerMobile({ stage, bioZone, linksZone, overlay, routes })
    : createWordsController({ stage, bioZone, linksZone, overlay, routes });

  words.mount();
});
