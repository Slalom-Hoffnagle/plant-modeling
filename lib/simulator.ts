import { DAYS_IN_YEAR, type ClimateProfile } from "@/lib/climate";
import type { Plant } from "@/lib/plants";

export type GrowthStage =
  | "pre_season"
  | "indoor"
  | "in_ground"
  | "germinating"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "harvest"
  | "declining"
  | "done";

export interface KeyEvent {
  dayOfYear: number;
  type: "indoor" | "plant" | "germination" | "harvest-start" | "harvest-end" | "last-frost" | "first-frost";
  plantId?: string;
  label: string;
}

export interface PlantSimulation {
  plant: Plant;
  indoorStartDay: number | null;
  plantDay: number;
  germinationDay: number;
  harvestStartDay: number;
  harvestEndDay: number;
  seasonEndDay: number;
  cumulativeGdd: number[];
  stages: GrowthStage[];
}

export interface SeasonSimulation {
  plants: PlantSimulation[];
  keyEvents: KeyEvent[];
}

function firstSoilReadyDay(climate: ClimateProfile, plant: Plant): number {
  const startDay = plant.frostTolerant ? 1 : climate.lastFrostDayOfYear;
  return climate.dailySoilTemp.findIndex((temperature, index) =>
    index + 1 >= startDay && temperature >= plant.soilTempMinGermination,
  ) + 1 || DAYS_IN_YEAR;
}

function stageForDay(simulation: PlantSimulation, day: number): GrowthStage {
  if (day < simulation.plantDay) {
    return simulation.indoorStartDay !== null && day >= simulation.indoorStartDay
      ? "indoor"
      : "pre_season";
  }
  if (day === simulation.plantDay) return "in_ground";
  if (day < simulation.germinationDay) return "germinating";
  if (day < simulation.germinationDay + simulation.plant.peakPhases.seedling) return "seedling";

  const vegetativeEnd = simulation.germinationDay + simulation.plant.peakPhases.seedling + simulation.plant.peakPhases.vegetative;
  if (day < vegetativeEnd) return "vegetative";

  const floweringEnd = vegetativeEnd + simulation.plant.peakPhases.flowering;
  if (day < floweringEnd) return "flowering";

  const fruitingEnd = floweringEnd + simulation.plant.peakPhases.fruiting;
  if (day < fruitingEnd && simulation.plant.peakPhases.fruiting > 0) return "fruiting";
  if (day <= simulation.harvestEndDay) return "harvest";
  if (day <= simulation.seasonEndDay) return "declining";
  return "done";
}

function simulatePlant(climate: ClimateProfile, plant: Plant): PlantSimulation {
  const indoorStartDay = plant.transplant && plant.indoorStartWeeksBefore > 0
    ? Math.max(1, climate.lastFrostDayOfYear - plant.indoorStartWeeksBefore * 7)
    : null;
  const plantDay = firstSoilReadyDay(climate, plant);
  const germinationDay = Math.min(DAYS_IN_YEAR, plantDay + Math.ceil((plant.daysToGerminationMin + plant.daysToGerminationMax) / 2));
  const cumulativeGdd = Array.from({ length: DAYS_IN_YEAR }, () => 0);

  for (let index = germinationDay - 1; index < DAYS_IN_YEAR; index += 1) {
    const averageTemperature = (climate.dailyTempMax[index] + climate.dailyTempMin[index]) / 2;
    cumulativeGdd[index] = (index > germinationDay - 1 ? cumulativeGdd[index - 1] : 0) + Math.max(0, averageTemperature - plant.gddBase);
  }

  const harvestStartDay = cumulativeGdd.findIndex((gdd, index) => index + 1 >= germinationDay && gdd >= plant.gddToFirstHarvest) + 1 || DAYS_IN_YEAR;
  const harvestEndDay = Math.min(DAYS_IN_YEAR, harvestStartDay + plant.harvestWindowDays);
  const seasonEndDay = plant.frostTolerant
    ? Math.min(harvestEndDay, climate.firstFrostDayOfYear + 21)
    : Math.min(harvestEndDay, climate.firstFrostDayOfYear);

  const simulation: PlantSimulation = {
    plant,
    indoorStartDay,
    plantDay,
    germinationDay,
    harvestStartDay,
    harvestEndDay,
    seasonEndDay,
    cumulativeGdd,
    stages: [],
  };
  simulation.stages = Array.from({ length: DAYS_IN_YEAR }, (_, index) => stageForDay(simulation, index + 1));
  return simulation;
}

export function simulateSeason(climate: ClimateProfile, selectedPlants: Plant[]): SeasonSimulation {
  const simulations = selectedPlants.map((plant) => simulatePlant(climate, plant));
  const events: KeyEvent[] = [
    { dayOfYear: climate.lastFrostDayOfYear, type: "last-frost", label: "Last frost of spring — warm season planting begins" },
    { dayOfYear: climate.firstFrostDayOfYear, type: "first-frost", label: "First frost expected — protect tender plants" },
  ];

  for (const simulation of simulations) {
    const { plant } = simulation;
    if (simulation.indoorStartDay) events.push({ dayOfYear: simulation.indoorStartDay, type: "indoor", plantId: plant.id, label: `Start ${plant.name} seeds indoors` });
    events.push({ dayOfYear: simulation.plantDay, type: "plant", plantId: plant.id, label: `${plant.transplant ? "Transplant" : "Direct sow"} ${plant.name} outdoors` });
    events.push({ dayOfYear: simulation.germinationDay, type: "germination", plantId: plant.id, label: `Watch for ${plant.name} sprouts` });
    events.push({ dayOfYear: simulation.harvestStartDay, type: "harvest-start", plantId: plant.id, label: `${plant.name} ready to harvest!` });
    events.push({ dayOfYear: simulation.harvestEndDay, type: "harvest-end", plantId: plant.id, label: `Last ${plant.name} harvest before frost` });
  }

  const deduplicatedEvents = Array.from(
    new Map(events.map((event) => [`${event.dayOfYear}:${event.label}`, event])).values(),
  ).sort((left, right) => left.dayOfYear - right.dayOfYear);

  return { plants: simulations, keyEvents: deduplicatedEvents };
}
