export function bindControls({ blobLayer, prevBtn, nextBtn, isMobile, onPrev, onNext }) {
  prevBtn.addEventListener("click", onPrev);
  nextBtn.addEventListener("click", onNext);

  // Swipe on mobile
  let touchX0 = null;
  let touchY0 = null;

  blobLayer.addEventListener("touchstart", (e) => {
    if (!isMobile()) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    touchX0 = t.clientX;
    touchY0 = t.clientY;
  }, { passive: true });

  blobLayer.addEventListener("touchend", (e) => {
    if (!isMobile() || touchX0 == null || touchY0 == null) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - touchX0;
    const dy = t.clientY - touchY0;

    touchX0 = null;
    touchY0 = null;

    if (Math.abs(dy) > Math.abs(dx)) return;

    const threshold = 40;
    if (dx > threshold) prevBtn.click();
    else if (dx < -threshold) nextBtn.click();
  }, { passive: true });
}
