import { describe, expect, it } from "vitest";
import { dayToScrollY, scrollYToDay, TOTAL_SCROLL_HEIGHT } from "@/lib/scroll";

describe("season scroll mapping", () => {
  it("maps the first and last calendar days to the scroll bounds", () => {
    expect(dayToScrollY(1)).toBe(0);
    expect(dayToScrollY(365)).toBe(TOTAL_SCROLL_HEIGHT);
    expect(scrollYToDay(0)).toBe(1);
    expect(scrollYToDay(TOTAL_SCROLL_HEIGHT)).toBe(365);
  });

  it("clamps days and positions outside the season", () => {
    expect(dayToScrollY(0)).toBe(0);
    expect(dayToScrollY(400)).toBe(TOTAL_SCROLL_HEIGHT);
    expect(scrollYToDay(-50)).toBe(1);
    expect(scrollYToDay(TOTAL_SCROLL_HEIGHT + 50)).toBe(365);
  });

  it("round-trips representative days within one calendar day", () => {
    for (const day of [15, 90, 172, 244, 320]) {
      expect(Math.abs(scrollYToDay(dayToScrollY(day)) - day)).toBeLessThanOrEqual(1);
    }
  });
});
