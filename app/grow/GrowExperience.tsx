"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClimateProfile } from "@/lib/climate";
import { plants } from "@/lib/plants";
import { dayToScrollY, scrollYToDay, TOTAL_SCROLL_HEIGHT } from "@/lib/scroll";
import { simulateSeason } from "@/lib/simulator";
import EventCallout from "@/components/EventCallout";
import ClimateBackdrop from "@/components/ClimateBackdrop";
import PlantLane from "@/components/PlantLane";
import PlantReport from "@/components/PlantReport";

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
  const [openPlantId, setOpenPlantId] = useState<string | null>(null);
  const [highlightedEventIndex, setHighlightedEventIndex] = useState(0);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("genius-loci-season");
    if (stored) setSeason(JSON.parse(stored) as SeasonData);
    setReady(true);
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    function updateCurrentDay() {
      animationFrame = 0;
      const stage = stageRef.current;
      if (!stage) return;
      const stageScrollY = window.scrollY - stage.offsetTop + window.innerHeight * 0.5;
      setCurrentDay(scrollYToDay(stageScrollY));
    }

    function scheduleCurrentDayUpdate() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateCurrentDay);
    }

    updateCurrentDay();
    window.addEventListener("scroll", scheduleCurrentDayUpdate, { passive: true });
    window.addEventListener("resize", scheduleCurrentDayUpdate);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleCurrentDayUpdate);
      window.removeEventListener("resize", scheduleCurrentDayUpdate);
    };
  }, [ready]);

  const selectedPlants = useMemo(() => season ? plants.filter((plant) => season.plantIds.includes(plant.id)) : [], [season]);
  const simulation = useMemo(() => season ? simulateSeason(season.climate, selectedPlants) : null, [season, selectedPlants]);

  useEffect(() => {
    const events = simulation?.keyEvents ?? [];
    if (!events.length) return;
    setHighlightedEventIndex((currentIndex) => {
      if (events[currentIndex]?.dayOfYear === currentDay) return currentIndex;
      const latestIndex = events.findLastIndex((event) => event.dayOfYear <= currentDay);
      return latestIndex === -1 ? 0 : latestIndex;
    });
  }, [currentDay, simulation]);

  const activeEvent = simulation?.keyEvents[highlightedEventIndex];

  function scrollToEvent(eventIndex: number) {
    const event = simulation?.keyEvents[eventIndex];
    const stage = stageRef.current;
    if (!event || !stage) return;
    setHighlightedEventIndex(eventIndex);
    const stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const targetY = stageTop + dayToScrollY(event.dayOfYear) - window.innerHeight * 0.5;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: targetY, behavior: reduceMotion ? "auto" : "smooth" });
  }

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
        <div className="max-w-4xl"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[#e7bd72]">Season model ready</p><h1 className="mt-6 font-serif text-6xl leading-[0.9] tracking-[-0.04em] sm:text-8xl">A year in your garden.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#f3efe4]/65">Scroll down to move through the calendar. Explore your garden and the key moments to a happy and healthy harvest.</p></div>

        <div className="mt-20 grid gap-6 border-y border-[#f3efe4]/15 py-8 sm:grid-cols-3"><Metric label="Last spring frost" value={season.climate.lastFrostDate} /><Metric label="First fall frost" value={season.climate.firstFrostDate} /><Metric label="Frost-free season" value={`${season.climate.frostFreeDays} days`} /></div>

        <div className="mt-16 flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#e7bd72]">Your selection</p><h2 className="mt-3 font-serif text-4xl">{selectedPlants.length} plants in the model</h2></div><span className="font-mono text-xs uppercase tracking-[0.14em] text-[#f3efe4]/45">Jan 01 — Dec 31</span></div>
        <div className="mt-8 space-y-3">{simulation?.plants.map((plantSimulation) => <PlantReport key={plantSimulation.plant.id} simulation={plantSimulation} events={simulation.keyEvents} open={openPlantId === plantSimulation.plant.id} onToggle={(open) => setOpenPlantId((current) => open ? plantSimulation.plant.id : current === plantSimulation.plant.id ? null : current)} />)}</div>
      </section>

      <section ref={stageRef} className="relative mx-auto max-w-7xl border-t border-[#f3efe4]/15 px-6 sm:px-10 lg:px-16" style={{ minHeight: TOTAL_SCROLL_HEIGHT }} aria-label="Growing season calendar">
        <div className="grid grid-cols-[92px_1fr] gap-3 py-8 lg:grid-cols-[150px_1fr] lg:gap-5" style={{ minHeight: TOTAL_SCROLL_HEIGHT }}>
          <DateSpine climate={season.climate} currentDay={currentDay} />
          <div className="relative overflow-clip border-l border-[#f3efe4]/15 bg-[#244b42]/35">
            <ClimateBackdrop climate={season.climate} />
            <div className="absolute inset-x-0 top-1/2 z-[1] border-t border-dashed border-[#e7bd72]/25" />
            <div className="absolute bottom-8 left-6 right-6 z-[1] flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#f3efe4]/40"><span>Begin</span><span>Harvest horizon</span></div>
            <div className="absolute left-0 right-0 z-[2] h-px bg-[#e7bd72] transition-[top] duration-100" style={{ top: `${(dayToScrollY(currentDay) / TOTAL_SCROLL_HEIGHT) * 100}%` }}>
              <span className="absolute left-2 top-0 -translate-y-full bg-[#173b35]/90 px-2 py-1 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-[#e7bd72]">
                L {Math.round(season.climate.dailyTempMin[currentDay - 1] ?? 0)}° / H {Math.round(season.climate.dailyTempMax[currentDay - 1] ?? 0)}°
              </span>
              <span className="absolute right-2 top-0 -translate-y-full bg-[#173b35]/90 px-2 py-1 text-right font-mono text-[9px] uppercase tracking-[0.08em] text-[#e7bd72]">
                Precip: {(season.climate.dailyPrecip[currentDay - 1] ?? 0).toFixed(2)}
              </span>
            </div>
            {simulation && <div className="sticky top-[108px] z-10 flex h-[calc(100vh-108px)] min-h-[420px] flex-col justify-end px-4 pt-32">
              <div className="absolute inset-x-4 top-0 bg-gradient-to-r from-[#f3efe4]/15 via-[#f3efe4]/[0.06] to-transparent px-3 pb-5 pt-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#f3efe4]/55">Live growth stage</p>
                <p className="mt-1 font-serif text-2xl text-[#e7bd72]">{formatDay(currentDay)} · Day {currentDay}</p>
              </div>
              <div className="absolute inset-x-4 top-[76px] flex h-12 overflow-hidden border-y border-[#e7bd72]/25 bg-[#173b35]/75 backdrop-blur-sm" aria-label="Growing moment highlight">
                {activeEvent && <EventCallout event={activeEvent} />}
                <div className="ml-auto flex shrink-0 border-l border-[#e7bd72]/25">
                  <button type="button" onClick={() => scrollToEvent(highlightedEventIndex - 1)} disabled={highlightedEventIndex <= 0} aria-label="Previous growing moment" className="flex w-10 items-center justify-center font-mono text-sm text-[#e7bd72] transition-colors hover:bg-[#f3efe4]/10 disabled:cursor-not-allowed disabled:text-[#f3efe4]/20">&lt;</button>
                  <button type="button" onClick={() => scrollToEvent(highlightedEventIndex + 1)} disabled={highlightedEventIndex >= simulation.keyEvents.length - 1} aria-label="Next growing moment" className="flex w-10 items-center justify-center border-l border-[#e7bd72]/25 font-mono text-sm text-[#e7bd72] transition-colors hover:bg-[#f3efe4]/10 disabled:cursor-not-allowed disabled:text-[#f3efe4]/20">&gt;</button>
                </div>
              </div>
              <div className="relative flex min-h-0 flex-1">{simulation.plants.map((plantSimulation) => <PlantLane key={plantSimulation.plant.id} simulation={plantSimulation} currentDay={currentDay} />)}</div>
            </div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function DateSpine({ climate, currentDay }: { climate: ClimateProfile; currentDay: number }) {
  return <div className="relative border-r border-[#f3efe4]/15 pr-3 lg:pr-5">
    {MONTHS.map((month) => <div key={month.name} className="absolute left-0 right-0" style={{ top: `${(dayToScrollY(month.day) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><div className="flex items-center gap-2"><span className="h-px w-3 bg-[#e7bd72]" /><span className="font-serif text-sm lg:text-lg">{month.name}</span></div><div className="mt-1 h-px bg-[#f3efe4]/20" /></div>)}
    {SEASONS.map((seasonMarker) => <div key={seasonMarker.label} className="absolute left-0 right-0 hidden -translate-y-1/2 lg:block" style={{ top: `${(dayToScrollY(seasonMarker.day) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#f3efe4]/40">{seasonMarker.label}</span></div>)}
    <Marker label="Last frost" day={climate.lastFrostDayOfYear} tone="warm" />
    <Marker label="First frost" day={climate.firstFrostDayOfYear} tone="cool" />
    <div className="absolute left-0 right-0 -translate-y-1/2" style={{ top: `${(dayToScrollY(currentDay) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#e7bd72] ring-4 ring-[#e7bd72]/20" /><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e7bd72]">Date {formatDayNumeric(currentDay)}</span></div></div>
  </div>;
}

function Marker({ label, day, tone }: { label: string; day: number; tone: "warm" | "cool" }) {
  return <div className="absolute left-0 right-0 -translate-y-1/2" style={{ top: `${(dayToScrollY(day) / TOTAL_SCROLL_HEIGHT) * 100}%` }}><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${tone === "warm" ? "bg-[#e7bd72]" : "bg-[#90c3c9]"}`} /><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#f3efe4]/60">{label}</span></div></div>;
}

function formatDay(day: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, day)));
}

function formatDayNumeric(day: number) {
  const date = new Date(Date.UTC(2023, 0, day));
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#f3efe4]/45">{label}</p><p className="mt-2 font-serif text-2xl text-[#e7bd72]">{value}</p></div>; }
