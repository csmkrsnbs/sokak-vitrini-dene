import type {
  ClothingType,
  GarmentPhotoType,
  PreviewCategory,
  PreviewMode,
  ProductKind,
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
};

export const CATEGORY_CONFIG: Record<PreviewCategory, CategoryConfig> = {
  clothing: {
    label: "Giyim",
    shortLabel: "Giyim",
    title: "Kıyafeti kendinde dene",
    description:
      "Günlük giyimden bikini, mayo, iç giyim ve yetişkin fantezi giyime kadar ürünü kendi fotoğrafında gör.",
    productLabel: "Ürünün fotoğrafı",
    productHint: "Ürünün tamamı net görünsün; sade fon veya model üzerindeki ürün kullanılabilir.",
    targetLabel: "Dijital profil veya kişi fotoğrafı",
    targetHint: "18 yaşından büyük kişiyi önden ve ürüne uygun kadrajda göster.",
    notePlaceholder: "Örn. Ceketi açık kullan, gömleği pantolonun içine sok",
    noteSuggestions: [
      "Mevcut pozu ve vücut oranlarını koru.",
      "Ürünü doğal kalıpta ve gerçekçi kumaş kıvrımlarıyla uygula.",
      "Yüzü, saçı ve arka planı değiştirme.",
    ],
  },
  jewelry: {
    label: "Takı & Saat",
    shortLabel: "Takı",
    title: "Takıyı kendinde gör",
    description: "Kolye, küpe, bileklik ve saati doğru ölçü ve ışıkla dene.",
    productLabel: "Takı veya saatin fotoğrafı",
    productHint: "Ürünü yakın, net ve mümkünse sade fonda çek.",
    targetLabel: "Dijital profil veya kişi fotoğrafı",
    targetHint: "Boyun, kulak, bilek veya ilgili bölge net görünsün.",
    notePlaceholder: "Örn. Kolyeyi doğal ölçüde boynuma yerleştir",
    noteSuggestions: [
      "Ürünün taş, metal ve renk ayrıntılarını koru.",
      "Takıyı doğal ölçüsünde ve doğru temas gölgesiyle yerleştir.",
      "Yüzü ve cilt dokusunu değiştirme.",
    ],
  },
  shoes: {
    label: "Ayakkabı",
    shortLabel: "Ayakkabı",
    title: "Ayakkabıyı kombininde gör",
    description: "Ayakkabı veya botu mevcut duruşuna ve kıyafetine uygula.",
    productLabel: "Ayakkabının fotoğrafı",
    productHint: "Çifti veya tek ürünü yan profiliyle net göster.",
    targetLabel: "Dijital profil veya kişi fotoğrafı",
    targetHint: "Ayaklar ve zemin kadrajda görünür olsun.",
    notePlaceholder: "Örn. Ayakkabıyı mevcut kombinime doğal biçimde uygula",
    noteSuggestions: [
      "Ayak pozunu ve zemini koru.",
      "Taban temasını ve gölgeyi gerçekçi yap.",
      "Ürünün renk ve materyalini değiştirme.",
    ],
  },
  bag: {
    label: "Çanta",
    shortLabel: "Çanta",
    title: "Çantayı üzerinde gör",
    description: "Omuz, el veya bel çantasını mevcut pozuna doğal biçimde ekle.",
    productLabel: "Çantanın fotoğrafı",
    productHint: "Sapları ve ürün formunu eksiksiz göster.",
    targetLabel: "Dijital profil veya kişi fotoğrafı",
    targetHint: "Üst gövde ve kollar görünür olsun.",
    notePlaceholder: "Örn. Çantayı sağ omzuma doğal biçimde tak",
    noteSuggestions: [
      "Çantayı vücut ölçüsüne uygun ölçekle.",
      "Sap temasını ve kumaş üstündeki gölgeyi koru.",
      "Mevcut pozu ve arka planı değiştirme.",
    ],
  },
  accessory: {
    label: "Gözlük & Şapka",
    shortLabel: "Aksesuar",
    title: "Aksesuarı kendinde gör",
    description: "Gözlük, şapka ve diğer giyilebilir aksesuarları dene.",
    productLabel: "Aksesuarın fotoğrafı",
    productHint: "Ürünü önden veya hafif çapraz açıyla net göster.",
    targetLabel: "Dijital profil veya kişi fotoğrafı",
    targetHint: "Yüz ve baş bölgesi net, ışık dengeli olsun.",
    notePlaceholder: "Örn. Gözlüğü yüz açıma uygun biçimde yerleştir",
    noteSuggestions: [
      "Yüz hatlarını ve kimliği koru.",
      "Ürünü doğru perspektif ve doğal temasla uygula.",
      "Cam yansımasını mevcut ışığa uyarla.",
    ],
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
    description: "Tişört, gömlek, bluz, ceket, sütyen ve korse için.",
    productHint: "Üst ürünün tamamı, askıları ve kolları görünür olsun.",
    targetHint: "18+ kişinin üst gövdesi önden ve net görünsün.",
  },
  bottoms: {
    label: "Alt giyim",
    shortLabel: "Pantolon · Etek · Alt iç giyim",
    description: "Pantolon, etek, şort ve alt iç giyim için.",
    productHint: "Bel kesimi ve ürünün tamamı görünür olsun.",
    targetHint: "18+ kişinin belden ayaklara kadar olan bölgesi net görünsün.",
  },
  "one-pieces": {
    label: "Tek parça",
    shortLabel: "Elbise · Mayo · Body",
    description: "Elbise, tulum, mayo, bikini seti, body ve yetişkin kostümü için.",
    productHint: "Ürünün omuzdan alt uca kadar tamamı görünür olsun.",
    targetHint: "18+ kişi baştan ayağa, önden ve net görünsün.",
  },
};

