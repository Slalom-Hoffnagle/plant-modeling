import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/climate/route";

const testZips = ["97401", "10001", "33101", "60601", "98101"];

function response(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), { status: ok ? status : status || 500, headers: { "content-type": "application/json" } });
}

function climatePayload() {
  const dates = Array.from({ length: 366 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, index + 1));
    return date.toISOString().slice(0, 10);
  });

  return {
    daily: {
      time: dates,
      temperature_2m_max: dates.map(() => 70),
      temperature_2m_min: dates.map(() => 45),
      precipitation_sum: dates.map(() => 0.1),
      soil_temperature_0_to_7cm_mean: dates.map(() => 60),
    },
  };
}

describe("GET /api/climate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("zippopotam.us")) {
        const zip = url.split("/").at(-1) ?? "00000";
        return response({
          places: [{
            "place name": `City ${zip}`,
            state: "Test State",
            "state abbreviation": "TS",
            latitude: "40",
            longitude: "-90",
          }],
        });
      }
      if (url.includes("phzmapi.org")) return response({ zone: "6a" });
      return response(climatePayload());
    }));
  });

  it.each(testZips)("returns a complete ClimateProfile for ZIP %s", async (zip) => {
    const result = await GET(new Request(`http://localhost/api/climate?zip=${zip}`));
    const profile = await result.json();

    expect(result.status).toBe(200);
    expect(profile.zip).toBe(zip);
    expect(profile.dailyTempMax).toHaveLength(365);
    expect(profile.dailyTempMin).toHaveLength(365);
    expect(profile.dailySoilTemp).toHaveLength(365);
    expect(profile.dailyPrecip).toHaveLength(365);
    expect(profile.dailyNoonSunAngle).toHaveLength(365);
    expect(profile.frostFreeDays).toBeGreaterThanOrEqual(0);
  });

  it("rejects malformed ZIP codes before calling upstream services", async () => {
    const result = await GET(new Request("http://localhost/api/climate?zip=123"));

    expect(result.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps March and December aligned when the source includes leap day", async () => {
    const result = await GET(new Request("http://localhost/api/climate?zip=97401"));
    const profile = await result.json();

    expect(profile.dailyTempMax).toHaveLength(365);
    expect(profile.dailyTempMax[59]).toBe(70);
    expect(profile.dailyTempMax[60]).toBe(70);
    expect(profile.dailyTempMax[364]).toBe(70);
  });
});
