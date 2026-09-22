import { describe, expect, it } from "vitest";
import { createClimateProfile } from "@/lib/climate";
import { plants } from "@/lib/plants";
import { PLANT_CATEGORIES, recommendedPlants } from "@/lib/plantRecommendations";

const climate = createClimateProfile({
  zip: "97401", city: "Eugene", state: "Oregon", stateAbbr: "OR", lat: 44, lng: -123, hardinessZone: "8b",
  dailyTempMax: Array(365).fill(75), dailyTempMin: Array(365).fill(50), dailySoilTemp: Array(365).fill(65), dailyPrecip: Array(365).fill(0.1),
});

describe("plant recommendations", () => {
  it("returns at most three location-ready plants per category", () => {
    for (const category of PLANT_CATEGORIES) {
      const recommendations = recommendedPlants(plants, climate, category, []);
      expect(recommendations).toHaveLength(3);
      expect(recommendations.every((plant) => plant.category === category)).toBe(true);
    }
  });

  it("ranks recent selections first within their category", () => {
    const recommendations = recommendedPlants(plants, climate, "flower", ["lavender", "zinnia"]);
    expect(recommendations.slice(0, 2).map((plant) => plant.id)).toEqual(["lavender", "zinnia"]);
  });
});
