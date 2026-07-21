"use client";

import {
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  Download,
  Gem,
  Glasses,
  Handbag,
  Heart,
  History,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Save,
  Share2,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CreditAccess } from "@/components/credit-access";
import {
  CATEGORY_CONFIG,
  CLOTHING_TYPE_CONFIG,
  GARMENT_PHOTO_TYPE_CONFIG,
  PREVIEW_MODE_CONFIG,
  PRODUCT_KIND_CONFIG,
  PRODUCT_KINDS_BY_CATEGORY,
} from "@/lib/categories";
import type {
  AccessState,
  ApiErrorBody,
  ClothingType,
  GarmentPhotoType,
  PreviewCategory,
  PreviewListItem,
  PreviewMode,
  PreviewProviderStatus,
  PreviewStatusResponse,
  ProductKind,
} from "@/lib/types";

const categoryIcons = {
  clothing: Shirt,
  jewelry: Gem,
  shoes: ShoppingBag,
  bag: Handbag,
  accessory: Glasses,
} satisfies Record<PreviewCategory, typeof Shirt>;

const MAX_RAW_FILE_BYTES = 20_000_000;
const MAX_UPLOAD_BYTES = 1_800_000;
const MAX_DIRECT_UPLOAD_DIMENSION = 4096;
const FAVORITES_KEY = "sv-dene-favorites-v1";
const PROFILE_META_KEY = "sv-dene-profile-meta-v1";
const PROFILE_DB_NAME = "sv-dene-profile-db";
const PROFILE_STORE = "profile";
const PROFILE_PHOTO_KEY = "photo";

const loadingMessages = [
  "Ürün ayrıntıları inceleniyor…",
  "Kişi ve ürün geometrisi eşleştiriliyor…",
  "Doku, ışık ve gölgeler uyarlanıyor…",
  "Gerçekçi önizleme hazırlanıyor…",
];

type SelectedImage = {
  file: File;
  previewUrl: string;
};

type Notice = {
  kind: "error" | "success";
  text: string;
} | null;

type LoadingStage = "submitting" | "queued" | "running";

type SavedProfile = {
  file: File;
  previewUrl: string;
  savedAt: string;
};

class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function loadingStageFor(status: PreviewProviderStatus | null): LoadingStage {
  return status === "PROCESSING" || status === "RUNNING" || status === "IN_PROGRESS"
    ? "running"
    : "queued";
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
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Fotoğraf hazırlanamadı.")),
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
  if (
    file.type === "image/jpeg" &&
    file.size <= MAX_UPLOAD_BYTES &&
    Math.max(source.width, source.height) <= MAX_DIRECT_UPLOAD_DIMENSION
  ) {
    return file;
  }

  const ratio = Math.min(1, 1600 / Math.max(source.width, source.height));
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

async function readApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiRequestError(
    payload?.error?.code || "REQUEST_FAILED",
    payload?.error?.message || "İşlem tamamlanamadı. Lütfen yeniden deneyin.",
  );
}

function openProfileDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PROFILE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Profil alanı açılamadı."));
  });
}

async function saveProfileFile(file: File) {
  const db = await openProfileDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(PROFILE_STORE, "readwrite");
    transaction.objectStore(PROFILE_STORE).put(file, PROFILE_PHOTO_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Profil kaydedilemedi."));
  });
  db.close();
}