type GarmentPhotoTypeConfig = {
  label: string;
  description: string;
};

export const GARMENT_PHOTO_TYPE_CONFIG: Record<GarmentPhotoType, GarmentPhotoTypeConfig> = {
  auto: {
    label: "Otomatik",
    description: "Sistem ürün fotoğrafı türünü otomatik algılar.",
  },
  "flat-lay": {
    label: "Tek başına / askıda",
    description: "Ürün sade fonda, askıda veya düz serilmiş halde.",
  },
  model: {
    label: "Model üzerinde",
    description: "Ürün başka bir yetişkin model üzerinde çekilmiş halde.",
  },
};

type ProductKindConfig = {
  label: string;
  category: PreviewCategory;
  clothingType: ClothingType;
  studioPrompt: string;
};

export const PRODUCT_KIND_CONFIG: Record<ProductKind, ProductKindConfig> = {
  tshirt: { label: "Tişört", category: "clothing", clothingType: "tops", studioPrompt: "premium t-shirt e-commerce fashion photo" },
  shirt: { label: "Gömlek", category: "clothing", clothingType: "tops", studioPrompt: "premium shirt e-commerce fashion photo" },
  blouse: { label: "Bluz", category: "clothing", clothingType: "tops", studioPrompt: "premium blouse e-commerce fashion photo" },
  jacket: { label: "Ceket", category: "clothing", clothingType: "tops", studioPrompt: "premium jacket e-commerce fashion photo" },
  dress: { label: "Elbise", category: "clothing", clothingType: "one-pieces", studioPrompt: "premium dress e-commerce fashion photo" },
  pants: { label: "Pantolon", category: "clothing", clothingType: "bottoms", studioPrompt: "premium trousers e-commerce fashion photo" },
  skirt: { label: "Etek", category: "clothing", clothingType: "bottoms", studioPrompt: "premium skirt e-commerce fashion photo" },
  bikini: { label: "Bikini", category: "clothing", clothingType: "one-pieces", studioPrompt: "tasteful adult swimwear e-commerce photo, non-explicit" },
  swimsuit: { label: "Mayo", category: "clothing", clothingType: "one-pieces", studioPrompt: "tasteful adult swimsuit e-commerce photo, non-explicit" },
  bra: { label: "Sütyen", category: "clothing", clothingType: "tops", studioPrompt: "tasteful adult lingerie e-commerce photo, non-explicit" },
  underwear: { label: "İç giyim", category: "clothing", clothingType: "bottoms", studioPrompt: "tasteful adult underwear e-commerce photo, non-explicit" },
  corset: { label: "Korse", category: "clothing", clothingType: "tops", studioPrompt: "tasteful adult corset fashion photo, non-explicit" },
  bodysuit: { label: "Body", category: "clothing", clothingType: "one-pieces", studioPrompt: "tasteful adult bodysuit fashion photo, non-explicit" },
  fantasy: { label: "Fantezi giyim", category: "clothing", clothingType: "one-pieces", studioPrompt: "tasteful adult costume fashion photo, fully covered, non-explicit" },
  necklace: { label: "Kolye", category: "jewelry", clothingType: "tops", studioPrompt: "premium necklace jewelry campaign photo" },
  earrings: { label: "Küpe", category: "jewelry", clothingType: "tops", studioPrompt: "premium earrings jewelry campaign photo" },
  bracelet: { label: "Bileklik", category: "jewelry", clothingType: "tops", studioPrompt: "premium bracelet jewelry campaign photo" },
  watch: { label: "Saat", category: "jewelry", clothingType: "tops", studioPrompt: "premium wristwatch fashion campaign photo" },
  shoes: { label: "Ayakkabı", category: "shoes", clothingType: "bottoms", studioPrompt: "premium shoes e-commerce fashion photo" },
  bag: { label: "Çanta", category: "bag", clothingType: "tops", studioPrompt: "premium handbag e-commerce fashion photo" },
  glasses: { label: "Gözlük", category: "accessory", clothingType: "tops", studioPrompt: "premium eyewear campaign photo" },
  hat: { label: "Şapka", category: "accessory", clothingType: "tops", studioPrompt: "premium hat fashion campaign photo" },
  accessory: { label: "Diğer aksesuar", category: "accessory", clothingType: "tops", studioPrompt: "premium wearable accessory campaign photo" },
};

