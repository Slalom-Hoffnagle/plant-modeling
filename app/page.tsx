"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedZip = zip.trim();
    if (!/^\d{5}$/.test(normalizedZip)) {
      setError("Enter a 5-digit US ZIP code.");
      return;
    }

    setError("");
    router.push(`/select?zip=${normalizedZip}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3efe4] text-[#173b35]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-[#173b35]/20 pb-5">
          <span className="font-mono text-xs uppercase tracking-[0.28em]">Genius Loci</span>
          <span className="text-xs uppercase tracking-[0.18em] text-[#b45f3f]">A growing year, modeled</span>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.24em] text-[#b45f3f]">Your garden, in time</p>
            <h1 className="max-w-3xl font-serif text-6xl leading-[0.92] tracking-[-0.04em] sm:text-8xl">
              Find the season hiding in your soil.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#173b35]/70">
              Enter your ZIP code to see local frost dates, climate patterns, and a planting year shaped around the crops you want to grow.
            </p>

            <form onSubmit={submit} className="mt-10 max-w-md">
              <label htmlFor="zip" className="mb-3 block font-mono text-xs uppercase tracking-[0.18em]">
                Where is your garden?
              </label>
              <div className="flex border-b-2 border-[#173b35] pb-2">
                <input
                  id="zip"
                  inputMode="numeric"
                  maxLength={5}
                  pattern="[0-9]{5}"
                  value={zip}
                  onChange={(event) => setZip(event.target.value.replace(/\D/g, ""))}
                  placeholder="97401"
                  aria-describedby={error ? "zip-error" : undefined}
                  className="min-w-0 flex-1 bg-transparent text-2xl outline-none placeholder:text-[#173b35]/30"
                />
                <button type="submit" className="ml-4 rounded-full bg-[#173b35] px-5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#f3efe4] transition hover:bg-[#b45f3f]">
                  Begin
                </button>
              </div>
              {error && <p id="zip-error" role="alert" className="mt-3 text-sm text-[#b45f3f]">{error}</p>}
            </form>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md rounded-[45%_55%_50%_50%] bg-[#d5dfc5] p-10 shadow-[inset_0_0_0_1px_rgba(23,59,53,0.12)]">
            <div className="absolute inset-10 rounded-full border border-[#173b35]/20" />
            <div className="absolute left-1/2 top-1/2 h-[70%] w-1 -translate-x-1/2 -translate-y-1/2 rotate-[28deg] bg-[#41694b]" />
            <div className="absolute left-[30%] top-[27%] h-24 w-16 -rotate-45 rounded-[100%_0] bg-[#6e9a62]" />
            <div className="absolute right-[23%] top-[40%] h-28 w-20 rotate-[28deg] rounded-[100%_0] bg-[#527f54]" />
            <div className="absolute bottom-[18%] left-[25%] h-20 w-14 rotate-[28deg] rounded-[100%_0] bg-[#89aa6a]" />
            <div className="absolute bottom-[12%] left-1/2 h-2 w-[70%] -translate-x-1/2 rounded-full bg-[#a76745]" />
            <span className="absolute bottom-6 left-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#173b35]/60">soil / light / time</span>
          </div>
        </section>
      </div>
    </main>
  );
}
