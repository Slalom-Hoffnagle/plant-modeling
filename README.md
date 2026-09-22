# Genius Loci

Genius Loci models a ZIP-specific growing year. It combines five complete years of daily climate observations with plant-specific soil-temperature and growing-degree-day requirements, then presents the result as a scrollable 365-day calendar.

## Application Flow

1. Enter a five-digit US ZIP code.
2. Review the resolved location, hardiness zone, and frost dates.
3. Search or browse the 55-plant catalog and select up to six plants.
4. Generate a full-year simulation.
5. Scroll through daily climate conditions, growth stages, and key planting or harvest moments.

## Architecture

- `app/api/climate/route.ts`: resolves ZIP and hardiness data, fetches historical climate observations, creates daily normals, and caches profiles for 24 hours.
- `lib/climate.ts`: climate types, calendar-day normalization, and frost derivation.
- `lib/plants.ts`: curated plant catalog and morphology configuration.
- `lib/simulator.ts`: pure TypeScript soil-temperature and GDD simulation.
- `lib/scroll.ts`: shared day-to-scroll conversion and calendar dimensions.
- `app/select/SelectExperience.tsx`: catalog search, recommendations, and plant selection.
- `app/grow/GrowExperience.tsx`: scroll-driven calendar and event navigation.
- `components/ClimateBackdrop.tsx`: daily temperature and precipitation field.
- `components/PlantMorphology.tsx`: procedural inline SVG plants.

The calendar uses native browser scrolling, a sticky viewport-height stage, and React state derived from the current scroll position. Highlight controls use native smooth scrolling and respect reduced-motion preferences.

## Data Sources

- [Zippopotam.us](https://www.zippopotam.us/) for ZIP-to-location lookup
- [PHZM API](https://phzmapi.org/) for USDA hardiness zones
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) for air temperature, shallow soil temperature, and precipitation

The API requests the five most recent complete calendar years and normalizes them into 365 daily values. Leap day is omitted.

## Browser Storage

- `sessionStorage["genius-loci-season"]` holds the active climate profile and selected plant IDs for the current tab.
- `localStorage["genius-loci-recent-plants"]` holds up to 12 recently selected plant IDs for recommendation ordering.

There are no user accounts or server-side saved gardens.

## Product Scope

[Genius-Loci-PRD.md](Genius-Loci-PRD.md) records the product requirements and implementation status. Milestones M1-M5 are implemented. Weed modeling, complete attribution UI, broader accessibility work, deployment, and user testing remain planned.