export const PRODUCT_KINDS_BY_CATEGORY = Object.fromEntries(
  (Object.keys(CATEGORY_CONFIG) as PreviewCategory[]).map((category) => [
    category,
    (Object.keys(PRODUCT_KIND_CONFIG) as ProductKind[]).filter(
      (kind) => PRODUCT_KIND_CONFIG[kind].category === category,
    ),
  ]),
) as Record<PreviewCategory, ProductKind[]>;

export const PREVIEW_MODE_CONFIG: Record<PreviewMode, { label: string; title: string; description: string }> = {
  personal: {
    label: "Kendimde dene",
    title: "Dijital profilinde dene",
    description: "Fotoğrafını bir kez kaydet; farklı ürünleri tekrar yüklemeden kendinde gör.",
  },
  studio: {
    label: "İşletme stüdyosu",
    title: "Üründen model görseli üret",
    description: "Yalnız ürün fotoğrafıyla katalog ve sosyal medya için model görseli oluştur.",
  },
};

export function isPreviewCategory(value: unknown): value is PreviewCategory {
  return typeof value === "string" && value in CATEGORY_CONFIG;
}

export function isPreviewMode(value: unknown): value is PreviewMode {
  return value === "personal" || value === "studio";
}

export function isClothingType(value: unknown): value is ClothingType {
  return typeof value === "string" && value in CLOTHING_TYPE_CONFIG;
}

export function isGarmentPhotoType(value: unknown): value is GarmentPhotoType {
  return typeof value === "string" && value in GARMENT_PHOTO_TYPE_CONFIG;
}

export function isProductKind(value: unknown): value is ProductKind {
  return typeof value === "string" && value in PRODUCT_KIND_CONFIG;
}
