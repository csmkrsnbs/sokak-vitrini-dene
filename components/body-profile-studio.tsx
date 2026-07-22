"use client";

import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Download,
  Footprints,
  Gem,
  Layers3,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
  X,
} from "@/components/icons";
import {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BodyProfile,
  BodyPresentation,
  CUSTOM_PRODUCTS_STORAGE_KEY,
  FitResult,
  FitStyle,
  Product,
  ProductCategory,
  ProductMeasurements,
  ProductSize,
  PROFILE_STORAGE_KEY,
  StretchLevel,
  bodyMassIndex,
  calculateFit,
  categoryLabels,
  categoryMeasurementFields,
  defaultProfile,
  fitStyleLabels,
  getSampleProducts,
  measurementLabels,
  slotForCategory,
  stretchLabels,
} from "@/lib/body-profile";

type LookSlots = Record<string, string>;
type ProfileField = keyof Pick<
  BodyProfile,
  | "height"
  | "weight"
  | "shoulder"
  | "chest"
  | "waist"
  | "hip"
  | "neck"
  | "arm"
  | "thigh"
  | "inseam"
  | "footLength"
>;

type ProductDraft = {
  name: string;
  brand: string;
  category: ProductCategory;
  color: string;
  accent: string;
  fitStyle: FitStyle;
  stretch: StretchLevel;
  imageDataUrl?: string;
};

const profileFields: Array<{
  key: ProfileField;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "height", label: "Boy", hint: "Baş ile topuk arası", min: 135, max: 215, step: 1 },
  { key: "weight", label: "Kilo", hint: "Güncel vücut ağırlığı", min: 35, max: 180, step: 0.5 },
  { key: "shoulder", label: "Omuz", hint: "İki omuz başı arası", min: 30, max: 62, step: 0.5 },
  { key: "chest", label: "Göğüs", hint: "En geniş noktadan çevre", min: 65, max: 160, step: 0.5 },
  { key: "waist", label: "Bel", hint: "Doğal bel hattından çevre", min: 50, max: 150, step: 0.5 },
  { key: "hip", label: "Basen", hint: "En geniş noktadan çevre", min: 70, max: 170, step: 0.5 },
  { key: "neck", label: "Boyun", hint: "Boyun çevresi", min: 25, max: 55, step: 0.5 },
  { key: "arm", label: "Kol boyu", hint: "Omuz başından bileğe", min: 45, max: 78, step: 0.5 },
  { key: "thigh", label: "Üst bacak", hint: "Uyluğun en geniş çevresi", min: 35, max: 95, step: 0.5 },
  { key: "inseam", label: "İç bacak", hint: "Ağdan ayak bileğine", min: 55, max: 105, step: 0.5 },
  { key: "footLength", label: "Ayak", hint: "Topuktan en uzun parmağa", min: 19, max: 33, step: 0.1 },
];

const categories: ProductCategory[] = [
  "top",
  "outerwear",
  "bottom",
  "skirt",
  "dress",
  "shoes",
  "necklace",
  "bag",
];

const categoryIcons: Record<ProductCategory, typeof Shirt> = {
  top: Shirt,
  outerwear: Layers3,
  bottom: Ruler,
  skirt: Sparkles,
  dress: WandSparkles,
  shoes: Footprints,
  necklace: Gem,
  bag: BriefcaseBusiness,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BodyProfile;
  } catch {
    return null;
  }
}

