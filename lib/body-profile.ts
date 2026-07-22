export type BodyPresentation = "feminine" | "masculine" | "neutral";

export type BodyProfile = {
  id: string;
  name: string;
  presentation: BodyPresentation;
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  neck: number;
  arm: number;
  thigh: number;
  inseam: number;
  footLength: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategory =
  | "top"
  | "outerwear"
  | "bottom"
  | "skirt"
  | "dress"
  | "shoes"
  | "necklace"
  | "bag";

export type FitStyle = "slim" | "regular" | "relaxed" | "oversize";
export type StretchLevel = "none" | "low" | "medium" | "high";

export type ProductMeasurements = {
  shoulder?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  length?: number;
  sleeve?: number;
  inseam?: number;
  footLength?: number;
};

export type ProductSize = {
  label: string;
  measurements: ProductMeasurements;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  color: string;
  accent: string;
  fitStyle: FitStyle;
  stretch: StretchLevel;
  imageDataUrl?: string;
  sizes: ProductSize[];
  isCustom?: boolean;
};

export type FitZoneKey =
  | "shoulder"
  | "chest"
  | "waist"
  | "hip"
  | "arm"
  | "inseam"
  | "footLength";

export type FitZone = {
  key: FitZoneKey;
  label: string;
  body: number;
  product: number;
  difference: number;
  status: "tight" | "good" | "relaxed" | "loose";
  text: string;
};

export type FitResult = {
  productId: string;
  recommendedSize: string;
  score: number;
  label: string;
  summary: string;
  zones: FitZone[];
  isSized: boolean;
};

export const PROFILE_STORAGE_KEY = "sv-body-profile-v1";
export const CUSTOM_PRODUCTS_STORAGE_KEY = "sv-custom-products-v1";

export const categoryLabels: Record<ProductCategory, string> = {
  top: "Üst giyim",
  outerwear: "Dış giyim",
  bottom: "Pantolon",
  skirt: "Etek",
  dress: "Elbise",
  shoes: "Ayakkabı",
  necklace: "Takı",
  bag: "Çanta",
};

export const fitStyleLabels: Record<FitStyle, string> = {
  slim: "Dar kalıp",
  regular: "Normal kalıp",
  relaxed: "Rahat kalıp",
  oversize: "Oversize",
};

export const stretchLabels: Record<StretchLevel, string> = {
  none: "Esnemez",
  low: "Az esnek",
  medium: "Esnek",
  high: "Çok esnek",
};

export const measurementLabels: Record<keyof ProductMeasurements, string> = {
  shoulder: "Omuz",
  chest: "Göğüs çevresi",
  waist: "Bel çevresi",
  hip: "Basen çevresi",
  length: "Ürün boyu",
  sleeve: "Kol boyu",
  inseam: "İç bacak",
  footLength: "Ayak uzunluğu",
};

export const categoryMeasurementFields: Record<ProductCategory, Array<keyof ProductMeasurements>> = {
  top: ["shoulder", "chest", "waist", "length", "sleeve"],
  outerwear: ["shoulder", "chest", "waist", "hip", "length", "sleeve"],
  bottom: ["waist", "hip", "inseam", "length"],
  skirt: ["waist", "hip", "length"],
  dress: ["shoulder", "chest", "waist", "hip", "length", "sleeve"],
  shoes: ["footLength"],
  necklace: [],
  bag: [],
};

const sampleProducts: Product[] = [
  {
    id: "sv-poplin-shirt",
    name: "İnci Poplin Gömlek",
    brand: "SV Selection",
    category: "top",
    color: "#e9e3d8",
    accent: "#b3996f",
    fitStyle: "regular",
    stretch: "low",
    sizes: [
      { label: "S", measurements: { shoulder: 39, chest: 94, waist: 90, length: 66, sleeve: 59 } },
      { label: "M", measurements: { shoulder: 41, chest: 100, waist: 96, length: 68, sleeve: 60 } },
      { label: "L", measurements: { shoulder: 43, chest: 106, waist: 102, length: 70, sleeve: 61 } },
      { label: "XL", measurements: { shoulder: 45, chest: 114, waist: 110, length: 72, sleeve: 62 } },
    ],
  },
  {
    id: "sv-linen-blazer",
    name: "Kum Keten Blazer",
    brand: "SV Atelier",
    category: "outerwear",
    color: "#b89f7e",
    accent: "#6d5943",
    fitStyle: "relaxed",
    stretch: "none",
    sizes: [
      { label: "S", measurements: { shoulder: 41, chest: 100, waist: 98, hip: 104, length: 70, sleeve: 59 } },
      { label: "M", measurements: { shoulder: 43, chest: 106, waist: 104, hip: 110, length: 72, sleeve: 60 } },
      { label: "L", measurements: { shoulder: 45, chest: 112, waist: 110, hip: 116, length: 74, sleeve: 61 } },
      { label: "XL", measurements: { shoulder: 47, chest: 120, waist: 118, hip: 124, length: 76, sleeve: 62 } },
    ],
  },
  {
    id: "sv-wide-pants",
    name: "Gece Geniş Paça Pantolon",
    brand: "SV Studio",
    category: "bottom",
    color: "#252b33",
    accent: "#707988",
    fitStyle: "relaxed",
    stretch: "medium",
    sizes: [
      { label: "36", measurements: { waist: 70, hip: 98, inseam: 77, length: 105 } },
      { label: "38", measurements: { waist: 74, hip: 102, inseam: 78, length: 106 } },
      { label: "40", measurements: { waist: 78, hip: 106, inseam: 79, length: 107 } },
      { label: "42", measurements: { waist: 84, hip: 112, inseam: 79, length: 108 } },
      { label: "44", measurements: { waist: 90, hip: 118, inseam: 79, length: 109 } },
    ],
  },
  {
    id: "sv-denim-skirt",
    name: "Koyu Denim Midi Etek",
    brand: "SV Denim",
    category: "skirt",
    color: "#35465b",
    accent: "#8493a6",
    fitStyle: "regular",
    stretch: "low",
    sizes: [
      { label: "36", measurements: { waist: 70, hip: 94, length: 78 } },
      { label: "38", measurements: { waist: 74, hip: 98, length: 79 } },
      { label: "40", measurements: { waist: 78, hip: 102, length: 80 } },
      { label: "42", measurements: { waist: 84, hip: 108, length: 81 } },
      { label: "44", measurements: { waist: 90, hip: 114, length: 82 } },
    ],
  },
  {
    id: "sv-satin-dress",
    name: "Bordo Saten Elbise",
    brand: "SV Occasion",
    category: "dress",
    color: "#7d2637",
    accent: "#c47d88",
    fitStyle: "slim",
    stretch: "medium",
    sizes: [
      { label: "S", measurements: { shoulder: 37, chest: 88, waist: 70, hip: 94, length: 128 } },
      { label: "M", measurements: { shoulder: 39, chest: 94, waist: 76, hip: 100, length: 130 } },
      { label: "L", measurements: { shoulder: 41, chest: 100, waist: 82, hip: 106, length: 132 } },
      { label: "XL", measurements: { shoulder: 43, chest: 108, waist: 90, hip: 114, length: 134 } },
    ],
  },
  {
    id: "sv-chain-necklace",
    name: "İnce Zincir Kolye",
    brand: "SV Jewelry",
    category: "necklace",
    color: "#c9a95f",
    accent: "#f0d99b",
    fitStyle: "regular",
    stretch: "none",
    sizes: [{ label: "Tek beden", measurements: {} }],
  },
  {
    id: "sv-tote-bag",
    name: "Taba Omuz Çantası",
    brand: "SV Accessories",
    category: "bag",
    color: "#986a45",
    accent: "#d0a27c",
    fitStyle: "regular",
    stretch: "none",
    sizes: [{ label: "Tek beden", measurements: {} }],
  },
  {
    id: "sv-sneaker",
    name: "Krem Günlük Sneaker",
    brand: "SV Steps",
    category: "shoes",
    color: "#eee8db",
    accent: "#9e9483",
    fitStyle: "regular",
    stretch: "low",
    sizes: [
      { label: "36", measurements: { footLength: 23 } },
      { label: "37", measurements: { footLength: 23.7 } },
      { label: "38", measurements: { footLength: 24.3 } },
      { label: "39", measurements: { footLength: 25 } },
      { label: "40", measurements: { footLength: 25.7 } },
      { label: "41", measurements: { footLength: 26.3 } },
      { label: "42", measurements: { footLength: 27 } },
      { label: "43", measurements: { footLength: 27.7 } },
    ],
  },
];

export function getSampleProducts() {
  return sampleProducts.map((product) => ({
    ...product,
    sizes: product.sizes.map((size) => ({ ...size, measurements: { ...size.measurements } })),
  }));
}

export function slotForCategory(category: ProductCategory) {
  if (category === "dress") return "body";
  if (category === "top") return "top";
  if (category === "outerwear") return "outerwear";
  if (category === "bottom" || category === "skirt") return "bottom";
  return category;
}

function profileValue(profile: BodyProfile, key: FitZoneKey) {
  return profile[key];
}

function relevantZones(category: ProductCategory): FitZoneKey[] {
  if (category === "top") return ["shoulder", "chest", "waist", "arm"];
  if (category === "outerwear") return ["shoulder", "chest", "waist", "hip", "arm"];
  if (category === "bottom") return ["waist", "hip", "inseam"];
  if (category === "skirt") return ["waist", "hip"];
  if (category === "dress") return ["shoulder", "chest", "waist", "hip", "arm"];
  if (category === "shoes") return ["footLength"];
  return [];
}

const zoneToMeasurement: Record<FitZoneKey, keyof ProductMeasurements> = {
  shoulder: "shoulder",
  chest: "chest",
  waist: "waist",
  hip: "hip",
  arm: "sleeve",
  inseam: "inseam",
  footLength: "footLength",
};

const zoneLabels: Record<FitZoneKey, string> = {
  shoulder: "Omuz",
  chest: "Göğüs",
  waist: "Bel",
  hip: "Basen",
  arm: "Kol boyu",
  inseam: "İç bacak",
  footLength: "Ayak",
};

function styleEase(style: FitStyle) {
  if (style === "slim") return 0.55;
  if (style === "relaxed") return 1.45;
  if (style === "oversize") return 2.2;
  return 1;
}

function stretchRelief(stretch: StretchLevel) {
  if (stretch === "high") return 5;
  if (stretch === "medium") return 3;
  if (stretch === "low") return 1.2;
  return 0;
}

function idealEaseFor(zone: FitZoneKey, product: Product) {
  if (zone === "footLength") return 0.7;
  if (zone === "arm" || zone === "inseam") return 0.8;
  if (zone === "shoulder") return 0.7 * styleEase(product.fitStyle);
  if (zone === "chest") return 5 * styleEase(product.fitStyle);
  if (zone === "waist") {
    if (product.category === "bottom" || product.category === "skirt") return 2 * styleEase(product.fitStyle);
    return 4 * styleEase(product.fitStyle);
  }
  if (zone === "hip") return 5 * styleEase(product.fitStyle);
  return 0;
}

function toleranceFor(zone: FitZoneKey) {
  if (zone === "footLength") return 0.55;
  if (zone === "shoulder") return 1.8;
  if (zone === "arm" || zone === "inseam") return 2.5;
  return 4;
}

function evaluateSize(profile: BodyProfile, product: Product, size: ProductSize) {
  const zones: FitZone[] = [];
  let total = 0;
  let count = 0;
  let hardPenalty = 0;

  for (const key of relevantZones(product.category)) {
    const measurementKey = zoneToMeasurement[key];
    const productValue = size.measurements[measurementKey];
    if (typeof productValue !== "number") continue;

    const body = profileValue(profile, key);
    const difference = productValue - body;
    const ideal = idealEaseFor(key, product);
    const tolerance = toleranceFor(key);
    const relief = key === "chest" || key === "waist" || key === "hip" ? stretchRelief(product.stretch) : 0;
    const minimum = key === "arm" || key === "inseam" ? -2.5 : ideal - tolerance - relief;
    const distance = Math.abs(difference - ideal);
    let score = Math.max(0, 100 - (distance / Math.max(tolerance, 0.5)) * 22);

    let status: FitZone["status"] = "good";
    let text = "Ölçü dengeli görünüyor.";

    if (difference < minimum) {
      status = "tight";
      text = `${Math.abs(difference).toFixed(1)} cm daha dar/kısa.`;
      hardPenalty += 24 + Math.min(24, Math.abs(difference - minimum) * 4);
      score = Math.min(score, 42);
    } else if (difference > ideal + tolerance * 2.2) {
      status = "loose";
      text = `${difference.toFixed(1)} cm bolluk bırakıyor.`;
      score = Math.min(score, 62);
    } else if (difference > ideal + tolerance) {
      status = "relaxed";
      text = "Rahat ve hafif bol durur.";
      score = Math.min(score, 82);
    } else {
      text = difference >= 0 ? "Önerilen rahatlık payında." : "Esneme payıyla uyumlu.";
    }

    total += score;
    count += 1;
    zones.push({
      key,
      label: zoneLabels[key],
      body,
      product: productValue,
      difference,
      status,
      text,
    });
  }

  if (!count) return { score: 100, zones: [] as FitZone[] };
  return { score: Math.max(0, Math.round(total / count - hardPenalty)), zones };
}

export function calculateFit(profile: BodyProfile, product: Product): FitResult {
  if (product.category === "necklace" || product.category === "bag") {
    return {
      productId: product.id,
      recommendedSize: product.sizes[0]?.label || "Tek beden",
      score: 100,
      label: "Tek beden",
      summary: "Bu ürün ölçü tabanlı beden seçimi gerektirmiyor.",
      zones: [],
      isSized: false,
    };
  }

  const evaluated = product.sizes.map((size) => ({ size, ...evaluateSize(profile, product, size) }));
  evaluated.sort((a, b) => b.score - a.score);
  const best = evaluated[0];

  if (!best) {
    return {
      productId: product.id,
      recommendedSize: "—",
      score: 0,
      label: "Ölçü eksik",
      summary: "Bu ürün için beden ölçüsü girilmemiş.",
      zones: [],
      isSized: true,
    };
  }

  const tightZones = best.zones.filter((zone) => zone.status === "tight");
  const looseZones = best.zones.filter((zone) => zone.status === "loose");
  const score = best.score;
  const label = score >= 86 ? "Çok iyi uyum" : score >= 72 ? "Uygun" : score >= 56 ? "Yaklaşık uyum" : "Uyumsuz";
  const summary = tightZones.length
    ? `${tightZones.map((zone) => zone.label).join(", ")} bölgesinde sıkılık riski var.`
    : looseZones.length
      ? `${looseZones.map((zone) => zone.label).join(", ")} bölgesinde belirgin bolluk olabilir.`
      : "Vücut ölçüleri ve ürün kalıbı dengeli eşleşiyor.";

  return {
    productId: product.id,
    recommendedSize: best.size.label,
    score,
    label,
    summary,
    zones: best.zones,
    isSized: true,
  };
}

export function bodyMassIndex(profile: Pick<BodyProfile, "height" | "weight">) {
  const meters = profile.height / 100;
  return Math.round((profile.weight / (meters * meters)) * 10) / 10;
}

export function defaultProfile(): BodyProfile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "",
    presentation: "neutral",
    height: 170,
    weight: 68,
    shoulder: 41,
    chest: 94,
    waist: 78,
    hip: 100,
    neck: 36,
    arm: 60,
    thigh: 56,
    inseam: 78,
    footLength: 24.5,
    createdAt: now,
    updatedAt: now,
  };
}
