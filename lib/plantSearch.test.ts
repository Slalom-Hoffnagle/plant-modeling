import { describe, expect, it } from "vitest";
import { plants } from "@/lib/plants";
import { filterPlants } from "@/lib/plantSearch";

describe("filterPlants", () => {
  it("searches the full catalog regardless of the active browse category", () => {
    expect(filterPlants(plants, "lavender", "vegetable").map((plant) => plant.id)).toEqual(["lavender"]);
  });

  it("respects category filters while browsing without a query", () => {
    expect(filterPlants(plants, "", "herb").every((plant) => plant.category === "herb")).toBe(true);
  });
});