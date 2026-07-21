"use client";

import {
  Box,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  FileImage,
  Images,
  LoaderCircle,
  Maximize2,
  Move,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ApiErrorBody,
  CollectionType,
  GarmentCategory,
  GarmentPhotoType,
  MannequinSize,
  StudioMode,
  TryOnResponse,
} from "@/lib/types";

type LocalImage = { file: File; url: string };
type Hotspot = { id: string; frame: number; label: string };
type OverlayTransform = { x: number; y: number; scale: number; rotate: number; width: number };

const modes: Array<{ id: StudioMode; label: string; short: string; icon: typeof Images }> = [
  { id: "360", label: "Gerçek 360°", short: "360°", icon: Images },
  { id: "mannequin", label: "Gizli Manken", short: "Manken", icon: Shirt },
  { id: "personal", label: "Kendi Üstünde", short: "Kendinde", icon: Camera },
  { id: "ar", label: "3D / WebAR", short: "AR", icon: Box },
];

const mannequinDefaults: Record<MannequinSize, OverlayTransform> = {
  s: { x: 0, y: -35, scale: 1, rotate: 0, width: 46 },
  m: { x: 0, y: -31, scale: 1.04, rotate: 0, width: 50 },
  l: { x: 0, y: -25, scale: 1.08, rotate: 0, width: 56 },
  xl: { x: 0, y: -19, scale: 1.12, rotate: 0, width: 62 },
};

const categoryOptions: Array<{ value: GarmentCategory; label: string; hint: string }> = [
  { value: "tops", label: "Üst giyim", hint: "Bluz, gömlek, ceket, sütyen, korse" },
  { value: "bottoms", label: "Alt giyim", hint: "Pantolon, etek, şort, alt iç giyim" },
  { value: "one-pieces", label: "Tek parça", hint: "Elbise, abiye, mayo, body" },
  { value: "two-piece", label: "İki parçalı takım", hint: "Bikini veya üst-alt takım" },
];

function revoke(image: LocalImage | null) {
  if (image) URL.revokeObjectURL(image.url);
}

function imageFromFile(file: File): LocalImage {
  return { file, url: URL.createObjectURL(file) };
}

function formatPercent(value: number) {
  return `%${Math.round(value * 100)}`;
}

async function readApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return payload?.error?.message || "İşlem tamamlanamadı.";
}

