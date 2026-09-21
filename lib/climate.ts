import { buildSunAngleProfile } from "@/lib/solar";

export interface ClimateProfile {
  zip: string;
  city: string;
  state: string;
  stateAbbr: string;
  lat: number;
  lng: number;
  hardinessZone: string;
  dailyTempMax: number[];
  dailyTempMin: number[];
  dailySoilTemp: number[];
  dailyPrecip: number[];
  dailyNoonSunAngle: number[];
  lastFrostDayOfYear: number;
  firstFrostDayOfYear: number;
  lastFrostDate: string;
  firstFrostDate: string;
  frostFreeDays: number;
}

export interface OpenMeteoDailyResponse {
  time: string[];
  temperature_2m_max: Array<number | null>;
  temperature_2m_min: Array<number | null>;
  precipitation_sum: Array<number | null>;
  soil_temperature_0_to_7cm_mean: Array<number | null>;
}

export const DAYS_IN_YEAR = 365;

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86_400_000) + 1;
}

export function formatDayOfYear(day: number): string {
  const date = new Date(Date.UTC(2024, 0, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function averageByCalendarDay(
  years: OpenMeteoDailyResponse[],
  field: keyof Omit<OpenMeteoDailyResponse, "time">,
): number[] {
  const sums = Array.from({ length: DAYS_IN_YEAR }, () => 0);
  const counts = Array.from({ length: DAYS_IN_YEAR }, () => 0);

  for (const year of years) {
    year.time.forEach((dateString, index) => {
      const date = new Date(`${dateString}T00:00:00Z`);
      if (date.getUTCMonth() === 1 && date.getUTCDate() === 29) {
        return;
      }
      const month = date.getUTCMonth();
      const dateInReferenceYear = new Date(Date.UTC(2023, month, date.getUTCDate()));
      const normalizedDay = dayOfYear(dateInReferenceYear) - 1;
      const value = year[field][index];

      if (normalizedDay < 0 || normalizedDay >= DAYS_IN_YEAR || value == null) {
        return;
      }

      sums[normalizedDay] += value;
      counts[normalizedDay] += 1;
    });
  }

  return sums.map((sum, index) => (counts[index] ? sum / counts[index] : 0));
}

export function deriveFrostDays(dailyTempMin: number[]): {
  lastFrostDayOfYear: number;
  firstFrostDayOfYear: number;
} {
  const springDays = dailyTempMin
    .slice(0, 180)
    .map((temperature, index) => (temperature <= 32 ? index + 1 : null))
    .filter((day): day is number => day !== null);
  const fallDay = dailyTempMin
    .slice(180)
    .map((temperature, index) => (temperature <= 32 ? index + 181 : null))
    .find((day): day is number => day !== null);

  return {
    lastFrostDayOfYear: springDays.at(-1) ?? 1,
    firstFrostDayOfYear: fallDay ?? DAYS_IN_YEAR,
  };
}

export function createClimateProfile(input: Omit<ClimateProfile, "dailyNoonSunAngle" | "lastFrostDayOfYear" | "firstFrostDayOfYear" | "lastFrostDate" | "firstFrostDate" | "frostFreeDays"> & { dailyTempMin: number[] }): ClimateProfile {
  const frostDays = deriveFrostDays(input.dailyTempMin);

  return {
    ...input,
    dailyNoonSunAngle: buildSunAngleProfile(input.lat),
    ...frostDays,
    lastFrostDate: formatDayOfYear(frostDays.lastFrostDayOfYear),
    firstFrostDate: formatDayOfYear(frostDays.firstFrostDayOfYear),
    frostFreeDays: frostDays.firstFrostDayOfYear - frostDays.lastFrostDayOfYear,
  };
}
