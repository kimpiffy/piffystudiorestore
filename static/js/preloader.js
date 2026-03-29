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

document.addEventListener('DOMContentLoaded', function() {
  const preloader = document.getElementById('preloader');
  const video = preloader?.querySelector('video');

  if (video) {
    // Hide preloader when video finishes playing
    video.addEventListener('ended', hidePreloader);
  }
});

// Fallback: hide preloader after max time (e.g., if video fails to load)
window.addEventListener('load', function() {
  setTimeout(() => {
    hidePreloader();
  }, 10000); // 10 second max timeout
});
