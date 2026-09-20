"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClimateProfile } from "@/lib/climate";
import { plants, type Plant, type PlantCategory } from "@/lib/plants";

const categories: Array<PlantCategory | "all"> = ["all", "vegetable", "herb", "flower"];

export default function SelectExperience({ initialZip }: { initialZip: string }) {
  const router = useRouter();
  const [climate, setClimate] = useState<ClimateProfile | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [category, setCategory] = useState<PlantCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!/^\d{5}$/.test(initialZip)) {
      setError("Return to the garden map and enter a valid ZIP code.");
      setLoading(false);
      return;
    }

    fetch(`/api/climate?zip=${initialZip}`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? "Location could not be found.");
        return response.json() as Promise<ClimateProfile>;
      })
      .then(setClimate)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [initialZip]);

  const visiblePlants = useMemo(() => plants.filter((plant) => {
    const matchesCategory = category === "all" || plant.category === category;
    const matchesSearch = plant.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, search]);

  function togglePlant(plant: Plant) {
    setSelectedIds((current) => {
      if (current.includes(plant.id)) return current.filter((id) => id !== plant.id);
      if (current.length >= 12) return current;
      return [...current, plant.id];
    });
  }

  function generate() {
    if (!climate || selectedIds.length === 0) return;
    sessionStorage.setItem("genius-loci-season", JSON.stringify({ climate, plantIds: selectedIds }));
    router.push("/grow");
  }

  return (
    <main className="min-h-screen bg-[#f3efe4] text-[#173b35]">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-[#173b35]/20 pb-5">
          <a href="/" className="font-mono text-xs uppercase tracking-[0.28em]">Genius Loci</a>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#b45f3f]">Step 02 / 03</span>
        </header>

        {loading && <div className="py-28 text-center font-serif text-4xl">Reading the local season...</div>}
        {error && (
          <div className="mx-auto max-w-xl py-28 text-center">
            <p role="alert" className="font-serif text-4xl">We could not locate that garden.</p>
            <p className="mt-4 text-[#173b35]/65">{error}</p>
            <a href="/" className="mt-8 inline-block rounded-full bg-[#173b35] px-6 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[#f3efe4]">Try another ZIP</a>
          </div>
        )}

        {climate && !error && (
          <>
            <section className="grid gap-10 border-b border-[#173b35]/15 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#b45f3f]">Location confirmed</p>
                <h1 className="mt-4 font-serif text-6xl leading-none tracking-[-0.04em]">{climate.city}, {climate.stateAbbr}</h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-[#173b35]/65">Zone {climate.hardinessZone} · {climate.lat.toFixed(2)}° N, {Math.abs(climate.lng).toFixed(2)}° W</p>
              </div>
              <dl className="grid grid-cols-2 gap-8 border-l border-[#173b35]/20 pl-8">
                <div><dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#173b35]/55">Last spring frost</dt><dd className="mt-2 font-serif text-2xl">{climate.lastFrostDate}</dd></div>
                <div><dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#173b35]/55">First fall frost</dt><dd className="mt-2 font-serif text-2xl">{climate.firstFrostDate}</dd></div>
              </dl>
            </section>

            <section className="py-12">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#b45f3f]">Choose your plants</p>
                  <h2 className="mt-3 font-serif text-5xl tracking-[-0.03em]">What will grow here?</h2>
                </div>
                <div className="text-right"><span className="font-serif text-4xl">{selectedIds.length}</span><span className="ml-2 font-mono text-xs uppercase tracking-[0.14em] text-[#173b35]/55">/ 12 selected</span></div>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <label className="sr-only" htmlFor="plant-search">Search plants</label>
                <input id="plant-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plants" className="w-full rounded-full border border-[#173b35]/25 bg-transparent px-5 py-3 outline-none focus:border-[#b45f3f] sm:w-56" />
                {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] transition ${category === item ? "border-[#173b35] bg-[#173b35] text-[#f3efe4]" : "border-[#173b35]/25 hover:border-[#173b35]"}`}>{item}</button>)}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePlants.map((plant) => {
                  const selected = selectedIds.includes(plant.id);
                  const unavailable = !selected && selectedIds.length >= 12;
                  return <button key={plant.id} type="button" onClick={() => togglePlant(plant)} disabled={unavailable} aria-pressed={selected} className={`group min-h-44 rounded-2xl border p-5 text-left transition ${selected ? "border-[#b45f3f] bg-[#e8d9c5]" : "border-[#173b35]/15 bg-[#eee8d9] hover:-translate-y-1 hover:border-[#173b35]/45"} ${unavailable ? "cursor-not-allowed opacity-45" : ""}`}>
                    <div className="flex items-start justify-between gap-4"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b45f3f]">{plant.category}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-xs ${selected ? "border-[#b45f3f] bg-[#b45f3f] text-white" : "border-[#173b35]/25"}`}>{selected ? "✓" : "+"}</span></div>
                    <h3 className="mt-8 font-serif text-3xl">{plant.name}</h3><p className="mt-2 text-sm leading-6 text-[#173b35]/60">{plant.description}</p>
                  </button>;
                })}
              </div>
            </section>

            <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border border-[#173b35]/15 bg-[#173b35] p-4 text-[#f3efe4] shadow-xl sm:px-6">
              <p className="text-sm text-[#f3efe4]/75">Your growing year is ready when you are.</p>
              <button type="button" onClick={generate} disabled={selectedIds.length === 0} className="shrink-0 rounded-full bg-[#e7bd72] px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[#173b35] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">Generate season</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
