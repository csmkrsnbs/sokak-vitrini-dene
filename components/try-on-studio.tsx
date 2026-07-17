"use client";

import {
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  Download,
  Gem,
  History,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Share2,
  Shirt,
  Sofa,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { CreditAccess } from "@/components/credit-access";
import { CATEGORY_CONFIG } from "@/lib/categories";
import type {
  AccessState,
  ApiErrorBody,
  PreviewCategory,
  PreviewListItem,
  PreviewProviderStatus,
  PreviewResponse,
  PreviewStatusResponse,
} from "@/lib/types";

const categoryIcons = {
  jewelry: Gem,
  clothing: Shirt,
  furniture: Sofa,
  car: CarFront,
} satisfies Record<PreviewCategory, typeof Gem>;

const MAX_RAW_FILE_BYTES = 20_000_000;
const MAX_UPLOAD_BYTES = 1_800_000;
const DIRECT_UPLOAD_TYPES = new Set(["image/jpeg"]);
const MAX_DIRECT_UPLOAD_DIMENSION = 4096;

type SelectedImage = {
  file: File;
  previewUrl: string;
};

type Notice = {
  kind: "error" | "success";
  text: string;
} | null;

type LoadingStage = "submitting" | "queued" | "running";

const loadingMessages = [
  "Ürün ayrıntıları inceleniyor…",
  "Açı ve perspektif eşleştiriliyor…",
  "Işık ve gölgeler uyarlanıyor…",
  "Gerçekçi önizleme hazırlanıyor…",
];

function loadingStageFor(status: PreviewProviderStatus | null): LoadingStage {
  return status === "IN_PROGRESS" || status === "RUNNING" ? "running" : "queued";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function loadBrowserImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Fotoğraf açılamadı."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Fotoğraf hazırlanamadı."))),
      "image/jpeg",
      quality,
    );
  });
}

