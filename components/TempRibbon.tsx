import type { ClimateProfile } from "@/lib/climate";
import { dayToScrollY, TOTAL_SCROLL_HEIGHT } from "@/lib/scroll";

const TEMP_MIN = -10;
const TEMP_MAX = 110;

function temperatureTop(temperature: number): number {
  const clamped = Math.min(TEMP_MAX, Math.max(TEMP_MIN, temperature));
  return ((TEMP_MAX - clamped) / (TEMP_MAX - TEMP_MIN)) * 100;
}

export default function TempRibbon({ climate, currentDay }: { climate: ClimateProfile; currentDay: number }) {
  const highPoints = climate.dailyTempMax.map((temperature, index) => `${(index / 364) * 100},${temperatureTop(temperature)}`).join(" ");
  const lowPoints = climate.dailyTempMin.map((temperature, index) => `${(index / 364) * 100},${temperatureTop(temperature)}`).join(" ");
  const currentTop = (dayToScrollY(currentDay) / TOTAL_SCROLL_HEIGHT) * 100;
  const currentHigh = climate.dailyTempMax[currentDay - 1] ?? 0;
  const currentLow = climate.dailyTempMin[currentDay - 1] ?? 0;
  const frostTop = temperatureTop(32);

  return <aside className="relative hidden min-h-[7300px] border-r border-[#f3efe4]/15 pr-1 md:block lg:pr-2" aria-label="Daily air temperature ribbon">
    <div className="absolute left-0 top-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#e7bd72]">Air °F</div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 top-8 h-[calc(100%-2rem)] w-full" aria-hidden="true">
      <polyline points={highPoints} fill="none" stroke="#e66b4f" strokeOpacity="0.72" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      <polyline points={lowPoints} fill="none" stroke="#90c3c9" strokeOpacity="0.78" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      <line x1="0" x2="100" y1={frostTop} y2={frostTop} stroke="#f3efe4" strokeDasharray="2 2" strokeOpacity="0.6" vectorEffect="non-scaling-stroke" />
    </svg>
    <span className="absolute right-1 -translate-y-1/2 font-mono text-[8px] text-[#f3efe4]/45" style={{ top: `${frostTop}%` }}>32°</span>
    <div className="absolute left-0 right-0 z-10 -translate-y-1/2" style={{ top: `${currentTop}%` }}>
      <div className="h-px bg-[#e7bd72]" />
      <div className="mt-1 bg-[#173b35] px-1 py-1 font-mono text-[8px] leading-tight text-[#f3efe4]">{Math.round(currentHigh)}° / {Math.round(currentLow)}°</div>
    </div>
    <div className="absolute bottom-0 left-0 font-mono text-[8px] text-[#f3efe4]/35">{TEMP_MIN}°</div>
    <div className="absolute right-0 top-0 font-mono text-[8px] text-[#f3efe4]/35">{TEMP_MAX}°</div>
  </aside>;
}
