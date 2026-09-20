import type { ClimateProfile } from "@/lib/climate";
import { dayToScrollY, TOTAL_SCROLL_HEIGHT } from "@/lib/scroll";

function sunTop(angle: number): number {
  return Math.min(50, Math.max(0, (1 - Math.min(90, Math.max(0, angle)) / 90) * 50));
}

export default function SunPrecipRibbon({ climate, currentDay }: { climate: ClimateProfile; currentDay: number }) {
  const sunPoints = climate.dailyNoonSunAngle.map((angle, index) => `${(index / 364) * 100},${sunTop(angle)}`).join(" ");
  const precipitationMax = Math.max(0.1, ...climate.dailyPrecip);
  const currentTop = (dayToScrollY(currentDay) / TOTAL_SCROLL_HEIGHT) * 100;
  const currentSun = climate.dailyNoonSunAngle[currentDay - 1] ?? 0;
  const currentRain = climate.dailyPrecip[currentDay - 1] ?? 0;

  return <aside className="relative hidden min-h-[7300px] border-l border-[#f3efe4]/15 pl-1 md:block lg:pl-2" aria-label="Sun angle and precipitation ribbon">
    <div className="absolute left-2 top-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#e7bd72]">Sun / rain</div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 top-8 h-[calc(100%-2rem)] w-full" aria-hidden="true">
      <rect x="0" y="50" width="100" height="50" fill="#173b35" fillOpacity="0.22" />
      <polyline points={sunPoints} fill="none" stroke="#e7bd72" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
      {climate.dailyPrecip.map((precipitation, index) => {
        const x = (index / 364) * 100;
        const height = (Math.max(0, precipitation) / precipitationMax) * 45;
        return <line key={index} x1={x} x2={x} y1="98" y2={98 - height} stroke={climate.dailyTempMin[index] < 32 ? "#f3efe4" : "#77b9d0"} strokeOpacity="0.62" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
      })}
      <line x1="0" x2="100" y1="50" y2="50" stroke="#f3efe4" strokeOpacity="0.22" vectorEffect="non-scaling-stroke" />
    </svg>
    <span className="absolute left-2 top-8 font-mono text-[8px] text-[#f3efe4]/40">90°</span>
    <span className="absolute bottom-[46%] left-2 font-mono text-[8px] text-[#f3efe4]/40">0°</span>
    <div className="absolute left-0 right-0 z-10 -translate-y-1/2" style={{ top: `${currentTop}%` }}>
      <div className="h-px bg-[#e7bd72]" />
      <div className="mt-1 bg-[#173b35] px-1 py-1 font-mono text-[8px] leading-tight text-[#f3efe4]">{Math.round(currentSun)}° · {currentRain.toFixed(2)}″</div>
    </div>
    <div className="absolute bottom-0 left-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[#f3efe4]/35">precip</div>
  </aside>;
}