async function prepareImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Lütfen bir fotoğraf seçin.");
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error("Fotoğraf en fazla 20 MB olabilir.");
  }

  const source = await loadBrowserImage(file);
  const maxDimension = 1600;

  if (
    DIRECT_UPLOAD_TYPES.has(file.type) &&
    file.size <= MAX_UPLOAD_BYTES &&
    Math.max(source.width, source.height) <= MAX_DIRECT_UPLOAD_DIMENSION
  ) {
    return file;
  }

  const ratio = Math.min(1, maxDimension / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * ratio));
  const height = Math.max(1, Math.round(source.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Fotoğraf hazırlanamadı.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  let blob = await canvasToBlob(canvas, 0.9);
  if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToBlob(canvas, 0.78);
  if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToBlob(canvas, 0.66);

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Fotoğraf sıkıştırılamadı. Daha küçük bir fotoğraf seçin.");
  }

  const safeName = file.name.replace(/\.[^.]+$/, "") || "fotograf";
  return new File([blob], `${safeName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function readApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiRequestError(
    payload?.error?.code || "REQUEST_FAILED",
    payload?.error?.message || "İşlem tamamlanamadı. Lütfen yeniden deneyin.",
  );
}

function UploadCard({
  id,
  step,
  label,
  hint,
  image,
  onSelect,
  onRemove,
  disabled,
}: {
  id: string;
  step: string;
  label: string;
  hint: string;
  image: SelectedImage | null;
  onSelect: (file: File) => Promise<void>;
  onRemove: () => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const select = async (file: File | undefined) => {
    if (!file) return;
    setPreparing(true);
    try {
      await onSelect(file);
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void select(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled && !preparing) void select(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="upload-block">
      <div className="upload-heading">
        <span>{step}</span>
        <div>
          <h3>{label}</h3>
          <p>{hint}</p>
        </div>
      </div>

      <div
        className={`upload-zone ${image ? "has-image" : ""} ${dragging ? "is-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={disabled || preparing}
          onChange={onInputChange}
        />

        {image ? (
          <>
            {/* Kullanıcının yerel ve geçici önizlemesi; Next Image uygun değildir. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.previewUrl} alt={`${label} önizlemesi`} />
            <div className="upload-image-overlay">
              <button
                type="button"
                className="icon-button"
                onClick={onRemove}
                aria-label={`${label} fotoğrafını kaldır`}
                disabled={disabled}
              >
                <X size={18} />
              </button>
              <label className="replace-button" htmlFor={id}>
                <RefreshCw size={15} /> Değiştir
              </label>
            </div>
            <span className="upload-complete">
              <Check size={15} /> Hazır
            </span>
          </>
        ) : (
          <label className="upload-empty" htmlFor={id}>
            {preparing ? (
              <LoaderCircle className="spin" size={26} />
            ) : (
              <ImagePlus size={28} strokeWidth={1.5} />
            )}
            <strong>{preparing ? "Fotoğraf hazırlanıyor…" : "Fotoğraf çek veya yükle"}</strong>
            <span>JPG, PNG veya WEBP · en fazla 1,8 MB</span>
            <em>
              <Upload size={14} /> Dosya seç
            </em>
          </label>
        )}
      </div>
    </div>
  );
}

export function TryOnStudio() {
  const [category, setCategory] = useState<PreviewCategory>("jewelry");
  const [product, setProduct] = useState<SelectedImage | null>(null);
  const [target, setTarget] = useState<SelectedImage | null>(null);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("submitting");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewListItem | null>(null);
  const [history, setHistory] = useState<PreviewListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [access, setAccess] = useState<AccessState | null>(null);
  const [packageOpen, setPackageOpen] = useState(false);
  const productRef = useRef<SelectedImage | null>(null);
  const targetRef = useRef<SelectedImage | null>(null);
  const config = CATEGORY_CONFIG[category];
  const loadingTitle =
    loadingStage === "submitting"
      ? "Fotoğraflar güvenli şekilde gönderiliyor…"
      : loadingStage === "queued"
        ? "Uygun GPU sırası bekleniyor…"
        : loadingMessages[loadingIndex];
  const loadingDescription =
    loadingStage === "queued"
      ? "Yoğunluğa göre bekleme uzayabilir. Sayfayı yenilesen de işlem kaldığı yerden izlenir."
      : loadingStage === "running"
        ? "GPU çalışıyor; gerçekçi önizlemen oluşturuluyor."
        : "İşlem kaydı oluşturuluyor; bu adım kısa sürer.";
  const loadingProgress =
    loadingStage === "submitting"
      ? 18
      : loadingStage === "queued"
        ? 36
        : Math.min(94, 58 + loadingIndex * 11);

  useEffect(() => {
    if (!loading || loadingStage !== "running") return;
    const timer = window.setInterval(() => {
      setLoadingIndex((current) => Math.min(current + 1, loadingMessages.length - 1));
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [loading, loadingStage]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const accessResponse = await fetch("/api/access", { cache: "no-store" });
        if (!accessResponse.ok) throw await readApiError(accessResponse);
        const accessPayload = (await accessResponse.json()) as { access: AccessState };
        if (active) setAccess(accessPayload.access);
      } catch {
        // Ana deneme akışını bağlantı sorunu yüzünden engelleme.
      }

      try {
        const historyResponse = await fetch("/api/previews", { cache: "no-store" });
        if (!historyResponse.ok) throw new Error("History unavailable");
        const payload = (await historyResponse.json()) as { previews: PreviewListItem[] };
        if (!active) return;

        const previews = payload.previews ?? [];
        setHistory(previews.filter((item) => item.status === "completed"));
        const pending = previews.find((item) => item.status === "processing");
        if (pending) {
          setActivePreviewId(pending.id);
          setLoadingStage(loadingStageFor(pending.providerStatus));
          setLoading(true);
        }
        setHistoryAvailable(true);
      } catch {
        if (active) setHistoryAvailable(false);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activePreviewId) return;

    let stopped = false;
    let timer: number | undefined;
    let connectionWarningShown = false;

    const schedule = (delay: number) => {
      timer = window.setTimeout(() => void poll(), delay);
    };

    const poll = async () => {
      try {
        const response = await fetch(`/api/previews/${activePreviewId}`, {
          cache: "no-store",
        });
        if (!response.ok) throw await readApiError(response);
        const payload = (await response.json()) as PreviewStatusResponse;
        if (stopped) return;

        connectionWarningShown = false;
        setAccess(payload.access);

        if (payload.preview.status === "processing") {
          setLoading(true);
          setLoadingStage(loadingStageFor(payload.preview.providerStatus));
          schedule(3_000);
          return;
        }

        setActivePreviewId(null);
        setLoading(false);

        if (payload.preview.status === "completed") {
          setResult(payload.preview);
          setHistory((current) =>
            [
              payload.preview,
              ...current.filter((item) => item.id !== payload.preview.id),
            ].slice(0, 12),
          );
          setHistoryAvailable(true);
          setNotice({ kind: "success", text: "Önizlemen hazır." });
          window.setTimeout(() => {
            document
              .getElementById("sonuc")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
          return;
        }

        setNotice({
          kind: "error",
          text:
            payload.terminalError?.message ||
            "Görsel hazırlanamadı. Kullanım hakkınız iade edildi.",
        });
      } catch {
        if (stopped) return;
        if (!connectionWarningShown) {
          connectionWarningShown = true;
          setNotice({
            kind: "error",
            text: "Durum bağlantısı geçici olarak kesildi; işlem arka planda devam ediyor.",
          });
        }
        schedule(5_000);
      }
    };

    schedule(1_500);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [activePreviewId]);

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    return () => {
      if (productRef.current) URL.revokeObjectURL(productRef.current.previewUrl);
      if (targetRef.current) URL.revokeObjectURL(targetRef.current.previewUrl);
    };
  }, []);

  const chooseImage = async (
    file: File,
    current: SelectedImage | null,
    setter: (value: SelectedImage | null) => void,
  ) => {
    try {
      const prepared = await prepareImage(file);
      if (current) URL.revokeObjectURL(current.previewUrl);
      setter({ file: prepared, previewUrl: URL.createObjectURL(prepared) });
      setResult(null);
      setNotice(null);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Fotoğraf hazırlanamadı.",
      });
    }
  };

  const removeImage = (
    current: SelectedImage | null,
    setter: (value: SelectedImage | null) => void,
  ) => {
    if (current) URL.revokeObjectURL(current.previewUrl);
    setter(null);
    setResult(null);
  };

  const changeCategory = (value: PreviewCategory) => {
    if (loading || value === category) return;
    setCategory(value);
    setResult(null);
    setNote("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!product || !target) {
      setNotice({ kind: "error", text: "İki fotoğrafı da eklemelisiniz." });
      return;
    }
    if (!consent) {
      setNotice({
        kind: "error",
        text: "Fotoğrafları kullanma iznini onaylamalısınız.",
      });
      return;
    }

    setLoadingIndex(0);
    setLoadingStage("submitting");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("category", category);
    formData.append("product", product.file);
    formData.append("target", target.file);
    formData.append("note", note.trim());
    formData.append("consent", "true");

    try {
      const response = await fetch("/api/previews", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw await readApiError(response);

      const payload = (await response.json()) as PreviewResponse;
      setAccess(payload.access);
      setHistoryAvailable(true);

      if (payload.preview.status === "completed") {
        setResult(payload.preview);
        setHistory((current) =>
          [
            payload.preview,
            ...current.filter((item) => item.id !== payload.preview.id),
          ].slice(0, 12),
        );
        setLoading(false);
        setNotice({ kind: "success", text: "Önizlemen hazır." });
        window.setTimeout(() => {
          document
            .getElementById("sonuc")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
        return;
      }

      setLoadingStage(loadingStageFor(payload.preview.providerStatus));
      setActivePreviewId(payload.preview.id);
    } catch (error) {
      setLoading(false);
      if (
        error instanceof ApiRequestError &&
        (error.code === "CREDITS_REQUIRED" ||
          error.code === "VPN_FREE_TRIAL_BLOCKED")
      ) {
        setPackageOpen(true);
      }
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Önizleme hazırlanamadı.",
      });
    }
  };

  const fetchResultBlob = async (item: PreviewListItem) => {
    if (!item.imageUrl) throw new Error("Görsel bulunamadı.");
    const response = await fetch(item.imageUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Görsel alınamadı.");
    return response.blob();
  };

  const downloadResult = async (item: PreviewListItem) => {
    try {
      const blob = await fetchResultBlob(item);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sokak-vitrini-${CATEGORY_CONFIG[item.category].shortLabel.toLocaleLowerCase("tr-TR")}.webp`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Görsel indirilemedi.",
      });
    }
  };

  const shareResult = async (item: PreviewListItem) => {
    try {
      const blob = await fetchResultBlob(item);
      const file = new File([blob], "sokak-vitrini-deneme.webp", { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Sokak Vitrini Dene",
          text: "Vitrinde gördüğümü, hayatımda gördüm.",
          files: [file],
        });
        return;
      }
      await downloadResult(item);
      setNotice({
        kind: "success",
        text: "Paylaşım desteklenmediği için görsel indirildi.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice({ kind: "error", text: "Görsel paylaşılamadı." });
    }
  };

  const deleteResult = async (item: PreviewListItem) => {
    if (!window.confirm("Bu önizlemeyi kalıcı olarak silmek istiyor musun?")) return;
    try {
      const response = await fetch(`/api/previews/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw await readApiError(response);
      setHistory((current) => current.filter((entry) => entry.id !== item.id));
      if (result?.id === item.id) setResult(null);
      setNotice({ kind: "success", text: "Önizleme silindi." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Önizleme silinemedi.",
      });
    }
  };

  const resetForm = () => {
    removeImage(product, setProduct);
    removeImage(target, setTarget);
    setNote("");
    setConsent(false);
    setResult(null);
    document.getElementById("dene")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="studio-section" id="dene">
        <div className="container">
          <div className="section-heading studio-section-heading">
            <span className="section-kicker">Şimdi dene</span>
            <h2>Gördüğünü kendi dünyana taşı</h2>
            <p>Ürün türünü seç, iki fotoğraf yükle ve sonucu gör.</p>
          </div>

          <CreditAccess
            access={access}
            open={packageOpen}
            onOpenChange={setPackageOpen}
            onAccessChange={setAccess}
          />

          <div className="studio-shell">
            <div className="studio-tabs" role="tablist" aria-label="Ürün türü">
              {(Object.keys(CATEGORY_CONFIG) as PreviewCategory[]).map((item) => {
                const Icon = categoryIcons[item];
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={category === item}
                    className={category === item ? "active" : ""}
                    key={item}
                    onClick={() => changeCategory(item)}
                    disabled={loading}
                  >
                    <Icon size={19} strokeWidth={1.7} />
                    {CATEGORY_CONFIG[item].label}
                  </button>
                );
              })}
            </div>

            <div className="studio-body">
              <form className="studio-form" onSubmit={submit}>
                <div className="studio-form-title">
                  <span className="studio-form-icon">
                    {(() => {
                      const Icon = categoryIcons[category];
                      return <Icon size={23} strokeWidth={1.6} />;
                    })()}
                  </span>
                  <div>
                    <h3>{config.title}</h3>
                    <p>{config.description}</p>
                  </div>
                </div>

                <div className="uploads-grid">
                  <UploadCard
                    id="product-image"
                    step="1"
                    label={config.productLabel}
                    hint={config.productHint}
                    image={product}
                    onSelect={(file) => chooseImage(file, product, setProduct)}
                    onRemove={() => removeImage(product, setProduct)}
                    disabled={loading}
                  />
                  <UploadCard
                    id="target-image"
                    step="2"
                    label={config.targetLabel}
                    hint={config.targetHint}
                    image={target}
                    onSelect={(file) => chooseImage(file, target, setTarget)}
                    onRemove={() => removeImage(target, setTarget)}
                    disabled={loading}
                  />
                </div>

                <div className="note-field">
                  <label htmlFor="placement-note">
                    Kendi yerleşim notun <em>isteğe bağlı</em>
                  </label>
                  <div className="note-suggestions" aria-label={`${config.label} için hazır yerleşim notları`}>
                    <strong>Hazır notlardan seç</strong>
                    <div>
                      {config.noteSuggestions.map((suggestion) => (
                        <button
                          type="button"
                          className={note === suggestion ? "active" : ""}
                          aria-pressed={note === suggestion}
                          onClick={() => setNote(suggestion)}
                          disabled={loading}
                          key={suggestion}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="placement-note"
                    value={note}
                    maxLength={300}
                    rows={2}
                    placeholder={config.notePlaceholder}
                    onChange={(event) => setNote(event.target.value)}
                    disabled={loading}
                  />
                  <small>{note.length}/300</small>
                </div>

                <label className="consent-row">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    disabled={loading}
                  />
                  <span className="custom-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                  <span>
                    Bu fotoğrafları kullanma hakkım veya fotoğraftaki kişinin açık izni var.
                  </span>
                </label>

                <button
                  className="button button-gold studio-submit"
                  type="submit"
                  disabled={loading || !product || !target}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="spin" size={19} />
                      {loadingStage === "queued"
                        ? "GPU sırası bekleniyor"
                        : loadingStage === "submitting"
                          ? "Fotoğraflar gönderiliyor"
                          : "Önizleme hazırlanıyor"}
                    </>
                  ) : (
                    <>
                      <WandSparkles size={19} />
                      Yapay zekâyla üzerinde gör
                    </>
                  )}
                </button>
                <p className="form-privacy-note">
                  <LockKeyhole size={14} /> Ürün ve hedef fotoğrafların uygulamada kalıcı olarak saklanmaz.
                </p>
              </form>

              <div className="result-panel" id="sonuc">
                {loading ? (
                  <div className="result-loading" aria-live="polite">
                    <div className="loading-orbit">
                      <span />
                      <Sparkles size={34} />
                    </div>
                    <span className="section-kicker">
                      {loadingStage === "queued" ? "GPU hazırlanıyor" : "Yapay zekâ çalışıyor"}
                    </span>
                    <h3>{loadingTitle}</h3>
                    <p>{loadingDescription}</p>
                    <div className="loading-progress">
                      <i style={{ width: `${loadingProgress}%` }} />
                    </div>
                  </div>
                ) : result?.imageUrl ? (
                  <div className="result-ready">
                    <div className="result-image-wrap">
                      {/* API tarafından kullanıcıya özel üretilen dinamik görsel. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.imageUrl} alt="Yapay zekâ ile oluşturulan ürün önizlemesi" />
                      <span className="result-badge">
                        <CheckCircle2 size={15} /> Önizleme hazır
                      </span>
                    </div>
                    <div className="result-actions">
                      <button
                        type="button"
                        className="button button-light"
                        onClick={() => void downloadResult(result)}
                      >
                        <Download size={17} /> İndir
                      </button>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => void shareResult(result)}
                      >
                        <Share2 size={17} /> Paylaş
                      </button>
                      <button type="button" className="button button-ghost" onClick={resetForm}>
                        <RefreshCw size={17} /> Yeni deneme
                      </button>
                    </div>
                    <p className="result-disclaimer">
                      Bu bir yapay zekâ önizlemesidir; ölçü, renk ve uyum gerçek üründe farklılık gösterebilir.
                    </p>
                  </div>
                ) : (
                  <div className="result-empty">
                    <div className="result-placeholder-art" aria-hidden="true">
                      <span className="placeholder-photo placeholder-photo-one">
                        <Camera size={27} />
                      </span>
                      <span className="placeholder-spark">
                        <Sparkles size={24} />
                      </span>
                      <span className="placeholder-photo placeholder-photo-two">
                        <WandSparkles size={29} />
                      </span>
                    </div>
                    <span className="section-kicker">Sonucun burada görünecek</span>
                    <h3>İki fotoğraf, tek gerçekçi önizleme</h3>
                    <p>Soldaki adımları tamamla ve vitrinde gördüğünü kendi hayatında gör.</p>
                    <ul>
                      <li>
                        <Check size={15} /> Ürün ayrıntıları korunur
                      </li>
                      <li>
                        <Check size={15} /> Perspektif ve ışık eşleşir
                      </li>
                      <li>
                        <Check size={15} /> Sonuç yalnızca sana görünür
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="history-section" id="gecmis">
        <div className="container">
          <div className="history-heading">
            <div>
              <span className="section-kicker">Sana özel</span>
              <h2>Son denemelerin</h2>
            </div>
            {history.length > 0 && (
              <span className="history-count">
                <History size={16} /> {history.length} önizleme
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="history-loading">
              <LoaderCircle className="spin" size={22} /> Geçmiş yükleniyor…
            </div>
          ) : history.length > 0 ? (
            <div className="history-grid">
              {history.map((item) => (
                <article className="history-card" key={item.id}>
                  <div className="history-image">
                    {/* Kullanıcıya özel dinamik API görseli. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl ?? ""} alt={`${CATEGORY_CONFIG[item.category].label} önizlemesi`} />
                    <span>{CATEGORY_CONFIG[item.category].label}</span>
                    <button
                      type="button"
                      className="history-delete"
                      onClick={() => void deleteResult(item)}
                      aria-label="Önizlemeyi sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="history-card-body">
                    <div>
                      <strong>{CATEGORY_CONFIG[item.category].title}</strong>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                    <div className="history-actions">
                      <button type="button" onClick={() => void downloadResult(item)} aria-label="İndir">
                        <Download size={17} />
                      </button>
                      <button type="button" onClick={() => void shareResult(item)} aria-label="Paylaş">
                        <Share2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <span>
                <History size={25} />
              </span>
              <div>
                <h3>{historyAvailable ? "Henüz bir denemen yok" : "Geçmiş şu anda kullanılamıyor"}</h3>
                <p>
                  {historyAvailable
                    ? "İlk önizlemeni oluşturduğunda burada görebileceksin."
                    : "Canlı ortam bağlantıları tamamlandığında sonuçların burada görünecek."}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {notice && (
        <div className={`toast toast-${notice.kind}`} role="status" aria-live="polite">
          {notice.kind === "success" ? <CheckCircle2 size={19} /> : <X size={19} />}
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Bildirimi kapat">
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