async function loadProfileFile() {
  const db = await openProfileDb();
  const value = await new Promise<Blob | undefined>((resolve, reject) => {
    const transaction = db.transaction(PROFILE_STORE, "readonly");
    const request = transaction.objectStore(PROFILE_STORE).get(PROFILE_PHOTO_KEY);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error ?? new Error("Profil okunamadı."));
  });
  db.close();
  if (!value) return null;
  return new File([value], "dijital-profil.jpg", {
    type: value.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

async function removeProfileFile() {
  const db = await openProfileDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(PROFILE_STORE, "readwrite");
    transaction.objectStore(PROFILE_STORE).delete(PROFILE_PHOTO_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Profil silinemedi."));
  });
  db.close();
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
  const [mode, setMode] = useState<PreviewMode>("personal");
  const [category, setCategory] = useState<PreviewCategory>("clothing");
  const [productKind, setProductKind] = useState<ProductKind>("shirt");
  const [clothingType, setClothingType] = useState<ClothingType>("tops");
  const [garmentPhotoType, setGarmentPhotoType] =
    useState<GarmentPhotoType>("auto");
  const [product, setProduct] = useState<SelectedImage | null>(null);
  const [target, setTarget] = useState<SelectedImage | null>(null);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [safetyConsent, setSafetyConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("submitting");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewListItem | null>(null);
  const [history, setHistory] = useState<PreviewListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [access, setAccess] = useState<AccessState | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const productRef = useRef<SelectedImage | null>(null);
  const targetRef = useRef<SelectedImage | null>(null);
  const savedProfileRef = useRef<SavedProfile | null>(null);

  const config = CATEGORY_CONFIG[category];
  const modeConfig = PREVIEW_MODE_CONFIG[mode];
  const availableKinds = PRODUCT_KINDS_BY_CATEGORY[category];
  const hasCouponCredit = (access?.coupon?.remaining ?? 0) > 0;
  const visibleHistory = useMemo(
    () => (favoritesOnly ? history.filter((item) => favorites.has(item.id)) : history),
    [favorites, favoritesOnly, history],
  );

  const loadingTitle =
    loadingStage === "submitting"
      ? "Fotoğraflar güvenli şekilde gönderiliyor…"
      : loadingStage === "queued"
        ? "Görsel servisi işlemi hazırlıyor…"
        : loadingMessages[loadingIndex];
  const loadingDescription =
    loadingStage === "queued"
      ? "İşlem sıraya alındı. Sayfayı yenilesen de sonuç geçmişinde izlenir."
      : loadingStage === "running"
        ? mode === "studio"
          ? "Ürün ayrıntıları korunarak katalog görseli oluşturuluyor."
          : "Ürün, dijital profilindeki poz ve ışığa uyarlanıyor."
        : "İşlem kaydı oluşturuluyor.";
  const loadingProgress =
    loadingStage === "submitting"
      ? 18
      : loadingStage === "queued"
        ? 38
        : Math.min(94, 58 + loadingIndex * 11);

  useEffect(() => {
    productRef.current = product;
  }, [product]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    savedProfileRef.current = savedProfile;
  }, [savedProfile]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const metaRaw = window.localStorage.getItem(PROFILE_META_KEY);
        if (!metaRaw) return;
        const meta = JSON.parse(metaRaw) as { savedAt?: string };
        const file = await loadProfileFile();
        if (!active || !file) return;
        setSavedProfile({
          file,
          previewUrl: URL.createObjectURL(file),
          savedAt: meta.savedAt || new Date().toISOString(),
        });
      } catch {
        window.localStorage.removeItem(PROFILE_META_KEY);
      } finally {
        if (active) setProfileLoading(false);
      }
    };
    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading || loadingStage !== "running") return;
    const timer = window.setInterval(() => {
      setLoadingIndex((current) => Math.min(current + 1, loadingMessages.length - 1));
    }, 7_000);
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
        // Ekranı bağlantı sorunu yüzünden kilitleme.
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
          setMode(pending.mode);
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
    let warned = false;

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
        warned = false;
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
          setMode(payload.preview.mode);
          setHistory((current) =>
            [payload.preview, ...current.filter((item) => item.id !== payload.preview.id)].slice(0, 12),
          );
          setHistoryAvailable(true);
          setNotice({ kind: "success", text: "Önizlemen hazır." });
          window.setTimeout(() => {
            document.getElementById("sonuc")?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
          return;
        }

        setNotice({
          kind: "error",
          text: payload.terminalError?.message || "Görsel hazırlanamadı. Kullanım hakkınız iade edildi.",
        });
      } catch {
        if (stopped) return;
        if (!warned) {
          warned = true;
          setNotice({
            kind: "error",
            text: "Durum bağlantısı geçici olarak kesildi; işlem arka planda devam ediyor.",
          });
        }
        schedule(5_000);
      }
    };

    schedule(1_200);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [activePreviewId]);

  useEffect(() => {
    return () => {
      if (productRef.current) URL.revokeObjectURL(productRef.current.previewUrl);
      if (targetRef.current) URL.revokeObjectURL(targetRef.current.previewUrl);
      if (savedProfileRef.current) URL.revokeObjectURL(savedProfileRef.current.previewUrl);
    };
  }, []);

  const setSelectedImage = async (
    file: File,
    current: SelectedImage | null,
    setter: (image: SelectedImage | null) => void,
  ) => {
    try {
      const prepared = await prepareImage(file);
      if (current) URL.revokeObjectURL(current.previewUrl);
      setter({ file: prepared, previewUrl: URL.createObjectURL(prepared) });
      setNotice(null);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Fotoğraf hazırlanamadı.",
      });
    }
  };

  const removeSelectedImage = (
    current: SelectedImage | null,
    setter: (image: SelectedImage | null) => void,
  ) => {
    if (current) URL.revokeObjectURL(current.previewUrl);
    setter(null);
  };

  const changeCategory = (next: PreviewCategory) => {
    setCategory(next);
    const first = PRODUCT_KINDS_BY_CATEGORY[next][0];
    setProductKind(first);
    setClothingType(PRODUCT_KIND_CONFIG[first].clothingType);
    setNote("");
    setResult(null);
  };

  const changeProductKind = (next: ProductKind) => {
    setProductKind(next);
    setClothingType(PRODUCT_KIND_CONFIG[next].clothingType);
  };

  const saveDigitalProfile = async () => {
    if (!target) return;
    try {
      await saveProfileFile(target.file);
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(PROFILE_META_KEY, JSON.stringify({ savedAt }));
      if (savedProfile) URL.revokeObjectURL(savedProfile.previewUrl);
      setSavedProfile({
        file: target.file,
        previewUrl: URL.createObjectURL(target.file),
        savedAt,
      });
      setNotice({ kind: "success", text: "Dijital profil bu cihazda kaydedildi." });
    } catch {
      setNotice({ kind: "error", text: "Dijital profil bu cihazda kaydedilemedi." });
    }
  };

  const useDigitalProfile = () => {
    if (!savedProfile) return;
    if (target) URL.revokeObjectURL(target.previewUrl);
    setTarget({
      file: savedProfile.file,
      previewUrl: URL.createObjectURL(savedProfile.file),
    });
    setNotice({ kind: "success", text: "Dijital profil fotoğrafı seçildi." });
  };

  const deleteDigitalProfile = async () => {
    try {
      await removeProfileFile();
      window.localStorage.removeItem(PROFILE_META_KEY);
      if (savedProfile) URL.revokeObjectURL(savedProfile.previewUrl);
      setSavedProfile(null);
      setNotice({ kind: "success", text: "Dijital profil bu cihazdan silindi." });
    } catch {
      setNotice({ kind: "error", text: "Dijital profil silinemedi." });
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const resetForm = () => {
    removeSelectedImage(product, setProduct);
    if (mode === "studio") removeSelectedImage(target, setTarget);
    setNote("");
    setResult(null);
    setConsent(false);
    setSafetyConsent(false);
    setLoadingIndex(0);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || (mode === "personal" && !target)) {
      setNotice({ kind: "error", text: "Gerekli fotoğrafları ekleyin." });
      return;
    }
    if (!consent || !safetyConsent) {
      setNotice({ kind: "error", text: "İzin ve içerik onaylarını tamamlayın." });
      return;
    }
    if (access && !hasCouponCredit) {
      setCouponOpen(true);
      return;
    }

    setLoading(true);
    setLoadingStage("submitting");
    setLoadingIndex(0);
    setResult(null);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.set("mode", mode);
      formData.set("category", category);
      formData.set("productKind", productKind);
      formData.set("clothingType", clothingType);
      formData.set("garmentPhotoType", garmentPhotoType);
      formData.set("product", product.file);
      if (mode === "personal" && target) formData.set("target", target.file);
      formData.set("note", note);
      formData.set("consent", String(consent));
      formData.set("safetyConsent", String(safetyConsent));

      const response = await fetch("/api/previews", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw await readApiError(response);
      const payload = (await response.json()) as {
        preview: PreviewListItem;
        access: AccessState;
      };
      setAccess(payload.access);

      if (payload.preview.status === "completed") {
        setLoading(false);
        setResult(payload.preview);
        setHistory((current) => [payload.preview, ...current].slice(0, 12));
        setNotice({ kind: "success", text: "Önizlemen hazır." });
      } else {
        setActivePreviewId(payload.preview.id);
        setLoadingStage(loadingStageFor(payload.preview.providerStatus));
      }
    } catch (error) {
      setLoading(false);
      if (error instanceof ApiRequestError && error.code === "CREDITS_REQUIRED") {
        setCouponOpen(true);
      }
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "İşlem başlatılamadı.",
      });
    }
  };

  const downloadResult = async (item: PreviewListItem) => {
    if (!item.imageUrl) return;
    try {
      const response = await fetch(item.imageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sokak-vitrini-${item.productKind}-${item.id.slice(0, 8)}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ kind: "error", text: "Görsel indirilemedi." });
    }
  };

  const shareResult = async (item: PreviewListItem) => {
    if (!item.imageUrl) return;
    try {
      const response = await fetch(item.imageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const file = new File([blob], "sokak-vitrini-dene.jpg", { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Sokak Vitrini Dene",
          text: "Sokakta gördüğümü dijital olarak denedim.",
          files: [file],
        });
      } else {
        await downloadResult(item);
        setNotice({ kind: "success", text: "Paylaşım desteklenmediği için görsel indirildi." });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice({ kind: "error", text: "Görsel paylaşılamadı." });
    }
  };

  const deleteResult = async (item: PreviewListItem) => {
    try {
      const response = await fetch(`/api/previews/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw await readApiError(response);
      setHistory((current) => current.filter((row) => row.id !== item.id));
      if (result?.id === item.id) setResult(null);
      if (favorites.has(item.id)) toggleFavorite(item.id);
      setNotice({ kind: "success", text: "Önizleme silindi." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Önizleme silinemedi.",
      });
    }
  };

  return (
    <>
      <section className="studio-section" id="dene">
        <div className="container">
          <div className="section-heading studio-section-heading">
            <span className="section-kicker">Tek platform, iki gelir alanı</span>
            <h2>Kendinde dene veya üründen satış görseli üret.</h2>
            <p>
              Tüketici dijital profilinde ürün dener; işletme yalnız ürün fotoğrafıyla
              katalog ve sosyal medya görseli oluşturur.
            </p>
          </div>

          <div className="experience-switch" aria-label="Deneyim modu">
            {(Object.keys(PREVIEW_MODE_CONFIG) as PreviewMode[]).map((item) => {
              const Icon = item === "personal" ? UserRound : BriefcaseBusiness;
              return (
                <button
                  type="button"
                  key={item}
                  className={mode === item ? "active" : ""}
                  disabled={loading}
                  onClick={() => {
                    setMode(item);
                    setResult(null);
                    setNote("");
                  }}
                >
                  <Icon size={20} />
                  <span>
                    <strong>{PREVIEW_MODE_CONFIG[item].label}</strong>
                    <small>{PREVIEW_MODE_CONFIG[item].description}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <CreditAccess
            access={access}
            open={couponOpen}
            onOpenChange={setCouponOpen}
            onAccessChange={setAccess}
          />

          <div className="studio-shell">
            <div className="studio-tabs studio-tabs-five" role="tablist" aria-label="Ürün türü">
              {(Object.keys(CATEGORY_CONFIG) as PreviewCategory[]).map((item) => {
                const Icon = categoryIcons[item];
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={category === item}
                    className={category === item ? "active" : ""}
                    key={item}
                    disabled={loading}
                    onClick={() => changeCategory(item)}
                  >
                    <Icon size={19} /> {CATEGORY_CONFIG[item].shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="studio-body">
              <form className="studio-form" onSubmit={submit}>
                <div className="studio-form-title">
                  <span className="studio-form-icon">
                    {mode === "personal" ? <UserRound size={22} /> : <BriefcaseBusiness size={22} />}
                  </span>
                  <div>
                    <h3>{modeConfig.title}</h3>
                    <p>{config.description}</p>
                  </div>
                </div>

                <div className="vton-options">
                  <div className="vton-option-group">
                    <div className="vton-option-heading">
                      <strong>Ürün alt türü</strong>
                      <span>Motor ayarı otomatik yapılır</span>
                    </div>
                    <div className="product-kind-grid">
                      {availableKinds.map((kind) => (
                        <button
                          type="button"
                          key={kind}
                          className={productKind === kind ? "active" : ""}
                          disabled={loading}
                          onClick={() => changeProductKind(kind)}
                        >
                          {PRODUCT_KIND_CONFIG[kind].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {category === "clothing" && (
                    <>
                      <div className="vton-option-group">
                        <div className="vton-option-heading">
                          <strong>Giyim bölgesi</strong>
                          <span>{CLOTHING_TYPE_CONFIG[clothingType].description}</span>
                        </div>
                        <div className="vton-choice-grid vton-choice-grid-three">
                          {(Object.keys(CLOTHING_TYPE_CONFIG) as ClothingType[]).map((type) => (
                            <button
                              type="button"
                              key={type}
                              className={clothingType === type ? "active" : ""}
                              disabled={loading}
                              onClick={() => setClothingType(type)}
                            >
                              <strong>{CLOTHING_TYPE_CONFIG[type].label}</strong>
                              <span>{CLOTHING_TYPE_CONFIG[type].shortLabel}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="vton-option-group">
                        <div className="vton-option-heading">
                          <strong>Ürün fotoğrafı biçimi</strong>
                          <span>{GARMENT_PHOTO_TYPE_CONFIG[garmentPhotoType].description}</span>
                        </div>
                        <div className="vton-choice-grid vton-choice-grid-three">
                          {(Object.keys(GARMENT_PHOTO_TYPE_CONFIG) as GarmentPhotoType[]).map((type) => (
                            <button
                              type="button"
                              key={type}
                              className={garmentPhotoType === type ? "active" : ""}
                              disabled={loading}
                              onClick={() => setGarmentPhotoType(type)}
                            >
                              <strong>{GARMENT_PHOTO_TYPE_CONFIG[type].label}</strong>
                              <span>{type === "auto" ? "Önerilen" : type === "model" ? "Kişi üzerinde" : "Ürün tek başına"}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {mode === "personal" && (
                  <div className="digital-profile-card">
                    <div className="digital-profile-copy">
                      <span className="digital-profile-icon">
                        <UserRound size={21} />
                      </span>
                      <div>
                        <strong>Dijital profilim</strong>
                        <p>
                          Fotoğraf cihazında saklanır; sunucuya yalnız deneme sırasında geçici olarak gönderilir.
                        </p>
                      </div>
                    </div>

                    {profileLoading ? (
                      <span className="profile-loading"><LoaderCircle className="spin" size={16} /> Profil kontrol ediliyor</span>
                    ) : savedProfile ? (
                      <div className="saved-profile-row">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={savedProfile.previewUrl} alt="Kaydedilmiş dijital profil" />
                        <div>
                          <strong>Profil hazır</strong>
                          <small>{formatDate(savedProfile.savedAt)}</small>
                        </div>
                        <button type="button" onClick={useDigitalProfile} disabled={loading}>
                          <Check size={15} /> Kullan
                        </button>
                        <button
                          type="button"
                          className="profile-delete"
                          onClick={() => void deleteDigitalProfile()}
                          disabled={loading}
                          aria-label="Dijital profili sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="profile-empty-copy">Henüz bu cihazda kayıtlı profil yok.</span>
                    )}
                  </div>
                )}

                <div className={`uploads-grid ${mode === "studio" ? "uploads-grid-studio" : ""}`}>
                  <UploadCard
                    id="product-photo"
                    step="1"
                    label={config.productLabel}
                    hint={category === "clothing" ? CLOTHING_TYPE_CONFIG[clothingType].productHint : config.productHint}
                    image={product}
                    onSelect={(file) => setSelectedImage(file, product, setProduct)}
                    onRemove={() => removeSelectedImage(product, setProduct)}
                    disabled={loading}
                  />

                  {mode === "personal" ? (
                    <div>
                      <UploadCard
                        id="target-photo"
                        step="2"
                        label={config.targetLabel}
                        hint={category === "clothing" ? CLOTHING_TYPE_CONFIG[clothingType].targetHint : config.targetHint}
                        image={target}
                        onSelect={(file) => setSelectedImage(file, target, setTarget)}
                        onRemove={() => removeSelectedImage(target, setTarget)}
                        disabled={loading}
                      />
                      {target && (
                        <button
                          type="button"
                          className="save-profile-button"
                          onClick={() => void saveDigitalProfile()}
                          disabled={loading}
                        >
                          <Save size={15} /> Bu fotoğrafı dijital profilim olarak kaydet
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="studio-brief-card">
                      <span className="upload-heading-number">2</span>
                      <BriefcaseBusiness size={28} />
                      <strong>İşletme görseli hazırlanacak</strong>
                      <p>
                        Sistem ürünü yetişkin bir model üzerinde, 4:5 katalog ve Instagram gönderi oranında oluşturur.
                      </p>
                      <ul>
                        <li><Check size={14} /> Ürün rengi ve ayrıntıları korunur</li>
                        <li><Check size={14} /> Temiz premium stüdyo görünümü</li>
                        <li><Check size={14} /> Model fotoğrafı yüklemek gerekmez</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="note-field">
                  <label htmlFor="placement-note">
                    {mode === "studio" ? "Görsel yönlendirmesi" : "Kullanım biçimi"}
                    <em>isteğe bağlı</em>
                  </label>
                  <div className="note-suggestions">
                    <strong>Hazır yönlendirmeler</strong>
                    <div>
                      {(mode === "studio"
                        ? [
                            "Beyaz premium stüdyo fonu, doğal duruş.",
                            "Şehirli günlük stil, sade arka plan.",
                            "Lüks katalog çekimi, yumuşak ışık.",
                          ]
                        : config.noteSuggestions
                      ).map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion}
                          className={note === suggestion ? "active" : ""}
                          onClick={() => setNote(suggestion)}
                          disabled={loading}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="placement-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 300))}
                    placeholder={mode === "studio" ? "Örn. Beyaz stüdyo fonu, doğal poz, premium katalog çekimi" : config.notePlaceholder}
                    disabled={loading}
                    maxLength={300}
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
                  <span className="custom-check" aria-hidden="true"><Check size={14} /></span>
                  <span>
                    Ürün fotoğrafını kullanma hakkım var
                    {mode === "personal" ? " ve kişi fotoğrafı için açık izin aldım." : "."}
                  </span>
                </label>

                <label className="consent-row consent-row-secondary">
                  <input
                    type="checkbox"
                    checked={safetyConsent}
                    onChange={(event) => setSafetyConsent(event.target.checked)}
                    disabled={loading}
                  />
                  <span className="custom-check" aria-hidden="true"><Check size={14} /></span>
                  <span>
                    Görsellerdeki kişilerin 18 yaşından büyük olduğunu; açık çıplaklık,
                    cinsel eylem veya izinsiz kişi kullanımı bulunmadığını onaylıyorum.
                    Yetişkin bikini, mayo, iç giyim ve fantezi giyim ürünleri kullanılabilir. {" "}
                    <Link href="/kullanim-kosullari" target="_blank" rel="noopener noreferrer">
                      Kullanım kuralları
                    </Link>
                  </span>
                </label>

                <button
                  className="button button-gold studio-submit"
                  type="submit"
                  disabled={loading || !product || (mode === "personal" && !target) || !consent || !safetyConsent}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="spin" size={19} />
                      {loadingStage === "queued" ? "İşlem hazırlanıyor" : loadingStage === "submitting" ? "Fotoğraflar gönderiliyor" : "Görsel oluşturuluyor"}
                    </>
                  ) : (
                    <>
                      <WandSparkles size={19} />
                      {access && !hasCouponCredit
                        ? "Kupon etkinleştirerek kullan"
                        : mode === "studio"
                          ? "Üründen model görseli üret"
                          : "Dijital profilimde dene"}
                    </>
                  )}
                </button>
                <p className="form-privacy-note">
                  <LockKeyhole size={14} /> Girdiler veritabanında saklanmaz; yalnız sonuçlar sınırlı süre tutulur.
                </p>
              </form>

              <div className="result-panel" id="sonuc">
                {loading ? (
                  <div className="result-loading" aria-live="polite">
                    <div className="loading-orbit"><span /><Sparkles size={34} /></div>
                    <span className="section-kicker">Yapay zekâ çalışıyor</span>
                    <h3>{loadingTitle}</h3>
                    <p>{loadingDescription}</p>
                    <div className="loading-progress"><i style={{ width: `${loadingProgress}%` }} /></div>
                  </div>
                ) : result?.imageUrl ? (
                  <div className="result-ready">
                    <div className="result-image-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.imageUrl} alt="Yapay zekâ ile oluşturulan ürün önizlemesi" />
                      <span className="result-badge"><CheckCircle2 size={15} /> Önizleme hazır</span>
                      <button
                        type="button"
                        className={`result-favorite ${favorites.has(result.id) ? "active" : ""}`}
                        onClick={() => toggleFavorite(result.id)}
                        aria-label="Favoriye ekle"
                      >
                        <Heart size={18} fill={favorites.has(result.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="result-meta-line">
                      <span>{PREVIEW_MODE_CONFIG[result.mode].label}</span>
                      <strong>{PRODUCT_KIND_CONFIG[result.productKind].label}</strong>
                    </div>
                    <div className="result-actions">
                      <button type="button" className="button button-light" onClick={() => void downloadResult(result)}>
                        <Download size={17} /> İndir
                      </button>
                      <button type="button" className="button button-outline" onClick={() => void shareResult(result)}>
                        <Share2 size={17} /> Paylaş
                      </button>
                      <button type="button" className="button button-ghost" onClick={resetForm}>
                        <RefreshCw size={17} /> Yeni işlem
                      </button>
                    </div>
                    <p className="result-disclaimer">
                      Yapay zekâ önizlemesidir; gerçek ölçü, renk ve ürün uyumu farklılık gösterebilir.
                    </p>
                  </div>
                ) : (
                  <div className="result-empty">
                    <div className="result-placeholder-art" aria-hidden="true">
                      <span className="placeholder-photo placeholder-photo-one"><Camera size={27} /></span>
                      <span className="placeholder-spark"><Sparkles size={24} /></span>
                      <span className="placeholder-photo placeholder-photo-two"><WandSparkles size={29} /></span>
                    </div>
                    <span className="section-kicker">Sonucun burada görünecek</span>
                    <h3>{mode === "studio" ? "Üründen satışa hazır görsel" : "Tek profil, sınırsız ürün fikri"}</h3>
                    <p>
                      {mode === "studio"
                        ? "Ürün fotoğrafını yükle; yetişkin model üzerinde 4:5 katalog görseli oluştur."
                        : "Dijital profilini bir kez kaydet; giyim ve aksesuarları tekrar fotoğraf yüklemeden dene."}
                    </p>
                    <ul>
                      <li><Check size={15} /> Ürün ayrıntıları korunur</li>
                      <li><Check size={15} /> Sonuç yalnızca bu tarayıcıya görünür</li>
                      <li><Check size={15} /> Favori ve geçmiş yönetimi</li>
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
              <h2>Denemeler ve stüdyo görselleri</h2>
            </div>
            <div className="history-heading-actions">
              <button
                type="button"
                className={favoritesOnly ? "active" : ""}
                onClick={() => setFavoritesOnly((value) => !value)}
              >
                <Heart size={15} fill={favoritesOnly ? "currentColor" : "none"} /> Favoriler
              </button>
              {history.length > 0 && (
                <span className="history-count"><History size={16} /> {history.length} görsel</span>
              )}
            </div>
          </div>

          {historyLoading ? (
            <div className="history-loading"><LoaderCircle className="spin" size={22} /> Geçmiş yükleniyor…</div>
          ) : visibleHistory.length > 0 ? (
            <div className="history-grid">
              {visibleHistory.map((item) => (
                <article className="history-card" key={item.id}>
                  <div className="history-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl ?? ""} alt={`${PRODUCT_KIND_CONFIG[item.productKind].label} önizlemesi`} />
                    <span>{item.mode === "studio" ? "İşletme stüdyosu" : PRODUCT_KIND_CONFIG[item.productKind].label}</span>
                    <button
                      type="button"
                      className={`history-favorite ${favorites.has(item.id) ? "active" : ""}`}
                      onClick={() => toggleFavorite(item.id)}
                      aria-label="Favoriye ekle"
                    >
                      <Heart size={16} fill={favorites.has(item.id) ? "currentColor" : "none"} />
                    </button>
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
                      <strong>{PRODUCT_KIND_CONFIG[item.productKind].label}</strong>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                    <div className="history-actions">
                      <button type="button" onClick={() => void downloadResult(item)} aria-label="İndir"><Download size={17} /></button>
                      <button type="button" onClick={() => void shareResult(item)} aria-label="Paylaş"><Share2 size={17} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <span>{favoritesOnly ? <Heart size={25} /> : <History size={25} />}</span>
              <div>
                <h3>
                  {favoritesOnly
                    ? "Henüz favori görsel yok"
                    : historyAvailable
                      ? "Henüz bir görselin yok"
                      : "Geçmiş şu anda kullanılamıyor"}
                </h3>
                <p>
                  {favoritesOnly
                    ? "Beğendiğin sonuçlarda kalp simgesine dokun."
                    : historyAvailable
                      ? "İlk önizleme veya işletme görselini oluşturduğunda burada görebileceksin."
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
          <button type="button" onClick={() => setNotice(null)} aria-label="Bildirimi kapat"><X size={16} /></button>
        </div>
      )}
    </>
  );
}
