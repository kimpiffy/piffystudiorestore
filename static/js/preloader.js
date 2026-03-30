const MIN_FALLBACK_CYCLE_MS = 2200;

let pageLoaded = false;
let minCycleComplete = false;
let preloaderHidden = false;
let usingFallback = false;
let videoActive = false;

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

function enableFallbackPreloader(preloader) {
  if (!preloader || usingFallback) {
    return;
  }

  usingFallback = true;
  preloader.classList.remove('video-active');
  preloader.classList.add('no-video');

  // Fallback still respects the "minimum one cycle" rule.
  setTimeout(() => {
    minCycleComplete = true;
    maybeHidePreloader();
  }, MIN_FALLBACK_CYCLE_MS);
}

document.addEventListener('DOMContentLoaded', function() {
  const preloader = document.getElementById('preloader');
  const video = preloader?.querySelector('video');

  if (!preloader) {
    return;
  }

  if (!video) {
    enableFallbackPreloader(preloader);
    return;
  }

  // We manually replay so we can count one full cycle reliably.
  video.loop = false;

  const supportsWebm =
    typeof video.canPlayType === 'function' &&
    (video.canPlayType('video/webm; codecs="vp9,opus"') !== '' ||
      video.canPlayType('video/webm') !== '');

  const supportsMp4 =
    typeof video.canPlayType === 'function' &&
    (video.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"') !== '' ||
      video.canPlayType('video/mp4') !== '');

  if (!supportsWebm && !supportsMp4) {
    enableFallbackPreloader(preloader);
    return;
  }

  video.addEventListener('playing', function() {
    if (!videoActive) {
      videoActive = true;
      preloader.classList.add('video-active');
    }
  }, { once: true });

  video.addEventListener('ended', function() {
    // First full cycle completed.
    if (!minCycleComplete) {
      minCycleComplete = true;
      maybeHidePreloader();
    }

    // Continue cycling until page is fully loaded.
    if (!pageLoaded) {
      video.currentTime = 0;
      const replayAttempt = video.play();
      if (replayAttempt && typeof replayAttempt.then === 'function') {
        replayAttempt.catch(() => {
          enableFallbackPreloader(preloader);
        });
      }
    }
  });

  video.addEventListener('error', function() {
    enableFallbackPreloader(preloader);
  });

  // If the browser claims support but never starts rendering, fall back.
  setTimeout(() => {
    if (!videoActive) {
      enableFallbackPreloader(preloader);
    }
  }, 1200);

  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt.catch(() => {
      enableFallbackPreloader(preloader);
    });
  }
});

window.addEventListener('load', function() {
  pageLoaded = true;
  maybeHidePreloader();
});

if (document.readyState === 'complete') {
  pageLoaded = true;
}
