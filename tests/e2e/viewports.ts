/** The widths the design is checked at. Phones get touch and a mobile viewport. */
export const VIEWPORTS = [
  { name: '360', width: 360, height: 780, mobile: true },
  { name: '390', width: 390, height: 844, mobile: true },
  { name: '768', width: 768, height: 1024, mobile: false },
  { name: '1280', width: 1280, height: 800, mobile: false },
  { name: '1920', width: 1920, height: 1080, mobile: false },
] as const;

export function contextFor(viewport: (typeof VIEWPORTS)[number]) {
  return {
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile || viewport.width === 768,
    deviceScaleFactor: viewport.mobile ? 2 : 1,
  };
}
