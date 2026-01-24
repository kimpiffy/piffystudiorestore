export const mqMobile = window.matchMedia("(max-width: 767px)");
export const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");

export const isMobile = () => mqMobile.matches;
export const isTablet = () => mqTablet.matches;

export const DESKTOP_PAGE_SIZE = 7;

export function perSet(projectCount) {
  if (isTablet()) return Math.min(5, projectCount);
  return Math.min(DESKTOP_PAGE_SIZE, projectCount);
}
