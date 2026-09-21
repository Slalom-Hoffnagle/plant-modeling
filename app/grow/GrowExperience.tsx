"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClimateProfile } from "@/lib/climate";
import { plants } from "@/lib/plants";
import { dayToScrollY, scrollYToDay, TOTAL_SCROLL_HEIGHT } from "@/lib/scroll";
import { simulateSeason } from "@/lib/simulator";
import EventCallout from "@/components/EventCallout";
import PlantLane from "@/components/PlantLane";
import PlantReport from "@/components/PlantReport";
import SunPrecipRibbon from "@/components/SunPrecipRibbon";
import TempRibbon from "@/components/TempRibbon";

type SeasonData = { climate: ClimateProfile; plantIds: string[] };

const MONTHS = [
  { name: "January", day: 1 },
  { name: "February", day: 32 },
  { name: "March", day: 61 },
  { name: "April", day: 92 },
  { name: "May", day: 122 },
  { name: "June", day: 153 },
  { name: "July", day: 183 },
  { name: "August", day: 214 },
  { name: "September", day: 245 },
  { name: "October", day: 275 },
  { name: "November", day: 306 },
  { name: "December", day: 336 },
];

const SEASONS = [
  { label: "Spring equinox", day: 80 },
  { label: "Summer solstice", day: 172 },
  { label: "Autumn equinox", day: 266 },
  { label: "Winter solstice", day: 355 },
];

export default function GrowExperience() {
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [ready, setReady] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("genius-loci-season");
    if (stored) setSeason(JSON.parse(stored) as SeasonData);
    setReady(true);
  }, []);

  useEffect(() => {
    function updateCurrentDay() {
      const stage = stageRef.current;
      if (!stage) return;
      const stageScrollY = window.scrollY - stage.offsetTop + window.innerHeight * 0.5;
      setCurrentDay(scrollYToDay(stageScrollY));
    }

    updateCurrentDay();
    window.addEventListener("scroll", updateCurrentDay, { passive: true });
    window.addEventListener("resize", updateCurrentDay);
    return () => {
      window.removeEventListener("scroll", updateCurrentDay);
      window.removeEventListener("resize", updateCurrentDay);
    };
  }, [ready]);

  const selectedPlants = useMemo(() => season ? plants.filter((plant) => season.plantIds.includes(plant.id)) : [], [season]);
  const simulation = useMemo(() => season ? simulateSeason(season.climate, selectedPlants) : null, [season, selectedPlants]);
  const visibleEvents = simulation?.keyEvents.filter((event) => event.dayOfYear <= currentDay).slice(-3) ?? [];

  if (!ready) return <main className="min-h-screen bg-[#173b35]" />;
  if (!season) return <main className="min-h-screen bg-[#173b35] p-8 text-[#f3efe4]"><a href="/" className="font-mono text-xs uppercase tracking-[0.2em]">Start a garden model</a></main>;

  return (
    <main className="min-h-screen bg-[#173b35] text-[#f3efe4]">
      <header className="sticky top-0 z-20 border-b border-[#f3efe4]/15 bg-[#173b35]/95 px-6 py-5 backdrop-blur sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <a href="/" className="font-mono text-xs uppercase tracking-[0.28em]">Genius Loci</a>
          <div className="text-right"><p className="font-serif text-xl">{season.climate.city}, {season.climate.stateAbbr}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f3efe4]/55">Day {currentDay} · {formatDay(currentDay)}</p></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:px-10 lg:px-16 lg:pt-28">
        <div className="max-w-4xl"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[#e7bd72]">Season model ready</p><h1 className="mt-6 font-serif text-6xl leading-[0.9] tracking-[-0.04em] sm:text-8xl">A year in your garden.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#f3efe4]/65">Scroll down to move through the calendar. The date spine keeps the year in view while the story space below makes room for what grows next.</p></div>

        <div className="mt-20 grid gap-6 border-y border-[#f3efe4]/15 py-8 sm:grid-cols-3"><Metric label="Last spring frost" value={season.climate.lastFrostDate} /><Metric label="First fall frost" value={season.climate.firstFrostDate} /><Metric label="Frost-free season" value={`${season.climate.frostFreeDays} days`} /></div>

        <div className="mt-16 flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#e7bd72]">Your selection</p><h2 className="mt-3 font-serif text-4xl">{selectedPlants.length} plants in the model</h2></div><span className="font-mono text-xs uppercase tracking-[0.14em] text-[#f3efe4]/45">Jan 01 — Dec 31</span></div>
        <div className="mt-8 space-y-3">{simulation?.plants.map((plantSimulation) => <PlantReport key={plantSimulation.plant.id} simulation={plantSimulation} events={simulation.keyEvents} />)}</div>
      </section>

      <section ref={stageRef} className="relative mx-auto min-h-[7300px] max-w-7xl border-t border-[#f3efe4]/15 px-6 sm:px-10 lg:px-16" aria-label="Growing season calendar">
        <div className="grid min-h-[7300px] grid-cols-[48px_92px_1fr_48px] gap-2 py-8 md:grid-cols-[48px_92px_1fr_48px] lg:grid-cols-[64px_150px_1fr_64px] lg:gap-5">
          <TempRibbon climate={season.climate} currentDay={currentDay} />
          <DateSpine climate={season.climate} currentDay={currentDay} />
          <div className="relative overflow-hidden border-l border-[#f3efe4]/15 bg-[#244b42]/35">
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#e7bd72]/35" />
            <div className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f3efe4]/45">Plant story / 365 days</div>
            <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#f3efe4]/40"><span>Begin</span><span>Harvest horizon</span></div>
            <div className="absolute left-0 right-0 h-px bg-[#e7bd72] transition-[top] duration-100" style={{ top: `${(dayToScrollY(currentDay) / TOTAL_SCROLL_HEIGHT) * 100}%` }} />
            {simulation && <div className="sticky top-[108px] z-10 flex h-[calc(100vh-150px)] min-h-[420px] flex-col justify-end px-4 pb-14 pt-20">
              <div className="absolute inset-x-4 top-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#f3efe4]/45">Live growth stage</p><p className="mt-1 font-serif text-2xl text-[#e7bd72]">{formatDay(currentDay)}</p></div>
              <div className="relative flex min-h-0 flex-1">{simulation.plants.map((plantSimulation) => <PlantLane key={plantSimulation.plant.id} simulation={plantSimulation} currentDay={currentDay} />)}</div>
              {simulation.keyEvents.map((event) => <EventCallout key={`${event.dayOfYear}-${event.label}`} event={event} visible={visibleEvents.some((visibleEvent) => visibleEvent.label === event.label)} />)}
            </div>}
          </div>
          <SunPrecipRibbon climate={season.climate} currentDay={currentDay} />
        </div>
      </section>
    </main>
  );
}

