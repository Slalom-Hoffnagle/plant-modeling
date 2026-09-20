import { describe, expect, it } from "vitest";
import { createClimateProfile } from "@/lib/climate";
import { plants } from "@/lib/plants";
import { simulateSeason } from "@/lib/simulator";

function syntheticClimate() {
  return createClimateProfile({
    zip: "97401",
    city: "Eugene",
    state: "Oregon",
    stateAbbr: "OR",
    lat: 44.05,
    lng: -123.1,
    hardinessZone: "8b",
    dailyTempMax: Array.from({ length: 365 }, (_, index) => 45 + index * 0.18),
    dailyTempMin: Array.from({ length: 365 }, (_, index) => 28 + index * 0.12),
    dailySoilTemp: Array.from({ length: 365 }, (_, index) => 50 + index * 0.12),
    dailyPrecip: Array.from({ length: 365 }, () => 0.05),
  });
}

describe("simulateSeason", () => {
  it("simulates the three M1 catalog plants with 365 daily stages", () => {
    const simulation = simulateSeason(syntheticClimate(), plants);

    expect(simulation.plants).toHaveLength(3);
    expect(simulation.plants.every((plant) => plant.stages.length === 365)).toBe(true);
  });

  it("gates tender plants until after the last spring frost", () => {
    const climate = syntheticClimate();
    const tomato = simulateSeason(climate, [plants[0]]).plants[0];

    expect(tomato.plantDay).toBeGreaterThanOrEqual(climate.lastFrostDayOfYear);
    expect(tomato.indoorStartDay).toBe(1);
  });

  it("allows frost-tolerant carrots to start as soon as soil is ready", () => {
    const climate = syntheticClimate();
    const carrot = simulateSeason(climate, [plants[1]]).plants[0];

    expect(carrot.plantDay).toBeLessThan(climate.lastFrostDayOfYear);
    expect(carrot.seasonEndDay).toBeLessThanOrEqual(climate.firstFrostDayOfYear + 21);
  });
});
