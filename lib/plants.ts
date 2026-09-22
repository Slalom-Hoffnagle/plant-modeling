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

type CatalogPlant = Pick<Plant, "id" | "name" | "category" | "description"> & Partial<Omit<Plant, "id" | "name" | "category" | "description" | "morphology">> & {
  morphology?: Partial<PlantMorphology>;
};

function catalogPlant(entry: CatalogPlant): Plant {
  const frostTolerant = entry.frostTolerant ?? false;
  const daysToMaturity = entry.daysToMaturity ?? 65;
  const categoryMorphology: Partial<PlantMorphology> = entry.category === "flower"
    ? { fruitShape: "none", flowerShape: "single" }
    : entry.category === "herb"
      ? { fruitShape: "none", flowerShape: "spike", leafSize: "small" }
      : {};

  return {
    soilTempMinGermination: frostTolerant ? 40 : 55,
    soilTempOptimalGermination: frostTolerant ? 60 : 72,
    daysToGerminationMin: 5,
    daysToGerminationMax: 14,
    daysToMaturity,
    gddBase: frostTolerant ? 40 : 50,
    gddToFirstHarvest: daysToMaturity * (frostTolerant ? 10 : 14),
    harvestWindowDays: entry.category === "flower" ? 60 : 35,
    directSow: true,
    transplant: true,
    indoorStartWeeksBefore: 4,
    frostTolerant,
    lifecycle: "annual",
    peakPhases: { seedling: 14, vegetative: 30, flowering: 35, fruiting: entry.category === "vegetable" ? 20 : 0, harvest: 35, decline: 14 },
    keyEvents: [],
    ...entry,
    morphology: { ...defaultMorphology, ...categoryMorphology, ...entry.morphology },
  };
}

