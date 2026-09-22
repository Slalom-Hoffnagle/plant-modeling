# Genius Loci
## Product Requirements Document — v1.0

**Author:** Carl Hoffnagle  
**Date:** September 2026  
**Status:** Draft  
**Stack:** Next.js 14 · TypeScript · Tailwind CSS · GSAP ScrollTrigger  
**Deployment:** Vercel  

---

## 1. Product Vision

Genius Loci is a web application that models a personalized growing season for a home gardener. The user specifies their location and selects up to 6 plants. The app then renders a full-page, scroll-driven narrative of their growing year — from soil warm-up through germination, sprout emergence, growth phases, blossom, fruit, and harvest — with each event anchored to real dates and driven by real climate data for their specific location.

As the user scrolls down, time advances. The illustration grows, dates and callouts appear, and the season unfolds. Side ribbons carry continuous environmental data — air temperature highs/lows, noon sun angle, and average precipitation — running alongside the plant story. An optional weed layer overlays the locally-common weed germination schedule on top of the main illustration.

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
5. Scroll narrative — user scrolls down through the year
       ↓
   [Optional] Toggle weed layer on/off at any time
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

### 3.4 Noon Sun Angle

**Source:** Calculated — no API required  
**Formula:** Solar noon altitude = 90° − |latitude − declination(dayOfYear)|  
**Declination:** δ = 23.44° × sin((360/365) × (N − 81)) where N = day of year

This is computed client-side for each of the 365 days using the user's latitude from the ZIP lookup. Output is a 365-point array of noon sun altitude angles (degrees above horizon), ranging from summer solstice maximum (~90° − |lat − 23.4°|) to winter solstice minimum (~90° − |lat + 23.4°|).

**Implementation:**
```typescript
function noonSunAngle(dayOfYear: number, latitudeDeg: number): number {
  const declinationDeg = 23.44 * Math.sin((Math.PI * 2 / 365) * (dayOfYear - 81))
  return 90 - Math.abs(latitudeDeg - declinationDeg)
}
```

---

### 3.5 Plant Growth Data

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

### 3.6 Weed Data

**Primary source:** University extension service literature (WVU, UMD, Montana State, UGA)  
**Weed germination model:** Soil temperature threshold + GDD accumulation (same model as crops)

Key thresholds from extension research:

| Weed | Min Soil Temp (°F) | GDD Base | Notes |
|---|---|---|---|
| Hairy bittercress | 34 | 34 | One of the earliest; winter annual |
| Chickweed | 35 | 35 | Very early spring and fall |
| Henbit | 34 | 34 | Overwinters, blooms early spring |
| Dandelion | 50 | 40 | Spring and fall flushes |
| Lamb's quarters | 45 | 40 | Early-mid spring |
| Wild mustard | 40 | 40 | Cool-season annual |
| Crabgrass (large) | 55 | 50 | GDD 300–350 from Jan 1 |
| Crabgrass (smooth) | 55 | 50 | GDD 150 from Jan 1 |
| Purslane | 60 | 50 | Mid-summer |
| Pigweed | 60 | 50 | Mid-summer; prolific seeder |
| Nutsedge | 60 | 50 | Mid-summer; loves wet soil |
| Field bindweed | 55 | 45 | Perennial; persistent |
| Ground ivy | 40 | 40 | Spring and fall |
| Wood sorrel | 50 | 40 | Spring and fall |
| Plantain | 50 | 40 | Spring; common in compacted soil |

**Regional relevance mapping:** Each weed entry includes a `regions` field (array of US regional codes) so the weed layer only shows weeds plausible for the user's state.

**Weed data structure:**

