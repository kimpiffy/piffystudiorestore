const MIN_FALLBACK_CYCLE_MS = 2200;

let pageLoaded = false;
let minCycleComplete = false;
let preloaderHidden = false;

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  const body = document.body;

  if (preloader && !preloader.classList.contains('hidden')) {
    preloader.classList.add('hidden');
    body.classList.add('content-visible');

    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
}

function maybeHidePreloader() {
  if (preloaderHidden) {
    return;
  }

  // Hard rule: never hide before one cycle completes.
  if (pageLoaded && minCycleComplete) {
    preloaderHidden = true;
    hidePreloader();
  }
}

function enableFallbackPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('no-video');
  }
}

function startFallbackMinimumCycle(video) {
  const fallbackCycleMs =
    Number.isFinite(video?.duration) && video.duration > 0
      ? Math.max(Math.round(video.duration * 1000), MIN_FALLBACK_CYCLE_MS)
      : MIN_FALLBACK_CYCLE_MS;

  setTimeout(() => {
    minCycleComplete = true;
    maybeHidePreloader();
  }, fallbackCycleMs);
}

document.addEventListener('DOMContentLoaded', function() {
  const preloader = document.getElementById('preloader');
  const video = preloader?.querySelector('video');

  if (!preloader) {
    return;
  }

  if (!video) {
    enableFallbackPreloader();
    startFallbackMinimumCycle(null);
    return;
  }

  // We manually restart playback at the end of each cycle so we can
  // reliably count a full first cycle before allowing hide.
  video.loop = false;

  const supportsWebm =
    typeof video.canPlayType === 'function' &&
    video.canPlayType('video/webm') !== '';

  if (!supportsWebm) {
    enableFallbackPreloader();
    startFallbackMinimumCycle(video);
    return;
  }

  video.addEventListener('ended', function() {
    if (!minCycleComplete) {
      minCycleComplete = true;
      maybeHidePreloader();
    }

    if (!pageLoaded) {
      video.currentTime = 0;
      const replayAttempt = video.play();
      if (replayAttempt && typeof replayAttempt.then === 'function') {
        replayAttempt.catch(() => {
          enableFallbackPreloader();
        });
      }
    }
  });

  // If metadata never loads or ended never fires on a device,
  // fallback timer guarantees at least one visible cycle duration.
  startFallbackMinimumCycle(video);

  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt.catch(() => {
      // Typical on iOS autoplay-blocked scenarios.
      enableFallbackPreloader();
    });
  }
});

window.addEventListener('load', function() {
  pageLoaded = true;
  maybeHidePreloader();
});