function readStoredProducts() {
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

function profileToCss(profile: BodyProfile): CSSProperties {
  const heightFactor = clamp((profile.height - 145) / 60, 0, 1);
  const shoulderScale = clamp(profile.shoulder / 41, 0.82, 1.28);
  const torsoScale = clamp(((profile.shoulder / 41) * 0.35) + ((profile.chest / 94) * 0.65), 0.82, 1.3);
  const waistScale = clamp(profile.waist / 78, 0.76, 1.36);
  const hipScale = clamp(profile.hip / 100, 0.82, 1.32);
  const thighScale = clamp(profile.thigh / 56, 0.78, 1.34);
  return {
    "--shoulder-scale": shoulderScale,
    "--left-shoulder-offset": `${(shoulderScale - 1) * -13}px`,
    "--right-shoulder-offset": `${(shoulderScale - 1) * 13}px`,
    "--torso-scale": torsoScale,
    "--waist-scale": waistScale,
    "--hip-scale": hipScale,
    "--thigh-scale": thighScale,
    "--height-scale": 0.94 + heightFactor * 0.12,
    "--shoulder-line": `${clamp(48 + (profile.shoulder - 36) * 1.3, 48, 72)}%`,
    "--waist-line": `${clamp(40 + (profile.waist - 65) * 0.55, 40, 72)}%`,
    "--hip-line": `${clamp(50 + (profile.hip - 85) * 0.48, 50, 74)}%`,
  } as CSSProperties;
}

function recommendedSize(product: Product, fit: FitResult) {
  return product.sizes.find((size) => size.label === fit.recommendedSize) || product.sizes[0];
}

function layerScale(profile: BodyProfile, product: Product, fit: FitResult) {
  const size = recommendedSize(product, fit);
  if (!size) return { x: 1, y: 1 };

  let x = 1;
  if (product.category === "top" || product.category === "outerwear" || product.category === "dress") {
    const value = size.measurements.chest || profile.chest;
    x = clamp(value / profile.chest, 0.88, 1.2);
  } else if (product.category === "bottom" || product.category === "skirt") {
    const value = size.measurements.hip || profile.hip;
    x = clamp(value / profile.hip, 0.88, 1.18);
  } else if (product.category === "shoes") {
    const value = size.measurements.footLength || profile.footLength;
    x = clamp(value / profile.footLength, 0.9, 1.12);
  }

  const baseLengths: Partial<Record<ProductCategory, number>> = {
    top: 68,
    outerwear: 72,
    bottom: 106,
    skirt: 80,
    dress: 130,
  };
  const baseLength = baseLengths[product.category];
  const y = baseLength && size.measurements.length
    ? clamp(size.measurements.length / baseLength, 0.82, 1.2)
    : 1;

  return { x, y };
}

function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  const Icon = categoryIcons[product.category];
  return (
    <div
      className={`product-visual product-visual-${product.category} ${compact ? "compact" : ""}`}
      style={{ "--product": product.color, "--product-accent": product.accent } as CSSProperties}
    >
      {product.imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageDataUrl} alt="" />
      ) : (
        <>
          <span className="product-graphic" />
          <Icon className="product-icon" size={compact ? 22 : 30} strokeWidth={1.6} />
        </>
      )}
    </div>
  );
}