const expandedCatalog: Plant[] = [
  catalogPlant({ id: "broccoli", name: "Broccoli", category: "vegetable", description: "A frost-tolerant brassica for cool spring and fall harvests.", frostTolerant: true, daysToMaturity: 70, keyEvents: ["Harvest the central head before flower buds open"], morphology: { leafShape: "lobed", leafSize: "large", fruitShape: "head", fruitColor: "#477a45" } }),
  catalogPlant({ id: "kale", name: "Kale", category: "vegetable", description: "A cold-hardy leafy green that improves in flavor after frost.", frostTolerant: true, daysToMaturity: 55, harvestWindowDays: 100, lifecycle: "biennial", keyEvents: ["Pick lower leaves while the crown continues growing"], morphology: { stemCount: "many", leafShape: "lobed", leafSize: "large", fruitShape: "none" } }),
  catalogPlant({ id: "spinach", name: "Spinach", category: "vegetable", description: "A fast leafy crop for short, cool days.", frostTolerant: true, daysToMaturity: 42, keyEvents: ["Harvest before warm weather triggers bolting"], morphology: { stemCount: "many", leafArrangement: "basal-rosette", fruitShape: "none" } }),
  catalogPlant({ id: "beet", name: "Beet", category: "vegetable", description: "A cool-season root crop with edible tops and roots.", frostTolerant: true, daysToMaturity: 60, keyEvents: ["Thin clusters early for well-shaped roots"], morphology: { stemCount: "many", leafArrangement: "basal-rosette", fruitShape: "root", fruitColor: "#7d2848" } }),
  catalogPlant({ id: "cabbage", name: "Cabbage", category: "vegetable", description: "A sturdy cool-season brassica for spring or fall gardens.", frostTolerant: true, daysToMaturity: 80, keyEvents: ["Harvest when heads feel firm"], morphology: { stemCount: "many", leafArrangement: "basal-rosette", leafSize: "large", fruitShape: "head", fruitColor: "#78a86a" } }),
  catalogPlant({ id: "onion", name: "Onion", category: "vegetable", description: "A day-length-sensitive bulb crop with varieties for northern and southern regions.", frostTolerant: true, daysToMaturity: 100, keyEvents: ["Choose short-, intermediate-, or long-day varieties for your latitude"], morphology: { stemCount: "many", leafShape: "strap", leafArrangement: "basal-rosette", fruitShape: "root", fruitColor: "#d6b66d" } }),
  catalogPlant({ id: "garlic", name: "Garlic", category: "vegetable", description: "A cold-hardy bulb commonly planted in fall for summer harvest.", frostTolerant: true, daysToMaturity: 240, lifecycle: "perennial", indoorStartWeeksBefore: 0, keyEvents: ["Plant cloves in fall and harvest after lower leaves brown"], morphology: { stemCount: "many", leafShape: "strap", fruitShape: "root", fruitColor: "#eee5cf" } }),
  catalogPlant({ id: "potato", name: "Potato", category: "vegetable", description: "A cool-tolerant tuber crop adaptable across much of the United States.", frostTolerant: true, daysToMaturity: 90, transplant: false, indoorStartWeeksBefore: 0, keyEvents: ["Hill soil around stems as plants grow"], morphology: { stemCount: "many", leafShape: "compound", flowerColor: "#ddd5ef", fruitShape: "root", fruitColor: "#b99462" } }),
  catalogPlant({ id: "sweet-corn", name: "Sweet Corn", category: "vegetable", description: "A warm-season grain best grown in blocks for pollination.", daysToMaturity: 75, transplant: false, indoorStartWeeksBefore: 0, keyEvents: ["Plant in blocks rather than a single row"], morphology: { maxHeightPx: 260, leafShape: "strap", leafSize: "large", flowerShape: "spike", fruitShape: "elongated", fruitColor: "#e9c84d" } }),
  catalogPlant({ id: "bush-bean", name: "Bush Bean", category: "vegetable", description: "A compact warm-season bean with a quick pod harvest.", daysToMaturity: 52, transplant: false, indoorStartWeeksBefore: 0, keyEvents: ["Pick pods often to sustain production"], morphology: { stemCount: 3, leafShape: "compound", fruitShape: "pod", fruitColor: "#579246" } }),
  catalogPlant({ id: "eggplant", name: "Eggplant", category: "vegetable", description: "A long-season heat lover for warm regions or early indoor starts.", soilTempMinGermination: 65, soilTempOptimalGermination: 80, daysToMaturity: 80, directSow: false, indoorStartWeeksBefore: 8, keyEvents: ["Harvest while fruit skin remains glossy"], morphology: { stemCount: 3, leafSize: "large", flowerColor: "#9c78be", fruitShape: "elongated", fruitColor: "#56386f" } }),
  catalogPlant({ id: "okra", name: "Okra", category: "vegetable", description: "A deeply heat-loving crop well suited to long southern summers.", soilTempMinGermination: 65, soilTempOptimalGermination: 80, daysToMaturity: 60, indoorStartWeeksBefore: 3, keyEvents: ["Harvest tender pods every one to two days"], morphology: { maxHeightPx: 240, leafShape: "lobed", leafSize: "large", flowerColor: "#f3df91", fruitShape: "pod", fruitColor: "#668d44" } }),
  catalogPlant({ id: "sweet-potato", name: "Sweet Potato", category: "vegetable", description: "A tropical vine crop for hot summers and frost-free soil.", soilTempMinGermination: 65, soilTempOptimalGermination: 80, daysToMaturity: 110, directSow: false, indoorStartWeeksBefore: 0, keyEvents: ["Plant slips only after soil is thoroughly warm"], morphology: { stemCount: "many", stemCurve: "vining", leafShape: "cordate", fruitShape: "root", fruitColor: "#c86537" } }),
  catalogPlant({ id: "pumpkin", name: "Pumpkin", category: "vegetable", description: "A sprawling warm-season squash requiring ample frost-free time.", daysToMaturity: 100, keyEvents: ["Cure mature fruit in a warm dry place"], morphology: { stemCount: "many", stemCurve: "vining", leafShape: "lobed", leafSize: "large", flowerColor: "#e8aa32", fruitShape: "round", fruitColor: "#df762b" } }),
  catalogPlant({ id: "oregano", name: "Oregano", category: "herb", description: "A drought-tolerant perennial herb for sunny, well-drained beds.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 80, harvestWindowDays: 120, keyEvents: ["Trim after flowering to renew leafy growth"], morphology: { stemCount: "many", leafArrangement: "opposite", flowerShape: "cluster", flowerColor: "#d3b0cf" } }),
  catalogPlant({ id: "sage", name: "Garden Sage", category: "herb", description: "A woody perennial culinary herb suited to dry summers.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 75, harvestWindowDays: 120, keyEvents: ["Replace woody plants every few years"], morphology: { stemCount: "many", leafShape: "lanceolate", leafArrangement: "opposite", flowerColor: "#8674ad", leafColor: "#768777" } }),
  catalogPlant({ id: "chives", name: "Chives", category: "herb", description: "A very cold-hardy perennial allium with edible leaves and flowers.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 60, harvestWindowDays: 120, keyEvents: ["Cut leaves near the base for regrowth"], morphology: { stemCount: "many", leafShape: "strap", leafArrangement: "basal-rosette", flowerShape: "cluster", flowerColor: "#ad83bd" } }),
  catalogPlant({ id: "tarragon", name: "French Tarragon", category: "herb", description: "A perennial culinary herb for temperate gardens with good drainage.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 90, directSow: false, keyEvents: ["Divide established clumps to renew growth"], morphology: { stemCount: "many", leafShape: "lanceolate", leafArrangement: "alternate", flowerShape: "none" } }),
  catalogPlant({ id: "lemongrass", name: "Lemongrass", category: "herb", description: "A tropical grass grown as an annual outside frost-free climates.", soilTempMinGermination: 65, soilTempOptimalGermination: 80, daysToMaturity: 100, directSow: false, indoorStartWeeksBefore: 8, keyEvents: ["Harvest thick outer stalks at soil level"], morphology: { stemCount: "many", leafShape: "strap", leafSize: "large", leafArrangement: "basal-rosette", flowerShape: "none" } }),
  catalogPlant({ id: "fennel", name: "Florence Fennel", category: "herb", description: "An aromatic cool-season herb grown for crisp bulbs and feathery leaves.", frostTolerant: true, daysToMaturity: 90, keyEvents: ["Keep evenly watered as the bulb develops"], morphology: { stemCount: "many", leafShape: "needle", flowerShape: "umbel", flowerColor: "#e3ca4f" } }),
  catalogPlant({ id: "coneflower", name: "Purple Coneflower", category: "flower", description: "A cold-hardy native perennial supporting pollinators and birds.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 120, keyEvents: ["Leave seed heads standing for winter birds"], morphology: { stemCount: 3, maxHeightPx: 190, leafShape: "lanceolate", flowerShape: "disc", flowerColor: "#bd6f9d" } }),
  catalogPlant({ id: "black-eyed-susan", name: "Black-Eyed Susan", category: "flower", description: "A resilient native flower for sunny beds across broad regions.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 90, keyEvents: ["Deadhead for repeat bloom or leave seeds for birds"], morphology: { stemCount: 3, flowerShape: "disc", flowerColor: "#e5b631" } }),
  catalogPlant({ id: "calendula", name: "Calendula", category: "flower", description: "A cool-season edible flower for mild winters and shoulder seasons.", frostTolerant: true, daysToMaturity: 55, keyEvents: ["Pick flowers frequently to extend bloom"], morphology: { stemCount: 3, flowerShape: "disc", flowerColor: "#e99431" } }),
  catalogPlant({ id: "snapdragon", name: "Snapdragon", category: "flower", description: "A cool-weather flower that tolerates light frost.", frostTolerant: true, daysToMaturity: 100, indoorStartWeeksBefore: 8, keyEvents: ["Pinch seedlings for branching"], morphology: { stemCount: 3, maxHeightPx: 190, leafShape: "lanceolate", flowerShape: "spike", flowerColor: "#d7798e" } }),
  catalogPlant({ id: "pansy", name: "Pansy", category: "flower", description: "A compact flower for cool spring, fall, and mild-winter gardens.", frostTolerant: true, daysToMaturity: 85, indoorStartWeeksBefore: 10, keyEvents: ["Remove faded blooms to maintain flowering"], morphology: { stemCount: "many", maxHeightPx: 80, leafArrangement: "basal-rosette", flowerColor: "#69569b" } }),
  catalogPlant({ id: "petunia", name: "Petunia", category: "flower", description: "A long-blooming annual for warm beds and containers.", daysToMaturity: 85, indoorStartWeeksBefore: 10, keyEvents: ["Trim leggy stems at midsummer"], morphology: { stemCount: "many", stemCurve: "arching", flowerColor: "#c85a91" } }),
  catalogPlant({ id: "geranium", name: "Zonal Geranium", category: "flower", description: "A heat-tolerant container favorite grown as an annual in cold climates.", daysToMaturity: 95, directSow: false, indoorStartWeeksBefore: 10, keyEvents: ["Allow soil surface to dry between waterings"], morphology: { stemCount: "many", leafShape: "lobed", flowerShape: "cluster", flowerColor: "#d94f55" } }),
  catalogPlant({ id: "aster", name: "New England Aster", category: "flower", description: "A cold-hardy native perennial providing late-season nectar.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 120, keyEvents: ["Pinch stems in early summer for compact growth"], morphology: { stemCount: "many", maxHeightPx: 220, leafShape: "lanceolate", flowerShape: "disc", flowerColor: "#7967aa" } }),
  catalogPlant({ id: "goldenrod", name: "Goldenrod", category: "flower", description: "A native perennial with late golden flowers for beneficial insects.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 120, keyEvents: ["Divide spreading clumps every few years"], morphology: { stemCount: "many", maxHeightPx: 220, leafShape: "lanceolate", flowerShape: "cluster", flowerColor: "#deb52e" } }),
  catalogPlant({ id: "milkweed", name: "Butterfly Milkweed", category: "flower", description: "A drought-tolerant native host plant for monarch butterflies.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 120, keyEvents: ["Expect slow establishment in the first year"], morphology: { stemCount: 3, leafShape: "lanceolate", flowerShape: "cluster", flowerColor: "#df7137" } }),
  catalogPlant({ id: "bee-balm", name: "Bee Balm", category: "flower", description: "A fragrant native perennial attracting bees, butterflies, and hummingbirds.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 110, keyEvents: ["Provide airflow to reduce powdery mildew"], morphology: { stemCount: "many", leafArrangement: "opposite", flowerShape: "cluster", flowerColor: "#be4162" } }),
  catalogPlant({ id: "yarrow", name: "Yarrow", category: "flower", description: "A durable native perennial for dry soils and beneficial insects.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 100, keyEvents: ["Cut back after bloom for a possible second flush"], morphology: { stemCount: "many", leafShape: "compound", flowerShape: "umbel", flowerColor: "#eee4b5" } }),
  catalogPlant({ id: "hollyhock", name: "Hollyhock", category: "flower", description: "A tall cottage-garden biennial adapted to cold-winter regions.", frostTolerant: true, lifecycle: "biennial", daysToMaturity: 150, keyEvents: ["Stake flowering stalks in windy sites"], morphology: { stemCount: 1, maxHeightPx: 260, leafShape: "lobed", leafSize: "large", flowerShape: "spike", flowerColor: "#c85d7d" } }),
  catalogPlant({ id: "coreopsis", name: "Coreopsis", category: "flower", description: "A sunny native perennial with a long, drought-tolerant bloom season.", frostTolerant: true, lifecycle: "perennial", daysToMaturity: 90, keyEvents: ["Shear after the first flush for rebloom"], morphology: { stemCount: "many", leafShape: "lanceolate", flowerShape: "disc", flowerColor: "#e5bc35" } }),
];

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
  {
    id: "lettuce", name: "Lettuce", category: "vegetable",
    soilTempMinGermination: 40, soilTempOptimalGermination: 60, daysToGerminationMin: 4, daysToGerminationMax: 10, daysToMaturity: 50,
    gddBase: 40, gddToFirstHarvest: 550, harvestWindowDays: 21, directSow: true, transplant: true, indoorStartWeeksBefore: 4, frostTolerant: true, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 30, flowering: 0, fruiting: 0, harvest: 21, decline: 10 },
    description: "A quick cool-season leafy crop for spring and fall.", keyEvents: ["Harvest outer leaves for repeated picking"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 90, leafShape: "lobed", leafSize: "large", leafArrangement: "basal-rosette", flowerShape: "none", fruitShape: "head", fruitColor: "#78a85a" },
  },
  {
    id: "pea", name: "Garden Pea", category: "vegetable",
    soilTempMinGermination: 40, soilTempOptimalGermination: 60, daysToGerminationMin: 7, daysToGerminationMax: 14, daysToMaturity: 60,
    gddBase: 40, gddToFirstHarvest: 750, harvestWindowDays: 28, directSow: true, transplant: false, indoorStartWeeksBefore: 0, frostTolerant: true, lifecycle: "annual",
    peakPhases: { seedling: 14, vegetative: 25, flowering: 14, fruiting: 18, harvest: 28, decline: 12 },
    description: "A climbing cool-season vegetable with edible pods.", keyEvents: ["Provide a trellis before vines begin climbing"],
    morphology: { ...defaultMorphology, stemCount: 3, stemCurve: "vining", maxHeightPx: 220, leafShape: "compound", leafSize: "small", flowerColor: "#f1edf2", fruitShape: "pod", fruitColor: "#65a34b" },
  },
  {
    id: "cucumber", name: "Cucumber", category: "vegetable",
    soilTempMinGermination: 60, soilTempOptimalGermination: 75, daysToGerminationMin: 3, daysToGerminationMax: 10, daysToMaturity: 55,
    gddBase: 50, gddToFirstHarvest: 900, harvestWindowDays: 40, directSow: true, transplant: true, indoorStartWeeksBefore: 3, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 22, flowering: 12, fruiting: 18, harvest: 40, decline: 14 },
    description: "A heat-loving vine producing crisp summer fruit.", keyEvents: ["Harvest frequently to keep vines productive"],
    morphology: { ...defaultMorphology, stemCount: 3, stemCurve: "vining", maxHeightPx: 200, leafShape: "lobed", leafSize: "large", flowerColor: "#f5cf42", fruitShape: "elongated", fruitColor: "#4d8d45" },
  },
  {
    id: "pepper", name: "Sweet Pepper", category: "vegetable",
    soilTempMinGermination: 65, soilTempOptimalGermination: 80, daysToGerminationMin: 7, daysToGerminationMax: 14, daysToMaturity: 75,
    gddBase: 50, gddToFirstHarvest: 1500, harvestWindowDays: 45, directSow: false, transplant: true, indoorStartWeeksBefore: 8, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 18, vegetative: 32, flowering: 16, fruiting: 28, harvest: 45, decline: 16 },
    description: "A tender warm-season crop that ripens from green to color.", keyEvents: ["Stake plants once fruit begins to weigh down branches"],
    morphology: { ...defaultMorphology, stemCount: 3, maxHeightPx: 170, leafShape: "lanceolate", leafArrangement: "opposite", flowerColor: "#f4f0dc", fruitShape: "elongated", fruitColor: "#d94f3d" },
  },
  {
    id: "zucchini", name: "Zucchini", category: "vegetable",
    soilTempMinGermination: 60, soilTempOptimalGermination: 75, daysToGerminationMin: 3, daysToGerminationMax: 10, daysToMaturity: 50,
    gddBase: 50, gddToFirstHarvest: 800, harvestWindowDays: 45, directSow: true, transplant: true, indoorStartWeeksBefore: 3, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 24, flowering: 10, fruiting: 14, harvest: 45, decline: 14 },
    description: "A vigorous summer squash with a generous harvest.", keyEvents: ["Pick fruit young for the best texture"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 130, leafShape: "lobed", leafSize: "large", leafArrangement: "basal-rosette", flowerColor: "#efb62c", fruitShape: "elongated", fruitColor: "#3f7845" },
  },
  {
    id: "radish", name: "Radish", category: "vegetable",
    soilTempMinGermination: 40, soilTempOptimalGermination: 60, daysToGerminationMin: 3, daysToGerminationMax: 7, daysToMaturity: 28,
    gddBase: 40, gddToFirstHarvest: 300, harvestWindowDays: 14, directSow: true, transplant: false, indoorStartWeeksBefore: 0, frostTolerant: true, lifecycle: "annual",
    peakPhases: { seedling: 8, vegetative: 16, flowering: 0, fruiting: 0, harvest: 14, decline: 7 },
    description: "A fast cool-season root crop for succession sowing.", keyEvents: ["Thin promptly so roots have room to swell"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 80, leafShape: "lobed", leafArrangement: "basal-rosette", flowerShape: "none", fruitShape: "root", fruitColor: "#c94256" },
  },
  {
    id: "parsley", name: "Parsley", category: "herb",
    soilTempMinGermination: 50, soilTempOptimalGermination: 70, daysToGerminationMin: 14, daysToGerminationMax: 28, daysToMaturity: 75,
    gddBase: 40, gddToFirstHarvest: 850, harvestWindowDays: 75, directSow: true, transplant: true, indoorStartWeeksBefore: 8, frostTolerant: true, lifecycle: "biennial",
    peakPhases: { seedling: 24, vegetative: 45, flowering: 0, fruiting: 0, harvest: 75, decline: 14 },
    description: "A cold-tolerant culinary herb with deeply divided leaves.", keyEvents: ["Harvest outer stems at soil level"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 110, leafShape: "compound", leafSize: "small", leafArrangement: "basal-rosette", flowerShape: "none", fruitShape: "none", leafColor: "#3f7d45" },
  },
  {
    id: "cilantro", name: "Cilantro", category: "herb",
    soilTempMinGermination: 45, soilTempOptimalGermination: 60, daysToGerminationMin: 7, daysToGerminationMax: 14, daysToMaturity: 45,
    gddBase: 40, gddToFirstHarvest: 500, harvestWindowDays: 28, directSow: true, transplant: false, indoorStartWeeksBefore: 0, frostTolerant: true, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 24, flowering: 12, fruiting: 0, harvest: 28, decline: 10 },
    description: "A cool-season herb grown for leaves and coriander seed.", keyEvents: ["Sow every few weeks for a steady leaf harvest"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 120, leafShape: "compound", leafSize: "small", flowerShape: "umbel", flowerColor: "#f5f1dc", fruitShape: "none" },
  },
  {
    id: "dill", name: "Dill", category: "herb",
    soilTempMinGermination: 50, soilTempOptimalGermination: 65, daysToGerminationMin: 7, daysToGerminationMax: 14, daysToMaturity: 55,
    gddBase: 40, gddToFirstHarvest: 650, harvestWindowDays: 35, directSow: true, transplant: false, indoorStartWeeksBefore: 0, frostTolerant: true, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 28, flowering: 18, fruiting: 0, harvest: 35, decline: 12 },
    description: "An airy culinary herb with aromatic foliage and umbels.", keyEvents: ["Let some flowers mature if seed is desired"],
    morphology: { ...defaultMorphology, stemCount: 3, maxHeightPx: 210, leafShape: "needle", leafSize: "small", flowerShape: "umbel", flowerColor: "#e9c94a", fruitShape: "none" },
  },
  {
    id: "mint", name: "Mint", category: "herb",
    soilTempMinGermination: 55, soilTempOptimalGermination: 70, daysToGerminationMin: 10, daysToGerminationMax: 16, daysToMaturity: 60,
    gddBase: 40, gddToFirstHarvest: 700, harvestWindowDays: 100, directSow: false, transplant: true, indoorStartWeeksBefore: 6, frostTolerant: true, lifecycle: "perennial",
    peakPhases: { seedling: 16, vegetative: 35, flowering: 16, fruiting: 0, harvest: 100, decline: 21 },
    description: "A spreading perennial herb best contained in a pot.", keyEvents: ["Cut stems regularly to encourage fresh growth"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 130, leafShape: "oval", leafArrangement: "opposite", flowerShape: "spike", flowerColor: "#b49ad6", fruitShape: "none" },
  },
  {
    id: "rosemary", name: "Rosemary", category: "herb",
    soilTempMinGermination: 60, soilTempOptimalGermination: 75, daysToGerminationMin: 14, daysToGerminationMax: 28, daysToMaturity: 90,
    gddBase: 50, gddToFirstHarvest: 1200, harvestWindowDays: 120, directSow: false, transplant: true, indoorStartWeeksBefore: 10, frostTolerant: false, lifecycle: "perennial",
    peakPhases: { seedling: 28, vegetative: 50, flowering: 20, fruiting: 0, harvest: 120, decline: 21 },
    description: "A woody Mediterranean herb with needle-like evergreen leaves.", keyEvents: ["Avoid wet soil and harvest no more than one third at once"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 190, leafShape: "needle", leafSize: "small", leafArrangement: "opposite", flowerShape: "cluster", flowerColor: "#8ba6d9", fruitShape: "none", leafColor: "#486b58" },
  },
  {
    id: "thyme", name: "Thyme", category: "herb",
    soilTempMinGermination: 55, soilTempOptimalGermination: 70, daysToGerminationMin: 14, daysToGerminationMax: 28, daysToMaturity: 75,
    gddBase: 40, gddToFirstHarvest: 850, harvestWindowDays: 100, directSow: false, transplant: true, indoorStartWeeksBefore: 8, frostTolerant: true, lifecycle: "perennial",
    peakPhases: { seedling: 24, vegetative: 42, flowering: 18, fruiting: 0, harvest: 100, decline: 18 },
    description: "A low perennial herb suited to dry, sunny garden edges.", keyEvents: ["Trim after flowering to keep plants compact"],
    morphology: { ...defaultMorphology, stemCount: "many", stemCurve: "arching", maxHeightPx: 80, leafShape: "oval", leafSize: "small", leafArrangement: "opposite", flowerShape: "cluster", flowerColor: "#c7a5cb", fruitShape: "none" },
  },
  {
    id: "marigold", name: "Marigold", category: "flower",
    soilTempMinGermination: 60, soilTempOptimalGermination: 75, daysToGerminationMin: 4, daysToGerminationMax: 7, daysToMaturity: 55,
    gddBase: 50, gddToFirstHarvest: 750, harvestWindowDays: 90, directSow: true, transplant: true, indoorStartWeeksBefore: 4, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 25, flowering: 90, fruiting: 0, harvest: 0, decline: 14 },
    description: "A reliable annual flower with warm gold and orange blooms.", keyEvents: ["Deadhead spent blooms to extend flowering"],
    morphology: { ...defaultMorphology, stemCount: 3, maxHeightPx: 130, leafShape: "compound", leafSize: "small", flowerShape: "cluster", flowerColor: "#ed9827", fruitShape: "none" },
  },
  {
    id: "sunflower", name: "Sunflower", category: "flower",
    soilTempMinGermination: 50, soilTempOptimalGermination: 70, daysToGerminationMin: 7, daysToGerminationMax: 10, daysToMaturity: 80,
    gddBase: 50, gddToFirstHarvest: 1300, harvestWindowDays: 30, directSow: true, transplant: false, indoorStartWeeksBefore: 0, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 14, vegetative: 40, flowering: 30, fruiting: 24, harvest: 30, decline: 18 },
    description: "A tall annual flower producing a broad pollinator-friendly disc.", keyEvents: ["Support tall varieties in exposed sites"],
    morphology: { ...defaultMorphology, maxHeightPx: 260, leafShape: "cordate", leafSize: "large", flowerShape: "disc", flowerColor: "#e5b82e", fruitShape: "head", fruitColor: "#59402d", stemColor: "#557349" },
  },
  {
    id: "zinnia", name: "Zinnia", category: "flower",
    soilTempMinGermination: 60, soilTempOptimalGermination: 75, daysToGerminationMin: 3, daysToGerminationMax: 7, daysToMaturity: 60,
    gddBase: 50, gddToFirstHarvest: 850, harvestWindowDays: 75, directSow: true, transplant: true, indoorStartWeeksBefore: 4, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 12, vegetative: 28, flowering: 75, fruiting: 0, harvest: 0, decline: 14 },
    description: "A bright cut flower that thrives in summer heat.", keyEvents: ["Cut above a leaf pair to encourage branching"],
    morphology: { ...defaultMorphology, stemCount: 3, maxHeightPx: 180, leafShape: "lanceolate", leafArrangement: "opposite", flowerShape: "disc", flowerColor: "#d94f78", fruitShape: "none" },
  },
  {
    id: "nasturtium", name: "Nasturtium", category: "flower",
    soilTempMinGermination: 55, soilTempOptimalGermination: 65, daysToGerminationMin: 7, daysToGerminationMax: 14, daysToMaturity: 55,
    gddBase: 50, gddToFirstHarvest: 700, harvestWindowDays: 75, directSow: true, transplant: false, indoorStartWeeksBefore: 0, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 14, vegetative: 24, flowering: 75, fruiting: 0, harvest: 40, decline: 14 },
    description: "An edible trailing flower with round leaves and peppery blooms.", keyEvents: ["Avoid rich fertilizer, which favors leaves over flowers"],
    morphology: { ...defaultMorphology, stemCount: "many", stemCurve: "vining", maxHeightPx: 130, leafShape: "cordate", leafSize: "large", flowerShape: "single", flowerColor: "#e66f35", fruitShape: "none" },
  },
  {
    id: "cosmos", name: "Cosmos", category: "flower",
    soilTempMinGermination: 55, soilTempOptimalGermination: 70, daysToGerminationMin: 7, daysToGerminationMax: 14, daysToMaturity: 65,
    gddBase: 50, gddToFirstHarvest: 950, harvestWindowDays: 80, directSow: true, transplant: true, indoorStartWeeksBefore: 4, frostTolerant: false, lifecycle: "annual",
    peakPhases: { seedling: 14, vegetative: 30, flowering: 80, fruiting: 0, harvest: 0, decline: 14 },
    description: "An airy annual flower that draws bees and butterflies.", keyEvents: ["Pinch young plants once for bushier growth"],
    morphology: { ...defaultMorphology, stemCount: 3, maxHeightPx: 220, leafShape: "compound", leafSize: "small", flowerShape: "single", flowerColor: "#e59ac0", fruitShape: "none" },
  },
  {
    id: "lavender", name: "Lavender", category: "flower",
    soilTempMinGermination: 55, soilTempOptimalGermination: 70, daysToGerminationMin: 14, daysToGerminationMax: 28, daysToMaturity: 100,
    gddBase: 50, gddToFirstHarvest: 1400, harvestWindowDays: 60, directSow: false, transplant: true, indoorStartWeeksBefore: 10, frostTolerant: true, lifecycle: "perennial",
    peakPhases: { seedling: 28, vegetative: 50, flowering: 60, fruiting: 0, harvest: 35, decline: 21 },
    description: "A fragrant perennial flower for dry soil and pollinators.", keyEvents: ["Shear lightly after bloom without cutting into old wood"],
    morphology: { ...defaultMorphology, stemCount: "many", maxHeightPx: 160, leafShape: "lanceolate", leafSize: "small", leafArrangement: "opposite", flowerShape: "spike", flowerColor: "#8f75b8", fruitShape: "none", leafColor: "#6d806d" },
  },
  ...expandedCatalog,
];