function UploadZone({
  title,
  hint,
  image,
  accept = "image/*",
  multiple = false,
  onChange,
  onClear,
}: {
  title: string;
  hint: string;
  image?: LocalImage | null;
  accept?: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}) {
  return (
    <label className={`upload-zone ${image ? "has-image" : ""}`}>
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={`${title} önizlemesi`} />
          <span className="upload-change"><Upload size={15} /> Değiştir</span>
          {onClear ? (
            <button
              type="button"
              className="image-clear"
              onClick={(event) => {
                event.preventDefault();
                onClear();
              }}
              aria-label={`${title} görselini kaldır`}
            >
              <Trash2 size={15} />
            </button>
          ) : null}
        </>
      ) : (
        <>
          <span className="upload-icon"><FileImage size={28} /></span>
          <strong>{title}</strong>
          <small>{hint}</small>
          <span className="upload-cta"><Upload size={15} /> Dosya seç</span>
        </>
      )}
      <input type="file" accept={accept} multiple={multiple} onChange={onChange} />
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-control">
      <span><strong>{label}</strong><em>{Math.round(value * 10) / 10}{suffix}</em></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function ProvaStudio() {
  const [mode, setMode] = useState<StudioMode>("360");
  const [collection, setCollection] = useState<CollectionType>("general");
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  const [sequence, setSequence] = useState<LocalImage[]>([]);
  const [frame, setFrame] = useState(0);
  const [sequenceZoom, setSequenceZoom] = useState(1);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hotspotText, setHotspotText] = useState("");
  const sequenceDrag = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });

  const [mannequinSize, setMannequinSize] = useState<MannequinSize>("m");
  const [mannequinImage, setMannequinImage] = useState<LocalImage | null>(null);
  const [overlayImage, setOverlayImage] = useState<LocalImage | null>(null);
  const [overlay, setOverlay] = useState<OverlayTransform>(mannequinDefaults.m);
  const overlayDrag = useRef<{ active: boolean; x: number; y: number; startX: number; startY: number }>({
    active: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  const [personImage, setPersonImage] = useState<LocalImage | null>(null);
  const [garmentImage, setGarmentImage] = useState<LocalImage | null>(null);
  const [secondGarmentImage, setSecondGarmentImage] = useState<LocalImage | null>(null);
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategory>("one-pieces");
  const [garmentPhotoType, setGarmentPhotoType] = useState<GarmentPhotoType>("auto");
  const [tryOnResult, setTryOnResult] = useState<TryOnResponse | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [glbUrl, setGlbUrl] = useState("");
  const [localGlbUrl, setLocalGlbUrl] = useState<string | null>(null);

  useEffect(() => {
    void import("@google/model-viewer");
  }, []);

  useEffect(() => {
    return () => {
      sequence.forEach(revoke);
      revoke(mannequinImage);
      revoke(overlayImage);
      revoke(personImage);
      revoke(garmentImage);
      revoke(secondGarmentImage);
      if (localGlbUrl) URL.revokeObjectURL(localGlbUrl);
    };
    // Object URL cleanup is intentionally limited to unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSequence = sequence[frame] ?? null;
  const currentModelUrl = localGlbUrl || glbUrl.trim();

  const activeHotspots = useMemo(
    () => hotspots.filter((item) => item.frame === frame),
    [frame, hotspots],
  );

  function replaceImage(
    event: ChangeEvent<HTMLInputElement>,
    current: LocalImage | null,
    setter: (value: LocalImage | null) => void,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 12 * 1024 * 1024) {
      setTryOnError("Her fotoğraf en fazla 12 MB olabilir.");
      return;
    }
    revoke(current);
    setter(imageFromFile(file));
    setTryOnResult(null);
    setTryOnError(null);
  }

  function loadSequence(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name, "tr", { numeric: true }));
    event.target.value = "";
    if (!files.length) return;
    sequence.forEach(revoke);
    setSequence(files.map(imageFromFile));
    setFrame(0);
    setSequenceZoom(1);
    setHotspots([]);
  }

  function stepFrame(direction: number) {
    if (!sequence.length) return;
    setFrame((current) => (current + direction + sequence.length) % sequence.length);
  }

  function onSequencePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!sequence.length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    sequenceDrag.current = { active: true, x: event.clientX };
  }

  function onSequencePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!sequenceDrag.current.active || !sequence.length) return;
    const diff = event.clientX - sequenceDrag.current.x;
    if (Math.abs(diff) < 10) return;
    stepFrame(diff > 0 ? -1 : 1);
    sequenceDrag.current.x = event.clientX;
  }

  function onSequencePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    sequenceDrag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function addHotspot() {
    const label = hotspotText.trim();
    if (!label || !sequence.length) return;
    setHotspots((items) => [...items, { id: crypto.randomUUID(), frame, label }]);
    setHotspotText("");
  }

  function onOverlayPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!overlayImage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    overlayDrag.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      startX: overlay.x,
      startY: overlay.y,
    };
  }

  function onOverlayPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = overlayDrag.current;
    if (!drag.active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = ((event.clientX - drag.x) / rect.width) * 100;
    const dy = ((event.clientY - drag.y) / rect.height) * 100;
    setOverlay((current) => ({ ...current, x: drag.startX + dx, y: drag.startY + dy }));
  }

  function onOverlayPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    overlayDrag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function submitTryOn(event: FormEvent) {
    event.preventDefault();
    if (!personImage || !garmentImage) {
      setTryOnError("Kişi ve ürün fotoğrafını yükleyin.");
      return;
    }
    if (garmentCategory === "two-piece" && !secondGarmentImage) {
      setTryOnError("İki parçalı takım için alt ürün fotoğrafını da yükleyin.");
      return;
    }
    if (collection === "private" && !adultConfirmed) {
      setTryOnError("Özel Vitrin için 18 yaş doğrulamasını onaylayın.");
      return;
    }

    setLoading(true);
    setTryOnError(null);
    setTryOnResult(null);
    const form = new FormData();
    form.set("person", personImage.file);
    form.set("garment", garmentImage.file);
    if (secondGarmentImage) form.set("secondGarment", secondGarmentImage.file);
    form.set("category", garmentCategory);
    form.set("garmentPhotoType", garmentPhotoType);

    try {
      const response = await fetch("/api/try-on", { method: "POST", body: form });
      if (!response.ok) throw new Error(await readApiError(response));
      const payload = (await response.json()) as TryOnResponse;
      setTryOnResult(payload);
    } catch (error) {
      setTryOnError(error instanceof Error ? error.message : "Önizleme oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!tryOnResult?.imageDataUrl) return;
    const link = document.createElement("a");
    link.href = tryOnResult.imageDataUrl;
    link.download = `sv-prova-${Date.now()}.png`;
    link.click();
  }

  function loadGlb(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (localGlbUrl) URL.revokeObjectURL(localGlbUrl);
    setLocalGlbUrl(URL.createObjectURL(file));
  }

  return (
    <section className="studio-section" id="studio">
      <div className="container">
        <div className="section-heading">
          <span className="section-kicker">SV Prova Stüdyosu</span>
          <h2>Dört farklı deneyim, tek ürün gerçekliği.</h2>
          <p>Ürünü gerçek çekimle incele; mankende, kendi fotoğrafında veya 3D ortamda gör.</p>
        </div>

        <div className="collection-switch" role="group" aria-label="Koleksiyon seçimi">
          <button
            type="button"
            className={collection === "general" ? "active" : ""}
            onClick={() => { setCollection("general"); setAdultConfirmed(false); }}
          >
            Genel Vitrin <small>Günlük giyim · Abiye · Aksesuar</small>
          </button>
          <button
            type="button"
            className={collection === "private" ? "active private" : ""}
            onClick={() => setCollection("private")}
          >
            Özel Vitrin <small>İç giyim · Bikini · Mayo · Fantezi</small>
          </button>
        </div>

        {collection === "private" ? (
          <label className="adult-confirm">
            <input
              type="checkbox"
              checked={adultConfirmed}
              onChange={(event) => setAdultConfirmed(event.target.checked)}
            />
            <span><ShieldCheck size={18} /><strong>18 yaşından büyüğüm.</strong> Özel Vitrin yalnız yetişkin kullanıcılar içindir.</span>
          </label>
        ) : null}

        <div className="studio-shell">
          <div className="mode-tabs" role="tablist" aria-label="Prova modları">
            {modes.map(({ id, label, short, icon: Icon }) => (
              <button
                type="button"
                role="tab"
                aria-selected={mode === id}
                className={mode === id ? "active" : ""}
                onClick={() => setMode(id)}
                key={id}
              >
                <Icon size={18} /><span className="full-label">{label}</span><span className="short-label">{short}</span>
              </button>
            ))}
          </div>

          {mode === "360" ? (
            <div className="studio-layout">
              <div className="visual-panel">
                {currentSequence ? (
                  <div
                    className="sequence-stage"
                    onPointerDown={onSequencePointerDown}
                    onPointerMove={onSequencePointerMove}
                    onPointerUp={onSequencePointerUp}
                    onPointerCancel={onSequencePointerUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentSequence.url}
                      alt={`360 derece ürün karesi ${frame + 1}`}
                      style={{ transform: `scale(${sequenceZoom})` }}
                      draggable={false}
                    />
                    <div className="sequence-badge"><Move size={15} /> Sağa / sola sürükle</div>
                    <div className="sequence-counter">{frame + 1} / {sequence.length}</div>
                    {activeHotspots.map((item) => (
                      <span className="hotspot-pin" key={item.id}>{item.label}</span>
                    ))}
                    <button className="sequence-arrow left" type="button" onClick={() => stepFrame(-1)}><ChevronLeft /></button>
                    <button className="sequence-arrow right" type="button" onClick={() => stepFrame(1)}><ChevronRight /></button>
                  </div>
                ) : (
                  <div className="empty-stage">
                    <span><Images size={34} /></span>
                    <h3>Gerçek ürün çekimlerini yükle</h3>
                    <p>Dosyaları 01, 02, 03… biçiminde adlandır. Sistem sıraya koyar ve sürüklenebilir 360° görünüm oluşturur.</p>
                    <label className="button button-gold"><Upload size={17} /> 24–36 kare seç<input hidden type="file" accept="image/*" multiple onChange={loadSequence} /></label>
                  </div>
                )}
              </div>

              <aside className="control-panel">
                <div className="panel-title"><span>GERÇEK ÜRÜN MODU</span><strong>Fotoğraf Dizisi</strong></div>
                <label className="compact-upload"><Upload size={16} /> Yeni 360° seti yükle<input hidden type="file" accept="image/*" multiple onChange={loadSequence} /></label>
                <RangeControl label="Yakınlaştırma" value={sequenceZoom} min={1} max={2.6} step={0.05} suffix="×" onChange={setSequenceZoom} />
                <div className="hotspot-form">
                  <label>Bu kareye detay notu</label>
                  <div><input value={hotspotText} onChange={(event) => setHotspotText(event.target.value)} placeholder="Örn. El işçiliği dantel" /><button type="button" onClick={addHotspot}>Ekle</button></div>
                </div>
                {hotspots.length ? (
                  <div className="hotspot-list">
                    {hotspots.map((item) => (
                      <button key={item.id} type="button" onClick={() => setFrame(item.frame)}>
                        <span>Kare {item.frame + 1}</span><strong>{item.label}</strong>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="truth-note"><Check size={17} /><p><strong>%100 gerçek ürün görüntüsü.</strong> Yapay üretim, renk değiştirme veya uydurulmuş arka görünüm yoktur.</p></div>
              </aside>
            </div>
          ) : null}

          {mode === "mannequin" ? (
            <div className="studio-layout">
              <div className="visual-panel mannequin-panel">
                <div
                  className="mannequin-stage"
                  onPointerDown={onOverlayPointerDown}
                  onPointerMove={onOverlayPointerMove}
                  onPointerUp={onOverlayPointerUp}
                  onPointerCancel={onOverlayPointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="mannequin-base"
                    src={mannequinImage?.url || `/mannequins/${mannequinSize}.svg`}
                    alt={`${mannequinSize.toUpperCase()} beden dijital manken`}
                    draggable={false}
                  />
                  {overlayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="garment-overlay"
                      src={overlayImage.url}
                      alt="Manken üzerindeki ürün katmanı"
                      draggable={false}
                      style={{
                        width: `${overlay.width}%`,
                        transform: `translate(calc(-50% + ${overlay.x}%), calc(-50% + ${overlay.y}%)) scale(${overlay.scale}) rotate(${overlay.rotate}deg)`,
                      }}
                    />
                  ) : (
                    <div className="overlay-empty"><Shirt size={24} /><span>Şeffaf ürün PNG&apos;si yükleyin</span></div>
                  )}
                  {overlayImage ? <span className="drag-label"><Move size={14} /> Ürünü sürükleyerek hizala</span> : null}
                </div>
              </div>

              <aside className="control-panel">
                <div className="panel-title"><span>GİZLİ PROVA</span><strong>Hazır Manken</strong></div>
                <div className="size-selector">
                  {(["s", "m", "l", "xl"] as MannequinSize[]).map((size) => (
                    <button type="button" className={mannequinSize === size ? "active" : ""} onClick={() => { setMannequinSize(size); setOverlay(mannequinDefaults[size]); }} key={size}>{size.toUpperCase()}</button>
                  ))}
                </div>
                <UploadZone
                  title="Ürün PNG"
                  hint="Arka planı şeffaf, önden çekilmiş ürün"
                  image={overlayImage}
                  onChange={(event) => replaceImage(event, overlayImage, setOverlayImage)}
                  onClear={() => { revoke(overlayImage); setOverlayImage(null); }}
                />
                <label className="compact-upload"><Upload size={16} /> Kendi stüdyo mankenini yükle<input hidden type="file" accept="image/*" onChange={(event) => replaceImage(event, mannequinImage, setMannequinImage)} /></label>
                <RangeControl label="Genişlik" value={overlay.width} min={20} max={90} step={1} suffix="%" onChange={(value) => setOverlay((item) => ({ ...item, width: value }))} />
                <RangeControl label="Ölçek" value={overlay.scale} min={0.5} max={1.8} step={0.02} suffix="×" onChange={(value) => setOverlay((item) => ({ ...item, scale: value }))} />
                <RangeControl label="Döndürme" value={overlay.rotate} min={-25} max={25} step={1} suffix="°" onChange={(value) => setOverlay((item) => ({ ...item, rotate: value }))} />
                <button type="button" className="button button-outline full-button" onClick={() => setOverlay(mannequinDefaults[mannequinSize])}><RotateCcw size={16} /> Hizalamayı sıfırla</button>
                <div className="truth-note neutral"><Eye size={17} /><p>Bu alan beden garantisi değil, ürünün farklı vücut ölçeklerindeki <strong>görsel duruş önizlemesidir.</strong></p></div>
              </aside>
            </div>
          ) : null}

          {mode === "personal" ? (
            <form className="studio-layout" onSubmit={submitTryOn}>
              <div className="visual-panel personal-panel">
                {tryOnResult?.imageDataUrl && tryOnResult.metrics.accepted ? (
                  <div className="result-grid">
                    <figure>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={personImage?.url} alt="Prova öncesi" />
                      <figcaption>ÖNCE · GERÇEK KİŞİ FOTOĞRAFI</figcaption>
                    </figure>
                    <figure className="result-output">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tryOnResult.imageDataUrl} alt="Dijital prova sonucu" />
                      <figcaption>DİJİTAL PROVA · YAKLAŞIK GÖRÜNÜM</figcaption>
                    </figure>
                  </div>
                ) : tryOnResult && !tryOnResult.metrics.accepted ? (
                  <div className="rejected-result">
                    <CircleAlert size={38} />
                    <h3>Bu sonuç yayınlanmadı.</h3>
                    <p>{tryOnResult.metrics.message}</p>
                    <button type="button" className="button button-outline" onClick={() => setMode("360")}>Gerçek 360° görünümü aç</button>
                  </div>
                ) : (
                  <div className="personal-placeholder">
                    <div className="scan-frame"><ScanLine size={46} /><span /></div>
                    <h3>Kendi GPU sunucunda kişisel prova</h3>
                    <p>Kişi ve ürün fotoğrafı yalnız bu işlem için GPU servisine gönderilir; veritabanına kaydedilmez.</p>
                    <div className="process-line"><span>Fotoğraf</span><i /><span>VTON</span><i /><span>Sadakat Kontrolü</span></div>
                  </div>
                )}
                {loading ? (
                  <div className="loading-curtain"><LoaderCircle className="spin" size={34} /><strong>Prova hazırlanıyor</strong><span>Ürün sadakati ölçülmeden sonuç gösterilmez.</span></div>
                ) : null}
              </div>

              <aside className="control-panel">
                <div className="panel-title"><span>SELF-HOSTED VTON</span><strong>Kendi Üstünde Prova</strong></div>
                <div className="two-upload-grid">
                  <UploadZone title="Kişi fotoğrafı" hint="Yetişkin, önden ve net" image={personImage} onChange={(event) => replaceImage(event, personImage, setPersonImage)} onClear={() => { revoke(personImage); setPersonImage(null); }} />
                  <UploadZone title="Ürün fotoğrafı" hint="Düz serim veya model üzerinde" image={garmentImage} onChange={(event) => replaceImage(event, garmentImage, setGarmentImage)} onClear={() => { revoke(garmentImage); setGarmentImage(null); }} />
                </div>
                <label className="field-label">Ürün tipi
                  <select value={garmentCategory} onChange={(event) => setGarmentCategory(event.target.value as GarmentCategory)}>
                    {categoryOptions.map((item) => <option value={item.value} key={item.value}>{item.label} — {item.hint}</option>)}
                  </select>
                </label>
                {garmentCategory === "two-piece" ? (
                  <UploadZone title="Alt parça fotoğrafı" hint="Takımın ikinci ürünü" image={secondGarmentImage} onChange={(event) => replaceImage(event, secondGarmentImage, setSecondGarmentImage)} onClear={() => { revoke(secondGarmentImage); setSecondGarmentImage(null); }} />
                ) : null}
                <label className="field-label">Ürün fotoğraf türü
                  <select value={garmentPhotoType} onChange={(event) => setGarmentPhotoType(event.target.value as GarmentPhotoType)}>
                    <option value="auto">Otomatik algıla</option>
                    <option value="flat-lay">Tek başına / düz serim</option>
                    <option value="model">Başka model üzerinde</option>
                  </select>
                </label>
                {tryOnError ? <div className="error-box"><CircleAlert size={17} />{tryOnError}</div> : null}
                <button className="button button-gold full-button" type="submit" disabled={loading}>
                  {loading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                  {loading ? "GPU işliyor…" : "Güvenilir prova oluştur"}
                </button>
                {tryOnResult ? (
                  <div className={`fidelity-card ${tryOnResult.metrics.grade}`}>
                    <div><span>ÜRÜN SADAKATİ</span><strong>{formatPercent(tryOnResult.metrics.overall)}</strong></div>
                    <label>Renk <i><b style={{ width: formatPercent(tryOnResult.metrics.color) }} /></i></label>
                    <label>Yapı <i><b style={{ width: formatPercent(tryOnResult.metrics.structure) }} /></i></label>
                    <p>{tryOnResult.metrics.message}</p>
                    {tryOnResult.imageDataUrl && tryOnResult.metrics.accepted ? <button type="button" onClick={downloadResult}><Download size={15} /> Sonucu indir</button> : null}
                  </div>
                ) : null}
                <div className="truth-note"><ShieldCheck size={17} /><p>Sonuç bir <strong>dijital simülasyondur.</strong> Beden seçimi için gerçek ölçü tablosu esas alınır.</p></div>
              </aside>
            </form>
          ) : null}

          {mode === "ar" ? (
            <div className="studio-layout">
              <div className="visual-panel ar-panel">
                {currentModelUrl ? (
                  <model-viewer
                    src={currentModelUrl}
                    alt="3D ürün modeli"
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    exposure="1"
                    loading="eager"
                    className="model-viewer"
                  >
                    <button slot="ar-button" className="ar-launch"><Camera size={17} /> Kamerayla ortamında gör</button>
                  </model-viewer>
                ) : (
                  <div className="empty-stage">
                    <span><Box size={34} /></span><h3>GLB ürün modelini ekle</h3><p>Çanta, ayakkabı, gözlük ve dekorasyon gibi sert formlu ürünleri serbest açıyla döndür ve desteklenen telefonda AR ile yerleştir.</p>
                    <label className="button button-gold"><Upload size={17} /> GLB dosyası seç<input hidden type="file" accept=".glb,model/gltf-binary" onChange={loadGlb} /></label>
                  </div>
                )}
              </div>
              <aside className="control-panel">
                <div className="panel-title"><span>3D ÜRÜN MODU</span><strong>WebAR</strong></div>
                <label className="compact-upload"><Upload size={16} /> Yerel GLB dosyası yükle<input hidden type="file" accept=".glb,model/gltf-binary" onChange={loadGlb} /></label>
                <label className="field-label">GLB dosya adresi<input type="url" value={glbUrl} onChange={(event) => { setGlbUrl(event.target.value); if (localGlbUrl) { URL.revokeObjectURL(localGlbUrl); setLocalGlbUrl(null); } }} placeholder="https://.../urun.glb" /></label>
                <div className="ar-features">
                  <span><Maximize2 size={16} /> Serbest 360° döndürme</span>
                  <span><Camera size={16} /> Android Scene Viewer / iOS Quick Look</span>
                  <span><ShieldCheck size={16} /> Uygulama yüklemeden tarayıcıdan</span>
                </div>
                <div className="truth-note neutral"><CircleAlert size={17} /><p>Gerçek boyutlu AR için GLB modelinin fiziksel ölçüleri doğru hazırlanmış olmalıdır.</p></div>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
