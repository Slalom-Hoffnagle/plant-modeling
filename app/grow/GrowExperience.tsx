"use client";

import { useEffect, useState } from "react";
import type { ClimateProfile } from "@/lib/climate";
import { plants, type Plant } from "@/lib/plants";

type SeasonData = { climate: ClimateProfile; plantIds: string[] };

export default function GrowExperience() {
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("genius-loci-season");
    if (stored) setSeason(JSON.parse(stored) as SeasonData);
    setReady(true);
  }, []);

  const selectedPlants = season ? plants.filter((plant) => season.plantIds.includes(plant.id)) : [];

  if (!ready) return <main className="min-h-screen bg-[#173b35]" />;
  if (!season) return <main className="min-h-screen bg-[#173b35] p-8 text-[#f3efe4]"><a href="/" className="font-mono text-xs uppercase tracking-[0.2em]">Start a garden model</a></main>;

  return (
    <main className="min-h-screen bg-[#173b35] text-[#f3efe4]">
      <header className="sticky top-0 z-10 border-b border-[#f3efe4]/15 bg-[#173b35]/95 px-6 py-5 backdrop-blur sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <a href="/" className="font-mono text-xs uppercase tracking-[0.28em]">Genius Loci</a>
          <div className="text-right"><p className="font-serif text-xl">{season.climate.city}, {season.climate.stateAbbr}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f3efe4]/55">The growing year begins here</p></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:px-10 lg:px-16 lg:pt-28">
        <div className="max-w-4xl"><p className="font-mono text-xs uppercase tracking-[0.24em] text-[#e7bd72]">Season model ready</p><h1 className="mt-6 font-serif text-6xl leading-[0.9] tracking-[-0.04em] sm:text-8xl">A year in your garden.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#f3efe4]/65">The scroll narrative will carry you from the last spring frost to the first fall frost, with each plant timed to this place.</p></div>

        <div className="mt-20 grid gap-6 border-y border-[#f3efe4]/15 py-8 sm:grid-cols-3"><Metric label="Last spring frost" value={season.climate.lastFrostDate} /><Metric label="First fall frost" value={season.climate.firstFrostDate} /><Metric label="Frost-free season" value={`${season.climate.frostFreeDays} days`} /></div>

        <div className="mt-16"><div className="flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#e7bd72]">Your selection</p><h2 className="mt-3 font-serif text-4xl">{selectedPlants.length} plants in the model</h2></div><span className="font-mono text-xs uppercase tracking-[0.14em] text-[#f3efe4]/45">Jan 01 — Dec 31</span></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedPlants.map((plant) => <PlantPreview key={plant.id} plant={plant} />)}</div></div>

        <div className="mt-20 border border-[#f3efe4]/15 bg-[#244b42] p-8 sm:p-12"><div className="flex h-48 items-end justify-center gap-2 overflow-hidden border-b border-[#e7bd72]/50">{Array.from({ length: 24 }, (_, index) => <div key={index} className="w-2 rounded-t-full bg-[#7ea467]" style={{ height: `${20 + ((index * 17) % 75)}%` }} />)}</div><p className="mt-8 text-center font-serif text-3xl text-[#e7bd72]">Scroll to watch the season unfold.</p><p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#f3efe4]/50">Narrative scaffold · M3 begins here</p></div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#f3efe4]/45">{label}</p><p className="mt-2 font-serif text-2xl text-[#e7bd72]">{value}</p></div>;
}

function PlantPreview({ plant }: { plant: Plant }) {
  return <article className="flex items-center gap-4 border border-[#f3efe4]/12 bg-[#244b42] p-4"><span className="flex h-12 w-12 shrink-0 items-end justify-center rounded-full bg-[#d5dfc5] pb-2"><span className="h-8 w-1 rotate-12 bg-[#41694b]" /><span className="-ml-2 h-4 w-3 -rotate-45 rounded-full bg-[#6e9a62]" /></span><div><h3 className="font-serif text-xl">{plant.name}</h3><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#f3efe4]/45">{plant.category} · {plant.daysToMaturity} days to maturity</p></div></article>;
}
