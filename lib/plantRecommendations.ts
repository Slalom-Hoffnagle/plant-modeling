import { DAYS_IN_YEAR, type ClimateProfile } from "@/lib/climate";
import type { Plant, PlantCategory } from "@/lib/plants";

export const PLANT_CATEGORIES: PlantCategory[] = ["vegetable", "herb", "flower"];

function locationScore(plant: Plant, climate: ClimateProfile): number {
  const firstReadyIndex = climate.dailySoilTemp.findIndex((temperature, index) => {
    const afterFrost = plant.frostTolerant || index + 1 >= climate.lastFrostDayOfYear;
    return afterFrost && temperature >= plant.soilTempMinGermination;
  });
  const firstReadyDay = firstReadyIndex === -1 ? DAYS_IN_YEAR : firstReadyIndex + 1;
  const usableSeason = Math.max(0, climate.firstFrostDayOfYear - firstReadyDay);
  const maturityFit = usableSeason - plant.daysToMaturity;

  return maturityFit - firstReadyDay * 0.15 + (plant.frostTolerant ? 8 : 0);
}

export function recommendedPlants(
  catalog: Plant[],
  climate: ClimateProfile,
  category: PlantCategory,
  recentIds: string[],
  limit = 3,
): Plant[] {
  const recentRank = new Map(recentIds.map((id, index) => [id, index]));

  return catalog
    .filter((plant) => plant.category === category)
    .sort((left, right) => {
      const leftRecent = recentRank.get(left.id);
      const rightRecent = recentRank.get(right.id);
      if (leftRecent !== undefined || rightRecent !== undefined) {
        if (leftRecent === undefined) return 1;
        if (rightRecent === undefined) return -1;
        return leftRecent - rightRecent;
      }
      return locationScore(right, climate) - locationScore(left, climate);
    })
    .slice(0, limit);
}
