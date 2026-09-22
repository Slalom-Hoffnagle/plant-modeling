import type { KeyEvent, PlantSimulation } from "@/lib/simulator";

type StageInterval = { stage: string; start: number; end: number };

function formatDay(day: number | null): string {
  if (day === null) return "Not applicable";
  const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, day)));
  return `${date} (day ${day})`;
}

function stageIntervals(stages: PlantSimulation["stages"]): StageInterval[] {
  const intervals: StageInterval[] = [];
  let start = 1;
  let stage = stages[0];

  for (let index = 1; index <= stages.length; index += 1) {
    if (stages[index] !== stage) {
      intervals.push({ stage: stage.replace("_", " "), start, end: index });
      start = index + 1;
      stage = stages[index];
    }
  }

  return intervals;
}

export default function PlantReport({ simulation, events, open, onToggle }: { simulation: PlantSimulation; events: KeyEvent[]; open: boolean; onToggle: (open: boolean) => void }) {
  const { plant } = simulation;
  const intervals = stageIntervals(simulation.stages);
  const plantEvents = events.filter((event) => !event.plantId || event.plantId === plant.id);

  return <details open={open} onToggle={(event) => onToggle(event.currentTarget.open)} className="group border border-[#f3efe4]/15 bg-[#244b42] open:bg-[#1f453d]">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 marker:hidden">
      <div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#e7bd72]">{plant.category} · {plant.lifecycle}</p><h3 className="mt-2 font-serif text-3xl">{plant.name}</h3><p className="mt-2 text-sm text-[#f3efe4]/55">{formatDay(simulation.plantDay)} → {formatDay(simulation.harvestEndDay)}</p></div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f3efe4]/25 font-mono text-xl text-[#e7bd72] group-open:rotate-45">+</span>
    </summary>

    <div className="border-t border-[#f3efe4]/15 px-5 pb-7 pt-6">
      <p className="max-w-2xl text-sm leading-6 text-[#f3efe4]/65">{plant.description}</p>

      <ReportSection title="Calculated timeline">
        <DataGrid items={[
          ["Indoor start", formatDay(simulation.indoorStartDay)],
          [plant.transplant ? "Transplant outdoors" : "Direct sow", formatDay(simulation.plantDay)],
          ["Expected germination", formatDay(simulation.germinationDay)],
          ["First harvest", formatDay(simulation.harvestStartDay)],
          ["Harvest ends", formatDay(simulation.harvestEndDay)],
          ["Season ends", formatDay(simulation.seasonEndDay)],
        ]} />
      </ReportSection>

      <ReportSection title="Growing requirements">
        <DataGrid items={[
          ["Minimum soil temperature", `${plant.soilTempMinGermination}°F`],
          ["Optimal soil temperature", `${plant.soilTempOptimalGermination}°F`],
          ["Germination range", `${plant.daysToGerminationMin}–${plant.daysToGerminationMax} days`],
          ["Days to maturity", `${plant.daysToMaturity} days`],
          ["GDD base", `${plant.gddBase}°F`],
          ["GDD to first harvest", plant.gddToFirstHarvest.toLocaleString()],
          ["Harvest window", `${plant.harvestWindowDays} days`],
          ["Indoor lead time", plant.indoorStartWeeksBefore ? `${plant.indoorStartWeeksBefore} weeks` : "Not applicable"],
          ["Direct sow", plant.directSow ? "Yes" : "No"],
          ["Transplant", plant.transplant ? "Yes" : "No"],
          ["Frost tolerant", plant.frostTolerant ? "Yes" : "No"],
          ["Lifecycle", plant.lifecycle],
        ]} />
      </ReportSection>

      <ReportSection title="Growth stages">
        <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#f3efe4]/40"><tr><th className="pb-2 font-normal">Stage</th><th className="pb-2 font-normal">Start</th><th className="pb-2 font-normal">End</th><th className="pb-2 text-right font-normal">Duration</th></tr></thead><tbody>{intervals.map((interval) => <tr key={`${interval.stage}-${interval.start}`} className="border-t border-[#f3efe4]/10"><td className="py-2 capitalize">{interval.stage}</td><td className="py-2">{formatDay(interval.start)}</td><td className="py-2">{formatDay(interval.end)}</td><td className="py-2 text-right">{interval.end - interval.start + 1} days</td></tr>)}</tbody></table></div>
      </ReportSection>

      <ReportSection title="Configured phase durations">
        <DataGrid items={[
          ["Seedling", `${plant.peakPhases.seedling} days`], ["Vegetative", `${plant.peakPhases.vegetative} days`],
          ["Flowering", `${plant.peakPhases.flowering} days`], ["Fruiting", `${plant.peakPhases.fruiting} days`],
          ["Harvest", `${plant.peakPhases.harvest} days`], ["Decline", `${plant.peakPhases.decline} days`],
        ]} />
      </ReportSection>

      <ReportSection title="GDD accumulation">
        <DataGrid items={[
          ["At germination", formatGdd(simulation, simulation.germinationDay)],
          ["At first harvest", formatGdd(simulation, simulation.harvestStartDay)],
          ["At harvest end", formatGdd(simulation, simulation.harvestEndDay)],
          ["At season end", formatGdd(simulation, simulation.seasonEndDay)],
        ]} />
        <details className="mt-4 border-t border-[#f3efe4]/10 pt-3"><summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-[#e7bd72]">View all 365 daily cumulative GDD values</summary><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-left font-mono text-[10px]"><thead className="sticky top-0 bg-[#1f453d] text-[#f3efe4]/45"><tr><th className="py-2 font-normal">Day</th><th className="py-2 font-normal">Date</th><th className="py-2 text-right font-normal">Cumulative GDD</th></tr></thead><tbody>{simulation.cumulativeGdd.map((gdd, index) => <tr key={index} className="border-t border-[#f3efe4]/10"><td className="py-1">{index + 1}</td><td className="py-1">{formatDay(index + 1).split(" (")[0]}</td><td className="py-1 text-right">{gdd.toFixed(2)}</td></tr>)}</tbody></table></div></details>
      </ReportSection>

      <ReportSection title="Events and care notes">
        <ul className="space-y-2 text-sm">{plantEvents.map((event) => <li key={`${event.dayOfYear}-${event.label}`} className="flex justify-between gap-4 border-b border-[#f3efe4]/10 pb-2"><span>{event.label}</span><span className="shrink-0 text-[#e7bd72]">{formatDay(event.dayOfYear)}</span></li>)}</ul>
        {plant.keyEvents.map((event) => <p key={event} className="mt-3 border-l-2 border-[#e7bd72] pl-3 text-sm text-[#f3efe4]/70">{event}</p>)}
      </ReportSection>

    </div>
  </details>;
}

function formatGdd(simulation: PlantSimulation, day: number): string { return `${(simulation.cumulativeGdd[day - 1] ?? 0).toFixed(2)} GDD`; }
function ReportSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-7"><h4 className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#e7bd72]">{title}</h4>{children}</section>; }
function DataGrid({ items }: { items: string[][] }) { return <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(([label, value]) => <div key={label} className="border-t border-[#f3efe4]/10 pt-2"><dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#f3efe4]/40">{label}</dt><dd className="mt-1 text-sm capitalize text-[#f3efe4]/85">{value}</dd></div>)}</dl>; }
