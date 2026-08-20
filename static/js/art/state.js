export const mqMobile = window.matchMedia("(max-width: 767px)");
export const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1199px)");
export const mqMasonryDesktop = window.matchMedia("(min-width: 1200px)");

export const isMobile = () => mqMobile.matches;
export const isTablet = () => mqTablet.matches;
export const isMasonryDesktop = () => mqMasonryDesktop.matches;

export const DESKTOP_PAGE_SIZE = 9;

export function perSet(projectCount) {
  if (isTablet()) return Math.min(6, projectCount);
  return Math.min(DESKTOP_PAGE_SIZE, projectCount);
}
