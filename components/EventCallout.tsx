import type { KeyEvent } from "@/lib/simulator";

const eventIcons: Record<KeyEvent["type"], string> = {
  indoor: "seed",
  plant: "hand",
  germination: "sprout",
  "harvest-start": "pick",
  "harvest-end": "last pick",
  "last-frost": "frost",
  "first-frost": "frost",
};

export default function EventCallout({ event }: { event: KeyEvent }) {
  return <article className="flex h-full min-w-0 flex-1 items-center px-3">
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded-full border border-[#e7bd72]/50 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[#e7bd72]">{eventIcons[event.type]}</span>
      <p className="min-w-0 truncate font-serif text-base leading-tight text-[#f3efe4]">{event.label}</p>
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-[#f3efe4]/45">Day {event.dayOfYear}</span>
    </div>
  </article>;
}
