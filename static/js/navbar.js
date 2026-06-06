/**
 * Smart Navigation Hover Behavior
 * - Desktop: hover to expand/collapse with smart delays to prevent jittery behavior
 * - Mobile/Touch: click to toggle
 * - Only closes when cursor is safely away from nav area
 */

(function() {
  'use strict';

  console.log('Navbar script loaded');

  // Configuration
  const HOVER_ENTER_DELAY = 100; // ms before opening on hover
  const HOVER_EXIT_DELAY = 150;  // ms before closing when leaving nav area (reduced)
  const SAFE_DISTANCE = 60;      // pixels - safe area around nav to prevent jittery behavior
  
  // Elements
  const navbar = document.getElementById('navbar');
  const navToggler = document.querySelector('.nav-x');
  const navPanel = document.querySelector('.nav-panel');
  const workDropdown = document.getElementById('workDropdown');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  
  // State
  let hoverEnterTimer = null;
  let hoverExitTimer = null;
  let isTouch = false;
  let navOpen = false;
  let dropdownOpen = false;
  let lastInteractionWasTouch = false;
  
  // Detect touch device - more nuanced for iPad with mouse support
  function detectTouch() {
    // Check if device supports hover properly (like iPad with mouse)
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    
    // If device has proper hover and fine pointer, treat as non-touch
    if (hasHover && hasPointer) {
      return false;
    }
    
    // Otherwise check for touch capability
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           navigator.msMaxTouchPoints > 0;
  }
  
  // Update interaction mode based on actual user input
  function updateInteractionMode(event) {
    if (event.type.startsWith('touch')) {
      lastInteractionWasTouch = true;
    } else if (event.type.startsWith('mouse')) {
      lastInteractionWasTouch = false;
    }
  }
  
  // Check if we should use touch behavior
  function shouldUseTouchBehavior() {
    return isTouch && lastInteractionWasTouch;
  }
  
  // Check if point is within safe area around navigation
  function isInSafeArea(x, y) {
    if (!navbar) return false;
    
    const navRect = navbar.getBoundingClientRect();
    const expandedArea = {
      left: navRect.left - SAFE_DISTANCE,
      right: navRect.right + SAFE_DISTANCE,
      top: navRect.top - SAFE_DISTANCE,
      bottom: navRect.bottom + SAFE_DISTANCE
    };
    
    // Also include dropdown area if it's open and nav panel is open
    if (navPanel && navOpen) {
      const panelRect = navPanel.getBoundingClientRect();
      expandedArea.right = Math.max(expandedArea.right, panelRect.right + SAFE_DISTANCE);
      expandedArea.bottom = Math.max(expandedArea.bottom, panelRect.bottom + SAFE_DISTANCE);
    }
    
    return x >= expandedArea.left && 
           x <= expandedArea.right && 
           y >= expandedArea.top && 
           y <= expandedArea.bottom;
  }
  
  // Open navigation
  function openNav() {
    console.log('Opening nav');
    if (navOpen) return;
    navOpen = true;
    document.body.classList.add('nav-expanded');
    
    if (navToggler) {
      navToggler.setAttribute('aria-expanded', 'true');
    }
    
    if (navPanel) {
      navPanel.classList.add('show');
    }
  }
  
  // Close navigation
  function closeNav() {
    console.log('Closing nav');
    if (!navOpen) return;
    navOpen = false;
    dropdownOpen = false;
    document.body.classList.remove('nav-expanded');
    
    if (navToggler) {
      navToggler.setAttribute('aria-expanded', 'false');
    }
    
    if (navPanel) {
      navPanel.classList.remove('show');
    }
    
    if (dropdownMenu) {
      dropdownMenu.classList.remove('show');
    }
    
    if (workDropdown) {
      workDropdown.setAttribute('aria-expanded', 'false');
    }

    // On touch devices, blur the toggler so closed state always returns to lowercase.
    navToggler?.blur();
  }
  
  // Open dropdown
  function openDropdown() {
    console.log('Opening dropdown');
    if (dropdownOpen || !navOpen) return;
    dropdownOpen = true;
    
    if (dropdownMenu) {
      dropdownMenu.classList.add('show');
    }
    
    if (workDropdown) {
      workDropdown.setAttribute('aria-expanded', 'true');
    }
  }
  
  // Close dropdown
  function closeDropdown() {
    console.log('Closing dropdown');
    if (!dropdownOpen) return;
    dropdownOpen = false;
    
    if (dropdownMenu) {
      dropdownMenu.classList.remove('show');
    }
    
    if (workDropdown) {
      workDropdown.setAttribute('aria-expanded', 'false');
    }
  }
  
  // Clear timers
  function clearTimers() {
    if (hoverEnterTimer) {
      clearTimeout(hoverEnterTimer);
      hoverEnterTimer = null;
    }
    if (hoverExitTimer) {
      clearTimeout(hoverExitTimer);
      hoverExitTimer = null;
    }
  }
  
  // Handle mouse enter navbar area
  function handleNavEnter(event) {
    console.log('Nav enter');
    updateInteractionMode(event);
    if (shouldUseTouchBehavior()) return;
    
    clearTimers();
    
    if (!navOpen) {
      hoverEnterTimer = setTimeout(() => {
        openNav();
      }, HOVER_ENTER_DELAY);
    }
  }
  
  // Handle mouse enter dropdown trigger - disabled for click-to-open behavior
  function handleDropdownEnter(event) {
    console.log('Dropdown enter - click to open mode');
    // No automatic hover opening - require click instead
    return;
  }
  
  // Removed handleDropdownLeave - submenu stays open once expanded
  
  // Handle global mouse move
  function handleMouseMove(event) {
    updateInteractionMode(event);
    if (shouldUseTouchBehavior() || !navOpen) return;
    
    clearTimers();
    
    const { clientX: x, clientY: y } = event;
    
    if (!isInSafeArea(x, y)) {
      hoverExitTimer = setTimeout(() => {
        closeNav();
      }, HOVER_EXIT_DELAY);
    }
  }
  
  // Handle click events (for touch devices and explicit clicks)
  function handleNavClick(event) {
    console.log('Nav click');
    updateInteractionMode(event);
    event.preventDefault();
    
    if (navOpen) {
      closeNav();
    } else {
      openNav();
    }
  }
  
  // Handle dropdown click
  function handleDropdownClick(event) {
    console.log('Dropdown click');
    updateInteractionMode(event);
    event.preventDefault();
    
    // Always toggle dropdown on click, regardless of device type
    if (dropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }
  
  // Handle clicks outside nav to close
  function handleDocumentClick(event) {
    if (!navOpen) return;
    
    if (!navbar.contains(event.target)) {
      closeNav();
    }
  }
  
  // Initialize
  function init() {
    console.log('Initializing navbar');
    
    if (!navbar || !navToggler || !navPanel) {
      console.warn('Navigation elements not found', { navbar: !!navbar, navToggler: !!navToggler, navPanel: !!navPanel });
      return;
    }
    
    isTouch = detectTouch();
    console.log('Device detection:', { isTouch });
    document.body.classList.remove('nav-expanded');
    
    // Set initial ARIA states
    navToggler.setAttribute('aria-expanded', 'false');
    if (workDropdown) {
      workDropdown.setAttribute('aria-expanded', 'false');
    }
    
    // Add event listeners for both mouse and touch
    // Mouse/hover behavior (will be dynamically disabled for touch interactions)
    navbar.addEventListener('mouseenter', handleNavEnter);
    document.addEventListener('mousemove', handleMouseMove);
    
    if (workDropdown) {
      workDropdown.addEventListener('mouseenter', handleDropdownEnter);
      // Removed mouseleave listeners - submenu stays open once expanded
    }
    
    // Touch event listeners to detect touch interactions
    navbar.addEventListener('touchstart', updateInteractionMode, { passive: true });
    document.addEventListener('touchstart', updateInteractionMode, { passive: true });
    
    // Click behavior (works on both desktop and touch)
    navToggler.addEventListener('click', handleNavClick);
    
    if (workDropdown) {
      workDropdown.addEventListener('click', handleDropdownClick);
    }
    
    // Close on outside click
    document.addEventListener('click', handleDocumentClick);
    
    console.log('Smart navigation initialized successfully');
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();