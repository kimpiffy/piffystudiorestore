// Hide preloader after video finishes playing
function hidePreloader() {
  const preloader = document.getElementById('preloader');
  const body = document.body;

  if (preloader && !preloader.classList.contains('hidden')) {
    preloader.classList.add('hidden');
    // Fade in page content
    body.classList.add('content-visible');

    // Remove preloader from DOM after animation completes
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500); // Match the CSS transition duration
  }
}

function enableFallbackPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('no-video');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const preloader = document.getElementById('preloader');
  const video = preloader?.querySelector('video');

  if (!preloader || !video) {
    return;
  }

  const supportsWebm =
    typeof video.canPlayType === 'function' &&
    video.canPlayType('video/webm') !== '';

  if (!supportsWebm) {
    enableFallbackPreloader();
    setTimeout(hidePreloader, 2200);
    return;
  }

  // Hide preloader when video finishes playing
  video.addEventListener('ended', hidePreloader);

  // On some mobile browsers autoplay fails despite muted + playsinline.
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt.catch(() => {
      enableFallbackPreloader();
      setTimeout(hidePreloader, 2200);
    });
  }
});

// Fallback: hide preloader after max time (e.g., if video fails to load)
window.addEventListener('load', function() {
  setTimeout(() => {
    hidePreloader();
  }, 10000); // 10 second max timeout
});
