# Genius Loci
## Product Requirements Document — v1.0

**Author:** Carl Hoffnagle  
**Date:** September 2026  
**Status:** Implementation baseline — M1–M5 complete; M6–M7 planned  
**Stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · native browser scrolling  
**Deployment:** Vercel  

---

## 1. Product Vision

Genius Loci is a web application that models a personalized growing season for a home gardener. The user specifies their location and selects up to 6 plants. The app then renders a full-page, scroll-driven narrative of their growing year — from soil warm-up through germination, sprout emergence, growth phases, blossom, fruit, and harvest — with each event anchored to real dates and driven by real climate data for their specific location.

As the user scrolls down, time advances. The illustrations grow, dates and callouts appear, and the season unfolds. A continuous climate backdrop carries daily air-temperature highs and lows plus average precipitation behind the plant lanes.

The experience is part planner, part almanac, part illustrated story. It is based on science but designed to feel alive.

---

## 2. User Flow

```
1. Landing — Enter ZIP code
       ↓
2. Location confirmed — city, state, hardiness zone, last/first frost dates displayed
       ↓
3. Plant Selector — browse and pick up to 6 plants (vegetables, herbs, flowers)
       ↓
4. Generate — app computes the full growing season model
       ↓
5. Scroll narrative — user scrolls through the year or navigates between key moments
```

---

## 3. Data Sources

All data sources used in this application are free, publicly accessible, and require no API keys unless noted.

---

### 3.1 ZIP Code → Location Resolution

**Source:** `api.zippopotam.us`  
**Endpoint:** `GET https://api.zippopotam.us/us/{zip}`  
**Returns:** City name, state name, state abbreviation, latitude, longitude  
**No key required**

```json
{
  "post code": "97401",
  "country": "United States",
  "places": [{
    "place name": "Eugene",
    "state": "Oregon",
    "state abbreviation": "OR",
    "latitude": "44.0514",
    "longitude": "-123.1008"
  }]
}
```

---

### 3.2 USDA Hardiness Zone

**Source:** `phzmapi.org` (static JSON files, no key, derived from USDA/PRISM data)  
**Endpoint:** `GET https://phzmapi.org/{zip}.json`  
**Returns:** Zone string (e.g. "8b"), temperature range  
**No key required**

```json
{
  "zone": "8b",
  "temperature_range": "15 to 20 (F)",
  "zipcode": "97401"
}
```

---

### 3.3 Historical Climate Data — Soil Temperature, Air Temperature, Precipitation

**Source:** Open-Meteo Historical Weather API (ERA5-Land reanalysis)  
**Endpoint:** `GET https://archive-api.open-meteo.com/v1/archive`  
**No key required · CC BY 4.0**

**Request parameters:**

```
latitude={lat}
longitude={lng}
start_date={startYear}-01-01
end_date={endYear}-12-31
daily=temperature_2m_max,temperature_2m_min,precipitation_sum,soil_temperature_0_to_7cm
temperature_unit=fahrenheit
precipitation_unit=inch
timezone=auto
```

Fetch the **most recent 5 complete calendar years** (e.g. 2020–2024). Average each variable by calendar day-of-year (1–365) across those 5 years to produce smooth, robust daily normals. This gives the app a 365-point profile for each variable rather than 12 coarse monthly values.

**Variables returned:**

| Variable | Description | Used for |
|---|---|---|
| `temperature_2m_max` | Daily high air temp (°F) | Day temp ribbon, frost detection, GDD |
| `temperature_2m_min` | Daily low air temp (°F) | Night temp ribbon, frost detection, GDD |
| `precipitation_sum` | Daily precipitation (inches) | Precip ribbon |
| `soil_temperature_0_to_7cm` | Surface soil temp (°F) | Germination gate per plant |

**Derived values computed server-side:**

- **Last spring frost date:** Latest day in days 1–180 where 5-year avg `temperature_2m_min` ≤ 32°F
- **First fall frost date:** Earliest day in days 181–365 where 5-year avg `temperature_2m_min` ≤ 32°F
- **Daily GDD (base 50°F):** `max(0, (tempMax + tempMin) / 2 − 50)` — accumulated from any given start date
- **Daily GDD (base 40°F):** Same formula with base 40 — used for cool-season crops

