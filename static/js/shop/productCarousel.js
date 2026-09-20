// static/js/shop/productCarousel.js

function initProductCarousel() {
  const carousel = document.getElementById('productCarousel');
  if (!carousel) return;

  const mainImg = carousel.querySelector('.carousel-main-image');
  const carouselContainer = carousel.querySelector('.carousel-container');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  const imageOverlay = document.getElementById('productImageOverlay');
  const overlayBackdrop = imageOverlay?.querySelector('.product-image-overlay__backdrop');
  const overlayPanel = imageOverlay?.querySelector('.product-image-overlay__panel');
  const overlayImg = imageOverlay?.querySelector('img');
  const overlayClose = imageOverlay?.querySelector('.product-image-overlay__close');

  console.log('Carousel init:', {
    carousel: !!carousel,
    mainImg: !!mainImg,
    carouselContainer: !!carouselContainer,
    dotsContainer: !!dotsContainer,
    imageOverlay: !!imageOverlay,
    overlayBackdrop: !!overlayBackdrop,
    overlayImg: !!overlayImg,
    overlayClose: !!overlayClose,
  });

  const images = Array.from(carousel.querySelectorAll('[data-carousel-item]'));
  
  if (images.length === 0) return;

  console.log(`Initializing carousel with ${images.length} images`);

  let currentIndex = 0;
  let autoScrollInterval = null;

  // Color cycle for dots
  const colorClasses = ['carousel-dot--pink', 'carousel-dot--lilac', 'carousel-dot--uranium'];

  // Create dots (only if dots container exists)
  if (dotsContainer) {
    images.forEach((_, index) => {
      const dot = document.createElement('div');
      const colorClass = colorClasses[index % colorClasses.length];
      dot.className = `carousel-dot ${colorClass} ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to image ${index + 1}`);
      dot.setAttribute('data-index', index);
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      
      console.log(`Creating dot ${index}: ${colorClass}`);
      
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(index);
        resetAutoScroll();
      });
      
      // Also handle keyboard navigation
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToSlide(index);
          resetAutoScroll();
        }
      });
      
      dotsContainer.appendChild(dot);
    });
  }

  const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
  console.log(`Total carousel dots created: ${dots.length}`);

  function updateCarousel() {
    mainImg.src = images[currentIndex].src;
    mainImg.alt = images[currentIndex].alt || `Product image ${currentIndex + 1}`;
    
    // Update carousel container data-image for overlay
    if (carouselContainer) {
      carouselContainer.setAttribute('data-image', images[currentIndex].src);
    }

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function goToSlide(index) {
    currentIndex = (index + images.length) % images.length;
    updateCarousel();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function startAutoScroll() {
    autoScrollInterval = setInterval(nextSlide, 4000);
  }

  function resetAutoScroll() {
    clearInterval(autoScrollInterval);
    startAutoScroll();
  }

  // Image overlay functionality (same pattern as community projects)
  if (imageOverlay && overlayImg) {
    console.log('Setting up overlay event handlers');
    
    function closeOverlay() {
      imageOverlay.classList.remove('is-open');
      imageOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      overlayImg.src = '';
      overlayImg.alt = '';
    }

    function openOverlay(src, alt) {
      overlayImg.src = src;
      overlayImg.alt = alt || '';
      imageOverlay.classList.add('is-open');
      imageOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }

    // Find all triggers with data-image attribute (carousel-container)
    var triggers = document.querySelectorAll('[data-image]');
    triggers.forEach(function (trigger) {
      var src = trigger.getAttribute('data-image');
      if (!src) return;
      
      var clickHandler = function () {
        var img = trigger.querySelector('img');
        openOverlay(src, img ? img.getAttribute('alt') : 'Product image');
      };
      
      trigger.addEventListener('click', clickHandler);
      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          clickHandler();
        }
      });
    });

    // Close overlay
    if (overlayBackdrop) overlayBackdrop.addEventListener('click', closeOverlay);
    if (overlayClose) overlayClose.addEventListener('click', closeOverlay);
    
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && imageOverlay.classList.contains('is-open')) {
        closeOverlay();
      }
    });
  }

  // Start auto-scroll
  startAutoScroll();
}

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductCarousel);
} else {
  // DOM is already ready
  initProductCarousel();
}