```typescript
interface Weed {
  id: string
  name: string
  soilTempMin: number
  gddBase: number
  gddToActiveGrowth: number
  peakSeason: 'early-spring' | 'spring' | 'summer' | 'fall' | 'year-round'
  regions: USRegion[]
  description: string
  managementTip: string
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
6. Compute the 365-point noon sun angle array from latitude
7. Return a `ClimateProfile` containing all of the above

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
  dailyNoonSunAngle: number[]  // degrees above horizon

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

The **scroll driver** is GSAP ScrollTrigger. Each plant element, each callout, each date marker is pinned to a scroll position that corresponds to its calendar day. The math:

```
scrollPosition(dayOfYear) = (dayOfYear / 365) × totalScrollHeight
```

`totalScrollHeight` is set large enough to give the season room to breathe — typically 10× the viewport height (e.g. 6000–8000px on a 700px viewport) so that scrolling through the full year takes 15–25 seconds of deliberate scrolling.

### 6.2 Page anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER  (sticky, 60px)                                             │
│  App name · Location · Zone · Frost dates · Weed toggle            │
└─────────────────────────────────────────────────────────────────────┘
│  LEFT RIBBON  (fixed, 48px wide)                                    │
│  • Day/night air temp (min/max band, color-coded)                   │
│  • Scrolls with the page — updates continuously                     │
├──────────┬──────────────────────────────────────────────────────────┤
│  DATE    │  MAIN STAGE                                              │
│  SPINE   │  Plant growth illustration area                          │
│  (fixed  │  • All selected plants grow here                        │
│   60px)  │  • Weed layer overlays (when enabled)                   │
│          │  • Key event callouts float in from right               │
│          │  • Month/season labels at major transitions             │
├──────────┴──────────────────────────────────────────────────────────┤
│  RIGHT RIBBON  (fixed, 48px wide)                                   │
│  • Noon sun angle arc (animated continuously)                       │
│  • Average precipitation bar (daily value)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Date spine

A thin vertical column (left side of main stage, 60px wide) shows:
- Month names at the start of each month (large, muted)
- Week tick marks every 7 days
- Season labels (Spring, Summer, Fall, Winter) at solstice/equinox days
- Last frost marker (↑ Last Frost) and First frost marker (↓ First Frost) as prominent horizontal rules

### 6.4 Plant growth illustration

Each of the selected plants occupies a **lane** in the main stage. Up to 12 lanes are arranged horizontally across the stage width. Each lane is a vertical track that runs the full height of the scroll document.

Within each lane, the plant illustration changes state as the user scrolls through its growth stages:
- Pre-season: empty lane, faint soil line at bottom
- Indoor: a small indoor pot icon appears at the left edge (separate from the main lane)
- In-ground through seedling: small sprout at soil line
- Vegetative: plant grows taller, gains leaves
- Flowering: blossoms appear
- Fruiting: visible fruit/vegetable forms
- Harvest: harvest indicator; lane glows/highlights
- Declining/done: plant fades, withers

**Implementation approach for illustrations:**  
All plant illustrations are procedurally generated — no authored artwork, no external image assets. Each plant is drawn entirely from parameterized SVG shapes and paths generated in code, animated by GSAP as the user scrolls through growth stages.

Each plant has a `PlantMorphology` config object that defines its visual character: stem count, branching angle, leaf shape (oval / lanceolate / lobed / compound), leaf size, flower shape (none / single / cluster / umbel), fruit shape (none / round / elongated / pod), and a color palette (stem, leaf, flower, fruit). These parameters vary per species and drive the procedural SVG renderer.

The renderer produces a layered SVG for each growth stage. Stage transitions are animated by GSAP: element `height`, `scale`, `opacity`, and path `d` attribute morphing between stages. No images are loaded. No artwork is produced by hand.

Example morphology configs:
- **Tomato:** single upright stem, compound leaves, yellow flower cluster, round red fruit
- **Carrot:** single stem, feathery compound leaves, no flower (root vegetable — crown only shown), orange elongated taproot
- **Lavender:** multi-stem, narrow lanceolate leaves, purple spike flower cluster, no fruit
- **Sunflower:** single thick stem, broad cordate leaves, large single disc flower, seed head fruit stage

### 6.5 Key event callouts

When a key event day is crossed during scroll, a callout animates in from the right side of the main stage:
- Icon (seed, sprout, sun, scissors, snowflake)
- Plant name + event name
- Date
- Optional action tip (e.g., "Time to side-dress with compost")
- Callouts dismiss automatically as the user continues scrolling past them

### 6.6 Left ribbon — Air temperature

A continuous vertical gradient band showing:
- **Red/warm band:** daily high temperature (°F)
- **Blue/cool band:** daily low temperature (°F)
- The band between high and low is color-filled — wide band = large diurnal range
- Frost threshold (32°F) marked as a horizontal dashed line across the ribbon
- Scale: fixed °F axis (e.g. −10°F to 110°F) for the full ribbon height
- Current day value shown as a floating label that moves as user scrolls

### 6.7 Right ribbon — Sun angle & precipitation

Two stacked sub-ribbons on the right:

**Top half — Noon sun angle:**
- A small arc or semicircle that animates to show the sun's position at noon for the current scroll-day
- Angle label updates continuously (e.g. "Sun: 52° above horizon")
- Solstice/equinox annotations at the appropriate scroll positions

**Bottom half — Precipitation:**
- A thin vertical bar chart — each day's average precipitation shown as a horizontal bar extending inward
- Color: blue for rain, white for snow (days where temp < 32°F)
- Wet months (e.g. Pacific Northwest winters) vs. dry summers are immediately visible

### 6.8 Weed layer

When toggled on:
- A semi-transparent red/amber overlay appears behind the plant lanes
- Each active weed species is shown as a small labeled band that spans its active germination/growth window
- Bands are stackable — multiple weeds active at once are shown as adjacent thin bands
- Weed species are filtered to those common in the user's region (derived from state abbreviation)
- A small weed legend floats at the top of the main stage listing which weeds are currently shown

---

## 7. Technical Architecture

### 7.1 Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vercel-native; API routes for data fetching |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Utility-first; custom CSS for ribbon animations |
| Scroll animation | GSAP + ScrollTrigger | Industry standard for scroll-driven narratives; handles pinning, scrubbing, and timeline sequencing |
| Plant illustrations | SVG (inline, animated) | Stage-based SVGs per plant; animated by GSAP |
| State | React `useState` / `useContext` | No external state library needed for MVP |
| Deployment | Vercel | Zero-config Next.js; edge caching on climate API |

### 7.2 Directory structure

```
/
├── app/
│   ├── page.tsx                  ← Landing: ZIP entry + location confirm
│   ├── select/
│   │   └── page.tsx              ← Plant selector
│   ├── grow/
│   │   └── page.tsx              ← Scroll narrative (main experience)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── climate/
│           └── route.ts          ← Climate data endpoint
├── lib/
│   ├── plants.ts                 ← Curated plant catalog (static data)
│   ├── weeds.ts                  ← Weed catalog (static data)
│   ├── simulator.ts              ← Growing season simulation engine
│   ├── climate.ts                ← Climate data types + utilities
│   └── solar.ts                  ← Noon sun angle calculation
├── components/
│   ├── PlantLane.tsx             ← Single plant lane within the scroll narrative
│   ├── PlantMorphology.tsx       ← Procedural SVG plant renderer (parameterized per species)
│   ├── DateSpine.tsx             ← Vertical date/month/season column
│   ├── TempRibbon.tsx            ← Left air temperature ribbon
│   ├── SunPrecipRibbon.tsx       ← Right sun angle + precipitation ribbon
│   ├── WeedLayer.tsx             ← Weed overlay (toggle-able)
│   ├── EventCallout.tsx          ← Key event annotation component
│   └── PlantSelector.tsx         ← Plant catalog UI
├── data/
│   ├── plants.json               ← Plant catalog (~55 entries)
│   └── weeds.json                ← Weed catalog (~15 entries)
└── public/
    └── (no illustration assets — all visuals are procedurally generated in code)