---

### 3.4 Plant Growth Data

**Primary source:** [OpenPlantDB](https://github.com/cwfrazier1/openplantdb) — CC0 public domain  
294 garden plants, JSON format, fields include:
- Germination soil temperature (min, optimal)
- Days to germination (range)
- Days to maturity (from seed or transplant)
- Indoor start weeks before last frost
- Direct sow vs. transplant
- Frost tolerance
- Mature plant height/width
- USDA zone suitability
- Growing directions

**Secondary source:** OSU Extension Service vegetable degree-day models  
URL: `https://extension.oregonstate.edu/catalog/em-9305-vegetable-degree-day-models-introduction-farmers-gardeners`  
Used to source GDD-to-harvest values (base temp + cumulative GDD) for each crop type.

**Curated app catalog:** The app maintains its own curated JSON catalog of ~55 plants (subset of OpenPlantDB + extension data), ensuring completeness and accuracy of the GDD fields needed for the simulation. The catalog is a static file in the repository — no runtime database required.

**Plant catalog fields (per entry):**

```typescript
interface Plant {
  id: string
  name: string
  category: 'vegetable' | 'herb' | 'flower'
  soilTempMinGermination: number   // °F — minimum soil temp to germinate
  soilTempOptimalGermination: number
  daysToGerminationMin: number
  daysToGerminationMax: number
  daysToMaturity: number           // from transplant or direct-sow germination
  gddBase: number                  // °F base for GDD accumulation
  gddToFirstHarvest: number        // cumulative GDD from germination to harvest
  harvestWindowDays: number        // how long harvest period lasts
  directSow: boolean
  transplant: boolean
  indoorStartWeeksBefore: number   // weeks before last frost (0 = N/A)
  frostTolerant: boolean           // survives light frost
  lifecycle: 'annual' | 'biennial' | 'perennial'
  peakPhases: {                    // relative durations (days) of each visual phase
    seedling: number
    vegetative: number
    flowering: number
    fruiting: number
    harvest: number
    decline: number
  }
  description: string
  keyEvents: string[]              // e.g. ["Side-dress with nitrogen at first flower"]
  morphology: PlantMorphology      // drives the procedural SVG renderer
}

interface PlantMorphology {
  // Stem
  stemCount: 1 | 2 | 3 | 'many'   // 1 = single upright, many = bushy/rosette
  stemCurve: 'straight' | 'arching' | 'vining'
  maxHeightPx: number              // full-grown height within the lane (px)

  // Leaves
  leafShape: 'oval' | 'lanceolate' | 'lobed' | 'compound' | 'cordate' | 'needle' | 'strap'
  leafSize: 'small' | 'medium' | 'large'
  leafArrangement: 'alternate' | 'opposite' | 'whorl' | 'basal-rosette'

  // Flower (null = no visible flower for this species)
  flowerShape: 'none' | 'single' | 'cluster' | 'spike' | 'umbel' | 'disc'
  flowerColor: string              // CSS color

  // Fruit / harvest indicator (null = leaf/root harvest, no fruit SVG)
  fruitShape: 'none' | 'round' | 'elongated' | 'pod' | 'cluster' | 'head' | 'root'
  fruitColor: string               // CSS color

  // Color palette
  stemColor: string                // CSS color
  leafColor: string                // CSS color
  leafColorVariant: string         // slightly different tone for depth
}
```

---

## 4. Climate Data Pipeline (Server-Side)

All heavy data fetching and normalization happens in a single Next.js API route. The client receives a clean, ready-to-use `ClimateProfile` object.

**Route:** `GET /api/climate?zip={zip}`

**Processing steps:**

1. Resolve ZIP → lat/lng/city/state via `api.zippopotam.us`
2. Fetch hardiness zone via `phzmapi.org/{zip}.json`
3. Fetch 5 years of daily ERA5-Land data from Open-Meteo
4. For each day of year (1–365), average each variable across all matching calendar days in the 5-year window
5. Derive frost dates from the averaged min temperature profile
6. Return a `ClimateProfile` containing all of the above

**ClimateProfile shape:**

```typescript
interface ClimateProfile {
  zip: string
  city: string
  state: string
  stateAbbr: string
  lat: number
  lng: number
  hardinessZone: string

  // 365-point daily normals (index 0 = Jan 1, index 364 = Dec 31)
  dailyTempMax: number[]       // °F daily high
  dailyTempMin: number[]       // °F daily low
  dailySoilTemp: number[]      // °F surface soil temp
  dailyPrecip: number[]        // inches precipitation

  // Derived
  lastFrostDayOfYear: number   // Julian day 1–365
  firstFrostDayOfYear: number
  lastFrostDate: string        // e.g. "April 14"
  firstFrostDate: string       // e.g. "October 22"
  frostFreeDays: number        // firstFrost - lastFrost
}
```

**Caching:** Results are cached server-side in memory by ZIP for 24 hours. On Vercel, use `next: { revalidate: 86400 }` on the fetch calls.

---

## 5. Growing Season Simulation Engine

A pure TypeScript module (`lib/simulator.ts`) — no external dependencies — that takes a `ClimateProfile` and an array of selected `Plant` objects and returns a full 365-day simulation.

### 5.1 Per-plant simulation logic

For each plant, in order:

1. **Indoor start day** (if `transplant && indoorStartWeeksBefore > 0`):  
   `indoorStartDay = lastFrostDayOfYear − (indoorStartWeeksBefore × 7)`

2. **Outdoor plant day:**  
   For frost-tolerant plants: first day where `dailySoilTemp[d] >= soilTempMinGermination`  
   For frost-sensitive plants: first day where `dailySoilTemp[d] >= soilTempMinGermination AND d >= lastFrostDayOfYear`

3. **Germination day:**  
   `plantDay + ceil((daysToGerminationMin + daysToGerminationMax) / 2)`

4. **GDD accumulation** (from germination day forward):  
   `cumulativeGDD[d] = cumulativeGDD[d-1] + max(0, (tempMax[d] + tempMin[d]) / 2 − gddBase)`

5. **Harvest start day:**  
   First day where `cumulativeGDD[d] >= gddToFirstHarvest`

6. **Harvest end day:**  
   `min(365, harvestStartDay + harvestWindowDays)`

7. **Season end:**  
   For frost-sensitive plants: `min(harvestEndDay, firstFrostDayOfYear)`  
   For frost-tolerant plants: `min(harvestEndDay, firstFrostDayOfYear + 21)` (handles light frosts)

### 5.2 Growth stage per day

Each day maps to one of these growth stages:

| Stage | Visual representation |
|---|---|
| `pre_season` | Nothing visible; plant not yet started |
| `indoor` | Indoor seedling indicator (not on main plant timeline) |
| `in_ground` | Just planted/sown — no visible growth yet |
| `germinating` | Soil stirring, day count shown |
| `seedling` | Small sprout visible, cotyledons |
| `vegetative` | Leafy growth, plant gaining height |
| `flowering` | Blossoms appear |
| `fruiting` | Fruit/vegetable forming |
| `harvest` | Ready to pick; harvest window open |
| `declining` | Post-harvest or frost-killed |
| `done` | Season complete |

### 5.3 Key events

The simulation also flags specific calendar days as **key events** — moments that generate a callout in the scroll narrative:

- Indoor start day → "Start {plant} seeds indoors"
- Outdoor plant day → "Direct sow {plant}" or "Transplant {plant} outdoors"
- Germination day → "Watch for {plant} sprouts"
- First harvest day → "{Plant} ready to harvest!"
- Last harvest day → "Last {plant} harvest before frost"
- First frost day → "First frost expected — protect tender plants"
- Last frost day → "Last frost of spring — warm season planting begins"

Key events across all plants are collected, deduplicated by date, and sorted. Days with multiple events show them as a stack.

---

## 6. The Scroll Narrative — Layout & Experience

### 6.1 Concept

The page is a vertical scroll document. The top is January 1. The bottom is December 31. Scrolling down through the page is traveling through the year. Plants grow visually as the user scrolls. Dates tick past. Environmental ribbons run alongside.

The scroll driver is the browser's native document scroll. A sticky, viewport-height stage reads the current scroll position and maps it to a calendar day. Event controls use native smooth scrolling to move to an exact modeled date, with an immediate fallback for reduced-motion preferences. The math is centralized in `lib/scroll.ts`:

```
scrollPosition(dayOfYear) = ((dayOfYear - 1) / 364) × totalScrollHeight
```

`totalScrollHeight` is `DAYS_IN_YEAR × PIXELS_PER_DAY`, currently 7,300px. Scroll-driven React updates are coalesced to one per animation frame.

### 6.2 Page anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER  (sticky, 60px)                                             │
│  App name · Location · current day                                 │
└─────────────────────────────────────────────────────────────────────┘
├──────────┬──────────────────────────────────────────────────────────┤
│  DATE    │  MAIN STAGE                                              │
│  SPINE   │  Plant growth illustration area                          │
│  (fixed  │  • All selected plants grow here                        │
│   60px)  │  • Plants stay anchored to the viewport bottom          │
│          │  • Temperature and precipitation render behind lanes     │
│          │  • One key event highlight with previous/next controls  │
│          │  • Month/season labels at major transitions             │
├──────────┴──────────────────────────────────────────────────────────┤
│  TRACKING LINE  • Date · daily high/low · precipitation            │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Date spine

A vertical column on the left side of the main stage shows:
- Month names at the start of each month (large, muted)
- Season labels (Spring, Summer, Fall, Winter) at solstice/equinox days
- Last frost marker (↑ Last Frost) and First frost marker (↓ First Frost) as prominent horizontal rules
- A live numeric date marker aligned to the current day

### 6.4 Plant growth illustration

Each of the selected plants occupies a **lane** in the main stage. Up to 6 lanes are arranged horizontally across the stage width. The lane group remains sticky as the calendar scrolls, with each illustration and its soil baseline anchored to the bottom edge of the viewport. Plant names and growth-stage badges remain visible; redundant footer status labels are omitted.

Within each lane, the plant illustration changes state as the user scrolls through its growth stages:
- Pre-season: empty lane, faint soil line at bottom
- Indoor: an emerging plant appears beneath a suspended grow light
- In-ground through seedling: small sprout at soil line
- Vegetative: plant grows taller, gains leaves
- Flowering: blossoms appear
- Fruiting: visible fruit/vegetable forms
- Harvest: harvest indicator; lane glows/highlights
- Declining/done: plant fades, withers

**Implementation approach for illustrations:**  
All plant illustrations are procedurally generated — no authored artwork or external image assets. Each plant is drawn entirely from parameterized SVG shapes and paths generated in code. React selects the modeled daily stage, and CSS transitions smooth visual state changes.

Each plant has a `PlantMorphology` config object that defines its visual character: stem count, branching angle, leaf shape (oval / lanceolate / lobed / compound), leaf size, flower shape (none / single / cluster / umbel), fruit shape (none / round / elongated / pod), and a color palette (stem, leaf, flower, fruit). These parameters vary per species and drive the procedural SVG renderer.

The renderer produces a layered SVG for each growth stage. No images are loaded and no artwork is produced by hand.

Example morphology configs:
- **Tomato:** single upright stem, compound leaves, yellow flower cluster, round red fruit
- **Carrot:** single stem, feathery compound leaves, no flower (root vegetable — crown only shown), orange elongated taproot
- **Lavender:** multi-stem, narrow lanceolate leaves, purple spike flower cluster, no fruit
- **Sunflower:** single thick stem, broad cordate leaves, large single disc flower, seed head fruit stage

### 6.5 Key event callouts

The sticky stage shows one key event at a time in a compact highlight bar:
- Event type badge
- Event label
- Day of year
- Previous and next controls that smoothly scroll to the modeled event date

Events sharing a date remain individually navigable.

### 6.6 Climate backdrop — Air temperature

A continuous field behind the plant lanes showing:
- **Red/warm band:** daily high temperature (°F)
- **Blue/cool band:** daily low temperature (°F)
- The band between high and low is color-filled — wide band = large diurnal range
- Frost threshold (32°F) marked as a horizontal dashed line across the ribbon
- Scale: fixed °F axis (e.g. −10°F to 110°F) for the full ribbon height
- Current-day values shown on the horizontal tracking line

### 6.7 Climate backdrop — Precipitation

- A thin vertical bar chart — each day's average precipitation shown as a horizontal bar extending inward
- Color: blue for rain, white for snow (days where temp < 32°F)
- Wet months (e.g. Pacific Northwest winters) vs. dry summers are immediately visible

## 7. Technical Architecture

### 7.1 Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vercel-native; API routes for data fetching |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Utility-first styling and CSS transitions |
| Scroll behavior | Native document scroll + sticky positioning | Calendar updates are coalesced with `requestAnimationFrame`; event controls use native smooth scrolling |
| Plant illustrations | Procedural inline SVG | Stage-based SVGs parameterized per plant |
| State | React state + browser storage | Active season in `sessionStorage`; recent plant IDs in `localStorage` |
| Deployment | Vercel | Zero-config Next.js; edge caching on climate API |

### 7.2 Implemented directory structure

```
/
├── app/
│   ├── page.tsx                  ← Landing and ZIP entry
│   ├── select/
│   │   ├── page.tsx
│   │   └── SelectExperience.tsx  ← Location confirmation and plant selector
│   ├── grow/
│   │   ├── page.tsx
│   │   └── GrowExperience.tsx    ← Scroll narrative and event navigation
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── climate/
│           └── route.ts          ← Climate data endpoint
├── lib/
│   ├── plants.ts                 ← Curated plant catalog (static data)
│   ├── simulator.ts              ← Growing season simulation engine
│   ├── climate.ts                ← Climate data types + utilities
│   ├── scroll.ts                 ← Shared calendar/scroll dimensions
│   ├── plantSearch.ts
│   └── plantRecommendations.ts
├── components/
│   ├── PlantLane.tsx             ← Single plant lane within the scroll narrative
│   ├── PlantMorphology.tsx       ← Procedural SVG plant renderer (parameterized per species)
│   ├── ClimateBackdrop.tsx       ← Temperature + precipitation field
│   ├── EventCallout.tsx          ← Key event annotation component
│   └── PlantReport.tsx            ← Expandable simulation report
└── Genius-Loci-PRD.md
```

### 7.3 Native scroll mapping pattern

```typescript
export const PIXELS_PER_DAY = 20
export const TOTAL_SCROLL_HEIGHT = DAYS_IN_YEAR * PIXELS_PER_DAY

export function dayToScrollY(dayOfYear: number): number {
  const day = Math.min(DAYS_IN_YEAR, Math.max(1, dayOfYear))
  return ((day - 1) / (DAYS_IN_YEAR - 1)) * TOTAL_SCROLL_HEIGHT
}

// The grow view derives currentDay from window.scrollY and stage geometry.
// Highlight controls call window.scrollTo({ top: targetY, behavior: 'smooth' }).
```

### 7.4 API route responsibilities

`GET /api/climate?zip={zip}`

1. Resolve ZIP → lat/lng/city/state (`api.zippopotam.us`)
2. Fetch hardiness zone (`phzmapi.org`)
3. Fetch 5 years of daily ERA5-Land data (Open-Meteo `/v1/archive`)
4. Average each variable across 5 years to produce 365-point daily normals
5. Compute derived values: frost dates and frostFreeDays
6. Return `ClimateProfile` JSON
7. Cache result for 24 hours

---

## 8. Functional Requirements

| ID | Requirement | Status |
|---|---|---|
| FR-01 | Accept a 5-digit US ZIP code and resolve to city, state, lat/lng, and hardiness zone | Implemented |
| FR-02 | Fetch and average 5 years of daily climate data to produce 365-point daily normals | Implemented |
| FR-03 | Compute and display last spring frost date and first fall frost date | Implemented |
| FR-04 | Present a browsable plant catalog with category filters and global search | Implemented |
| FR-05 | Allow selection of 1–6 plants; enforce the maximum | Implemented |
| FR-06 | Simulate the full 365-day growing season per plant using soil temp gating and GDD accumulation | Implemented |
| FR-07 | Render a scroll-driven narrative where scrolling advances through the calendar year | Implemented |
| FR-08 | Transition procedural plant illustrations through each modeled growth stage | Implemented |
| FR-09 | Show a date spine with month names, season labels, live date, and frost markers | Implemented |
| FR-10 | Show continuous daily high/low air temperature with the 32°F frost line marked | Implemented |
| FR-11 | Show continuous average daily precipitation behind the plant lanes | Implemented |
| FR-12 | Generate key events and provide one-at-a-time navigation to their dates | Implemented |
| FR-13 | Attribute Open-Meteo data per CC BY 4.0 license requirements | Planned (M6) |
| FR-14 | Run without authentication or server-side saved gardens; use browser storage for active/recent selections | Implemented |

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Initial page load (LCP) | < 2.5s on broadband |
| Climate API response (uncached) | < 4s |
| Climate API response (cached) | < 300ms |
| Scroll animation frame rate | 60fps on modern desktop Chrome/Safari |
| Simulation computation time (client) | < 50ms for 6 plants |
| Browser support | Chrome 115+, Safari 16+, Firefox 120+, Edge 115+ |
| Responsive layout | Desktop, tablet, and mobile |
| Accessibility | WCAG review remains planned; event navigation respects reduced-motion preferences |

---

## 10. Open Questions for Development

1. **Plant illustrations:** ~~Resolved.~~ All plant visuals are procedurally generated SVG. Each species has a `PlantMorphology` config that parameterizes its visual character. `PlantMorphology.tsx` renders the geometry for the current React-selected growth stage, with CSS transitions between states.

2. **Scroll document height:** 20px per day (7300px total) is a starting point. User testing will determine whether the season needs more or less room. This is a single constant to tune.

3. **Scroll implementation:** ~~Resolved.~~ Native scrolling and sticky positioning meet the current interaction and performance requirements; no scroll-animation dependency is used.

4. **Multiple frost dates:** ~~Resolved.~~ The 5-year average single-date approach is accepted for v1. If user feedback surfaces problems in high-altitude or coastal climates with high interannual variability, a frost date range display can be added in a later iteration.

5. **Plant catalog completeness:** ~~Resolved.~~ OSU Extension degree-day models are the primary GDD source. Where per-variety GDD data is unavailable, fall back to `daysToMaturity × estimatedDailyGDD` derived from the location's growing season profile. This is an accepted approximation for v1.

---

## 11. Data Attribution Requirements

| Source | License | Attribution required |
|---|---|---|
| Open-Meteo ERA5-Land | CC BY 4.0 | "Weather data by Open-Meteo.com" |
| OpenPlantDB | CC0 (public domain) | None required; credit appreciated |
| phzmapi.org / USDA PRISM | Public domain | None required |
| api.zippopotam.us | Free public use | None required |

Attribution for Open-Meteo must appear in the app footer. This UI remains planned for M6.

---

## 12. Out of Scope — v1

- User accounts or saved gardens
- Push notifications or frost alerts
- Monetization
- Soil amendment or irrigation recommendations
- Companion planting guidance
- Pest and disease modeling
- Export to PDF or calendar

---

## 13. Build Milestones

| Milestone | Deliverable | Status |
|---|---|---|
| M1 — Data layer | `/api/climate` route, normalized ClimateProfile, and simulation tests | Complete |
| M2 — Navigation | ZIP entry → location confirmation → plant selector → grow view | Complete |
| M3 — Scroll scaffold | Shared scroll dimensions, date spine, and day-of-year mapping | Complete |
| M4 — Plant lanes | Up to 6 bottom-anchored lanes, growth stages, and navigable key events | Complete |
| M5 — Climate backdrop | Daily temperature and precipitation fields with live values | Complete |
| M6 — Polish | Complete reduced-motion coverage, error-state review, attribution footer, accessibility and performance audits | In progress |
| M7 — Deploy | Production deployment and 5 tests with gardeners | Planned |

---

*End of Document — Genius Loci PRD v1.0 — implementation status updated September 2026*
