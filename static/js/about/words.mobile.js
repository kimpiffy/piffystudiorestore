// static/js/about/words.mobile.js
import { createWordsController } from "./words.desktop.js";

/**
 * Mobile uses the same controller but your CSS zones become
 * (bio top lane, links bottom lane). That’s the “separate mobile JS”
 * without duplicating everything.
 *
 * If you want even calmer motion on mobile later, we can fork properly.
 */
export function createWordsControllerMobile(args) {
  return createWordsController(args);
}
