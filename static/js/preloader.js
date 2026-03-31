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
  const mp4Source = document.getElementById('preloader-mp4');
  const webmSource = document.getElementById('preloader-webm');

  if (!preloader) {
    return;
  }

  if (!video) {
    enableFallbackPreloader(preloader);
    return;
  }

  // We manually replay so we can count one full cycle reliably.
  video.loop = false;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

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

  const ua = window.navigator.userAgent || '';
  const platform = window.navigator.platform || '';
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOSDesktopMode = platform === 'MacIntel' && maxTouchPoints > 1;
  const shouldPreferMp4 = isIOSDevice || isIPadOSDesktopMode;

  // Use WebM wherever practical; force MP4 on iOS-class devices for reliability.
  if (!shouldPreferMp4 && supportsWebm && webmSource?.src) {
    video.src = webmSource.src;
  } else if (supportsMp4 && mp4Source?.src) {
    video.src = mp4Source.src;
  } else if (supportsWebm && webmSource?.src) {
    video.src = webmSource.src;
  }

  video.load();

  function markVideoActive() {
    if (!videoActive) {
      videoActive = true;
      preloader.classList.add('video-active');
    }
  }

  video.addEventListener('playing', function() {
    markVideoActive();
  }, { once: true });

  video.addEventListener('play', function() {
    markVideoActive();
  }, { once: true });

  video.addEventListener('canplay', function() {
    markVideoActive();
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
  }, 2000);

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
