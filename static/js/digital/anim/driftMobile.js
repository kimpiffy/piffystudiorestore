import { isMobile } from "../state.js";

export function createMobileDrift() {
  function stop() {
    return;
  }

  function start() {
    return;
  }

  return { start, stop };
}
