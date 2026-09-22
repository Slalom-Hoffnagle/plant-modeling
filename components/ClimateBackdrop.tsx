import { DAYS_IN_YEAR, type ClimateProfile } from "@/lib/climate";

const TEMP_MIN = -10;
const TEMP_MAX = 110;

function temperaturePosition(temperature: number): number {
  const clamped = Math.min(TEMP_MAX, Math.max(TEMP_MIN, temperature));
  return ((clamped - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
}

export default function ClimateBackdrop({ climate }: { climate: ClimateProfile }) {
  const precipitationMax = Math.max(0.1, ...climate.dailyPrecip);

  return <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-label="Daily temperature and precipitation graph">
    <div className="absolute inset-0 opacity-45" aria-hidden="true">
      {climate.dailyTempMax.map((high, index) => {
        const low = climate.dailyTempMin[index] ?? high;
        const lowPosition = temperaturePosition(low);
        const highPosition = Math.max(0.4, temperaturePosition(high));
        const lowShare = Math.min(100, (lowPosition / highPosition) * 100);
        const top = (index / DAYS_IN_YEAR) * 100;
        const barHeight = 72 / DAYS_IN_YEAR;
        const precipitation = Math.max(0, climate.dailyPrecip[index] ?? 0);
        const precipitationWidth = (precipitation / precipitationMax) * 28;
        const isSnow = low < 32;

        return <div key={index} className="absolute inset-x-0" style={{ top: `${top}%`, height: `${barHeight}%` }}>
          <span className="absolute inset-y-0 left-0 bg-[#d9805e]/40" data-temperature-bar style={{ width: `${highPosition}%` }}>
            <span className="absolute inset-y-0 left-0 bg-[#79aebb]/50" style={{ width: `${lowShare}%` }} />
          </span>
          {precipitation > 0 && <span className={`absolute inset-y-0 right-0 ${isSnow ? "bg-[#f3efe4]/55" : "bg-[#68a9bd]/60"}`} style={{ width: `${Math.max(0.3, precipitationWidth)}%` }} />}
        </div>;
      })}
    </div>

    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
      <line x1={temperaturePosition(32)} x2={temperaturePosition(32)} y1="0" y2="100" stroke="#f3efe4" strokeDasharray="1 1.5" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
    </svg>

    <div className="absolute inset-0 bg-gradient-to-r from-[#173b35]/45 via-transparent to-[#173b35]/35" />
  </div>;
}
