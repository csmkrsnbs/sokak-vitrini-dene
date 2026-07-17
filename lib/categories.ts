import type { PreviewCategory } from "@/lib/types";

type CategoryConfig = {
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  productLabel: string;
  productHint: string;
  targetLabel: string;
  targetHint: string;
  notePlaceholder: string;
  outputSize: "1024x1536" | "1536x1024";
};

export const CATEGORY_CONFIG: Record<PreviewCategory, CategoryConfig> = {
  jewelry: {
    label: "Takı",
    shortLabel: "Takı",
    title: "Takıyı üzerinde gör",
    description: "Vitrindeki kolye, bilezik, küpe veya saati doğal ölçü ve ışıkla dene.",
    productLabel: "Takının fotoğrafı",
    productHint: "Ürünü mümkün olduğunca yakından ve net çek.",
    targetLabel: "Senin veya arkadaşının fotoğrafı",
    targetHint: "Boyun, bilek ya da ilgili bölge görünür olsun.",
    notePlaceholder: "Örn. Kolyeyi boynuma doğal ölçüde yerleştir",
    outputSize: "1024x1536",
  },
  clothing: {
    label: "Giyim",
    shortLabel: "Giyim",
    title: "Kıyafeti üzerinde gör",
    description: "Vitrinde beğendiğin gömlek, ceket veya elbiseyi fotoğrafında dene.",
    productLabel: "Kıyafetin fotoğrafı",
    productHint: "Ürünün tamamı ve kesimi görünür olsun.",
    targetLabel: "Senin veya arkadaşının fotoğrafı",
    targetHint: "Önden çekilmiş, vücudu net gösteren bir fotoğraf seç.",
    notePlaceholder: "Örn. Gömleği üzerime normal kesim olarak giydir",
    outputSize: "1024x1536",
  },
  furniture: {
    label: "Mobilya",
    shortLabel: "Mobilya",
    title: "Mobilyayı evinde gör",
    description: "Koltuğu, masayı veya dekorasyon ürününü odandaki gerçek yerine yerleştir.",
    productLabel: "Mobilyanın fotoğrafı",
    productHint: "Ürünü önden veya hafif çapraz açıyla çek.",
    targetLabel: "Odanın fotoğrafı",
    targetHint: "Yerleştirmek istediğin boş alan kadrajda görünsün.",
    notePlaceholder: "Örn. Koltuğu pencerenin karşısındaki boş duvara yerleştir",
    outputSize: "1536x1024",
  },
  car: {
    label: "Otomobil",
    shortLabel: "Otomobil",
    title: "Aracı kendi mekânında gör",
    description: "Beğendiğin otomobili evinin önünde, garajında veya seçtiğin sokakta gör.",
    productLabel: "Otomobilin fotoğrafı",
    productHint: "Aracın tamamını gösteren temiz bir açı seç.",
    targetLabel: "Mekânın fotoğrafı",
    targetHint: "Aracın duracağı alan geniş ve net görünsün.",
    notePlaceholder: "Örn. Aracı garaj kapısının önüne aynı açıyla yerleştir",
    outputSize: "1536x1024",
  },
};

export function isPreviewCategory(value: unknown): value is PreviewCategory {
  return typeof value === "string" && value in CATEGORY_CONFIG;
}
