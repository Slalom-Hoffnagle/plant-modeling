import type { PlantMorphology as Morphology } from "@/lib/plants";
import type { GrowthStage } from "@/lib/simulator";

const visibleStages: GrowthStage[] = ["seedling", "vegetative", "flowering", "fruiting", "harvest", "declining"];

export default function PlantMorphology({ morphology, stage }: { morphology: Morphology; stage: GrowthStage }) {
  const visible = visibleStages.includes(stage);
  const height = stage === "seedling" ? 42 : stage === "vegetative" ? 78 : stage === "flowering" ? 112 : stage === "fruiting" || stage === "harvest" ? 138 : stage === "declining" ? 96 : 0;
  const leafCount = stage === "seedling" ? 2 : stage === "vegetative" ? 5 : stage === "declining" ? 4 : 8;
  const flowerVisible = stage === "flowering" || stage === "fruiting" || stage === "harvest";
  const fruitVisible = stage === "fruiting" || stage === "harvest";

  return <svg viewBox="0 0 160 180" role="img" aria-label={`${stage} plant`} className={`h-44 w-full overflow-visible transition-opacity duration-500 ${stage === "declining" ? "opacity-60" : ""}`}>
    <line x1="80" x2="80" y1="170" y2="170" stroke="#a76745" strokeWidth="4" strokeLinecap="round" />
    {stage === "in_ground" && <circle cx="80" cy="166" r="4" fill="#e7bd72" />}
    {stage === "germinating" && <path d="M 70 168 Q 80 153 90 168" fill="none" stroke="#e7bd72" strokeWidth="3" strokeLinecap="round" />}
    {stage === "indoor" && <g>
      <path d="M 62 88 V 101 M 98 88 V 101" stroke="#d5dfc5" strokeWidth="2" />
      <rect x="54" y="101" width="52" height="10" rx="2" fill="#d9a15b" />
      <path d="M 60 114 L 57 124 M 72 114 L 71 126 M 88 114 L 89 126 M 100 114 L 103 124" stroke="#e7bd72" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M 80 168 V 139" stroke={morphology.stemColor} strokeWidth="4" strokeLinecap="round" />
      <path d="M 80 151 Q 68 136 58 143 Q 63 156 80 158" fill={morphology.leafColor} />
      <path d="M 80 145 Q 92 130 103 138 Q 98 152 80 153" fill={morphology.leafColorVariant} />
    </g>}
    {visible && <g>
      <path d={morphology.stemCurve === "vining" ? `M 80 168 Q 50 ${168 - height / 2} 82 ${168 - height}` : `M 80 168 Q ${morphology.stemCurve === "arching" ? 105 : 80} ${168 - height / 2} 80 ${168 - height}`} fill="none" stroke={morphology.stemColor} strokeWidth={morphology.stemCount === "many" ? 3 : 5} strokeLinecap="round" />
      {Array.from({ length: leafCount }, (_, index) => {
        const y = 156 - index * (height / Math.max(leafCount, 1));
        const side = index % 2 === 0 ? -1 : 1;
        const x = 80 + side * (12 + (index % 3) * 4);
        return <path key={index} d={`M 80 ${y} Q ${x} ${y - 14} ${x + side * 16} ${y - 3} Q ${x} ${y + 5} 80 ${y}`} fill={index % 2 ? morphology.leafColorVariant : morphology.leafColor} opacity={stage === "declining" ? 0.65 : 1} />;
      })}
      {flowerVisible && morphology.flowerShape !== "none" && <g fill={morphology.flowerColor}><circle cx="80" cy={168 - height - 4} r="7" /><circle cx="72" cy={168 - height - 1} r="5" /><circle cx="88" cy={168 - height - 1} r="5" /></g>}
      {fruitVisible && morphology.fruitShape !== "none" && <g fill={morphology.fruitColor}><circle cx="69" cy={168 - height / 2} r="8" /><circle cx="91" cy={168 - height / 2 - 10} r="7" /></g>}
    </g>}
    {stage === "harvest" && <path d="M 54 174 Q 80 162 106 174" fill="none" stroke="#e7bd72" strokeWidth="2" strokeDasharray="3 4" />}
  </svg>;
}
