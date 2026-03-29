export const mqMobile = window.matchMedia("(max-width: 767px)");
export const mqTablet = window.matchMedia("(min-width: 768px) and ( max-width: 1024px)");

export const isMobile = () => mqMobile.matches;
export const isTablet = () => mqTablet.matches;

// For art mosaic: show more blobs per set than digital
// Desktop: 6 per view (2-3 per row), Tablet: 4 per view
export const DESKTOP_PAGE_SIZE = 6;

export function perSet(projectCount) {
  if (isTablet()) return Math.min(4, projectCount);
  return Math.min(DESKTOP_PAGE_SIZE, projectCount);
}
