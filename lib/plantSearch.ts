import type { Plant, PlantCategory } from "@/lib/plants";

export function filterPlants(
  catalog: Plant[],
  query: string,
  category: PlantCategory | "all",
): Plant[] {
  const normalizedQuery = query.trim().toLowerCase();

  return catalog.filter((plant) => {
    if (!normalizedQuery) return category === "all" || plant.category === category;

    const searchableText = [
      plant.name,
      plant.category,
      plant.description,
      ...plant.keyEvents,
    ].join(" ").toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}