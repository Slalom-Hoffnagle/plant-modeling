import { DAYS_IN_YEAR } from "@/lib/climate";

export const PIXELS_PER_DAY = 20;
export const TOTAL_SCROLL_HEIGHT = DAYS_IN_YEAR * PIXELS_PER_DAY;

export function dayToScrollY(dayOfYear: number, totalHeight = TOTAL_SCROLL_HEIGHT): number {
  const clampedDay = Math.min(DAYS_IN_YEAR, Math.max(1, dayOfYear));
  return ((clampedDay - 1) / (DAYS_IN_YEAR - 1)) * totalHeight;
}

export function scrollYToDay(scrollY: number, totalHeight = TOTAL_SCROLL_HEIGHT): number {
  const clampedScrollY = Math.min(totalHeight, Math.max(0, scrollY));
  return Math.round((clampedScrollY / totalHeight) * (DAYS_IN_YEAR - 1)) + 1;
}