function AvatarStage({
  profile,
  products,
  selected,
  fitMap,
}: {
  profile: BodyProfile;
  products: Product[];
  selected: LookSlots;
  fitMap: Map<string, FitResult>;
}) {
  const selectedProducts = Object.values(selected)
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  return (
    <div className={`avatar-stage avatar-${profile.presentation}`} style={profileToCss(profile)}>
      <div className="avatar-glow" />
      <div className="height-line"><span>{profile.height} cm</span></div>
      <svg className="body-avatar" viewBox="0 0 320 720" role="img" aria-label={`${profile.name || "Kullanıcı"} dijital vücut profili`}>
        <defs>
          <linearGradient id="skinGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#e6c6ad" />
            <stop offset="1" stopColor="#c99677" />
          </linearGradient>
          <linearGradient id="baseSuit" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#eee9df" />
            <stop offset="1" stopColor="#cfc7ba" />
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="70" rx="42" ry="52" fill="url(#skinGradient)" />
        <path className="avatar-neck" d="M140 108 L180 108 L184 145 L136 145 Z" fill="url(#skinGradient)" />
        <path className="avatar-torso" d="M82 152 Q160 126 238 152 L221 335 Q160 365 99 335 Z" fill="url(#baseSuit)" />
        <path className="avatar-left-arm" d="M89 158 Q68 170 61 218 L45 407 Q44 432 61 435 Q78 432 80 409 L103 218 Z" fill="url(#skinGradient)" />
        <path className="avatar-right-arm" d="M231 158 Q252 170 259 218 L275 407 Q276 432 259 435 Q242 432 240 409 L217 218 Z" fill="url(#skinGradient)" />
        <path className="avatar-pelvis" d="M99 326 Q160 350 221 326 L229 390 Q160 414 91 390 Z" fill="url(#baseSuit)" />
        <path className="avatar-left-leg" d="M96 376 Q128 366 157 387 L148 655 Q145 687 118 687 Q96 680 99 651 Z" fill="url(#baseSuit)" />
        <path className="avatar-right-leg" d="M163 387 Q192 366 224 376 L221 651 Q224 680 202 687 Q175 687 172 655 Z" fill="url(#baseSuit)" />
        <ellipse cx="122" cy="690" rx="36" ry="13" fill="#b38a70" />
        <ellipse cx="198" cy="690" rx="36" ry="13" fill="#b38a70" />
      </svg>

      <div className="avatar-measure avatar-measure-shoulder"><i /><span>{profile.shoulder} cm omuz</span></div>
      <div className="avatar-measure avatar-measure-waist"><i /><span>{profile.waist} cm bel</span></div>
      <div className="avatar-measure avatar-measure-hip"><i /><span>{profile.hip} cm basen</span></div>

      {selectedProducts.map((product) => {
        const fit = fitMap.get(product.id);
        const scale = fit ? layerScale(profile, product, fit) : { x: 1, y: 1 };
        return (
          <div
            className={`avatar-product-layer layer-${product.category} ${product.imageDataUrl ? "has-image" : ""}`}
            key={product.id}
            style={{
              "--product": product.color,
              "--product-accent": product.accent,
              "--layer-scale-x": scale.x,
              "--layer-scale-y": scale.y,
            } as CSSProperties}
            title={`${product.name}${fit ? ` · ${fit.recommendedSize}` : ""}`}
          >
            {product.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageDataUrl} alt={product.name} />
            ) : (
              <span className="avatar-product-shape" />
            )}
            {fit && fit.isSized ? <b>{fit.recommendedSize}</b> : null}
          </div>
        );
      })}

      {!selectedProducts.length ? (
        <div className="avatar-empty-note"><Sparkles size={16} /> Katalogdan ürün seçerek kombinini oluştur.</div>
      ) : null}
    </div>
  );
}

function NumberField({
  profile,
  field,
  onChange,
}: {
  profile: BodyProfile;
  field: (typeof profileFields)[number];
  onChange: (key: ProfileField, value: number) => void;
}) {
  return (
    <label className="measurement-field">
      <span><strong>{field.label}</strong><small>{field.hint}</small></span>
      <span className="measurement-input">
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={profile[field.key]}
          onChange={(event) => onChange(field.key, Number(event.target.value))}
        />
        <em>{field.key === "weight" ? "kg" : "cm"}</em>
      </span>
    </label>
  );
}

