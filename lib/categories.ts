import type {
  ClothingType,
  GarmentPhotoType,
  PreviewCategory,
} from "@/lib/types";

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
  noteSuggestions: readonly string[];
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
    noteSuggestions: [
      "Kolyeyi boynuma doğal ölçüsünde, mevcut açı ve ışığı değiştirmeden yerleştir.",
      "Bileziği görünen bileğime gerçek ürün ölçüsünde tak.",
      "Küpeleri iki kulağıma simetrik ve doğal biçimde yerleştir.",
    ],
    outputSize: "1024x1536",
  },
  clothing: {
    label: "Giyim",
    shortLabel: "Giyim",
    title: "Kıyafeti üzerinde gör",
    description:
      "Gömlek, ceket, elbise, iç çamaşırı veya fantezi kostümü yetişkin fotoğrafında dene.",
    productLabel: "Kıyafetin fotoğrafı",
    productHint:
      "Ürünü başka biri üzerinde değil; sade fonda, askıda veya düz serilmiş ve tamamı görünür biçimde çek.",
    targetLabel: "Senin veya arkadaşının fotoğrafı",
    targetHint: "Önden çekilmiş, vücudu net gösteren bir fotoğraf seç.",
    notePlaceholder: "Örn. Gömleği üzerime normal kesim olarak giydir",
    noteSuggestions: [
      "Gömleği üzerime normal kalıpta, mevcut pozumu koruyarak giydir.",
      "Ceketi üzerime doğal oturacak şekilde açık kullan.",
      "Elbiseyi vücut oranlarımı ve duruşumu değiştirmeden giydir.",
    ],
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
    noteSuggestions: [
      "Koltuğu boş duvarın önüne, zemine tam basacak şekilde yerleştir.",
      "Masayı odanın ortasındaki boş alana perspektife uygun yerleştir.",
      "Ürünü pencerenin karşısındaki boş alana gerçek ölçüsünde yerleştir.",
    ],
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
    noteSuggestions: [
      "Aracı garaj kapısının önüne, zemine ve kamera açısına uygun yerleştir.",
      "Aracı yol kenarındaki boş alana gerçek ölçüsünde park et.",
      "Aracı evin önüne, yönünü değiştirmeden doğal gölgeyle yerleştir.",
    ],
    outputSize: "1536x1024",
  },
};

type ClothingTypeConfig = {
  label: string;
  shortLabel: string;
  description: string;
  productHint: string;
  targetHint: string;
};

export const CLOTHING_TYPE_CONFIG: Record<ClothingType, ClothingTypeConfig> = {
  tops: {
    label: "Üst giyim",
    shortLabel: "Gömlek · Ceket · Sütyen",
    description:
      "Gömlek, tişört, bluz, ceket, sütyen veya korseyi üst gövdeye uygular.",
    productHint: "Üst ürünün tamamı, askıları ve kolları görünür olsun.",
    targetHint:
      "Yalnızca 18 yaşından büyük, önden çekilmiş ve üst gövdesi net görünen bir fotoğraf seç.",
  },
  bottoms: {
    label: "Alt giyim",
    shortLabel: "Pantolon · Etek · Alt iç giyim",
    description:
      "Pantolon, etek, şort veya alt iç giyim ürününü bel ve bacak bölgesine uygular.",
    productHint: "Alt ürünün tamamı ve bel kesimi görünür olsun.",
    targetHint:
      "Yalnızca 18 yaşından büyük, belden ayaklara kadar görünen önden çekilmiş bir fotoğraf seç.",
  },
  "one-pieces": {
    label: "Tek parça",
    shortLabel: "Elbise · Tulum · Body",
    description:
      "Elbise, tulum, body veya tek parça kostümü tam vücut kıyafeti olarak uygular.",
    productHint: "Tek parça ürünün omuzdan etek ucuna kadar tamamı görünsün.",
    targetHint:
      "Yalnızca 18 yaşından büyük, baştan ayağa görünen ve önden çekilmiş bir fotoğraf seç.",
  },
};

type GarmentPhotoTypeConfig = {
  label: string;
  description: string;
};

export const GARMENT_PHOTO_TYPE_CONFIG: Record<
  GarmentPhotoType,
  GarmentPhotoTypeConfig
> = {
  "flat-lay": {
    label: "Tek başına / askıda",
    description:
      "Ürün sade fonda, askıda veya düz serilmiş halde ve tamamı görünür olmalı.",
  },
};

export function isPreviewCategory(value: unknown): value is PreviewCategory {
  return typeof value === "string" && value in CATEGORY_CONFIG;
}

export function isClothingType(value: unknown): value is ClothingType {
  return typeof value === "string" && value in CLOTHING_TYPE_CONFIG;
}

export function isGarmentPhotoType(value: unknown): value is GarmentPhotoType {
  return typeof value === "string" && value in GARMENT_PHOTO_TYPE_CONFIG;
}
