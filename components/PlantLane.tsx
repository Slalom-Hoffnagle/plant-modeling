import type { PlantSimulation } from "@/lib/simulator";
import PlantMorphology from "./PlantMorphology";

export default function PlantLane({ simulation, currentDay }: { simulation: PlantSimulation; currentDay: number }) {
  const stage = simulation.stages[currentDay - 1] ?? "pre_season";
  const active = stage !== "pre_season" && stage !== "done";
  const stageLabel = stage.replace("_", " ");

  return <article className={`relative flex min-w-0 flex-1 flex-col justify-end overflow-hidden border-r border-[#f3efe4]/10 px-2 pb-6 transition-colors duration-500 ${stage === "harvest" ? "bg-[#e7bd72]/10" : ""}`} aria-label={`${simulation.plant.name}, ${stageLabel}`}>
    <div className="absolute left-2 top-3 right-2 flex items-start justify-between gap-2"><h3 className="truncate font-serif text-base text-[#f3efe4]">{simulation.plant.name}</h3><span className="rounded-full bg-[#173b35]/70 px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[#e7bd72]">{stageLabel}</span></div>
    <div className={`mx-auto w-full max-w-[150px] transition-transform duration-500 ${active ? "translate-y-0" : "translate-y-6"}`}><PlantMorphology morphology={simulation.plant.morphology} stage={stage} /></div>
    <div className="h-px bg-[#a76745]" />
    <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.08em] text-[#f3efe4]/40">{active ? `Day ${currentDay}` : "Awaiting season"}</p>
  </article>;
}
