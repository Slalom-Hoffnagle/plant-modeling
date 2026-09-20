export type PlantCategory = "vegetable" | "herb" | "flower";
export type Lifecycle = "annual" | "biennial" | "perennial";

export interface PlantMorphology {
  stemCount: 1 | 2 | 3 | "many";
  stemCurve: "straight" | "arching" | "vining";
  maxHeightPx: number;
  leafShape: "oval" | "lanceolate" | "lobed" | "compound" | "cordate" | "needle" | "strap";
  leafSize: "small" | "medium" | "large";
  leafArrangement: "alternate" | "opposite" | "whorl" | "basal-rosette";
  flowerShape: "none" | "single" | "cluster" | "spike" | "umbel" | "disc";
  flowerColor: string;
  fruitShape: "none" | "round" | "elongated" | "pod" | "cluster" | "head" | "root";
  fruitColor: string;
  stemColor: string;
  leafColor: string;
  leafColorVariant: string;
}

export interface Plant {
  id: string;
  name: string;
  category: PlantCategory;
  soilTempMinGermination: number;
  soilTempOptimalGermination: number;
  daysToGerminationMin: number;
  daysToGerminationMax: number;
  daysToMaturity: number;
  gddBase: number;
  gddToFirstHarvest: number;
  harvestWindowDays: number;
  directSow: boolean;
  transplant: boolean;
  indoorStartWeeksBefore: number;
  frostTolerant: boolean;
  lifecycle: Lifecycle;
  peakPhases: {
    seedling: number;
    vegetative: number;
    flowering: number;
    fruiting: number;
    harvest: number;
    decline: number;
  };
  description: string;
  keyEvents: string[];
  morphology: PlantMorphology;
}

const defaultMorphology: PlantMorphology = {
  stemCount: 1,
  stemCurve: "straight",
  maxHeightPx: 180,
  leafShape: "oval",
  leafSize: "medium",
  leafArrangement: "alternate",
  flowerShape: "single",
  flowerColor: "#f7c948",
  fruitShape: "round",
  fruitColor: "#d94f4f",
  stemColor: "#3f6b46",
  leafColor: "#5e8c4a",
  leafColorVariant: "#83a95c",
};

export const plants: Plant[] = [
  {
    id: "tomato",
    name: "Tomato",
    category: "vegetable",
    soilTempMinGermination: 60,
    soilTempOptimalGermination: 75,
    daysToGerminationMin: 5,
    daysToGerminationMax: 10,
    daysToMaturity: 70,
    gddBase: 50,
    gddToFirstHarvest: 1400,
    harvestWindowDays: 45,
    directSow: false,
    transplant: true,
    indoorStartWeeksBefore: 6,
    frostTolerant: false,
    lifecycle: "annual",
    peakPhases: { seedling: 14, vegetative: 30, flowering: 18, fruiting: 25, harvest: 45, decline: 21 },
    description: "A warm-season crop with a long harvest window.",
    keyEvents: ["Side-dress with nitrogen at first flower"],
    morphology: { ...defaultMorphology, flowerShape: "cluster" },
  },
  {
    id: "carrot",
    name: "Carrot",
    category: "vegetable",
    soilTempMinGermination: 45,
    soilTempOptimalGermination: 65,
    daysToGerminationMin: 10,
    daysToGerminationMax: 21,
    daysToMaturity: 70,
    gddBase: 40,
    gddToFirstHarvest: 900,
    harvestWindowDays: 30,
    directSow: true,
    transplant: false,
    indoorStartWeeksBefore: 0,
    frostTolerant: true,
    lifecycle: "biennial",
    peakPhases: { seedling: 18, vegetative: 45, flowering: 0, fruiting: 0, harvest: 30, decline: 14 },
    description: "A cool-season root crop that sweetens with cool weather.",
    keyEvents: ["Thin seedlings once tops emerge"],
    morphology: { ...defaultMorphology, flowerShape: "none", fruitShape: "root", fruitColor: "#e88b2e", leafShape: "compound" },
  },
  {
    id: "basil",
    name: "Basil",
    category: "herb",
    soilTempMinGermination: 55,
    soilTempOptimalGermination: 70,
    daysToGerminationMin: 5,
    daysToGerminationMax: 10,
    daysToMaturity: 30,
    gddBase: 50,
    gddToFirstHarvest: 650,
    harvestWindowDays: 60,
    directSow: true,
    transplant: true,
    indoorStartWeeksBefore: 4,
    frostTolerant: false,
    lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 25, flowering: 14, fruiting: 0, harvest: 60, decline: 14 },
    description: "A tender herb that rewards frequent harvesting.",
    keyEvents: ["Pinch growing tips before flowering"],
    morphology: { ...defaultMorphology, flowerShape: "spike", flowerColor: "#d9c2ff", fruitShape: "none" },
  },
];
