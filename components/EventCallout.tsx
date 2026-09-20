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

export default function EventCallout({ event, visible }: { event: KeyEvent; visible: boolean }) {
  return <article className={`pointer-events-none absolute right-4 top-16 z-10 w-[min(270px,calc(100%-2rem))] border border-[#e7bd72]/45 bg-[#173b35]/95 p-4 shadow-xl transition-all duration-500 ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`} aria-hidden={!visible}>
    <div className="flex items-start gap-3"><span className="mt-0.5 rounded-full border border-[#e7bd72]/60 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#e7bd72]">{eventIcons[event.type]}</span><div><p className="font-serif text-lg leading-tight text-[#f3efe4]">{event.label}</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f3efe4]/50">Day {event.dayOfYear}</p></div></div>
  </article>;
}
