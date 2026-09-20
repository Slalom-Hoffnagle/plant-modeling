import { NextResponse } from "next/server";
import {
  averageByCalendarDay,
  createClimateProfile,
  type OpenMeteoDailyResponse,
} from "@/lib/climate";

interface ZipResponse {
  places?: Array<{
    "place name": string;
    state: string;
    "state abbreviation": string;
    latitude: string;
    longitude: string;
  }>;
}

interface ZoneResponse {
  zone?: string;
}

interface CachedProfile {
  expiresAt: number;
  profile: ReturnType<typeof createClimateProfile>;
}

const profileCache = new Map<string, CachedProfile>();
const CACHE_TTL_MS = 86_400_000;

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

function completeYears(currentDate = new Date()): number[] {
  const lastCompleteYear = currentDate.getUTCFullYear() - 1;
  return Array.from({ length: 5 }, (_, index) => lastCompleteYear - 4 + index);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 86_400 } });
  if (!response.ok) throw new Error(`Upstream request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

async function loadProfile(zip: string) {
  const location = await fetchJson<ZipResponse>(`https://api.zippopotam.us/us/${zip}`);
  const zone = await fetchJson<ZoneResponse>(`https://phzmapi.org/${zip}.json`).catch(() => ({ zone: "Unknown" }));
  const place = location.places?.[0];
  if (!place) throw new Error("ZIP code was not found");

  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  const years = completeYears();
  const startDate = `${years[0]}-01-01`;
  const endDate = `${years[years.length - 1]}-12-31`;
  const climateUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
  const climateParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: startDate,
    end_date: endDate,
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    timezone: "auto",
  });
  for (const variable of [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "soil_temperature_0_to_7cm_mean",
  ]) {
    climateParams.append("daily", variable);
  }
  climateUrl.search = climateParams.toString();
  const climate = await fetchJson<{ daily: OpenMeteoDailyResponse }>(climateUrl.toString());
  const daily = climate.daily;

  return createClimateProfile({
    zip,
    city: place["place name"],
    state: place.state,
    stateAbbr: place["state abbreviation"],
    lat,
    lng,
    hardinessZone: zone.zone ?? "Unknown",
    dailyTempMax: averageByCalendarDay([daily], "temperature_2m_max"),
    dailyTempMin: averageByCalendarDay([daily], "temperature_2m_min"),
    dailySoilTemp: averageByCalendarDay([daily], "soil_temperature_0_to_7cm_mean"),
    dailyPrecip: averageByCalendarDay([daily], "precipitation_sum"),
  });
}

export async function GET(request: Request) {
  const zip = new URL(request.url).searchParams.get("zip")?.trim() ?? "";
  if (!isValidZip(zip)) {
    return NextResponse.json({ error: "A 5-digit US ZIP code is required" }, { status: 400 });
  }

  const cached = profileCache.get(zip);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.profile, { headers: { "Cache-Control": "public, max-age=86400" } });
  }

  try {
    const profile = await loadProfile(zip);
    profileCache.set(zip, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(profile, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Climate data could not be loaded";
    const status = message.includes("not found") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
