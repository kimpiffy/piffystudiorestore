// Track preloader state
let preloaderReady = false;
let contentReady = false;

function checkAndHidePreloader() {
  // Only hide if both conditions met
  if (!preloaderReady || !contentReady) return;

  const preloader = document.getElementById('preloader');
  const body = document.body;

  if (preloader && !preloader.classList.contains('hidden')) {
    preloader.classList.add('hidden');
    body.classList.add('content-visible');

    // Remove preloader from DOM after fade transition
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
}

function enableFallbackPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('no-video');
  }
}

function isContentLoaded() {
  // Check if actual visible content exists (header, main content, etc)
  const header = document.querySelector('header');
  const content = document.querySelector('[role="main"], main, .page-content, body > section, body > article');
  
  if (!header && !content) return false;
  
  // At least one major element must be present and have content
  return !!(
    (document.querySelectorAll('img').length > 0) ||
    (document.body.textContent.trim().length > 100) ||
    document.readyState === 'complete'
  );
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
    // Use fallback loader on mobile/unsupported
    enableFallbackPreloader();
    preloaderReady = true;
    
    // Wait for content, minimum 2.2s
    setTimeout(() => {
      const checkContent = setInterval(() => {
        if (isContentLoaded()) {
          contentReady = true;
          clearInterval(checkContent);
          checkAndHidePreloader();
        }
      }, 200);
      
      // Force hide after 15s max
      setTimeout(() => {
        contentReady = true;
        checkAndHidePreloader();
      }, 15000);
    }, 2200);
    return;
  }

  // Video loaded and playing - wait for one complete cycle minimum
  let videoHasPlayed = false;
  
  video.addEventListener('ended', function() {
    videoHasPlayed = true;
    preloaderReady = true;
    checkAndHidePreloader();
  });

  // Attempt to play video
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt
      .then(() => {
        // Video playing successfully
        // Wait for content while video loops
        const checkContent = setInterval(() => {
          if (isContentLoaded()) {
            contentReady = true;
            clearInterval(checkContent);
            preloaderReady = true;
            checkAndHidePreloader();
          }
        }, 200);
        
        // Force hide after 15s max even if content not loaded
        setTimeout(() => {
          contentReady = true;
          preloaderReady = true;
          checkAndHidePreloader();
        }, 15000);
      })
      .catch(() => {
        // Autoplay failed - use fallback
        enableFallbackPreloader();
        preloaderReady = true;
        
        // Wait for content, minimum 2.2s
        setTimeout(() => {
          const checkContent = setInterval(() => {
            if (isContentLoaded()) {
              contentReady = true;
              clearInterval(checkContent);
              checkAndHidePreloader();
            }
          }, 200);
          
          // Force hide after 15s max
          setTimeout(() => {
            contentReady = true;
            checkAndHidePreloader();
          }, 15000);
        }, 2200);
      });
  }
});

// Additional safety: hide on page fully loaded if not already hidden
window.addEventListener('load', function() {
  contentReady = true;
  preloaderReady = true;
  checkAndHidePreloader();
});