function DateSpine({ climate, currentDay }: { climate: ClimateProfile; currentDay: number }) {
  return <div className="relative border-r border-[#f3efe4]/15 pr-3 lg:pr-5">
    <div className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#e7bd72]">2026</div>
    {MONTHS.map((month) => <div key={month.name} className="absolute left-0 right-0" style={{ top: `${(dayToScrollY(month.day) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><div className="flex items-center gap-2"><span className="h-px w-3 bg-[#e7bd72]" /><span className="font-serif text-sm lg:text-lg">{month.name}</span></div><div className="mt-1 h-px bg-[#f3efe4]/20" /></div>)}
    {SEASONS.map((seasonMarker) => <div key={seasonMarker.label} className="absolute left-0 right-0 hidden -translate-y-1/2 lg:block" style={{ top: `${(dayToScrollY(seasonMarker.day) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#f3efe4]/40">{seasonMarker.label}</span></div>)}
    <Marker label="Last frost" day={climate.lastFrostDayOfYear} tone="warm" />
    <Marker label="First frost" day={climate.firstFrostDayOfYear} tone="cool" />
    <div className="absolute left-0 right-0 -translate-y-1/2" style={{ top: `${(dayToScrollY(currentDay) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#e7bd72] ring-4 ring-[#e7bd72]/20" /><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e7bd72]">Today</span></div></div>
  </div>;
}

function Marker({ label, day, tone }: { label: string; day: number; tone: "warm" | "cool" }) {
  return <div className="absolute left-0 right-0 -translate-y-1/2" style={{ top: `${(dayToScrollY(day) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${tone === "warm" ? "bg-[#e7bd72]" : "bg-[#90c3c9]"}`} /><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#f3efe4]/60">{label}</span></div></div>;
}

function formatDay(day: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, day)));
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#f3efe4]/45">{label}</p><p className="mt-2 font-serif text-2xl text-[#e7bd72]">{value}</p></div>; }