function ProfileEditor({
  initial,
  mandatory,
  onSave,
  onClose,
}: {
  initial: BodyProfile;
  mandatory: boolean;
  onSave: (profile: BodyProfile) => void;
  onClose?: () => void;
}) {
  const [draft, setDraft] = useState<BodyProfile>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stepFields = [profileFields.slice(0, 2), profileFields.slice(2, 7), profileFields.slice(7)];

  function changeField(key: ProfileField, value: number) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function next() {
    if (step === 0 && !draft.name.trim()) {
      setError("Profil için bir ad yazın.");
      return;
    }
    if (step < 2) {
      setStep((current) => current + 1);
      setError(null);
      return;
    }
    const invalid = profileFields.find((field) => {
      const value = draft[field.key];
      return !Number.isFinite(value) || value < field.min || value > field.max;
    });
    if (invalid) {
      setError(`${invalid.label} ölçüsü izin verilen aralıkta değil.`);
      return;
    }
    onSave({ ...draft, name: draft.name.trim(), updatedAt: new Date().toISOString() });
  }

  return (
    <div className="profile-modal-backdrop">
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="profile-modal-main">
          <div className="modal-header">
            <div>
              <span className="section-eyebrow"><UserRound size={15} /> İlk adım</span>
              <h2 id="profile-title">Dijital vücut profilini oluştur</h2>
              <p>Ürünler, bu ölçüler ile gerçek ürün ölçüleri karşılaştırılarak bedeninde ölçeklenir.</p>
            </div>
            {!mandatory && onClose ? (
              <button className="icon-button" type="button" onClick={onClose} aria-label="Kapat"><X size={19} /></button>
            ) : null}
          </div>

          <div className="stepper" aria-label="Profil adımları">
            {["Temel bilgiler", "Üst vücut", "Alt vücut"].map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === step ? "active" : index < step ? "done" : ""}
                onClick={() => index <= step && setStep(index)}
              >
                <span>{index < step ? <Check size={14} /> : index + 1}</span>{label}
              </button>
            ))}
          </div>

          {step === 0 ? (
            <div className="profile-basic-grid">
              <label className="text-field wide">
                <span>Profil adı</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Örn. Samim" autoFocus />
              </label>
              <div className="presentation-field wide">
                <span>Avatar görünümü</span>
                <div>
                  {([
                    ["feminine", "Feminen"],
                    ["neutral", "Dengeli"],
                    ["masculine", "Maskülen"],
                  ] as Array<[BodyPresentation, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={draft.presentation === value ? "active" : ""}
                      onClick={() => setDraft((current) => ({ ...current, presentation: value }))}
                    >
                      <UserRound size={18} />{label}
                    </button>
                  ))}
                </div>
              </div>
              {stepFields[0].map((field) => <NumberField key={field.key} profile={draft} field={field} onChange={changeField} />)}
            </div>
          ) : (
            <div className="measurement-grid">
              {stepFields[step].map((field) => <NumberField key={field.key} profile={draft} field={field} onChange={changeField} />)}
            </div>
          )}

          {error ? <div className="inline-error"><AlertCircle size={17} />{error}</div> : null}

          <div className="modal-actions">
            <button type="button" className="button button-ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
              <ChevronLeft size={17} /> Geri
            </button>
            <button type="button" className="button button-primary" onClick={next}>
              {step === 2 ? <><Save size={17} /> Profili oluştur</> : <>Devam <ChevronRight size={17} /></>}
            </button>
          </div>
        </div>

        <aside className="profile-modal-preview">
          <span className="preview-tag"><WandSparkles size={14} /> Ölçü motoru</span>
          <AvatarStage profile={{ ...draft, name: draft.name || "Profil" }} products={[]} selected={{}} fitMap={new Map()} />
          <div className="preview-stats">
            <div><small>Boy / kilo</small><strong>{draft.height} cm · {draft.weight} kg</strong></div>
            <div><small>Vücut oranı</small><strong>{bodyMassIndex(draft)} BMI</strong></div>
            <div><small>Profil</small><strong>{draft.chest} / {draft.waist} / {draft.hip}</strong></div>
          </div>
          <p><LockKeyhole size={14} /> Ölçüler bu cihazın tarayıcısında saklanır. GPU veya fotoğraf yükleme zorunluluğu yoktur.</p>
        </aside>
      </section>
    </div>
  );
}

function FitPanel({ product, result }: { product: Product; result: FitResult }) {
  return (
    <section className="fit-card">
      <div className="fit-card-head">
        <ProductVisual product={product} compact />
        <div>
          <small>{product.brand}</small>
          <strong>{product.name}</strong>
          <span>{fitStyleLabels[product.fitStyle]} · {stretchLabels[product.stretch]}</span>
        </div>
        <div className={`fit-score score-${result.score >= 72 ? "good" : result.score >= 56 ? "medium" : "low"}`}>
          <strong>{result.isSized ? result.recommendedSize : "✓"}</strong>
          <small>{result.label}</small>
        </div>
      </div>
      {result.isSized ? (
        <>
          <div className="fit-meter"><i style={{ width: `${result.score}%` }} /><span>{result.score}/100 uyum</span></div>
          <p>{result.summary}</p>
          <div className="zone-list">
            {result.zones.map((zone) => (
              <div key={zone.key} className={`zone zone-${zone.status}`}>
                <span><i />{zone.label}</span>
                <strong>{zone.product} cm</strong>
                <small>{zone.text}</small>
              </div>
            ))}
          </div>
        </>
      ) : <p>{result.summary}</p>}
    </section>
  );
}