```

### 7.3 GSAP ScrollTrigger pattern

```typescript
// Pseudocode — each plant lane registers its own ScrollTrigger
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Total scroll document height (set on the scroll container element)
const TOTAL_HEIGHT = 365 * 20 // 20px per day = 7300px total

// Convert a Julian day to a scroll position
function dayToScrollY(day: number): number {
  return (day / 365) * TOTAL_HEIGHT
}

// For each plant, create a timeline pinned to its growth window
plants.forEach((sim) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-container',
      start: `top+=${dayToScrollY(sim.germinationDay)} top`,
      end: `top+=${dayToScrollY(sim.seasonEndDay)} top`,
      scrub: true,
    }
  })

  // Animate plant illustration height, opacity, stage transitions
  tl.to(`#lane-${sim.plant.id} .plant-illustration`, {
    height: '80%',
    duration: 1,
    ease: 'none'
  })
})
```

### 7.4 API route responsibilities

`GET /api/climate?zip={zip}`

1. Resolve ZIP → lat/lng/city/state (`api.zippopotam.us`)
2. Fetch hardiness zone (`phzmapi.org`)
3. Fetch 5 years of daily ERA5-Land data (Open-Meteo `/v1/archive`)
4. Average each variable across 5 years to produce 365-point daily normals
5. Compute derived values: frost dates, frostFreeDays, noonSunAngle array
6. Return `ClimateProfile` JSON
7. Cache result for 24 hours

---

## 8. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Accept a 5-digit US ZIP code and resolve to city, state, lat/lng, and hardiness zone |
| FR-02 | Fetch and average 5 years of daily climate data to produce 365-point daily normals |
| FR-03 | Compute and display last spring frost date and first fall frost date |
| FR-04 | Present a browsable plant catalog with category filters and search |
| FR-05 | Allow selection of 1–6 plants; enforce the maximum |
| FR-06 | Simulate the full 365-day growing season per plant using soil temp gating and GDD accumulation |
| FR-07 | Render a scroll-driven narrative where scrolling advances through the calendar year |
| FR-08 | Animate plant growth illustrations through each growth stage as the user scrolls |
| FR-09 | Show a vertical date spine with month names, week ticks, season labels, and frost markers |
| FR-10 | Show a continuous left ribbon of daily high/low air temperature with the 32°F frost line marked |
| FR-11 | Show a continuous right ribbon of noon sun angle (animated arc) and average daily precipitation |
| FR-12 | Generate key event callouts at the correct scroll positions for each plant |
| FR-13 | Provide a toggleable weed layer showing region-appropriate weed germination windows |
| FR-14 | Attribute Open-Meteo data per CC BY 4.0 license requirements |
| FR-15 | Run without requiring user authentication or data persistence |

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
| Responsive layout | Desktop and tablet; mobile is out of scope for v1 |
| Accessibility | WCAG 2.1 AA for non-animated content; reduced-motion media query respected |

---

## 10. Open Questions for Development

1. **Plant illustrations:** ~~Resolved.~~ All plant visuals are procedurally generated SVG — no authored assets, no photo processing. Each species has a `PlantMorphology` config in the plant catalog (static data file) that parameterizes its visual character. The `PlantMorphology.tsx` component reads this config and renders the correct SVG geometry for the current growth stage, animated by GSAP. See Section 6.4 and the `PlantMorphology` interface in Section 3.5 for detail. The `/public/illustrations/` directory does not exist.

2. **Scroll document height:** 20px per day (7300px total) is a starting point. User testing will determine whether the season needs more or less room. This is a single constant to tune.

3. **GSAP license:** ~~Resolved.~~ This is a personal project. GSAP ScrollTrigger is licensed freely for personal and open-source use. No licensing action required.

4. **Multiple frost dates:** ~~Resolved.~~ The 5-year average single-date approach is accepted for v1. If user feedback surfaces problems in high-altitude or coastal climates with high interannual variability, a frost date range display can be added in a later iteration.

5. **Plant catalog completeness:** ~~Resolved.~~ OSU Extension degree-day models are the primary GDD source. Where per-variety GDD data is unavailable, fall back to `daysToMaturity × estimatedDailyGDD` derived from the location's growing season profile. This is an accepted approximation for v1.

6. **Weed geographic precision:** ~~Resolved.~~ 6-region state-based mapping is accepted for v1. The USDA PLANTS database or county-level extension records can improve precision in a later iteration.

---

## 11. Data Attribution Requirements

| Source | License | Attribution required |
|---|---|---|
| Open-Meteo ERA5-Land | CC BY 4.0 | "Weather data by Open-Meteo.com" |
| OpenPlantDB | CC0 (public domain) | None required; credit appreciated |
| phzmapi.org / USDA PRISM | Public domain | None required |
| api.zippopotam.us | Free public use | None required |
| Weed data (extension services) | Public domain | None required |

Attribution for Open-Meteo must appear in the app footer.

---

## 12. Out of Scope — v1

- User accounts or saved gardens
- Mobile layout
- Push notifications or frost alerts
- Monetization
- Soil amendment or irrigation recommendations
- Companion planting guidance
- Pest and disease modeling
- Export to PDF or calendar

---

## 13. Suggested Build Milestones

| Milestone | Deliverable |
|---|---|
| M1 — Data layer | `/api/climate` route working; ClimateProfile validated against 5 test ZIPs; simulation engine unit-tested for 3 plants |
| M2 — Navigation | ZIP entry → location confirm → plant selector → "generate" button → grow page shell |
| M3 — Scroll scaffold | Scroll document at correct height; date spine rendering; scroll position correctly mapped to day-of-year |
| M4 — Plant lanes | 12 lanes rendering; growth stage transitions triggering at correct scroll positions; key event callouts appearing |
| M5 — Ribbons | Left temp ribbon and right sun/precip ribbon both rendering with live scroll-position data |
| M6 — Weed layer | Toggle functional; weed bands rendering in correct date windows for user's region |
| M7 — Polish | Reduced-motion support; error states; attribution footer; performance audit |
| M8 — Deploy | Vercel production deploy; 5 user tests with real gardeners |

---

*End of Document — Genius Loci PRD v1.0 — All open questions resolved*
