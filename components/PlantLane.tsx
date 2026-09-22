import type { PlantSimulation } from "@/lib/simulator";
import PlantMorphology from "./PlantMorphology";

export default function PlantLane({ simulation, currentDay }: { simulation: PlantSimulation; currentDay: number }) {
  const stage = simulation.stages[currentDay - 1] ?? "pre_season";
  const active = stage !== "pre_season" && stage !== "done";
  const stageLabel = stage.replace("_", " ");

  return <article className={`relative flex min-w-0 flex-1 flex-col justify-end overflow-hidden border-r border-[#f3efe4]/10 px-2 transition-colors duration-500 ${stage === "harvest" ? "bg-[#e7bd72]/10" : ""}`} aria-label={`${simulation.plant.name}, ${stageLabel}`}>
    <div className="absolute inset-x-0 top-0 min-h-16 bg-gradient-to-b from-[#f3efe4]/15 via-[#f3efe4]/[0.07] to-transparent px-2 pb-4 pt-2">
      <h3 className="font-serif text-base leading-tight text-[#f3efe4]">{simulation.plant.name}</h3>
      <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.08em] text-[#e7bd72]">{stageLabel}</span>
    </div>
    <div className={`mx-auto w-full max-w-[150px] transition-transform duration-500 ${active ? "translate-y-0" : "translate-y-6"}`}><PlantMorphology morphology={simulation.plant.morphology} stage={stage} /></div>
    <div className="h-px bg-[#a76745]" />
  </article>;
}