function ProductEditor({
  onSave,
  onClose,
}: {
  onSave: (product: Product) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ProductDraft>({
    name: "",
    brand: "",
    category: "top",
    color: "#d9c7aa",
    accent: "#806c52",
    fitStyle: "regular",
    stretch: "none",
  });
  const [sizes, setSizes] = useState<ProductSize[]>([
    { label: "M", measurements: { shoulder: 41, chest: 100, waist: 94, length: 68, sleeve: 60 } },
  ]);
  const [error, setError] = useState<string | null>(null);
  const fields = categoryMeasurementFields[draft.category];

  function changeCategory(category: ProductCategory) {
    const nextMeasurements: ProductMeasurements = {};
    for (const field of categoryMeasurementFields[category]) nextMeasurements[field] = undefined;
    setDraft((current) => ({ ...current, category }));
    setSizes([{ label: category === "necklace" || category === "bag" ? "Tek beden" : "M", measurements: nextMeasurements }]);
  }

  function updateSize(index: number, updater: (size: ProductSize) => ProductSize) {
    setSizes((current) => current.map((size, sizeIndex) => sizeIndex === index ? updater(size) : size));
  }

  async function loadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Yalnızca görsel dosyası yükleyin.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setError("Tarayıcıda saklanacağı için ürün görseli en fazla 1,5 MB olabilir.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, imageDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Ürün adını yazın.");
      return;
    }
    if (!sizes.length) {
      setError("En az bir beden ekleyin.");
      return;
    }
    if (fields.length) {
      const missing = sizes.some((size) => fields.some((field) => typeof size.measurements[field] !== "number" || Number(size.measurements[field]) <= 0));
      if (missing) {
        setError("Her beden için görünen tüm ölçüleri doldurun.");
        return;
      }
    }
    onSave({
      ...draft,
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      brand: draft.brand.trim() || "Kendi ürünüm",
      sizes,
      isCustom: true,
    });
  }

  return (
    <div className="drawer-backdrop">
      <form className="product-drawer" onSubmit={submit}>
        <div className="drawer-head">
          <div><span className="section-eyebrow"><Plus size={14} /> Ürün tanımı</span><h2>Ölçülü ürün ekle</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Kapat"><X size={19} /></button>
        </div>
        <p className="drawer-intro">Ürünün gerçek ölçülerini gir. Uygulama her bedeni kullanıcı profiliyle ayrı ayrı karşılaştırır.</p>

        <div className="drawer-grid">
          <label className="text-field"><span>Ürün adı</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Örn. Keten gömlek" /></label>
          <label className="text-field"><span>Marka / mağaza</span><input value={draft.brand} onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))} placeholder="İsteğe bağlı" /></label>
          <label className="select-field"><span>Kategori</span><select value={draft.category} onChange={(event) => changeCategory(event.target.value as ProductCategory)}>{categories.map((category) => <option value={category} key={category}>{categoryLabels[category]}</option>)}</select></label>
          <label className="select-field"><span>Kalıp</span><select value={draft.fitStyle} onChange={(event) => setDraft((current) => ({ ...current, fitStyle: event.target.value as FitStyle }))}>{Object.entries(fitStyleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="select-field"><span>Esneklik</span><select value={draft.stretch} onChange={(event) => setDraft((current) => ({ ...current, stretch: event.target.value as StretchLevel }))}>{Object.entries(stretchLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="image-upload-field"><span>Ürün görseli</span><input type="file" accept="image/*" onChange={loadImage} /><b>{draft.imageDataUrl ? "Görsel hazır" : "Görsel seç"}</b></label>
          <label className="color-field"><span>Ana renk</span><input type="color" value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} /></label>
          <label className="color-field"><span>Detay rengi</span><input type="color" value={draft.accent} onChange={(event) => setDraft((current) => ({ ...current, accent: event.target.value }))} /></label>
        </div>

        <div className="size-editor-head">
          <div><strong>Beden ölçüleri</strong><small>Çevre ölçülerini tam çevre olarak gir.</small></div>
          {fields.length ? <button type="button" className="mini-button" onClick={() => setSizes((current) => [...current, { label: `${current.length + 1}`, measurements: {} }])}><Plus size={14} /> Beden ekle</button> : null}
        </div>

        <div className="size-editor-list">
          {sizes.map((size, index) => (
            <div className="size-editor-row" key={index}>
              <label><span>Beden</span><input value={size.label} onChange={(event) => updateSize(index, (current) => ({ ...current, label: event.target.value }))} /></label>
              {fields.map((field) => (
                <label key={field}>
                  <span>{measurementLabels[field]}</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={size.measurements[field] ?? ""}
                    onChange={(event) => updateSize(index, (current) => ({
                      ...current,
                      measurements: { ...current.measurements, [field]: event.target.value === "" ? undefined : Number(event.target.value) },
                    }))}
                  />
                </label>
              ))}
              {sizes.length > 1 ? <button type="button" className="remove-size" onClick={() => setSizes((current) => current.filter((_, sizeIndex) => sizeIndex !== index))}><Trash2 size={15} /></button> : null}
            </div>
          ))}
        </div>

        {error ? <div className="inline-error"><AlertCircle size={17} />{error}</div> : null}
        <div className="drawer-actions"><button type="button" className="button button-ghost" onClick={onClose}>Vazgeç</button><button className="button button-primary" type="submit"><Save size={17} /> Ürünü kaydet</button></div>
      </form>
    </div>
  );
}

export function BodyProfileStudio() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [products, setProducts] = useState<Product[]>(getSampleProducts());
  const [selected, setSelected] = useState<LookSlots>({});
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [profileEditor, setProfileEditor] = useState(false);
  const [productEditor, setProductEditor] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"catalog" | "avatar" | "fit">("avatar");

  useEffect(() => {
    const storedProfile = readStoredProfile();
    const customProducts = readStoredProducts();
    setProfile(storedProfile);
    setProducts([...getSampleProducts(), ...customProducts]);
    setHydrated(true);
  }, []);

  const fitMap = useMemo(() => {
    const map = new Map<string, FitResult>();
    if (!profile) return map;
    for (const product of products) map.set(product.id, calculateFit(profile, product));
    return map;
  }, [profile, products]);

  const selectedProducts = useMemo(
    () => Object.values(selected).map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product)),
    [products, selected],
  );

  const activeProduct = products.find((product) => product.id === activeProductId) || selectedProducts[selectedProducts.length - 1] || null;
  const activeFit = activeProduct ? fitMap.get(activeProduct.id) || null : null;

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr");
    return products.filter((product) => {
      const categoryMatch = category === "all" || product.category === category;
      const queryMatch = !normalized || `${product.name} ${product.brand} ${categoryLabels[product.category]}`.toLocaleLowerCase("tr").includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [category, products, query]);

  function saveProfile(next: BodyProfile) {
    setProfile(next);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    setProfileEditor(false);
  }

  function selectProduct(product: Product) {
    const slot = slotForCategory(product.category);
    setSelected((current) => {
      const next = { ...current };
      if (next[slot] === product.id) {
        delete next[slot];
      } else {
        if (product.category === "dress") {
          delete next.top;
          delete next.bottom;
        }
        if (product.category === "top" || product.category === "bottom" || product.category === "skirt") delete next.body;
        next[slot] = product.id;
      }
      return next;
    });
    setActiveProductId(product.id);
    setMobilePanel("avatar");
  }

  function addCustomProduct(product: Product) {
    const customProducts = [...products.filter((item) => item.isCustom), product];
    setProducts([...getSampleProducts(), ...customProducts]);
    localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(customProducts));
    setProductEditor(false);
    setCategory(product.category);
    setActiveProductId(product.id);
  }

  function deleteCustomProduct(product: Product) {
    if (!product.isCustom) return;
    const customProducts = products.filter((item) => item.isCustom && item.id !== product.id);
    setProducts([...getSampleProducts(), ...customProducts]);
    localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(customProducts));
    setSelected((current) => Object.fromEntries(Object.entries(current).filter(([, id]) => id !== product.id)));
    if (activeProductId === product.id) setActiveProductId(null);
  }

  function resetLook() {
    setSelected({});
    setActiveProductId(null);
  }

  function exportProfile() {
    if (!profile) return;
    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      look: selectedProducts.map((product) => ({
        product: product.name,
        brand: product.brand,
        category: categoryLabels[product.category],
        fit: fitMap.get(product.id),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sv-dijital-beden-${profile.name.toLocaleLowerCase("tr").replace(/\s+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return <div className="app-loading"><Sparkles className="spin" size={24} /><span>Dijital beden hazırlanıyor…</span></div>;

  const safeProfile = profile || defaultProfile();

  return (
    <>
      {!profile || profileEditor ? (
        <ProfileEditor
          initial={profile || defaultProfile()}
          mandatory={!profile}
          onSave={saveProfile}
          onClose={profile ? () => setProfileEditor(false) : undefined}
        />
      ) : null}
      {productEditor ? <ProductEditor onSave={addCustomProduct} onClose={() => setProductEditor(false)} /> : null}

      <div className="app-shell">
        <header className="app-header">
          <a className="brand" href="#top" aria-label="Sokak Vitrini Dijital Beden">
            <span className="brand-mark">SV</span>
            <span><strong>SOKAK VİTRİNİ</strong><small>DİJİTAL BEDEN</small></span>
          </a>
          <div className="header-center"><Sparkles size={15} /><span>Ölçü tabanlı kombin ve beden uyumu</span></div>
          <div className="header-actions">
            <button type="button" className="profile-chip" onClick={() => setProfileEditor(true)}>
              <UserRound size={17} />
              <span><small>Dijital profil</small><strong>{safeProfile.name || "Profil"}</strong></span>
              <Pencil size={14} />
            </button>
          </div>
        </header>

        <div className="mobile-tabs">
          <button className={mobilePanel === "catalog" ? "active" : ""} onClick={() => setMobilePanel("catalog")}><ShoppingBag size={17} />Ürünler</button>
          <button className={mobilePanel === "avatar" ? "active" : ""} onClick={() => setMobilePanel("avatar")}><UserRound size={17} />Bedenim</button>
          <button className={mobilePanel === "fit" ? "active" : ""} onClick={() => setMobilePanel("fit")}><CircleGauge size={17} />Uyum</button>
        </div>

        <main className="studio-grid" id="top">
          <aside className={`catalog-panel mobile-panel-${mobilePanel === "catalog" ? "show" : "hide"}`}>
            <div className="panel-title">
              <div><span className="section-eyebrow"><ShoppingBag size={14} /> Katalog</span><h1>Ürün seç ve kombinle</h1></div>
              <button type="button" className="icon-button add-product" onClick={() => setProductEditor(true)} aria-label="Ürün ekle"><Plus size={19} /></button>
            </div>

            <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ürün veya marka ara" /></label>
            <div className="category-scroller">
              <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>Tümü</button>
              {categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{categoryLabels[item]}</button>)}
            </div>

            <div className="product-list">
              {filteredProducts.map((product) => {
                const fit = fitMap.get(product.id);
                const selectedNow = Object.values(selected).includes(product.id);
                return (
                  <article className={`product-card ${selectedNow ? "selected" : ""}`} key={product.id} onClick={() => setActiveProductId(product.id)}>
                    <ProductVisual product={product} />
                    <div className="product-card-copy">
                      <small>{product.brand}</small>
                      <h2>{product.name}</h2>
                      <div><span>{categoryLabels[product.category]}</span>{fit?.isSized ? <b>{fit.recommendedSize} önerisi</b> : <b>Tek beden</b>}</div>
                      {fit ? <div className="mini-fit"><i style={{ width: `${fit.score}%` }} /><span>{fit.label}</span></div> : null}
                    </div>
                    <div className="product-card-actions">
                      <button type="button" className={selectedNow ? "remove-look" : "add-look"} onClick={(event) => { event.stopPropagation(); selectProduct(product); }}>
                        {selectedNow ? <><Check size={15} /> Kombinde</> : <><Plus size={15} /> Dene</>}
                      </button>
                      {product.isCustom ? <button type="button" className="delete-product" onClick={(event) => { event.stopPropagation(); deleteCustomProduct(product); }} aria-label="Ürünü sil"><Trash2 size={15} /></button> : null}
                    </div>
                  </article>
                );
              })}
              {!filteredProducts.length ? <div className="empty-catalog"><Search size={22} /><strong>Ürün bulunamadı</strong><span>Filtreyi temizleyin veya kendi ürününüzü ekleyin.</span></div> : null}
            </div>
          </aside>

          <section className={`avatar-panel mobile-panel-${mobilePanel === "avatar" ? "show" : "hide"}`}>
            <div className="avatar-panel-head">
              <div>
                <span className="section-eyebrow"><WandSparkles size={14} /> Dijital vücut profili</span>
                <h2>{safeProfile.name || "Profil"} üzerinde görünüm</h2>
              </div>
              <div className="look-actions">
                <button type="button" className="mini-button" disabled={!selectedProducts.length} onClick={resetLook}><RotateCcw size={14} /> Temizle</button>
                <button type="button" className="mini-button" onClick={exportProfile}><Download size={14} /> Dışa aktar</button>
              </div>
            </div>

            <AvatarStage profile={safeProfile} products={products} selected={selected} fitMap={fitMap} />

            <div className="look-dock">
              <div className="look-dock-title"><Layers3 size={16} /><span><strong>Aktif kombin</strong><small>{selectedProducts.length ? `${selectedProducts.length} ürün` : "Henüz ürün yok"}</small></span></div>
              <div className="look-items">
                {selectedProducts.map((product) => (
                  <button type="button" key={product.id} className={activeProduct?.id === product.id ? "active" : ""} onClick={() => { setActiveProductId(product.id); setMobilePanel("fit"); }}>
                    <ProductVisual product={product} compact />
                    <span><strong>{product.name}</strong><small>{fitMap.get(product.id)?.recommendedSize}</small></span>
                    <ChevronRight size={15} />
                  </button>
                ))}
                {!selectedProducts.length ? <p>Üst, alt, dış giyim, takı, çanta ve ayakkabıyı aynı profil üzerinde birleştirebilirsin.</p> : null}
              </div>
            </div>
          </section>

          <aside className={`analysis-panel mobile-panel-${mobilePanel === "fit" ? "show" : "hide"}`}>
            <div className="panel-title analysis-title">
              <div><span className="section-eyebrow"><CircleGauge size={14} /> Beden analizi</span><h2>Ölçü karşılaştırması</h2></div>
            </div>

            <section className="profile-summary-card">
              <div className="profile-summary-head"><UserRound size={19} /><span><small>Aktif profil</small><strong>{safeProfile.name || "Profil"}</strong></span><button type="button" onClick={() => setProfileEditor(true)}><Pencil size={14} /></button></div>
              <div className="profile-numbers">
                <span><small>Göğüs</small><strong>{safeProfile.chest}</strong></span>
                <span><small>Bel</small><strong>{safeProfile.waist}</strong></span>
                <span><small>Basen</small><strong>{safeProfile.hip}</strong></span>
              </div>
              <div className="profile-confidence"><CheckCircle2 size={15} /><span>11 ölçü ile profil hazır</span></div>
            </section>

            {activeProduct && activeFit ? (
              <FitPanel product={activeProduct} result={activeFit} />
            ) : (
              <section className="analysis-empty">
                <CircleGauge size={34} />
                <strong>Bir ürün seç</strong>
                <p>Önerilen beden, dar/uygun/bol bölgeleri ve ürün ölçüsü karşılaştırması burada görünür.</p>
              </section>
            )}

            <section className="method-card">
              <div><Ruler size={18} /><span><strong>Nasıl hesaplanıyor?</strong><small>Vücut ölçüsü + kalıp + kumaş esnekliği</small></span></div>
              <p>Motor her ürün bedenini ayrı değerlendirir. Çevre ölçüleri, omuz, kol, iç bacak ve ayak uzunluğu kategoriye göre karşılaştırılır.</p>
              <div className="method-badges"><span>GPU yok</span><span>Fotoğraf zorunlu değil</span><span>Anında sonuç</span></div>
            </section>
          </aside>
        </main>

        <footer className="app-footer">
          <span>© 2026 Sokak Vitrini</span>
          <p>Bu önizleme fiziksel prova garantisi değildir; satın almada gerçek ürün ölçü tablosu esas alınır.</p>
          <nav><a href="/gizlilik">Gizlilik</a><a href="/kullanim-kosullari">Kullanım Koşulları</a></nav>
        </footer>
      </div>
    </>
  );
}
