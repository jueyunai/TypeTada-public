import {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  type ClipboardEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Dices,
  FileText,
  FolderDown,
  FolderUp,
  History,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Monitor,
  MoreHorizontal,
  LocateFixed,
  Undo2,
  Plus,
  RotateCcw,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Shuffle,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import {
  canDownloadLayout,
  copyRichText,
  previewDocument,
  download,
  exportResult,
  isResultUsable,
  layoutFailureFilename,
  layoutFailureReport,
} from "./output";
import * as local from "./db";
import type { RenderExportFormat } from "./render-export";
import { diffBlockText } from "./diff";
import { sourceManifest } from "./content";
import {
  APP_VERSION,
  AUTH_CONFIG_ERROR,
  GENERATION_CONFIG_ERROR,
  GITHUB_REPOSITORY_URL,
  ICP_FILING,
  PUBLIC_SECURITY_FILING,
  PUBLIC_SECURITY_FILING_CODE,
} from "./config";
import {
  authorizeUrl,
  finishAuthorization,
  disconnectWallet,
  walletStatus,
  setRemember,
  type Wallet as WalletState,
} from "./wallet";
import {
  BLIND_BOX_STYLES,
  blindBoxStyleLabel,
  formatBlindBoxLabel,
  isBlindBoxThemeId,
} from "./blindbox";

const BLIND_BOX_SWATCHES: Record<
  NonNullable<Preferences["blindBoxStyle"]>,
  string[]
> = {
  random: ["#047857", "#1E4FD0", "#DC2626", "#9A4A1C"],
  tech: ["#1E4FD0", "#6D28D9", "#0F766E", "#1E293B"],
  minimal: ["#3D5A4C", "#44403C", "#334155", "#9A4A1C"],
  magazine: ["#047857", "#DC2626", "#0F4C81", "#C2410C"],
};
import { themes as listThemes, loadDemo } from "./library";
import {
  generateLayout,
  recoverFailedLayout,
  recoverFromFailureReportFile,
  UnsavedResult,
} from "./pipeline";
import {
  describeResult,
  describeBlock,
  formatTokens,
  friendlyJobMessage,
  friendlyLocation,
  targetPath,
  type DecorationItem,
  type Notice,
  type NoticeAction,
} from "./notices";
import {
  fillAuthorPlaceholders,
  removePlaceholderParagraphs,
  restoreLayoutSource,
  saveLocalEdit,
} from "./fixes";
import { importImage } from "./images";
import { readPaste } from "./paste";
import {
  SourceRichEditor,
  type RichPastePayload,
  type SourceEditorHandle,
} from "./SourceRichEditor";
import { themeImage, themeSampleLabel } from "./themes";
import publicSecurityFilingIcon from "./public-security-filing.png";
import {
  DEFAULT_PREFERENCES,
  MODEL,
  MAX_CHARACTERS,
  type Article,
  type Asset,
  type Job,
  type LayoutResult,
  type Theme,
  type Version,
  type Preferences,
} from "./types";

const TOKEN_DANCE_CREDITS_URL = "https://tokendance.space/credits";

// Shown only when the deploying site configures its own filing numbers.
const filingLinks =
  ICP_FILING || PUBLIC_SECURITY_FILING ? (
    <div className="workspace-footer-filings">
      {ICP_FILING && (
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
          {ICP_FILING}
        </a>
      )}
      {PUBLIC_SECURITY_FILING && (
        <a
          href={
            PUBLIC_SECURITY_FILING_CODE
              ? `https://beian.mps.gov.cn/#/query/webSearch?code=${PUBLIC_SECURITY_FILING_CODE}`
              : "https://beian.mps.gov.cn/"
          }
          target="_blank"
          rel="noreferrer"
        >
          <img src={publicSecurityFilingIcon} alt="" width={16} height={16} />
          {PUBLIC_SECURITY_FILING}
        </a>
      )}
    </div>
  ) : null;
const finished = new Set([
  "succeeded",
  "failed",
  "cancelled",
  "outcome_unknown",
]);
const stages: Record<string, string> = {
  normalize: "整理文章结构",
  analyze: "选择适合的主题",
  generate: "按主题排版中",
  validate: "检查正文与样式",
  repair: "修复排版问题",
  complete: "排版已完成",
};
const enhancementLabels: Record<string, string> = {
  cover: "封面卡片",
  toc: "精选导读",
  intro: "开头引言",
  quote: "引用金句",
  oneliner: "亮点金句",
  label: "装饰标签",
  author: "署名尾卡",
  footer: "文末声明",
  cta: "互动引导",
  added: "装饰文字",
  placeholder: "待填写",
};
const authorTypes = [
  ["preserve", "沿用原文署名"],
  ["custom", "使用我的署名"],
  ["none", "不额外添加署名"],
];
function NoticeItem({
  notice,
  fillLabel = "填写署名",
  onAction,
  onLocate,
  children,
}: {
  notice: Notice;
  fillLabel?: string;
  onAction?: (action: NoticeAction) => void;
  onLocate?: () => void;
  children?: ReactNode;
}) {
  const canFill = !!onAction && !!notice.actions?.includes("fill_author");
  const canRemove =
    !!onAction && !!notice.actions?.includes("remove_placeholder");
  return (
    <div className={"notice-item notice-" + notice.level}>
      <strong>{notice.title}</strong>
      {notice.quote && <q className="notice-quote">{notice.quote}</q>}
      {notice.detail && <p>{notice.detail}</p>}
      {(canFill || canRemove || onLocate) && (
        <div className="notice-actions">
          {canFill && (
            <button
              className="primary small"
              onClick={() => onAction!("fill_author")}
            >
              {fillLabel}
            </button>
          )}
          {onLocate && (
            <button className="text-button" onClick={onLocate}>
              <LocateFixed size={13} /> 在预览中查看
            </button>
          )}
          {canRemove && (
            <button
              className="text-button subtle-danger"
              onClick={() => onAction!("remove_placeholder")}
            >
              {canFill ? "不要署名，删掉这一段" : "删掉这一段"}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
function DecorationList({
  items,
  blocks,
  paths,
  onLocate,
}: {
  items: DecorationItem[];
  blocks: { id: string; kind: string; text: string }[];
  paths: (number[] | null)[];
  onLocate: (path: number[] | null | undefined) => void;
}) {
  return (
    <ul className="decoration-list">
      {items.map((item) => {
        const path = paths[item.index];
        const where = item.location
          ? friendlyLocation(item.location, blocks)
          : "";
        return (
          <li key={item.index} title={item.text}>
            <span className="decoration-type">
              {enhancementLabels[item.type] || item.type}
            </span>
            <span className="decoration-text">
              {item.text.replace(/\s+/g, " ")}
            </span>
            {path ? (
              <button
                className="icon-button decoration-locate"
                aria-label={`在预览中查看：${where || item.text.slice(0, 20)}`}
                title={where ? `${where} · 在预览中查看` : "在预览中查看"}
                onClick={() => onLocate(path)}
              >
                <LocateFixed size={13} />
              </button>
            ) : (
              <small>{where}</small>
            )}
          </li>
        );
      })}
    </ul>
  );
}
type ToastAction = { label: string; run: () => void };
type ToastItem = { id: number; text: string; action?: ToastAction };
type ConfirmDialog = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};
function ViewportSegmentedSwitch({
  width,
  onChange,
}: {
  width: "phone" | "wide";
  onChange: (next: "phone" | "wide") => void;
}) {
  return (
    <span className="viewport-segmented" role="group" aria-label="预览视口切换">
      <button
        aria-pressed={width === "phone"}
        onClick={() => onChange("phone")}
      >
        <Smartphone size={13} /> 手机
      </button>
      <button aria-pressed={width === "wide"} onClick={() => onChange("wide")}>
        <Monitor size={13} /> 宽屏
      </button>
    </span>
  );
}

const PHONE_DEVICE_W = 413;
const PHONE_DEVICE_H = 872;

function PhoneDeviceFrame({
  fullscreen,
  headerTitle,
  sampleClass,
  className,
  children,
}: {
  fullscreen: boolean;
  headerTitle: string;
  sampleClass: string;
  className: string;
  children: ReactNode;
}) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(() => (fullscreen ? 0.8 : 0.65));
  const [zoomMode, setZoomMode] = useState<"fit" | "actual">("fit");

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const measure = (availW: number, availH: number) => {
      if (availW <= 0 || availH <= 0) return;
      const next = Math.min(
        1,
        Math.max(
          0.42,
          Math.min(availW / PHONE_DEVICE_W, availH / PHONE_DEVICE_H),
        ),
      );
      const rounded = Math.round(next * 1000) / 1000;
      setFitScale((prev) =>
        Math.abs(prev - rounded) > 0.002 ? rounded : prev,
      );
    };
    measure(el.clientWidth, el.clientHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        measure(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fullscreen]);

  const effectiveScale = zoomMode === "actual" ? 1 : fitScale;
  const shellClass = fullscreen
    ? "phone-shell phone-shell-full "
    : "phone-shell phone-shell-docked ";

  return (
    <div
      className={
        "phone-stage-slot" + (zoomMode === "actual" ? " is-actual" : "")
      }
    >
      <div ref={scrollAreaRef} className="phone-scroll-area">
        <div
          className="phone-scaler-box"
          style={{
            width: Math.round(PHONE_DEVICE_W * effectiveScale),
            height: Math.round(PHONE_DEVICE_H * effectiveScale),
          }}
        >
          <div
            className={
              "article-preview " + sampleClass + shellClass + className
            }
            style={{
              transform:
                effectiveScale === 1 ? "none" : `scale(${effectiveScale})`,
            }}
          >
            <div className="phone-status-bar" aria-hidden="true">
              <span className="phone-time">9:41</span>
              <span className="phone-dynamic-island">
                <i />
              </span>
              <span className="phone-status-icons">
                <i className="phone-signal" />
                <i className="phone-battery" />
              </span>
            </div>
            <div className="phone-wechat-bar" aria-hidden="true">
              <ChevronLeft size={17} />
              <span>{headerTitle || "公众号文章"}</span>
              <MoreHorizontal size={17} />
            </div>
            <div className="phone-screen">{children}</div>
            <div className="phone-home-bar" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
      <div className="phone-scale-bar">
        <span className="phone-scale-caption" aria-hidden="true">
          iPhone 16 · 393×852 · {Math.round(effectiveScale * 100)}%
        </span>
        <span
          className="phone-zoom-toggle"
          role="group"
          aria-label="手机预览缩放"
        >
          <button
            type="button"
            className={zoomMode === "fit" ? "active" : ""}
            aria-pressed={zoomMode === "fit"}
            onClick={() => setZoomMode("fit")}
          >
            适配
          </button>
          <button
            type="button"
            className={zoomMode === "actual" ? "active" : ""}
            aria-pressed={zoomMode === "actual"}
            onClick={() => setZoomMode("actual")}
          >
            100%
          </button>
        </span>
      </div>
    </div>
  );
}

// 复用于双栏预览与全屏沉浸预览的内容画布组件
function PreviewViewport({
  display,
  sampleTheme,
  showImages,
  width,
  fullscreen = false,
  headerTitle = "",
  className = "",
}: {
  display: LayoutResult | null;
  sampleTheme: Theme | null | undefined;
  showImages: boolean;
  width: "phone" | "wide";
  fullscreen?: boolean;
  headerTitle?: string;
  className?: string;
}) {
  if (!display && !sampleTheme) return null;

  const isSample = !display && !!sampleTheme;
  const innerContent = display ? (
    <iframe
      key={`result-${display.resultId}-${showImages}`}
      title="公众号排版效果"
      // Same-origin lets the workbench scroll to and highlight an item.
      // Scripts stay disabled (no allow-scripts, CSP default-src 'none').
      sandbox="allow-same-origin"
      srcDoc={previewDocument(display, showImages)}
      referrerPolicy="no-referrer"
    />
  ) : (
    <iframe
      key={`sample-${sampleTheme!.id}`}
      title={`${sampleTheme!.name}主题样张`}
      sandbox=""
      src={`/library/${sampleTheme!.id}-sample.html`}
    />
  );

  const sampleClass = isSample ? "theme-document-sample " : "";

  if (width !== "phone") {
    return (
      <div
        className={
          "article-preview " + sampleClass + "wide-preview " + className
        }
      >
        {innerContent}
      </div>
    );
  }

  return (
    <PhoneDeviceFrame
      fullscreen={fullscreen}
      headerTitle={
        headerTitle || display?.title || sampleTheme?.name || "公众号文章"
      }
      sampleClass={sampleClass}
      className={className}
    >
      {innerContent}
    </PhoneDeviceFrame>
  );
}

export default function App() {
  const [dataEpoch, setDataEpoch] = useState(0);
  const [sourceView, setSourceView] = useState<"rich" | "markdown">("rich");
  const [fullscreenWriting, setFullscreenWriting] = useState(false);
  const [ready, setReady] = useState(false),
    [articles, setArticles] = useState<Article[]>([]),
    [doc, setDoc] = useState<Article | null>(null),
    [themes, setThemes] = useState<Theme[]>([]),
    [theme, setTheme] = useState("moyu-green");
  const [result, setResult] = useState<LayoutResult | null>(null),
    [demo, setDemo] = useState<LayoutResult | null>(null),
    [wallet, setWallet] = useState<WalletState | null>(null),
    [job, setJob] = useState<Job | null>(null),
    [globalJob, setGlobalJob] = useState<Job | null>(null),
    [versions, setVersions] = useState<Version[]>([]),
    [failedJobs, setFailedJobs] = useState<Job[]>([]),
    [recoverableJobIds, setRecoverableJobIds] = useState<Set<string>>(
      () => new Set(),
    ),
    [recoveringJobId, setRecoveringJobId] = useState<string | null>(null),
    [restoringSource, setRestoringSource] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<
      | "themes"
      | "history"
      | "wallet"
      | "help"
      | "settings"
      | "confirm"
      | "inspect"
      | null
    >(null),
    [saveState, setSaveState] = useState(""),
    [stickyNotice, setStickyNotice] = useState(""),
    [error, setError] = useState(""),
    [toasts, setToasts] = useState<ToastItem[]>([]),
    [failureNotice, setFailureNotice] = useState<Job | null>(null),
    [historyTarget, setHistoryTarget] = useState<string | null>(null),
    [confirmModal, setConfirmModal] = useState<ConfirmDialog | null>(null),
    [fullscreenPreview, setFullscreenPreview] = useState(false),
    [downloadMenuOpen, setDownloadMenuOpen] = useState(false),
    [exportingFormat, setExportingFormat] = useState<RenderExportFormat | null>(null),
    [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [authorFormOpen, setAuthorFormOpen] = useState(false);
  const [authorDraft, setAuthorDraft] = useState({ name: "", bio: "" });
  // Set when locating switched the preview to wide; offers a way back.
  const [autoWide, setAutoWide] = useState(false);
  const [width, setWidthState] = useState<"phone" | "wide">("phone"),
    [mobileTab, setMobileTab] = useState("source"),
    [navOpen, setNavOpen] = useState(false);
  const [mode, setMode] = useState<Preferences["mode"]>("format_only"),
    [blindBoxStyle, setBlindBoxStyle] =
      useState<NonNullable<Preferences["blindBoxStyle"]>>("random"),
    [authorMode, setAuthorMode] =
      useState<Preferences["authorMode"]>("preserve"),
    [name, setName] = useState(""),
    [bio, setBio] = useState(""),
    [note, setNote] = useState(""),
    [consent, setConsent] = useState(false),
    [showImages, setShowImages] = useState(false),
    [remember, setRememberWallet] = useState(true);
  const [busy, setBusy] = useState(false),
    [assets, setAssets] = useState<Asset[]>([]),
    [search, setSearch] = useState(""),
    [previewTheme, setPreviewTheme] = useState<Theme | null>(null),
    [themeDrawerTab, setThemeDrawerTab] = useState<"presets" | "blindbox">(
      "presets",
    ),
    [articleBusy, setArticleBusy] = useState(false);
  useEffect(() => {
    if (drawer !== "themes") return;
    setThemeDrawerTab(mode === "blindbox" ? "blindbox" : "presets");
  }, [drawer]);
  const assetUrlMap = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset.url])),
    [assets],
  );
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const refresh = () =>
      void local
        .listAssets()
        .then((next) => {
          if (alive) setAssets(next);
        })
        .catch(showError);
    refresh();
    window.addEventListener("typetada-data", refresh);
    return () => {
      alive = false;
      window.removeEventListener("typetada-data", refresh);
    };
  }, [ready]);
  const drawerRef = useRef<HTMLElement>(null),
    historyRowRef = useRef<HTMLDivElement>(null),
    historyButtonRef = useRef<HTMLButtonElement>(null),
    fullscreenRef = useRef<HTMLDivElement>(null),
    confirmRef = useRef<HTMLDivElement>(null),
    downloadMenuRef = useRef<HTMLDivElement>(null),
    richEditorRef = useRef<SourceEditorHandle>(null),
    sourceRef = useRef<HTMLTextAreaElement>(null),
    docRef = useRef<Article | null>(null),
    selectionRef = useRef<{
      articleId: string;
      start: number;
      end: number;
    } | null>(null),
    toastSeq = useRef(0),
    toastTimers = useRef<Map<number, number>>(new Map()),
    confirmRefState = useRef<ConfirmDialog | null>(null),
    savedRef = useRef(""),
    saveQueue = useRef<Promise<unknown>>(Promise.resolve()),
    loadSeq = useRef(0),
    fileRef = useRef<HTMLInputElement>(null),
    imageRef = useRef<HTMLInputElement>(null),
    backupRef = useRef<HTMLInputElement>(null),
    reportRef = useRef<HTMLInputElement>(null),
    mutationRef = useRef(false),
    deletingRef = useRef(new Set<string>()),
    activeTask = useRef<{ id?: string; controller: AbortController } | null>(
      null,
    );
  confirmRefState.current = confirmModal;
  const setWidth = useCallback((next: "phone" | "wide") => {
    setAutoWide(false);
    setWidthState(next);
  }, []);
  const showError = useCallback(
    (e: unknown) => {
      const message = e instanceof Error ? e.message : "操作未完成，请稍后重试";
      setError(
        /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|unable to preload css/i.test(message)
          ? "页面资源加载失败。请等排版结束并确认原稿已保存，再刷新后重试。"
          : message,
      );
    },
    [],
  );
  const dismissToast = useCallback((toastId: number) => {
    const timer = toastTimers.current.get(toastId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      toastTimers.current.delete(toastId);
    }
    setToasts((old) => old.filter((item) => item.id !== toastId));
  }, []);
  const pushToast = useCallback((value: string, action?: ToastAction) => {
    if (!value) return;
    const itemId = ++toastSeq.current;
    setToasts((old) => [...old.slice(-2), { id: itemId, text: value, action }]);
    const durationMs = action
      ? 6000
      : [...value].length <= 20
        ? 1800
        : 3200;
    const timer = window.setTimeout(() => {
      toastTimers.current.delete(itemId);
      setToasts((old) => old.filter((item) => item.id !== itemId));
    }, durationMs);
    toastTimers.current.set(itemId, timer);
  }, []);
  useEffect(() => {
    return () => {
      for (const timer of toastTimers.current.values())
        window.clearTimeout(timer);
      toastTimers.current.clear();
      confirmRefState.current?.resolve(false);
    };
  }, []);
  const askConfirm = useCallback(
    (options: Omit<ConfirmDialog, "resolve">) =>
      new Promise<boolean>((resolve) => {
        setConfirmModal((prev) => {
          prev?.resolve(false);
          return { ...options, resolve };
        });
      }),
    [],
  );
  const resolveConfirm = useCallback((accepted: boolean) => {
    setConfirmModal((prev) => {
      if (prev) prev.resolve(accepted);
      return null;
    });
  }, []);
  const prefs: Preferences = {
    theme,
    mode,
    blindBoxStyle,
    authorMode,
    name,
    bio,
    note,
    consent,
    showImages,
  };
  function applyPrefs(p: Preferences) {
    setTheme(p.theme);
    setMode(p.mode);
    setBlindBoxStyle(p.blindBoxStyle ?? "random");
    setAuthorMode(p.authorMode);
    setName(p.name);
    setBio(p.bio);
    setNote(p.note);
    setConsent(p.consent);
    setShowImages(p.showImages);
  }
  const refreshArticles = useCallback(async () => {
    const [rows, active] = await Promise.all([
      local.listArticles(),
      local.activeJob(),
    ]);
    setArticles(rows);
    setGlobalJob(active);
    return rows;
  }, []);
  const refreshWallet = useCallback(async (refresh = false) => {
    const next = await walletStatus(refresh);
    setWallet(next);
    if (next.connected) setRememberWallet(next.remember);
    return next;
  }, []);
  const refreshHistory = useCallback(async (articleId?: string) => {
    const idToLoad = articleId ?? docRef.current?.id;
    if (!idToLoad) return;
    const [v, fj, capIds] = await Promise.all([
      local.listVersions(idToLoad),
      local.listFailedJobs(idToLoad),
      local.listFailureCaptureJobIds(),
    ]);
    if (docRef.current?.id !== idToLoad) return;
    setVersions(v);
    setFailedJobs(fj);
    setRecoverableJobIds(capIds);
  }, []);
  const openArticle = useCallback(
    async (article: Article, background = false) => {
      const before = docRef.current;
      const seq = ++loadSeq.current;
      const [fresh, history, j, failed, capIds] = await Promise.all([
        local.getArticle(article.id),
        local.listVersions(article.id),
        local.latestJob(article.id),
        local.listFailedJobs(article.id),
        local.listFailureCaptureJobIds(),
      ]);
      if (seq !== loadSeq.current) return;
      let selected = fresh;
      const recovery = await local.loadRecovery(fresh.id);
      if (
        recovery &&
        recovery.revision >= fresh.revision &&
        (recovery.sourceMarkdown !== fresh.sourceMarkdown ||
          recovery.title !== fresh.title)
      ) {
        selected = { ...recovery, revision: fresh.revision };
        setStickyNotice("已恢复本浏览器未保存的稿件，请检查后保存。");
      }
      if (seq !== loadSeq.current) return;
      if (
        background &&
        (docRef.current !== before ||
          (before &&
            JSON.stringify([before.title, before.sourceMarkdown]) !==
              savedRef.current))
      ) {
        setStickyNotice(
          "另一窗口有新版本，当前输入已保留。请检查后另存副本或处理保存冲突。",
        );
        return;
      }
      savedRef.current = JSON.stringify([fresh.title, fresh.sourceMarkdown]);
      docRef.current = selected;
      setDoc(selected);
      // 打开或新建文章默认进入所见即所得「写作」态
      setSourceView("rich");
      setVersions(history);
      setFailedJobs(failed);
      setRecoverableJobIds(capIds);
      setSaveState(selected === fresh ? "已保存到本机" : "等待保存");
      setNavOpen(false);
      setJob(j);
      setResult(null);
      if (history[0]) {
        const r = await local.getResult(history[0].id);
        if (seq === loadSeq.current) {
          setResult(r);
        }
      }
      void local.putMeta("lastArticle", fresh.id);
    },
    [],
  );
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const authNotice = await finishAuthorization().catch((e) => {
          showError(e);
          return null;
        });
        const [[rows, w, p, last, currentEpoch], libraryResults] =
          await Promise.all([
            Promise.all([
              refreshArticles(),
              walletStatus(),
              local.getPreferences(),
              local.getMeta<string>("lastArticle"),
              local.epoch(),
            ]),
            Promise.allSettled([listThemes(), loadDemo()]),
          ]);
        if (!alive) return;
        const [ts, d] = libraryResults;
        if (ts.status === "fulfilled") setThemes(ts.value);
        if (d.status === "fulfilled") setDemo(d.value);
        if (ts.status === "rejected" || d.status === "rejected")
          setError(
            "排版规则或示例暂时加载失败；本机文章仍可编辑，请刷新重试规则加载。",
          );
        setArticles(rows);
        setWallet(w);
        setRememberWallet(w.connected ? w.remember : true);
        applyPrefs(p);
        setDataEpoch(currentEpoch);
        setReady(true);
        if (authNotice) pushToast(authNotice);
        const selected = rows.find((a) => a.id === last) || rows[0];
        if (selected) await openArticle(selected);
      } catch (e) {
        if (alive) {
          showError(e);
          setReady(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [openArticle, refreshArticles, pushToast, showError]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(
      () =>
        void local
          .putMetaAtEpoch("preferences", prefs, dataEpoch)
          .catch(showError),
      300,
    );
    return () => clearTimeout(timer);
  }, [
    ready,
    theme,
    mode,
    blindBoxStyle,
    authorMode,
    name,
    bio,
    note,
    consent,
    showImages,
    dataEpoch,
    showError,
  ]);
  const flushSave = useCallback(async () => {
    const perform = async () => {
      const current = docRef.current;
      if (!current || deletingRef.current.has(current.id)) return null;
      const signature = JSON.stringify([current.title, current.sourceMarkdown]);
      if (signature === savedRef.current) return current;
      setSaveState("保存中…");
      try {
        const saved = await local.saveArticle(current);
        if (docRef.current?.id === current.id) {
          const next = { ...docRef.current, revision: saved.revision };
          docRef.current = next;
          setDoc(next);
          savedRef.current = signature;
          setSaveState(
            JSON.stringify([next.title, next.sourceMarkdown]) === signature
              ? "已保存到本机"
              : "等待保存",
          );
          await local.saveRecovery(next);
        }
        setArticles((old) => old.map((a) => (a.id === saved.id ? saved : a)));
        return saved;
      } catch (e) {
        setSaveState("保存失败");
        showError(e);
        throw e;
      }
    };
    const pending = saveQueue.current.catch(() => {}).then(perform);
    saveQueue.current = pending;
    return pending;
  }, [showError]);
  useEffect(() => {
    if (!doc) return;
    const timer = setTimeout(() => void flushSave().catch(() => {}), 600);
    return () => clearTimeout(timer);
  }, [doc?.id, doc?.title, doc?.sourceMarkdown, flushSave]);
  useEffect(() => {
    const changed = async () => {
      if (!ready) return;
      try {
        const liveEpoch = await local.epoch();
        if (liveEpoch !== dataEpoch) {
          activeTask.current?.controller.abort();
          setDataEpoch(liveEpoch);
          applyPrefs(DEFAULT_PREFERENCES);
          setStickyNotice("本地数据已在另一窗口清除，当前缓存已失效。");
        }
        const rows = await refreshArticles();
        await refreshWallet();
        const current = docRef.current;
        if (!current) return;
        const fresh = rows.find((a) => a.id === current.id);
        if (!fresh) {
          activeTask.current?.controller.abort();
          docRef.current = null;
          setDoc(null);
          setResult(null);
          setVersions([]);
          setFailedJobs([]);
          setRecoverableJobIds(new Set());
          setJob(null);
          savedRef.current = "";
          setStickyNotice("当前文章已在另一窗口删除或本地数据已清除。");
          return;
        }
        if (fresh.revision > current.revision) {
          if (
            JSON.stringify([current.title, current.sourceMarkdown]) ===
            savedRef.current
          )
            await openArticle(fresh, true);
          else
            setStickyNotice(
              "另一窗口有新版本，当前输入已保留。保存冲突时请另存副本。",
            );
        }
        const j = await local.latestJob(current.id);
        if (j && activeTask.current?.id !== j.id) setJob(j);
        await refreshHistory(current.id);
      } catch (e) {
        showError(e);
      }
    };
    window.addEventListener("typetada-data", changed);
    return () => window.removeEventListener("typetada-data", changed);
  }, [
    refreshArticles,
    refreshWallet,
    openArticle,
    refreshHistory,
    dataEpoch,
    ready,
    showError,
  ]);
  useEffect(() => {
    const leaving = (event: BeforeUnloadEvent) => {
      const current = docRef.current;
      if (
        activeTask.current ||
        (current &&
          JSON.stringify([current.title, current.sourceMarkdown]) !==
            savedRef.current)
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const hide = () => activeTask.current?.controller.abort();
    window.addEventListener("beforeunload", leaving);
    window.addEventListener("pagehide", hide);
    return () => {
      window.removeEventListener("beforeunload", leaving);
      window.removeEventListener("pagehide", hide);
    };
  }, []);
  useEffect(() => {
    if (!drawer) return;
    if (drawer === "settings")
      void local.listAssets().then(setAssets).catch(showError);
    // 打开钱包抽屉时自动静默刷新一次可用余额，失败不阻断抽屉使用
    if (drawer === "wallet") void refreshWallet(true).catch(() => {});
  }, [drawer, refreshWallet, showError]);
  useEffect(() => {
    const backgrounds = document.querySelectorAll<HTMLElement>(
      ".topbar,.sidebar,.workspace",
    );
    const writingBackgrounds = document.querySelectorAll<HTMLElement>(
      ".topbar,.sidebar,.preview-pane,.actionbar,.workspace-footer,.mobile-tabs,.workspace-feedback",
    );
    const hideBase = !!(drawer || fullscreenPreview || confirmModal);
    backgrounds.forEach((e) => (e.inert = hideBase));
    if (!hideBase && fullscreenWriting && doc) {
      writingBackgrounds.forEach((e) => (e.inert = true));
    } else if (!hideBase) {
      writingBackgrounds.forEach((e) => (e.inert = false));
    }
    if (fullscreenRef.current)
      fullscreenRef.current.inert = !!(drawer || confirmModal);
    const backdrop = drawerRef.current?.parentElement;
    if (backdrop) backdrop.inert = !!confirmModal;
    return () => {
      backgrounds.forEach((e) => (e.inert = false));
      writingBackgrounds.forEach((e) => (e.inert = false));
      if (fullscreenRef.current) fullscreenRef.current.inert = false;
      if (backdrop) backdrop.inert = false;
    };
  }, [drawer, fullscreenPreview, fullscreenWriting, doc, confirmModal]);
  useEffect(() => {
    if (!confirmModal) return;
    const previous = document.activeElement as HTMLElement | null;
    confirmRef.current
      ?.querySelector<HTMLElement>(
        confirmModal.danger ? ".confirm-cancel" : ".confirm-accept",
      )
      ?.focus();
    return () => previous?.focus();
  }, [!!confirmModal]);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement as HTMLElement | null;
    drawerRef.current
      ?.querySelector<HTMLElement>("button,input,select,textarea,a,summary")
      ?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
      else if (drawer === "history") historyButtonRef.current?.focus();
    };
  }, [drawer]);
  const currentFailure =
    failureNotice?.articleId === doc?.id ? failureNotice : null;
  const visibleHistoryTarget =
    drawer === "history" && failedJobs.some((entry) => entry.id === historyTarget)
      ? historyTarget
      : null;
  useEffect(() => {
    if (!failureNotice) return;
    if (drawer === "history" && currentFailure)
      setHistoryTarget(currentFailure.id);
    if (!currentFailure || drawer === "history") {
      setFailureNotice(null);
    }
  }, [currentFailure, drawer, failureNotice]);
  useEffect(() => {
    if (!failureNotice) return;
    const timer = window.setTimeout(() => setFailureNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [failureNotice]);
  useEffect(() => {
    if (!visibleHistoryTarget) return;
    historyRowRef.current?.focus({ preventScroll: true });
    historyRowRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [visibleHistoryTarget]);
  useEffect(() => {
    if (!fullscreenPreview) return;
    const previous = document.activeElement as HTMLElement | null;
    fullscreenRef.current
      ?.querySelector<HTMLElement>("button,input,select,textarea")
      ?.focus();
    return () => previous?.focus();
  }, [fullscreenPreview]);
  useEffect(() => {
    if (!fullscreenWriting) return;
    const previous = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      if (sourceView === "rich") richEditorRef.current?.focus("end");
      else sourceRef.current?.focus();
    });
    return () => {
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [fullscreenWriting]);
  useEffect(() => {
    if (
      !drawer &&
      !fullscreenPreview &&
      !fullscreenWriting &&
      !confirmModal &&
      !downloadMenuOpen
    )
      return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (confirmModal) resolveConfirm(false);
        else if (downloadMenuOpen) setDownloadMenuOpen(false);
        else if (drawer) setDrawer(null);
        else if (fullscreenPreview) setFullscreenPreview(false);
        else if (fullscreenWriting) setFullscreenWriting(false);
        return;
      }
      if (e.key === "Tab") {
        const container = confirmModal
          ? confirmRef.current
          : drawer
            ? drawerRef.current
            : fullscreenPreview
              ? fullscreenRef.current
              : null;
        if (!container) return;
        const items = Array.from(
          container.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),select,textarea,a[href],summary",
          ),
        ).filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [
    drawer,
    fullscreenPreview,
    fullscreenWriting,
    confirmModal,
    downloadMenuOpen,
    resolveConfirm,
  ]);
  useEffect(() => {
    if (!downloadMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!downloadMenuRef.current?.contains(e.target as Node))
        setDownloadMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [downloadMenuOpen]);
  useEffect(() => {
    if (drawer !== "themes") setPreviewTheme(null);
  }, [drawer]);
  useEffect(() => {
    if (previewTheme) {
      if (typeof drawerRef.current?.scrollTo === "function")
        drawerRef.current.scrollTo({ top: 0 });
      drawerRef.current
        ?.querySelector<HTMLButtonElement>(".theme-detail>button")
        ?.focus();
    }
  }, [previewTheme]);
  function changeDoc(patch: Partial<Article>) {
    if (!docRef.current) return;
    const next = { ...docRef.current, ...patch };
    docRef.current = next;
    setDoc(next);
    setSaveState("等待保存");
    void local.saveRecovery(next).catch(showError);
  }
  function insertMarkdownSnippet(snippet: string, noticeMessage?: string) {
    const current = docRef.current;
    if (!current) return;
    const clean = snippet.trim();
    if (sourceView === "rich" && richEditorRef.current) {
      const singleImage = /^!\[([^\]]*)\]\((?:<([^>]+)>|([^)\s]+))\)$/.exec(
        clean,
      );
      if (singleImage) {
        richEditorRef.current.insertImage(
          singleImage[2] || singleImage[3],
          singleImage[1] || "",
        );
      } else {
        richEditorRef.current.insertMarkdown(clean);
      }
    } else if (sourceView === "markdown" && sourceRef.current) {
      const input = sourceRef.current;
      const savedSel =
        selectionRef.current?.articleId === current.id
          ? selectionRef.current
          : null;
      const start = Math.min(
        input.selectionStart ??
          savedSel?.start ??
          current.sourceMarkdown.length,
        current.sourceMarkdown.length,
      );
      const end = Math.min(
        input.selectionEnd ?? savedSel?.end ?? current.sourceMarkdown.length,
        current.sourceMarkdown.length,
      );
      const before = current.sourceMarkdown.slice(0, start);
      const after = current.sourceMarkdown.slice(end);
      const leading =
        before && !before.endsWith("\n\n")
          ? before.endsWith("\n")
            ? "\n"
            : "\n\n"
          : "";
      const trailing =
        after && !after.startsWith("\n\n")
          ? after.startsWith("\n")
            ? "\n"
            : "\n\n"
          : "";
      const inserted = leading + clean + trailing;
      const next = before + inserted + after;
      const caret = before.length + inserted.length;
      changeDoc({ sourceMarkdown: next });
      selectionRef.current = {
        articleId: current.id,
        start: caret,
        end: caret,
      };
      requestAnimationFrame(() => {
        sourceRef.current?.focus();
        sourceRef.current?.setSelectionRange(caret, caret);
      });
    } else {
      const sep = !current.sourceMarkdown.trim()
        ? ""
        : current.sourceMarkdown.endsWith("\n\n")
          ? ""
          : current.sourceMarkdown.endsWith("\n")
            ? "\n"
            : "\n\n";
      changeDoc({
        sourceMarkdown: current.sourceMarkdown + sep + clean + "\n",
      });
    }
    if (noticeMessage) pushToast(noticeMessage);
  }
  async function newArticle(
    source = "",
    title = "未命名文章",
    saveCopy = false,
    importedAssets: Asset[] = [],
    expectedEpoch?: number,
  ) {
    if (mutationRef.current) return null;
    mutationRef.current = true;
    setArticleBusy(true);
    if (title === "未命名文章") title += ` ${articles.length + 1}`;
    try {
      if (!saveCopy) await flushSave();
      else await saveQueue.current.catch(() => {});
      const article = await local.createArticle(
        title,
        source,
        importedAssets,
        expectedEpoch,
      );
      await refreshArticles();
      await openArticle(article);
      setDrawer(null);
      setMobileTab("source");
      setSearch("");
      setError("");
      requestAnimationFrame(() => {
        if (!source.trim()) {
          if (sourceView === "rich") richEditorRef.current?.focus("start");
          else sourceRef.current?.focus();
        }
      });
      return article;
    } catch (e) {
      showError(e);
      return null;
    } finally {
      mutationRef.current = false;
      setArticleBusy(false);
    }
  }
  async function openSafely(a: Article) {
    try {
      await flushSave();
      await openArticle(a);
    } catch (e) {
      showError(e);
    }
  }
  async function connect() {
    setBusy(true);
    try {
      await flushSave();
      location.assign(await authorizeUrl(remember));
    } catch (e) {
      showError(e);
      setBusy(false);
    }
  }
  async function startLayout(
    confirmed = false,
    draft?: LayoutResult,
    options?: { skipRepeatConfirm?: boolean },
  ) {
    if (!doc?.sourceMarkdown.trim() || activeTask.current) return;
    if (GENERATION_CONFIG_ERROR) {
      showError(new Error(GENERATION_CONFIG_ERROR));
      return;
    }
    if (!wallet?.connected) {
      setDrawer("wallet");
      return;
    }
    if (!consent && !confirmed) {
      setError("");
      setDrawer("confirm");
      return;
    }
    if (confirmed) setConsent(true);
    if (
      !draft &&
      !options?.skipRepeatConfirm &&
      job &&
      finished.has(job.status) &&
      job.status !== "cancelled" &&
      job.sourceRevision === doc.revision &&
      !(await askConfirm({
        title: "确认重新排版",
        message:
          "这份原稿已提交过。新建排版会再次调用模型；上次未知或失败也可能已计费，确认继续？",
        confirmText: "继续排版",
        cancelText: "取消",
      }))
    )
      return;
    if (activeTask.current) return;
    const controller = new AbortController();
    activeTask.current = { controller };
    setFailureNotice(null);
    setBusy(true);
    setError("");
    try {
      const saved = await flushSave();
      if (!saved) return;
      const value = await generateLayout(
        saved,
        { ...prefs, consent: consent || confirmed },
        controller,
        (next) => {
          if (activeTask.current) activeTask.current.id = next.id;
          if (docRef.current?.id === next.articleId) setJob(next);
        },
        draft,
        mode === "blindbox" && !draft ? result?.blindBoxBrief : undefined,
      );
      if (docRef.current?.id === saved.id) {
        setResult(value);
        await refreshHistory(saved.id);
        setMobileTab("preview");
        if (value.validation.ready)
          pushToast(value.notice ?? "排版已完成，可以复制了。");
      }
    } catch (e) {
      if (
        e instanceof UnsavedResult &&
        docRef.current?.id === e.result.articleId
      ) {
        setResult(e.result);
        showError(e);
        return;
      }
      const taskId = activeTask.current?.id;
      const failed = taskId ? await local.getJob(taskId).catch(() => null) : null;
      if (
        failed &&
        (failed.status === "failed" || failed.status === "outcome_unknown")
      ) {
        if (failed.articleId === docRef.current?.id && !controller.signal.aborted)
          setFailureNotice(failed);
      } else if (!controller.signal.aborted) {
        showError(e);
      }
    } finally {
      activeTask.current = null;
      setBusy(false);
      await refreshHistory().catch(() => {});
      await refreshWallet(true).catch(() => {});
    }
  }
  async function requestRepair(draft: LayoutResult) {
    if (activeTask.current || draft !== result || stale) return;
    if (!wallet?.connected) {
      setDrawer("wallet");
      return;
    }
    if (
      !(await askConfirm({
        title: "用 AI 修复这份稿子？",
        message:
          "原稿和成稿将交给 TokenDance 和模型处理。这次修复会额外消耗 Token，原待核对稿会保留。" +
          (job?.status === "outcome_unknown"
            ? "上次请求结果未知，也可能已计费。"
            : ""),
        confirmText: "确认并修复",
        cancelText: "先不修复",
      }))
    )
      return;
    setDrawer(null);
    await startLayout(true, draft);
  }
  async function showLocalEdit(
    target: LayoutResult,
    next: LayoutResult,
    message: string,
  ) {
    if (docRef.current?.id !== next.articleId) return;
    setResult((current) => current?.resultId === target.resultId ? next : current);
    await refreshHistory(next.articleId);
    pushToast(message, {
      label: "撤销",
      run: () =>
        void (async () => {
          try {
            const [latest] = await local.listVersions(next.articleId);
            if (latest?.id !== next.resultId) {
              pushToast("已保存更新的成稿，可在历史版本查看修改前的稿子。");
              return;
            }
            const previous = await local.getResult(target.resultId);
            await local.deleteResult(next.resultId);
            setResult((current) =>
              current?.resultId === next.resultId ? previous : current,
            );
            await refreshHistory(previous.articleId);
            pushToast("已撤销，成稿恢复到修改前。");
          } catch (e) {
            showError(e);
          }
        })(),
    });
  }
  async function restoreDifference(target: LayoutResult, sourceId: string) {
    if (restoringSource || busy || activeTask.current || target !== result || stale)
      return;
    setRestoringSource(sourceId);
    try {
      const next = await restoreLayoutSource(target, sourceId);
      await showLocalEdit(target, next, "已恢复此处原文，可撤销。");
    } catch (e) {
      showError(e);
    } finally {
      setRestoringSource(null);
    }
  }
  async function applyNoticeAction(
    target: LayoutResult,
    action: NoticeAction,
    author?: { name: string; bio: string },
  ) {
    if (target.demo || !target.sourceHtml) return;
    try {
      let html: string | null;
      if (action === "fill_author") {
        const signer = author ?? { name, bio };
        if (!signer.name.trim()) {
          // Ask inline instead of sending the author to the settings page.
          setDrawer(null);
          setAuthorDraft({ name: "", bio });
          setAuthorFormOpen(true);
          return;
        }
        html = fillAuthorPlaceholders(
          target.sourceHtml,
          target.sourceMarkdown,
          signer,
        );
        if (!html)
          throw new Error(
            "没找到可以填入署名的位置。可以在提示里选择「不要署名，删掉这一段」。",
          );
        if (author) {
          // Remember the signature for the next layouts.
          setAuthorMode("custom");
          setName(author.name.trim());
          setBio(author.bio.trim());
        }
      } else {
        html = removePlaceholderParagraphs(
          target.sourceHtml,
          target.sourceMarkdown,
        );
        if (!html) throw new Error("没找到需要删除的模板文字。");
        const quote = describeResult(target).notices.action.find(
          (n) => n.key === "placeholder",
        )?.quote;
        if (
          !(await askConfirm({
            title: "删掉这一段？",
            message:
              (quote
                ? `将从成稿中删除：「${quote}」。`
                : "将从成稿中删除含模板文字的那一段。") +
              "原文不受影响，删除后几秒内可以撤销。",
            confirmText: "删掉",
            cancelText: "保留",
            danger: true,
          }))
        )
          return;
      }
      const next = await saveLocalEdit(
        target,
        html,
        action === "fill_author"
          ? "在本机填入了署名，没有调用模型。"
          : "在本机删除了模板文字，没有调用模型。",
      );
      setAuthorFormOpen(false);
      await showLocalEdit(
        target,
        next,
        action === "fill_author"
          ? "署名已填入成稿，没有调用模型。"
          : "已删掉这一段，没有调用模型。",
      );
    } catch (e) {
      showError(e);
    }
  }
  async function downloadVisual(target: LayoutResult, format: RenderExportFormat) {
    if (exportingFormat || !canDownloadLayout(target)) return;
    setExportingFormat(format);
    setDownloadMenuOpen(false);
    pushToast(format === "pdf" ? "正在生成 PDF…" : "正在生成长图…");
    try {
      const { createRenderExport } = await import("./render-export");
      const saved = await createRenderExport(target, format, (missing) =>
        askConfirm({
          title: `${missing.length} 张配图无法导出`,
          message:
            missing
              .slice(0, 3)
              .map((name) => `「${name.slice(0, 40)}」`)
              .join("、") +
            (missing.length > 3 ? "等配图" : "") +
            "会用文字提示代替。想保留配图，可以取消，下载原图并用本机图片重新插入。",
          confirmText: "仍然下载",
          cancelText: "取消",
        }),
      );
      if (!saved) return;
      const title = target.title.replace(/[<>:"/\\|?*]/g, "_").trim().slice(0, 64);
      const suffix = isResultUsable(target) ? "" : "-待核对";
      download(saved.file, `${title || "文有样成稿"}${suffix}.${saved.extension}`);
      pushToast(format === "pdf" ? "已生成 PDF" : "已生成长图");
    } catch (e) {
      showError(e);
    } finally {
      setExportingFormat(null);
    }
  }
  async function handleAcceptAndCopy(target: LayoutResult) {
    if (
      target === result &&
      stale &&
      !(await askConfirm({
        title: "原稿已修改",
        message: "这份排版对应较早版本的原稿，确认复制这个历史成稿？",
        confirmText: "继续复制",
        cancelText: "取消",
      }))
    )
      return;
    try {
      copyRichText(target, true);
      const accepted = await local.acceptReview(target.resultId);
      setResult((current) =>
        current?.resultId === accepted.resultId ? accepted : current,
      );
      setVersions(await local.listVersions(accepted.articleId));
      setDrawer(null);
      pushToast("已确认无误并复制，去公众号编辑器粘贴吧");
    } catch (e) {
      showError(e);
    }
  }
  async function handleCopyResult(target: LayoutResult, confirmDraft = false) {
    if (
      target === result &&
      stale &&
      !(await askConfirm({
        title: "原稿已修改",
        message: "这份排版对应较早版本的原稿，确认复制这个历史成稿？",
        confirmText: "继续复制",
        cancelText: "取消",
      }))
    )
      return;
    if (
      !isResultUsable(target) &&
      (!confirmDraft ||
        !target.reviewIssues?.length ||
        !(await askConfirm({
          title: "仍然复制此稿？",
          message: "这份稿子的原文差异会一并复制。粘贴后请核对，再发布。",
          confirmText: "仍然复制此稿",
          cancelText: "继续核对",
          danger: true,
        })))
    )
      return;
    const pending = target.demo ? null : describeResult(target).notices;
    if (
      !confirmDraft && pending?.action.length &&
      !(await askConfirm({
        title: "还有需要处理的地方",
        message:
          pending.action.map((n) => n.title).join("；") +
          "。直接复制的话，这些内容会原样出现在公众号里。",
        confirmText: "仍然复制",
        cancelText: "先去处理",
      }))
    ) {
      setDrawer("inspect");
      return;
    }
    try {
      copyRichText(target, confirmDraft);
      if (confirmDraft) {
        pushToast("已复制待核对稿，发布前请检查差异。");
        return;
      }
      const hints = pending ? pending.action.length + pending.review.length : 0;
      const hintSuffix = hints
        ? `还有 ${hints} 条提示，粘贴后请在公众号里看一眼。`
        : "";
      if (target.demo) pushToast("示例已复制，可到公众号编辑器粘贴查看。");
      else if (target.imageStatus === "local_pending")
        pushToast(
          "已复制。文章里有本机上传的图片，粘贴后请在公众号保存草稿并重新打开，确认图片显示正常。" +
            hintSuffix,
        );
      else if (target.imageStatus === "remote")
        pushToast(
          "已复制。文章里有网络图片，粘贴后请在公众号保存草稿并重新打开，确认图片都显示出来了。" +
            hintSuffix,
        );
      else pushToast("已复制，去公众号编辑器粘贴吧。" + hintSuffix);
    } catch (e) {
      showError(e);
    }
  }
  async function handleRichPaste(payload: RichPastePayload) {
    const current = docRef.current;
    if (!current || busy) return;
    const generation = await local.epoch();
    setBusy(true);
    try {
      const pasted = await readPaste(payload);
      if (
        (await local.epoch()) !== generation ||
        docRef.current?.id !== current.id
      )
        throw new Error("原稿已变化，请重新粘贴，当前内容已保留。");
      if (pasted.assets.length) {
        for (const asset of pasted.assets) {
          await local.putAsset(asset, generation);
        }
        setAssets((prev) => {
          const map = new Map(prev.map((a) => [a.id, a]));
          for (const asset of pasted.assets) map.set(asset.id, asset);
          return [...map.values()];
        });
      }
      if (pasted.markdown.trim()) {
        richEditorRef.current?.insertMarkdown(pasted.markdown);
        await flushSave();
      }
      pushToast(pasted.warnings.join(" ") || "已保留粘贴格式与配图。");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function pasteSource(event: ClipboardEvent<HTMLTextAreaElement>) {
    const clipboard = event.clipboardData;
    const html = clipboard.getData("text/html"),
      text = clipboard.getData("text/plain");
    const files = [...clipboard.files];
    if (!html && !files.some((file) => file.type.startsWith("image/"))) return;
    event.preventDefault();
    const current = docRef.current;
    if (!current || busy) return;
    const input = event.currentTarget;
    const start = input.selectionStart,
      end = input.selectionEnd;
    const generation = await local.epoch();
    setBusy(true);
    try {
      const pasted = await readPaste({ html, text, files });
      if (
        (await local.epoch()) !== generation ||
        docRef.current?.id !== current.id ||
        docRef.current.sourceMarkdown !== current.sourceMarkdown
      )
        throw new Error("原稿已变化，请重新粘贴，当前内容已保留。");
      const source =
        current.sourceMarkdown.slice(0, start) +
        pasted.markdown +
        current.sourceMarkdown.slice(end);
      const pending = saveQueue.current
        .catch(() => {})
        .then(async () => {
          const live = docRef.current;
          if (
            !live ||
            live.id !== current.id ||
            live.sourceMarkdown !== current.sourceMarkdown
          )
            throw new Error("原稿已变化，请重新粘贴，当前内容已保留。");
          const saved = await local.saveArticle(
            { ...live, sourceMarkdown: source },
            pasted.assets,
            generation,
          );
          if (docRef.current?.id === saved.id) {
            const next = {
              ...docRef.current,
              revision: saved.revision,
              sourceMarkdown:
                docRef.current.sourceMarkdown === current.sourceMarkdown
                  ? source
                  : docRef.current.sourceMarkdown,
            };
            docRef.current = next;
            savedRef.current = JSON.stringify([
              saved.title,
              saved.sourceMarkdown,
            ]);
            setDoc(next);
            setSaveState(
              JSON.stringify([next.title, next.sourceMarkdown]) ===
                savedRef.current
                ? "已保存到本机"
                : "等待保存",
            );
            await local.saveRecovery(next);
          }
          setArticles((old) => old.map((a) => (a.id === saved.id ? saved : a)));
        });
      saveQueue.current = pending;
      await pending;
      pushToast(pasted.warnings.join(" ") || "已保留粘贴格式与配图。");
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(
          start + pasted.markdown.length,
          start + pasted.markdown.length,
        );
      });
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function cancelJob(target = job) {
    if (target && activeTask.current?.id === target.id)
      activeTask.current.controller.abort();
    if (target) {
      await local.interruptJob(target.id);
      if (docRef.current?.id === target.articleId) {
        setJob(await local.latestJob(target.articleId));
        await refreshHistory(target.articleId);
      }
    }
    await refreshArticles();
    pushToast("已停止后续步骤。已发出的请求可能计费，不会自动重发。");
  }
  async function importFile(file: File) {
    setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("文件不能超过10MiB");
      if (/\.(md|txt)$/i.test(file.name)) {
        const source = await file.text();
        await newArticle(
          source,
          source.match(/^#\s+(.+)/m)?.[1] || file.name.replace(/\.[^.]+$/, ""),
        );
      } else {
        const { importWord } = await import("./imports");
        const data = await importWord(file);
        const warningNote = data.warnings.length
          ? "\n" + data.warnings.join("\n")
          : "";
        if (
          await askConfirm({
            title: "确认导入 Word 文稿",
            message: `已提取正文，其中 ${data.images} 张图片仅在本机浏览器保存。${warningNote}\n确认作为新文章导入？`,
            confirmText: "确认导入",
            cancelText: "取消",
          })
        )
          await newArticle(
            data.sourceMarkdown,
            data.title,
            false,
            data.assets,
            data.generation,
          );
      }
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function uploadImages(fileList: File[]) {
    const current = docRef.current;
    if (!current || !fileList.length) return;
    setBusy(true);
    try {
      let inserted = 0;
      for (const file of fileList) {
        const asset = await importImage(file);
        if (docRef.current?.id !== current.id) {
          pushToast("图片已本地保存；文章已切换，请从设置查看后插入。");
          return;
        }
        setAssets((prev) =>
          prev.some((a) => a.id === asset.id) ? prev : [...prev, asset],
        );
        insertMarkdownSnippet(`![](typetada-image:${asset.id})`);
        inserted++;
      }
      if (inserted > 0) {
        pushToast(
          "图片仅保存在本机并已插入原稿；成稿使用 data URL，粘贴至公众号后请注意补图。",
        );
      }
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
      if (imageRef.current) imageRef.current.value = "";
    }
  }
  async function deleteArticle(target: Article) {
    if (
      mutationRef.current ||
      !(await askConfirm({
        title: "删除文章",
        message: `确认删除「${target.title}」及本机排版版本？删除后无法撤销，配图缓存可在设置中清理。`,
        confirmText: "确认删除",
        cancelText: "取消",
        danger: true,
      }))
    )
      return;
    mutationRef.current = true;
    setArticleBusy(true);
    deletingRef.current.add(target.id);
    try {
      if (activeTask.current && job?.articleId === target.id)
        activeTask.current.controller.abort();
      await saveQueue.current.catch(() => {});
      const current = docRef.current?.id === target.id;
      if (current) {
        ++loadSeq.current;
        docRef.current = null;
        setDoc(null);
        setResult(null);
        savedRef.current = "";
        setVersions([]);
        setFailedJobs([]);
        setJob(null);
      }
      await local.deleteArticle(target.id);
      const rows = await refreshArticles();
      if (current && rows[0]) await openArticle(rows[0]);
      pushToast("文章及排版版本已删除");
      setError("");
    } catch (e) {
      showError(e);
    } finally {
      deletingRef.current.delete(target.id);
      mutationRef.current = false;
      setArticleBusy(false);
    }
  }
  async function downloadLayoutFailure(
    failedJob: Job,
    includeResponses = false,
  ) {
    const responses = includeResponses
      ? await local.getFailureResponses(failedJob.id)
      : undefined;
    if (includeResponses) {
      if (!responses) {
        pushToast("该次响应正文已被更新的失败记录替换，请下载诊断信息。");
        return;
      }
      if (
        !(await askConfirm({
          title: "导出模型返回正文？",
          message: "文件可能包含你的稿件内容和文中链接。发送给他人前请先检查。",
          confirmText: "下载含正文报告",
          cancelText: "取消",
        }))
      )
        return;
    }
    download(
      layoutFailureReport(failedJob, responses),
      layoutFailureFilename(failedJob, !!responses?.length),
      "application/json",
    );
  }
  async function recoverFailure(targetJob: Job) {
    if (recoveringJobId || busy || activeTask.current) return;
    setRecoveringJobId(targetJob.id);
    setError("");
    try {
      const saved = await flushSave();
      if (!saved) return;
      const value = await recoverFailedLayout(saved, targetJob, prefs);
      if (docRef.current?.id === saved.id) {
        setResult(value);
        setJob(await local.latestJob(saved.id));
        await refreshHistory(saved.id);
        setDrawer(null);
        setMobileTab("preview");
        pushToast(
          value.validation.ready
            ? "已用本地留存的 AI 响应 0 费用恢复成稿，可直接复制。"
            : "已免费恢复为待核对稿，请确认差异后复制。",
        );
      }
    } catch (e) {
      showError(e);
    } finally {
      setRecoveringJobId(null);
    }
  }
  async function recoverFromReport(file: File) {
    if (recoveringJobId || busy || activeTask.current) {
      if (reportRef.current) reportRef.current.value = "";
      return;
    }
    setRecoveringJobId("report");
    setError("");
    try {
      const saved = await flushSave();
      if (!saved) return;
      const value = await recoverFromFailureReportFile(saved, file, prefs);
      if (docRef.current?.id === saved.id) {
        setResult(value);
        setJob(await local.latestJob(saved.id));
        await refreshHistory(saved.id);
        setDrawer(null);
        setMobileTab("preview");
        pushToast(
          value.validation.ready
            ? "已从失败报告 0 费用恢复成稿，可直接复制。"
            : "已从失败报告免费恢复为待核对稿，请确认差异后复制。",
        );
      }
    } catch (e) {
      showError(e);
    } finally {
      setRecoveringJobId(null);
      if (reportRef.current) reportRef.current.value = "";
    }
  }
  function downloadSource() {
    if (docRef.current)
      download(
        docRef.current.sourceMarkdown,
        "typetada-source.md",
        "text/markdown",
      );
  }
  async function backup(articleId?: string) {
    try {
      await flushSave();
      const { exportBackup } = await import("./backup");
      download(
        await exportBackup(articleId),
        articleId ? "typetada-article.json" : "typetada-backup.json",
        "application/json",
      );
      pushToast("备份已导出（含原稿、版本与本机配图，不含钱包 Key）。");
    } catch (e) {
      showError(e);
    }
  }
  async function restore(file: File) {
    if (
      !(await askConfirm({
        title: "导入 JSON 备份",
        message:
          "将把备份作为新文章导入，不会覆盖现有稿件；钱包凭据与模型传输同意状态不会导入。确认继续？",
        confirmText: "确认导入",
        cancelText: "取消",
      }))
    ) {
      if (backupRef.current) backupRef.current.value = "";
      return;
    }
    setBusy(true);
    try {
      await flushSave();
      const { importBackup } = await import("./backup");
      const count = await importBackup(file);
      applyPrefs(await local.getPreferences());
      await refreshArticles();
      pushToast(`已导入 ${count.articles} 篇文章、${count.results} 份成稿。`);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
      if (backupRef.current) backupRef.current.value = "";
    }
  }
  const selectedTheme = themes.find((t) => t.id === theme),
    display =
      result ||
      (!doc && (theme === demo?.themeId || mode === "auto") ? demo : null),
    isRunning = !!job && !finished.has(job.status),
    // 有原稿但未生成成稿且选定了具体主题时，右侧直接展示所选主题样张并加提示标识
    sampleTheme =
      !display && !isRunning && mode === "format_only" ? selectedTheme : null;
  const displayTheme = display
    ? themes.find((t) => t.id === display.themeId)
    : sampleTheme;
  const dirty =
      !!doc &&
      JSON.stringify([doc.title, doc.sourceMarkdown]) !== savedRef.current,
    stale =
      !!doc &&
      !!result &&
      (result.sourceRevision !== doc.revision || result.sourceMarkdown !== doc.sourceMarkdown || dirty),
    editingWhileRunning =
      isRunning &&
      !!doc &&
      !!job &&
      (doc.revision !== job.sourceRevision || dirty),
    filteredArticles = articles.filter((a) =>
      a.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    );
  const review = useMemo(
    () => (display ? describeResult(display) : null),
    [display],
  );
  const jobBlocks = useMemo(() => {
    if (!doc || !job?.error || doc.revision !== job.sourceRevision) return [];
    try {
      return sourceManifest(doc.sourceMarkdown).blocks;
    } catch {
      return [];
    }
  }, [doc, job]);
  const draftIssues = display?.reviewIssues;
  const hasReviewIssues = !!draftIssues?.length;
  const reviewAccepted = hasReviewIssues && !!display?.reviewAcceptedAt;
  const hasDraft = hasReviewIssues && !display?.reviewAcceptedAt;
  const isDisplayUsable = !!display && isResultUsable(display);
  const canFixDisplay =
    !!display?.validation.ready && !display.demo && !!display.sourceHtml;
  const highlight = useRef<(() => void) | null>(null);
  const locateInPreview = useCallback(
    (path: number[] | null | undefined) => {
      const missing = () =>
        pushToast("没能在预览里定位到这里，可以在右侧预览中手动查看。");
      if (!path?.length) return missing();
      setDrawer(null);
      setMobileTab("preview");
      // The phone frame is scaled down; show the spot at full width.
      if (width === "phone") {
        setWidthState("wide");
        setAutoWide(true);
      }
      highlight.current?.();
      const started = performance.now();
      const find = () => {
        const frames = [
          ...document.querySelectorAll<HTMLIFrameElement>(
            '.preview-stage iframe[title="公众号排版效果"]',
          ),
        ];
        const frame = frames.find((f) => f.offsetParent !== null) ?? frames[0];
        const doc = frame?.contentDocument;
        let target: Element | null | undefined =
          doc?.readyState === "complete" ? doc.body : null;
        for (const index of path) target = target?.children[index];
        return target && "style" in target
          ? { el: target as HTMLElement, doc: doc! }
          : null;
      };
      const attempt = () => {
        const found = find();
        if (!found) {
          // The preview may be remounting after the width switch.
          if (performance.now() - started < 2500)
            return void window.setTimeout(attempt, 80);
          return missing();
        }
        const { el, doc } = found;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        const before = el.getAttribute("style");
        el.style.outline = "2px solid #f59e0b";
        el.style.outlineOffset = "3px";
        el.style.backgroundColor = "#fff4d6";
        const events = ["pointerdown", "wheel", "touchstart", "keydown"];
        let timer = 0;
        const clear = () => {
          window.clearTimeout(timer);
          for (const name of events)
            doc.removeEventListener(name, onUser, true);
          if (before === null) el.removeAttribute("style");
          else el.setAttribute("style", before);
          if (highlight.current === clear) highlight.current = null;
        };
        const onUser = () => clear();
        // Keep it until the author interacts with the preview, at most 8s.
        window.setTimeout(() => {
          if (highlight.current !== clear) return;
          for (const name of events) doc.addEventListener(name, onUser, true);
        }, 600);
        timer = window.setTimeout(clear, 8000);
        highlight.current = clear;
      };
      window.setTimeout(attempt, 120);
    },
    [pushToast, width],
  );
  useEffect(() => {
    setAuthorFormOpen(false);
    highlight.current?.();
  }, [display?.resultId]);
  useEffect(() => {
    // Close open "more" menus on an outside click or Escape.
    const close = (event: Event) => {
      for (const menu of document.querySelectorAll<HTMLDetailsElement>(
        "details.more-menu[open]",
      ))
        if (
          (event instanceof KeyboardEvent && event.key === "Escape") ||
          (!(event instanceof KeyboardEvent) &&
            !menu.contains(event.target as Node))
        )
          menu.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  const placeholderNotice = review?.notices.action.find(
    (n) => n.key === "placeholder",
  );
  const fillLabel = name.trim() ? `填入「${name.trim()}」` : "填写署名";
  useEffect(() => {
    if (!isRunning || !job) {
      setElapsedSeconds(0);
      return;
    }
    const updateElapsed = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor(Date.now() / 1000 - job.startedAt)),
      );
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, job]);
  useEffect(() => {
    if (fullscreenPreview && !display && !sampleTheme)
      setFullscreenPreview(false);
  }, [fullscreenPreview, display, sampleTheme]);
  useEffect(() => {
    if (fullscreenWriting && !doc) setFullscreenWriting(false);
  }, [fullscreenWriting, doc]);
  const characterCount = doc ? [...doc.sourceMarkdown].length : 0,
    maxCharacters = MAX_CHARACTERS,
    overLimit = characterCount > maxCharacters,
    canGenerate =
      !!doc?.sourceMarkdown.trim() &&
      !overLimit &&
      !busy &&
      !isRunning &&
      !articleBusy,
    themeChanged =
      !!result &&
      ((mode === "format_only" && theme !== result.themeId) ||
        (mode === "blindbox" && !isBlindBoxThemeId(result.themeId))),
    walletRecovery = wallet?.recoveryAction;

  let nextStep = "";
  if (GENERATION_CONFIG_ERROR) nextStep = GENERATION_CONFIG_ERROR;
  else if (!doc) nextStep = "新建或导入原稿 → 选主题 → 排版 → 复制";
  else if (!doc.sourceMarkdown.trim())
    nextStep = "下一步：在左侧粘贴正文，或点击「导入」。";
  else if (overLimit)
    nextStep = `正文超出 ${characterCount - maxCharacters} 字符，请拆分后排版。`;
  else if (!wallet?.connected)
    nextStep = "下一步：连接钱包，使用自己的额度排版。";
  else if (!isRunning) {
    if (stale || themeChanged)
      nextStep = "当前显示旧版，点击「开始排版」生成新版。";
    else if (hasDraft) nextStep = "成稿已保留，先查看差异。";
    else if (result && isResultUsable(result))
      nextStep = "先看预览，满意后点击「复制到公众号」。";
    else nextStep = "确认主题后，点击「开始排版」。";
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="icon-button nav-toggle"
          aria-label={navOpen ? "关闭文章列表" : "打开文章列表"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen(!navOpen)}
        >
          <Menu size={20} />
        </button>
        <a className="brand" href="/editor">
          <span className="brand-mark">文</span>
          <b>文有样</b>
          <span>TypeTada</span>
        </a>
        <span className="header-divider" />
        <span className="workspace-label">公众号排版工作台</span>
        <div className="header-actions">
          <button
            className="quiet help-trigger"
            aria-label="打开使用指南"
            title="使用指南"
            onClick={() => setDrawer("help")}
          >
            <BookOpen size={16} /> <span className="help-label">使用指南</span>
          </button>
          <button className="wallet-button" onClick={() => setDrawer("wallet")}>
            <Wallet size={16} />
            {wallet?.connected ? "钱包已连接" : "连接 Token 钱包"}
            {wallet?.connected && <span className="connection-dot" />}
          </button>
        </div>
      </header>
      {navOpen && (
        <button
          className="nav-scrim"
          aria-label="关闭文章列表"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={"sidebar " + (navOpen ? "sidebar-open" : "")}>
        <button
          className="primary new-article"
          onClick={() => void newArticle()}
          disabled={!ready || articleBusy}
        >
          <Plus size={17} /> {articleBusy ? "处理中…" : "新建文章"}
        </button>
        <div className="section-label">
          我的文章 <span>{articles.length}</span>
        </div>
        {articles.length > 0 && (
          <label className="article-search">
            <Search size={14} />
            <input
              type="search"
              aria-label="搜索文章"
              placeholder="搜索文章"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        )}
        <nav aria-label="文章列表">
          {articles.length === 0 ? (
            <div className="sidebar-empty">
              第一篇好文章，
              <br />
              从这里开始。
            </div>
          ) : filteredArticles.length === 0 ? (
            <p className="sidebar-empty">没有找到这篇文章。</p>
          ) : (
            filteredArticles.map((a) => (
              <div
                key={a.id}
                className={
                  "article-row " + (doc?.id === a.id ? "selected" : "")
                }
              >
                <button
                  className="article-link"
                  aria-current={doc?.id === a.id ? "page" : undefined}
                  title={a.title || "未命名文章"}
                  disabled={articleBusy}
                  onClick={() => void openSafely(a)}
                >
                  <FileText size={16} />
                  <span>
                    <b>{a.title || "未命名文章"}</b>
                    <small>
                      {new Date(a.updatedAt * 1000).toLocaleDateString(
                        "zh-CN",
                        { month: "short", day: "numeric" },
                      )}
                      {!a.sourceMarkdown.trim() ? " · 空白稿" : ""}
                    </small>
                  </span>
                </button>
                <button
                  className="article-delete"
                  title="删除文章"
                  aria-label={`删除文章：${a.title || "未命名文章"}`}
                  disabled={articleBusy}
                  onClick={() => void deleteArticle(a)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-community-links">
            <a
              className="sidebar-watcha-badge"
              href="https://watcha.cn/products/typetada?utm_source=product-badge&utm_content=invite"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://tos.watcha.cn/public/images/invite-0-white.png"
                alt="在观猹查看文有样 TypeTada（新标签页）"
                width={170}
                height={36}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </a>
            {GITHUB_REPOSITORY_URL && (
              <a
                className="sidebar-github-link"
                href={GITHUB_REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="在 GitHub 查看开源仓库（新窗口打开）"
                title="GitHub 开源仓库"
              >
                <svg
                  width={15}
                  height={15}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub 开源</span>
                <ArrowUpRight size={13} className="sidebar-github-arrow" />
              </a>
            )}
          </div>
          <div className="sidebar-backup-links">
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void backup()}
              title="导出全部文章、成稿与本机配图（不含钱包Key）"
            >
              <FolderDown size={14} /> 导出备份
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => backupRef.current?.click()}
              title="从 JSON 备份恢复文章（不覆盖现有稿件）"
            >
              <FolderUp size={14} /> 恢复备份
            </button>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <div className="workspace-feedback">
          {globalJob && globalJob.articleId !== doc?.id && (
            <div className="message" role="status">
              <span>
                另一篇文章有未结束的排版任务：
                {articles.find((a) => a.id === globalJob.articleId)?.title ||
                  "未命名文章"}
              </span>
              <button
                onClick={() => {
                  const target = articles.find(
                    (a) => a.id === globalJob.articleId,
                  );
                  if (target) void openSafely(target);
                }}
              >
                查看任务文章
              </button>
              <button
                onClick={() => void cancelJob(globalJob).catch(showError)}
              >
                停止并标记未知
              </button>
            </div>
          )}
          {hasDraft ? (
            <div className="message warning action-banner" role="status">
              <div className="action-banner-row">
                <span className="action-banner-text">
                  <strong>排版已生成，{draftIssues?.length} 处细节待核对</strong>
                  <span>核对无误即可直接复制</span>
                </span>
                <span className="message-actions">
                  <button
                    className="primary small"
                    onClick={() => setDrawer("inspect")}
                  >
                    查看差异 <ArrowRight size={13} />
                  </button>
                </span>
              </div>
            </div>
          ) : display && !isDisplayUsable && (
            <div className="message error" role="alert">
              <span>
                这版排版没通过原文核对，不能复制：
                {(review?.errors ?? []).slice(0, 3).join("；")}
              </span>
            </div>
          )}
          {display &&
            display.validation.ready &&
            !!review?.notices.action.length &&
            (() => {
              const notice = review.notices.action[0];
              const path = targetPath(notice.target, review.locations);
              const canFill =
                canFixDisplay && !!notice.actions?.includes("fill_author");
              const canRemove =
                canFixDisplay &&
                !!notice.actions?.includes("remove_placeholder");
              const more = review.notices.action.length - 1;
              return (
                <div className="message warning action-banner" role="status">
                  <div className="action-banner-row">
                    <span className="action-banner-text">
                      <strong>{notice.title}</strong>
                      {notice.quote ? (
                        <q className="notice-quote">{notice.quote}</q>
                      ) : (
                        notice.detail && <span>{notice.detail}</span>
                      )}
                    </span>
                    <span className="message-actions">
                      {canFill && !authorFormOpen && (
                        <button
                          className="primary small"
                          onClick={() =>
                            void applyNoticeAction(display, "fill_author")
                          }
                        >
                          {fillLabel}
                        </button>
                      )}
                      {!!path && (
                        <button
                          className="text-button"
                          onClick={() => locateInPreview(path)}
                        >
                          <LocateFixed size={13} /> 在预览中查看
                        </button>
                      )}
                      {more > 0 && (
                        <button
                          className="text-button"
                          onClick={() => setDrawer("inspect")}
                        >
                          还有 {more} 项
                        </button>
                      )}
                      {canRemove && (
                        <details className="more-menu">
                          <summary aria-label="更多操作">
                            更多 <ChevronDown size={13} />
                          </summary>
                          <div className="more-menu-list" role="menu">
                            <button
                              role="menuitem"
                              onClick={(e) => {
                                (
                                  e.currentTarget.closest(
                                    "details",
                                  ) as HTMLDetailsElement
                                ).open = false;
                                void applyNoticeAction(
                                  display,
                                  "remove_placeholder",
                                );
                              }}
                            >
                              {canFill ? "不要署名，删掉这一段" : "删掉这一段"}
                            </button>
                          </div>
                        </details>
                      )}
                    </span>
                  </div>
                  {authorFormOpen && placeholderNotice && (
                    <form
                      className="author-inline-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void applyNoticeAction(
                          display,
                          "fill_author",
                          authorDraft,
                        );
                      }}
                    >
                      <label>
                        作者名字
                        <input
                          autoFocus
                          required
                          maxLength={60}
                          value={authorDraft.name}
                          onChange={(e) =>
                            setAuthorDraft((d) => ({
                              ...d,
                              name: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        一句话介绍<small>（可不填）</small>
                        <input
                          maxLength={200}
                          value={authorDraft.bio}
                          onChange={(e) =>
                            setAuthorDraft((d) => ({
                              ...d,
                              bio: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <span className="author-inline-actions">
                        <button
                          className="primary small"
                          type="submit"
                          disabled={!authorDraft.name.trim()}
                        >
                          填入成稿
                        </button>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => setAuthorFormOpen(false)}
                        >
                          取消
                        </button>
                      </span>
                      <small className="author-inline-hint">
                        也会保存为以后排版的默认署名，可在设置里修改。
                      </small>
                    </form>
                  )}
                </div>
              );
            })()}
        </div>
        <div className="mobile-tabs">
          <button
            aria-pressed={mobileTab === "source"}
            onClick={() => setMobileTab("source")}
          >
            编辑原稿
          </button>
          <button
            aria-pressed={mobileTab === "preview"}
            onClick={() => setMobileTab("preview")}
          >
            排版预览
          </button>
        </div>
        <section className="editor-frame">
          <div
            className={
              "source-pane " +
              (fullscreenWriting && doc ? "source-pane-fullscreen " : "") +
              (mobileTab !== "source" && !fullscreenWriting
                ? "mobile-hidden"
                : "")
            }
            {...(fullscreenWriting && doc
              ? {
                  role: "dialog",
                  "aria-modal": true,
                  "aria-label": "全屏专注写作",
                }
              : {})}
          >
            <div className="pane-toolbar source-toolbar">
              <span className="source-heading">
                <FileText size={15} /> {fullscreenWriting ? "专注写作" : "原稿"}
                {doc && (
                  <span
                    className="source-view-switch"
                    role="group"
                    aria-label="原稿显示方式"
                  >
                    <button
                      aria-pressed={sourceView === "rich"}
                      onClick={() => {
                        setSourceView("rich");
                        requestAnimationFrame(() =>
                          richEditorRef.current?.focus("end"),
                        );
                      }}
                    >
                      写作
                    </button>
                    <button
                      aria-pressed={sourceView === "markdown"}
                      onClick={() => {
                        setSourceView("markdown");
                        requestAnimationFrame(() => sourceRef.current?.focus());
                      }}
                    >
                      Markdown
                    </button>
                  </span>
                )}
              </span>
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  <Upload size={14} /> 导入
                </button>
                <button
                  onClick={() => imageRef.current?.click()}
                  disabled={busy || !doc}
                  aria-label="插入配图"
                  title="上传并插入配图"
                >
                  <ImagePlus size={16} />
                </button>
                {doc && (
                  <button
                    onClick={downloadSource}
                    className="source-secondary-action"
                    aria-label="下载 Markdown 原稿"
                    title="下载 Markdown 原稿"
                  >
                    <ArrowDownToLine size={15} />
                  </button>
                )}
                {doc && (
                  <button
                    onClick={() =>
                      void newArticle(
                        doc.sourceMarkdown,
                        doc.title + " 副本",
                        true,
                      )
                    }
                    className="source-secondary-action"
                    aria-label="另存副本"
                    title="另存副本"
                  >
                    <Copy size={15} />
                  </button>
                )}
                {fullscreenWriting && doc ? (
                  <>
                    <button
                      className="fullscreen-write-layout-btn"
                      disabled={!canGenerate || !!GENERATION_CONFIG_ERROR}
                      title="退出全屏并立即生成排版"
                      onClick={() => {
                        setFullscreenWriting(false);
                        void startLayout();
                      }}
                    >
                      <Sparkles size={14} /> 去排版
                    </button>
                    <button
                      className="fullscreen-write-exit-btn"
                      aria-label="退出全屏写作"
                      title="退出全屏写作 (Esc)"
                      onClick={() => setFullscreenWriting(false)}
                    >
                      <Minimize2 size={15} /> 退出全屏
                    </button>
                  </>
                ) : (
                  <button
                    aria-label="全屏专注写作"
                    title="全屏沉浸式写作"
                    disabled={!doc}
                    onClick={() => {
                      setFullscreenPreview(false);
                      setFullscreenWriting(true);
                    }}
                  >
                    <Maximize2 size={15} />
                  </button>
                )}
              </div>
            </div>
            {doc ? (
              <div className="source-sheet">
                {editingWhileRunning && job && (
                  <div className="running-edit-hint" role="status">
                    本次排版正基于提交时的快照（v{job.sourceRevision}
                    ）生成，新改动将保存在草稿中供下次排版。
                  </div>
                )}
                <input
                  className="article-title"
                  aria-label="文章标题"
                  placeholder="给文章起个标题"
                  value={doc.title}
                  onChange={(e) => changeDoc({ title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (sourceView === "rich")
                        richEditorRef.current?.focus("start");
                      else sourceRef.current?.focus();
                    }
                  }}
                />
                {sourceView === "rich" ? (
                  <SourceRichEditor
                    ref={richEditorRef}
                    articleId={doc.id}
                    value={doc.sourceMarkdown}
                    assets={assetUrlMap}
                    busy={busy}
                    onChange={(sourceMarkdown) => changeDoc({ sourceMarkdown })}
                    onRequestImageUpload={() => imageRef.current?.click()}
                    onDropImageFiles={(files) => void uploadImages(files)}
                    onRichPaste={(payload) => void handleRichPaste(payload)}
                  />
                ) : (
                  <textarea
                    ref={sourceRef}
                    className="source-editor"
                    aria-label="文章原稿"
                    placeholder="在这里粘贴文章，或导入 Markdown、Word 文件…"
                    value={doc.sourceMarkdown}
                    onSelect={(e) => {
                      selectionRef.current = {
                        articleId: doc.id,
                        start:
                          e.currentTarget.selectionStart ??
                          e.currentTarget.value.length,
                        end:
                          e.currentTarget.selectionEnd ??
                          e.currentTarget.value.length,
                      };
                    }}
                    onKeyUp={(e) => {
                      selectionRef.current = {
                        articleId: doc.id,
                        start:
                          e.currentTarget.selectionStart ??
                          e.currentTarget.value.length,
                        end:
                          e.currentTarget.selectionEnd ??
                          e.currentTarget.value.length,
                      };
                    }}
                    onClick={(e) => {
                      selectionRef.current = {
                        articleId: doc.id,
                        start:
                          e.currentTarget.selectionStart ??
                          e.currentTarget.value.length,
                        end:
                          e.currentTarget.selectionEnd ??
                          e.currentTarget.value.length,
                      };
                    }}
                    onChange={(e) => {
                      selectionRef.current = {
                        articleId: doc.id,
                        start:
                          e.currentTarget.selectionStart ??
                          e.currentTarget.value.length,
                        end:
                          e.currentTarget.selectionEnd ??
                          e.currentTarget.value.length,
                      };
                      changeDoc({ sourceMarkdown: e.target.value });
                    }}
                    onPaste={(event) => void pasteSource(event)}
                    spellCheck={false}
                  />
                )}
              </div>
            ) : (
              <div className="empty-source">
                <span className="empty-paper">
                  <FileText size={32} strokeWidth={1.4} />
                </span>
                <h2>把好内容放进来</h2>
                <p>直接开始创作，或导入 Markdown / Word。</p>
                <button
                  className="primary"
                  onClick={() => void newArticle()}
                  disabled={!ready || articleBusy}
                >
                  <Plus size={16} /> 开始写一篇
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    demo && void newArticle(demo.sourceMarkdown, demo.title)
                  }
                >
                  用示例文章试试看 <ArrowRight size={14} />
                </button>
                <span className="input-types">
                  支持所见即所得 · Markdown · Word
                </span>
              </div>
            )}
            <div className="source-status">
              <span className={overLimit ? "error-text" : ""}>
                {doc
                  ? `${characterCount.toLocaleString()} / ${maxCharacters.toLocaleString()} 字符${
                      characterCount > 0
                        ? ` · 约 ${Math.max(1, Math.ceil(characterCount / 400))} 分钟读完`
                        : ""
                    }`
                  : "原稿会自动保存 · 请及时下载备份"}
              </span>
              <span className={saveState === "保存失败" ? "error-text" : ""}>
                {doc && fullscreenWriting && (
                  <small className="edit-hint">
                    Esc 退出 · ⌘K 插链接 · 支持拖拽传图 ·{" "}
                  </small>
                )}
                {saveState === "保存中…" ? (
                  <LoaderCircle size={12} className="spin" />
                ) : doc ? (
                  <Check size={12} />
                ) : null}
                {doc ? saveState : ""}
              </span>
            </div>
          </div>
          <div
            className={
              "preview-pane " + (mobileTab !== "preview" ? "mobile-hidden" : "")
            }
          >
            <div className="pane-toolbar">
              <span>
                <LayoutTemplate size={15} />{" "}
                <span className="pane-title-label">排版预览</span>
                <button
                  className="theme-select"
                  aria-label="选择排版主题"
                  title="点击切换或预览排版主题"
                  onClick={() => setDrawer("themes")}
                >
                  <span
                    className={
                      mode === "auto"
                        ? "theme-dot-auto"
                        : mode === "blindbox"
                          ? "theme-dot-blindbox"
                          : ""
                    }
                    style={
                      mode === "format_only"
                        ? { background: selectedTheme?.color || "#059669" }
                        : undefined
                    }
                  />
                  <b>
                    {mode === "auto"
                      ? "AI 自动选"
                      : mode === "blindbox"
                        ? `盲盒 · ${blindBoxStyleLabel(blindBoxStyle)}`
                        : selectedTheme?.name || "摸鱼绿"}
                  </b>
                  <ChevronDown
                    size={13}
                    className="theme-select-caret"
                    aria-hidden="true"
                  />
                </button>
                {display?.blindBoxBrief && !display.demo && (
                  <span
                    className="blindbox-result-chip"
                    title={display.blindBoxBrief.summary}
                  >
                    <i
                      style={{
                        background: display.blindBoxBrief.palette.primary,
                      }}
                    />
                    {display.blindBoxBrief.family.name} ·{" "}
                    {display.blindBoxBrief.palette.name}
                  </span>
                )}
                {mode === "blindbox" &&
                  display?.blindBoxBrief &&
                  !display.demo &&
                  !isRunning &&
                  !stale &&
                  !!doc && (
                    <button
                      type="button"
                      className="blindbox-reroll-btn"
                      disabled={busy || !!GENERATION_CONFIG_ERROR}
                      title="换一套不同的视觉家族与配色重新排版"
                      onClick={() =>
                        void startLayout(false, undefined, {
                          skipRepeatConfirm: true,
                        })
                      }
                    >
                      <Shuffle size={12} /> 再开一盒
                    </button>
                  )}
                {(mode === "auto" || themeChanged) &&
                  (displayTheme || display?.blindBoxBrief || (display && isBlindBoxThemeId(display.themeId))) &&
                  display &&
                  !display.demo && (
                    <em
                      title={`当前成稿主题：${
                        displayTheme?.name ||
                        formatBlindBoxLabel(display.blindBoxBrief, display.themeId)
                      }`}
                    >
                      成稿：
                      {displayTheme?.name ||
                        formatBlindBoxLabel(display.blindBoxBrief, display.themeId)}
                    </em>
                  )}
                {display?.demo && <em>Skill 示例</em>}
                {sampleTheme && <em>主题样张</em>}
                {display &&
                  display.decisions.length > 0 &&
                  !display.blindBoxBrief && (
                    <button
                      className="decision-chip"
                      onClick={() => setDrawer("inspect")}
                      title={display.decisions.join("；")}
                    >
                      AI 推荐
                    </button>
                  )}
              </span>
              <div className="width-switch">
                <ViewportSegmentedSwitch width={width} onChange={setWidth} />
                <button
                  aria-label="全屏预览"
                  title="全屏沉浸式预览"
                  disabled={!display && !sampleTheme}
                  onClick={() => {
                    setFullscreenWriting(false);
                    setFullscreenPreview(true);
                  }}
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  ref={historyButtonRef}
                  aria-label="历史版本"
                  title="历史排版版本"
                  onClick={() => {
                    setHistoryTarget(currentFailure?.id ?? null);
                    setDrawer("history");
                  }}
                  disabled={!doc}
                >
                  <History size={16} />
                </button>
              </div>
            </div>
            {(stale || themeChanged) && !isRunning && (
              <div className="stale-note">
                {stale
                  ? "原稿已修改，当前为历史排版。"
                  : "已选新主题，当前仍显示上次成稿。"}
                点击「开始排版」生成新版本。
              </div>
            )}
            {doc && sampleTheme && (
              <div className="sample-mode-banner">
                当前展示「{sampleTheme.name}」主题样张 ·
                点击下方「开始排版」生成本文成稿
              </div>
            )}
            {autoWide && width === "wide" && (
              <div className="auto-wide-hint" role="status">
                已切到宽屏查看
                <button
                  className="text-button"
                  onClick={() => setWidth("phone")}
                >
                  切回手机
                </button>
              </div>
            )}
            <div className="preview-stage">
              {display || sampleTheme ? (
                <PreviewViewport
                  display={display}
                  sampleTheme={sampleTheme}
                  showImages={showImages}
                  width={width}
                  fullscreen={false}
                  headerTitle={
                    display
                      ? display.title
                      : sampleTheme
                        ? `${sampleTheme.name} · 主题样张`
                        : ""
                  }
                />
              ) : (
                <div className="empty-preview">
                  <LayoutTemplate size={34} strokeWidth={1.2} />
                  <h2>让文章穿上新衣</h2>
                  <p>
                    {mode === "auto"
                      ? "当前为 AI 自动选主题，点击下方“开始排版”。"
                      : mode === "blindbox"
                        ? `当前为盲盒排版（${blindBoxStyleLabel(blindBoxStyle)}），点击下方“开始排版”随机抽一套视觉家族。`
                        : "选择一套主题，点击下方“开始排版”。"}
                    <br />
                    预览、复制和下载会使用同一份成稿。
                  </p>
                  <span className="preview-rule" />
                </div>
              )}
              {isRunning && job && (
                <div className="running-preview-overlay" role="status">
                  <div className="running-preview-card">
                    <div className="running-preview-badge">
                      <LoaderCircle size={16} className="spin" />
                      <span>
                        正在按「
                        {mode === "auto"
                          ? "AI 自动选主题"
                          : mode === "blindbox"
                            ? `盲盒 · ${blindBoxStyleLabel(blindBoxStyle)}`
                            : selectedTheme?.name || theme}
                        」排版
                      </span>
                    </div>
                    <h3>{stages[job.stage] || "正在处理排版"}</h3>
                    <div className="running-steps" aria-hidden="true">
                      <span
                        className={
                          ["normalize", "analyze"].includes(job.stage)
                            ? "active"
                            : "done"
                        }
                      >
                        1. 理解结构
                      </span>
                      <span
                        className={
                          ["generate", "repair"].includes(job.stage)
                            ? "active"
                            : job.stage === "validate" ||
                                job.stage === "complete"
                              ? "done"
                              : ""
                        }
                      >
                        2. 生成排版
                      </span>
                      <span
                        className={job.stage === "validate" ? "active" : ""}
                      >
                        3. 核对校验
                      </span>
                    </div>
                    <p className="running-metrics">
                      已耗时 <b>{elapsedSeconds}s</b> · 已请求 {job.callCount}{" "}
                      次
                    </p>
                    <p className="small-label">
                      长文排版可能需要几分钟，请保持页面打开。
                    </p>
                    <button
                      className="quiet danger"
                      onClick={() => void cancelJob().catch(showError)}
                    >
                      {activeTask.current?.id === job.id
                        ? "取消本次排版"
                        : "原窗口已关闭？停止并标记未知"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="preview-status">
              <ShieldCheck size={13} />
              <span>
                {doc && sampleTheme
                  ? `所选主题「${sampleTheme.name}」真实样张，非本文成稿`
                  : sampleTheme
                    ? "所选主题的真实样张，非你的成稿"
                    : display?.demo
                      ? "来自现有 Skill 的示例，未消耗模型额度"
                      : display
                        ? display.validation.ready
                          ? review?.notices.action.length
                            ? `原文已逐段核对 · ${review.notices.action.length} 处需要你处理`
                            : review?.notices.review.length
                              ? `原文已逐段核对 · ${review.notices.review.length} 条建议看一眼`
                              : "原文已逐段核对 · 可以复制了"
                          : reviewAccepted
                            ? review?.notices.action.length
                              ? `人工已核对 · ${review.notices.action.length} 处需要你处理`
                              : `人工已核对（${draftIssues!.length} 处差异已确认）· 可以复制了`
                            : hasDraft
                              ? `待核对稿 · ${draftIssues!.length} 处细节待核对`
                              : "这版没通过原文核对，不能复制"
                        : "原文保留 · 金句增强 · 一键复制"}
              </span>
              {display && !display.demo && (
                <button
                  className="text-button preview-inspect-btn"
                  onClick={() => setDrawer("inspect")}
                >
                  {hasDraft ? "查看差异" : "核对详情"}
                </button>
              )}
            </div>
          </div>
        </section>
        <div className="actionbar">
          <div className="layout-options">
            <button
              className="settings-button"
              onClick={() => setDrawer("settings")}
              aria-label="排版设置"
            >
              <Settings2 size={17} />
              <span>设置</span>
            </button>
          </div>
          <div className="output-actions">
            <div className="download-dropdown" ref={downloadMenuRef}>
              <button
                className="icon-button download-trigger"
                title="下载或导出"
                aria-label="下载与导出"
                aria-expanded={downloadMenuOpen}
                aria-busy={exportingFormat !== null}
                disabled={!display && !doc}
                onClick={() => setDownloadMenuOpen((open) => !open)}
              >
                <ArrowDownToLine size={16} />
                <ChevronDown size={12} />
              </button>
              {downloadMenuOpen && (
                <div
                  className="download-menu"
                  role="menu"
                  aria-label="下载选项"
                >
                  <button
                    role="menuitem"
                    disabled={!display || !canDownloadLayout(display)}
                    onClick={() => {
                      if (!display) return;
                      try {
                        exportResult(display, "preview");
                        setDownloadMenuOpen(false);
                        pushToast(
                          hasDraft
                            ? "已下载待核对稿 (.html)"
                            : "已下载完整版 HTML",
                        );
                      } catch (e) {
                        showError(e);
                      }
                    }}
                  >
                    下载完整版 HTML (.html)
                    <small>
                      {hasDraft
                        ? "待核对稿 · 下载后仍可继续核对"
                        : "含预览和一键复制"}
                    </small>
                  </button>
                  <button
                    role="menuitem"
                    disabled={!!exportingFormat || !display || !canDownloadLayout(display)}
                    onClick={() => display && void downloadVisual(display, "pdf")}
                  >
                    {exportingFormat === "pdf" ? "正在生成 PDF…" : "下载 PDF (.pdf)"}
                    <small>A4 分页，文字不可选中</small>
                  </button>
                  <button
                    role="menuitem"
                    disabled={!!exportingFormat || !display || !canDownloadLayout(display)}
                    onClick={() => display && void downloadVisual(display, "png")}
                  >
                    {exportingFormat === "png" ? "正在生成长图…" : "下载图片 (.png)"}
                    <small>整篇成稿导出为一张长图</small>
                  </button>
                  <button
                    role="menuitem"
                    disabled={!doc && !display}
                    onClick={() => {
                      if (doc) downloadSource();
                      else if (display) exportResult(display, "markdown");
                      setDownloadMenuOpen(false);
                      pushToast("已下载 Markdown 原稿");
                    }}
                  >
                    下载 Markdown 原稿 (.md)
                  </button>
                </div>
              )}
            </div>
            {isRunning && job && (
              <button
                className="quiet danger"
                onClick={() => void cancelJob().catch(showError)}
              >
                取消
              </button>
            )}
            {(() => {
              const primaryAction: "generate" | "review" | "copy" =
                isRunning || !display || display.demo || stale || themeChanged
                  ? "generate"
                  : hasDraft
                    ? "review"
                    : isDisplayUsable
                      ? "copy"
                      : "generate";
              const generateTitle =
                GENERATION_CONFIG_ERROR ||
                (!doc
                  ? "先新建或导入文章"
                  : !doc.sourceMarkdown.trim()
                    ? "先输入文章正文"
                    : overLimit
                      ? `正文需在 ${maxCharacters} 字符以内`
                      : "生成新排版版本，可能消耗模型额度");
              const renderGenerateBtn = (
                variant: "primary" | "secondary",
                label: string,
              ) => (
                <button
                  className={`${variant} generate-button`}
                  aria-describedby="workbench-next-step"
                  disabled={!canGenerate || !!GENERATION_CONFIG_ERROR}
                  title={generateTitle}
                  onClick={() => void startLayout()}
                >
                  {busy || isRunning ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}{" "}
                  {isRunning ? `排版中 ${elapsedSeconds}s` : label}
                </button>
              );
              const renderReviewOrCopyBtn = (
                variant: "primary" | "secondary",
              ) => (
                <button
                  className={variant}
                  disabled={!isDisplayUsable && !hasDraft}
                  onClick={() => {
                    if (hasDraft) setDrawer("inspect");
                    else if (display) void handleCopyResult(display);
                  }}
                >
                  {hasDraft ? <FileText size={16} /> : <Copy size={16} />}
                  {hasDraft ? "查看差异" : "复制到公众号"}
                </button>
              );
              if (primaryAction === "generate") {
                return (
                  <>
                    {renderReviewOrCopyBtn("secondary")}
                    {renderGenerateBtn("primary", "开始排版")}
                  </>
                );
              }
              return (
                <>
                  {renderGenerateBtn("secondary", "重新排版")}
                  {renderReviewOrCopyBtn("primary")}
                </>
              );
            })()}
          </div>
        </div>
        <footer className={`workspace-footer${doc && walletRecovery ? " wallet-recovery-footer" : ""}`}>
          <span id="workbench-next-step">
            {doc && walletRecovery ? (
              <span className="wallet-recovery-hint" role="status">
                {walletRecovery === "top_up_balance" ? (
                  <>
                    TokenDance 钱包余额不足
                    <a href={TOKEN_DANCE_CREDITS_URL} target="_blank" rel="noreferrer">
                      去充值 <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                  </>
                ) : (
                  <>
                    {walletRecovery === "reauthorize_api_key"
                      ? "钱包授权已失效"
                      : "钱包周期额度已用完"}
                    <button className="text-button" onClick={() => setDrawer("wallet")}>
                      {walletRecovery === "reauthorize_api_key" ? "重新授权" : "查看钱包"}
                    </button>
                  </>
                )}
              </span>
            ) : nextStep}
          </span>
          {filingLinks}
        </footer>
      </main>
      <div className="toast-stack" aria-live="polite">
        {currentFailure && !drawer && !confirmModal && (
          <div className="floating-alert job-alert" role="status">
            <span className="floating-alert-title">
              <AlertTriangle size={16} aria-hidden="true" />
              {currentFailure.status === "outcome_unknown"
                ? "本次排版结果未知，可能已计费。"
                : "本次排版未完成，详情已保存到历史记录。"}
            </span>
            <button
              className="text-button"
              onClick={() => {
                setHistoryTarget(currentFailure.id);
                setFailureNotice(null);
                setFullscreenPreview(false);
                setDrawer("history");
              }}
            >
              查看记录
            </button>
            <button
              className="icon-button"
              aria-label="关闭异常提示"
              onClick={() => setFailureNotice(null)}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {error && (
          <div className="floating-alert error-alert" role="alert">
            <span>{friendlyJobMessage(error, jobBlocks)}</span>
            <button
              className="icon-button"
              aria-label="关闭错误提示"
              onClick={() => setError("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {stickyNotice && (
          <div className="floating-alert sticky-alert" role="status">
            <span>{stickyNotice}</span>
            <button
              className="icon-button"
              aria-label="关闭提醒"
              onClick={() => setStickyNotice("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {toasts.map((item) => (
          <div
            key={item.id}
            className={"toast " + (item.action ? "toast-with-action" : "")}
            role="status"
            onClick={
              item.action ? undefined : () => dismissToast(item.id)
            }
          >
            <span className="toast-icon" aria-hidden="true">
              <Check size={12} />
            </span>
            <span>{item.text}</span>
            {item.action && (
              <>
                <button
                  className="toast-action"
                  onClick={() => {
                    dismissToast(item.id);
                    item.action!.run();
                  }}
                >
                  <Undo2 size={13} /> {item.action.label}
                </button>
                <button
                  aria-label="关闭通知"
                  onClick={() => dismissToast(item.id)}
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <input
        ref={backupRef}
        type="file"
        accept=".json"
        hidden
        onChange={(e) => e.target.files?.[0] && void restore(e.target.files[0])}
      />
      <input
        ref={reportRef}
        type="file"
        accept=".json"
        hidden
        onChange={(e) =>
          e.target.files?.[0] && void recoverFromReport(e.target.files[0])
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".md,.txt,.docx"
        hidden
        onChange={(e) =>
          e.target.files?.[0] && void importFile(e.target.files[0])
        }
      />
      <input
        ref={imageRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) =>
          e.target.files?.length && void uploadImages([...e.target.files])
        }
      />
      {drawer && (
        <div
          className="drawer-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawer(null);
          }}
        >
          <section
            ref={drawerRef}
            className={"drawer " + (drawer === "themes" ? "themes-drawer" : "")}
            role="dialog"
            aria-modal="true"
            aria-label={
              {
                themes: "选择排版主题",
                history: "历史版本",
                wallet: "钱包",
                help: "使用指南",
                settings: "排版设置",
                confirm: "确认排版",
                inspect: "成稿核对与用量",
              }[drawer]
            }
          >
            <div className="drawer-header">
              <div>
                <h2>
                  {
                    {
                      themes: "为文章选个好模样",
                      history: "每一次排版，都在这里",
                      wallet: wallet?.connected ? "我的钱包" : "连接钱包",
                      help: "从好内容，到好模样",
                      settings: "排版设置",
                      confirm: "开始排版",
                      inspect: "成稿核对与用量",
                    }[drawer]
                  }
                </h2>
                {drawer === "help" && (
                  <p className="help-version">当前版本 v{APP_VERSION}</p>
                )}
              </div>
              <button
                className="icon-button"
                aria-label="关闭面板"
                onClick={() => setDrawer(null)}
              >
                <X size={20} />
              </button>
            </div>
            {error && error !== job?.error?.message && (
              <div className="message error" role="alert">
                {error}
              </div>
            )}
            {drawer === "themes" &&
              (previewTheme ? (
                <div className="theme-detail">
                  <button
                    className="text-button"
                    onClick={() => setPreviewTheme(null)}
                  >
                    <ArrowLeft size={15} /> 返回全部主题
                  </button>
                  <div className="theme-detail-heading">
                    <div>
                      <h3>{previewTheme.name}</h3>
                      <p>
                        {themeSampleLabel(previewTheme.id)} ·
                        仅查看，不消耗模型额度
                      </p>
                    </div>
                    <button
                      className="primary"
                      onClick={() => {
                        setTheme(previewTheme.id);
                        setMode("format_only");
                        setDrawer(null);
                        pushToast(
                          `已选择「${previewTheme.name}」，可先看样张，点击「开始排版」生成新成稿。`,
                        );
                      }}
                    >
                      使用这个主题 <Check size={15} />
                    </button>
                  </div>
                  <div className="theme-full-preview">
                    <iframe
                      title={`${previewTheme.name}完整样张`}
                      src={`/library/${previewTheme.id}-sample.html`}
                      sandbox=""
                    />
                  </div>
                  <p className="small-label">
                    样张用于查看版式；文章内容与长度会影响最终成稿。原作者甲木 ×
                    摸鱼小李。
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="theme-mode-tabs"
                    role="tablist"
                    aria-label="排版模式选择"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={themeDrawerTab === "presets"}
                      className={
                        "theme-mode-tab " +
                        (themeDrawerTab === "presets" ? "active" : "")
                      }
                      onClick={() => setThemeDrawerTab("presets")}
                    >
                      <span>精选主题</span>
                      <em>{themes.length || 13}</em>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={themeDrawerTab === "blindbox"}
                      className={
                        "theme-mode-tab blindbox-tab " +
                        (themeDrawerTab === "blindbox" ? "active" : "")
                      }
                      onClick={() => setThemeDrawerTab("blindbox")}
                    >
                      <span className="blindbox-tab-fx" aria-hidden="true" />
                      <span className="blindbox-dice-stage" aria-hidden="true">
                        <Dices size={16} className="blindbox-tab-dice" />
                        <span className="blindbox-dice-shadow" />
                        <span className="blindbox-sparks">
                          <i className="spark-1">✦</i>
                          <i className="spark-2" />
                          <i className="spark-3" />
                        </span>
                      </span>
                      <span className="blindbox-tab-label">盲盒排版</span>
                      {themeDrawerTab !== "blindbox" ? (
                        <span className="blindbox-float-badge">试试手气</span>
                      ) : (
                        <em>百变</em>
                      )}
                    </button>
                  </div>

                  {themeDrawerTab === "presets" ? (
                    <>
                      <p className="drawer-description">
                        选一套喜欢的版式，预览与切换不消耗额度。
                      </p>
                      <button
                        className={
                          "auto-theme " + (mode === "auto" ? "chosen" : "")
                        }
                        onClick={() => {
                          setMode("auto");
                          setDrawer(null);
                          pushToast("已切换 AI 自动选主题");
                        }}
                      >
                        <Sparkles size={20} />
                        <span>
                          <b>让 AI 从以下主题挑选</b>
                          <small>
                            根据文章题材自动匹配最合适的一套，最多增加一次分析调用
                          </small>
                        </span>
                        <ArrowRight size={17} />
                      </button>
                      <div className="theme-grid">
                        {themes.map((t) => (
                          <article
                            key={t.id}
                            className={
                              "theme-card " +
                              (theme === t.id && mode === "format_only"
                                ? "chosen"
                                : "")
                            }
                          >
                            <button
                              className="theme-image-button"
                              aria-label={`查看${t.name}完整样张`}
                              onClick={() => setPreviewTheme(t)}
                            >
                              <img
                                src={themeImage(t.id, true)}
                                alt={`${t.name}真实模板预览`}
                                loading="lazy"
                              />
                              <span>查看完整样张</span>
                            </button>
                            <div className="theme-caption">
                              <b>{t.name}</b>
                              {theme === t.id && mode === "format_only" ? (
                                <span className="selected-tag">
                                  <Check size={13} /> 已选
                                </span>
                              ) : null}
                            </div>
                            <small>{t.description.split("（")[0]}</small>
                            <div className="theme-card-bottom">
                              <button
                                className="text-button"
                                aria-label={`使用${t.name}主题`}
                                onClick={() => {
                                  setTheme(t.id);
                                  setMode("format_only");
                                  setDrawer(null);
                                  pushToast(`已选择「${t.name}」`);
                                }}
                              >
                                使用主题 <ArrowRight size={13} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="blindbox-panel">
                      <p className="drawer-description">
                        跳出固定模板，每次从 160+ 组配色与版式里随机开箱，单次调用出稿且不与上盒重复。
                      </p>
                      <div
                        className="blindbox-style-grid"
                        role="radiogroup"
                        aria-label="盲盒风格方向"
                      >
                        {BLIND_BOX_STYLES.map((st) => {
                          const selected =
                            mode === "blindbox" && blindBoxStyle === st.id;
                          const swatches = BLIND_BOX_SWATCHES[st.id];
                          return (
                            <button
                              key={st.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              className={
                                "blindbox-style-card " +
                                (selected ? "selected" : "")
                              }
                              onClick={() => {
                                setBlindBoxStyle(st.id);
                                setMode("blindbox");
                                setDrawer(null);
                                pushToast(`已切换盲盒 · ${st.label}`);
                              }}
                            >
                              <div className="blindbox-card-top">
                                <span
                                  className="blindbox-swatches"
                                  aria-hidden="true"
                                >
                                  {swatches.map((hex) => (
                                    <i key={hex} style={{ background: hex }} />
                                  ))}
                                </span>
                                {selected ? (
                                  <span className="selected-tag">
                                    <Check size={12} /> 已选
                                  </span>
                                ) : (
                                  <span className="blindbox-card-go">
                                    使用 <ArrowRight size={12} />
                                  </span>
                                )}
                              </div>
                              <b>{st.label}</b>
                              <small>{st.description}</small>
                            </button>
                          );
                        })}
                      </div>
                      <p className="blindbox-panel-note">
                        点击任一风格即刻生效；出稿后可在预览顶栏随时点击「再开一盒」换新方案。
                      </p>
                    </div>
                  )}
                </>
              ))}
            {drawer === "settings" && (
              <div className="settings-form">
                <p className="auto-save-hint">
                  <Check size={13} /> 所有修改已自动保存在当前浏览器
                </p>
                <label>
                  署名方式
                  <select
                    value={authorMode}
                    onChange={(e) =>
                      setAuthorMode(e.target.value as Preferences["authorMode"])
                    }
                  >
                    {authorTypes.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                {authorMode === "custom" && (
                  <>
                    <label>
                      作者名字
                      <input
                        value={name}
                        maxLength={60}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      一句话介绍
                      <input
                        value={bio}
                        maxLength={200}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </label>
                  </>
                )}
                <label>
                  排版偏好
                  <textarea
                    value={note}
                    maxLength={500}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="选填，例如重点突出结论"
                    rows={3}
                  />
                </label>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={showImages}
                    onChange={(e) => setShowImages(e.target.checked)}
                  />
                  <span>
                    成稿预览加载外链图片
                    <small>
                      仅控制右侧成稿；原稿直接显示原图，本机配图默认显示。
                    </small>
                  </span>
                </label>
                <details className="asset-settings">
                  <summary>
                    管理配图{assets.length ? `（${assets.length}）` : ""}
                  </summary>
                  <p className="field-hint">
                    图片仅存本机，粘贴公众号后请检查。
                  </p>

                  {assets.length === 0 ? (
                    <p>没有本机配图。</p>
                  ) : (
                    assets.map((a) => (
                      <div className="asset-row" key={a.id}>
                        <img src={a.url} alt={a.name} />
                        <span>
                          {a.name}
                          <small>仅保存在浏览器</small>
                        </span>
                        <button
                          className="quiet"
                          disabled={!doc}
                          onClick={() =>
                            insertMarkdownSnippet(
                              `![](typetada-image:${a.id})`,
                              "配图标识已插入原稿。",
                            )
                          }
                        >
                          插入原稿
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label="删除本机配图"
                          onClick={async () => {
                            try {
                              await local.deleteAsset(a.id);
                              setAssets(await local.listAssets());
                            } catch (e) {
                              showError(e);
                            }
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </details>
                <div className="settings-actions">
                  <button
                    className="quiet"
                    onClick={async () => {
                      if (
                        !(await askConfirm({
                          title: "恢复默认设置",
                          message:
                            "将清空自定义署名、一句话介绍与排版偏好，并重置成稿外链图开关，是否确认？",
                          confirmText: "确认恢复",
                          cancelText: "取消",
                          danger: true,
                        }))
                      )
                        return;
                      setAuthorMode("preserve");
                      setName("");
                      setBio("");
                      setNote("");
                      setShowImages(false);
                      pushToast("已恢复默认排版设置");
                    }}
                  >
                    <RotateCcw size={14} /> 恢复默认
                  </button>
                  <button className="primary" onClick={() => setDrawer(null)}>
                    完成 <Check size={16} />
                  </button>
                </div>
              </div>
            )}
            {drawer === "inspect" && display && review && (
              <div className="inspect-content">
                <div className="inspect-summary">
                  <div>
                    <small>成稿主题</small>
                    <strong>
                      {display.blindBoxBrief || isBlindBoxThemeId(display.themeId)
                        ? formatBlindBoxLabel(display.blindBoxBrief, display.themeId)
                        : themes.find((t) => t.id === display.themeId)?.name ||
                          display.themeId}
                    </strong>
                  </div>
                  <div>
                    <small>本次用量（tokens）</small>
                    <strong>
                      输入 {formatTokens(display.usage.inputTokens)} · 输出{" "}
                      {formatTokens(display.usage.outputTokens)}
                    </strong>
                  </div>
                </div>
                {draftIssues?.length ? (
                  <section className="notice-section">
                    <div className="draft-section-head">
                      <h4>
                        {reviewAccepted
                          ? `已确认的原文差异（${draftIssues.length}）`
                          : `待核对的原文差异（${draftIssues.length}）`}
                      </h4>
                      {reviewAccepted && (
                        <span className="draft-accepted-pill">已人工核对</span>
                      )}
                    </div>
                    {draftIssues.map((issue) => {
                      const diff = diffBlockText(
                        issue.expected,
                        issue.actual,
                        issue.kind,
                      );
                      return (
                        <div
                          className={`notice-item draft-diff ${
                            reviewAccepted ? "is-accepted" : "notice-action"
                          }`}
                          key={`${issue.sourceId}-${issue.kind}`}
                        >
                          <div className="draft-diff-head">
                            <strong>{describeBlock(issue.sourceId, review.blocks)}</strong>
                            <span className={`diff-summary-badge is-${diff.summary.tone}`}>
                              {diff.summary.label}
                            </span>
                          </div>
                          {issue.detail && (
                            <p className="draft-diff-detail">{issue.detail}</p>
                          )}
                          {issue.expected && (
                            <div className="draft-diff-row">
                              <span className="diff-role">原文</span>
                              <p>
                                {diff.expectedRuns.map((run, idx) =>
                                  run.type === "del" ? (
                                    <del className="diff-del" key={idx}>
                                      {run.text}
                                    </del>
                                  ) : (
                                    <span key={idx}>{run.text}</span>
                                  ),
                                )}
                              </p>
                            </div>
                          )}
                          <div className="draft-diff-row">
                            <span className="diff-role">成稿</span>
                            <p>
                              {issue.actual ? (
                                diff.actualRuns.map((run, idx) =>
                                  run.type === "add" ? (
                                    <mark className="diff-add" key={idx}>
                                      {run.text}
                                    </mark>
                                  ) : (
                                    <span key={idx}>{run.text}</span>
                                  ),
                                )
                              ) : (
                                <span className="diff-missing">此处未找到对应内容</span>
                              )}
                            </p>
                          </div>
                          {hasDraft &&
                            display.sourceHtml &&
                            !stale &&
                            ["changed_text", "missing", "outside_body"].includes(
                              issue.kind,
                            ) && (
                              <div className="notice-actions">
                                <button
                                  className="secondary"
                                  disabled={busy || isRunning || !!restoringSource}
                                  onClick={() =>
                                    void restoreDifference(display, issue.sourceId)
                                  }
                                >
                                  {restoringSource === issue.sourceId
                                    ? "正在恢复…"
                                    : "恢复此处原文"}
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    })}
                    {hasDraft ? (
                      <div className="notice-actions draft-review-actions">
                        <span
                          className="tip-wrap"
                          data-tip={
                            stale
                              ? "原稿已修改，请先重新排版"
                              : "让 AI 对齐原文重新生成（会再次消耗 Token）"
                          }
                        >
                          <button
                            className="secondary"
                            disabled={busy || isRunning || !!restoringSource || stale || !!GENERATION_CONFIG_ERROR}
                            onClick={() => void requestRepair(display)}
                          >
                            用 AI 修复
                          </button>
                        </span>
                        <button
                          className="primary"
                          disabled={!!restoringSource}
                          onClick={() => void handleAcceptAndCopy(display)}
                        >
                          保留差异并复制
                        </button>
                      </div>
                    ) : (
                      <div className="notice-actions draft-review-actions is-accepted">
                        {!stale && !GENERATION_CONFIG_ERROR && (
                          <span
                            className="tip-wrap"
                            data-tip="让 AI 对齐原文重新生成（会再次消耗 Token）"
                          >
                            <button
                              className="text-button"
                              disabled={busy || isRunning}
                              onClick={() => void requestRepair(display)}
                            >
                              仍需 AI 修复
                            </button>
                          </span>
                        )}
                        <button
                          className="secondary"
                          onClick={() => void handleCopyResult(display)}
                        >
                          复制此稿
                        </button>
                      </div>
                    )}
                  </section>
                ) : !isDisplayUsable && (
                  <div className="inspect-card notice-block-error">
                    <h4>没通过原文核对，不能复制</h4>
                    {review.errors.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                )}
                {review.notices.action.length > 0 && (
                  <section className="notice-section">
                    <h4>需要你处理（{review.notices.action.length}）</h4>
                    {review.notices.action.map((notice) => (
                      <NoticeItem
                        key={notice.key}
                        notice={notice}
                        fillLabel={fillLabel}
                        onLocate={
                          targetPath(notice.target, review.locations)
                            ? () =>
                                locateInPreview(
                                  targetPath(notice.target, review.locations),
                                )
                            : undefined
                        }
                        onAction={
                          canFixDisplay
                            ? (action) =>
                                void applyNoticeAction(display, action)
                            : undefined
                        }
                      />
                    ))}
                  </section>
                )}
                {review.notices.review.length > 0 && (
                  <section className="notice-section">
                    <h4>建议看一眼（{review.notices.review.length}）</h4>
                    {review.notices.review.map((notice) => (
                      <NoticeItem
                        key={notice.key}
                        notice={notice}
                        onLocate={
                          targetPath(notice.target, review.locations)
                            ? () =>
                                locateInPreview(
                                  targetPath(notice.target, review.locations),
                                )
                            : undefined
                        }
                      />
                    ))}
                  </section>
                )}
                {display.validation.ready &&
                  !review.notices.action.length &&
                  !review.notices.review.length && (
                    <div className="inspect-card notice-all-good">
                      <h4>原文已逐段核对，可以放心复制</h4>
                      <p>粘贴到公众号后，建议保存草稿并用手机预览看一眼。</p>
                    </div>
                  )}
                {review.notices.auto.length > 0 && (
                  <details className="notice-disclosure">
                    <summary>
                      主题已自动处理（{review.notices.auto.length}）
                      <small>不需要逐条确认</small>
                    </summary>
                    {review.notices.auto.map((notice) => (
                      <NoticeItem
                        key={notice.key}
                        notice={notice}
                        onLocate={
                          notice.items
                            ? undefined
                            : targetPath(notice.target, review.locations)
                              ? () =>
                                  locateInPreview(
                                    targetPath(notice.target, review.locations),
                                  )
                              : undefined
                        }
                      >
                        {notice.items && (
                          <DecorationList
                            items={notice.items}
                            blocks={review.blocks}
                            paths={review.locations?.enhancements ?? []}
                            onLocate={locateInPreview}
                          />
                        )}
                      </NoticeItem>
                    ))}
                  </details>
                )}
                {display.decisions.length > 0 && (
                  <div className="inspect-card">
                    <h4>排版说明</h4>
                    <p>{display.decisions.join("；")}</p>
                  </div>
                )}
                <details className="notice-disclosure technical">
                  <summary>技术详情（反馈问题时用）</summary>
                  {job?.diagnostic && (
                    <p>
                      结束原因：{job.diagnostic.finishReason || "stop"} · 正文{" "}
                      {job.diagnostic.contentCharacters} 字符 · 思考{" "}
                      {job.diagnostic.reasoningCharacters} 字符 · 请求{" "}
                      {job.callCount} 次
                    </p>
                  )}
                  <p>
                    模型：{display.model || "未知"} · 原始 tokens：
                    {display.usage.inputTokens ?? "未知"} /{" "}
                    {display.usage.outputTokens ?? "未知"}
                  </p>
                  {[...display.validation.errors, ...review.warnings].map(
                    (message, idx) => (
                      <p key={idx}>
                        <code>{message}</code>
                      </p>
                    ),
                  )}
                </details>
              </div>
            )}
            {drawer === "confirm" && (
              <div className="confirm-layout">
                <div className="confirm-theme">
                  {mode === "blindbox" ? (
                    <Dices size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                  <span>
                    {mode === "auto"
                      ? "AI 自动选主题"
                      : mode === "blindbox"
                        ? `盲盒排版（${blindBoxStyleLabel(blindBoxStyle)}）`
                        : themes.find((t) => t.id === theme)?.name || "摸鱼绿"}
                    <small>
                      {mode === "blindbox"
                        ? "160+ 组配色与版式随机开箱 · 单次调用出稿"
                        : "保留原文 · 金句与头尾卡片"}
                    </small>
                  </span>
                </div>
                <p>文章将交给 TokenDance 和模型处理，费用从你的钱包扣除。</p>
                <details className="disclosure">
                  <summary>查看调用说明</summary>
                  <p>
                    手选主题调用一次，AI 自动选主题最多调用两次。AI 修复由你另行发起。失败、取消或中断也可能计费。
                  </p>
                </details>
                <button
                  className="primary"
                  onClick={() => {
                    setDrawer(null);
                    void startLayout(true);
                  }}
                >
                  同意并开始排版 <ArrowRight size={16} />
                </button>
                <button className="quiet" onClick={() => setDrawer("settings")}>
                  调整设置
                </button>
              </div>
            )}
            {drawer === "wallet" && (
              <div className="wallet-content">
                <div className="wallet-illustration">
                  <Wallet size={36} strokeWidth={1.3} />
                </div>
                <h3>
                  {wallet?.connected ? "钱包已连接" : "用自己的额度，按需排版"}
                </h3>
                <p>
                  {wallet?.connected
                    ? "费用从 TokenDance 账户扣除。"
                    : "前往 TokenDance 授权，返回即可排版。"}
                </p>
                <label className="consent-check remember-wallet">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={async (e) => {
                      const value = e.target.checked;
                      setRememberWallet(value);
                      if (wallet?.connected) {
                        await setRemember(value);
                        await refreshWallet();
                      }
                    }}
                  />
                  <span>
                    在此设备记住钱包
                    <small>
                      公共设备请取消勾选。凭据保存在浏览器，可被设备使用者读取。
                    </small>
                  </span>
                </label>
                {wallet?.balanceYuan !== null &&
                  wallet?.balanceYuan !== undefined && (
                    <div className="balance">
                      ¥ {wallet.balanceYuan.toFixed(4)}
                      <small>可用余额</small>
                    </div>
                  )}
                {wallet?.recoveryAction && (
                  <p role="status">
                    {
                      (
                        {
                          top_up_balance:
                            "余额不足，请前往平台充值；当前Key仍有效，不会删除。",
                          reauthorize_api_key: "当前Key已失效，请重新授权。",
                          api_key_quota:
                            "已达到周期额度，可等待刷新或主动重新授权。",
                        } as Record<string, string>
                      )[wallet.recoveryAction]
                    }
                  </p>
                )}
                {wallet?.message && (
                  <div className="message error">{wallet.message}</div>
                )}
                {AUTH_CONFIG_ERROR && <p role="status">{AUTH_CONFIG_ERROR}</p>}
                <button
                  className="primary"
                  disabled={busy || !!AUTH_CONFIG_ERROR}
                  onClick={() => void connect()}
                >
                  <Wallet size={16} />
                  {wallet?.connected ? "重新授权" : "连接 TokenDance"}
                  <ArrowRight size={16} />
                </button>
                {wallet?.connected && (
                  <div className="wallet-extra">
                    <button
                      className="quiet"
                      onClick={() => void refreshWallet(true).catch(showError)}
                    >
                      刷新余额
                    </button>
                    <a
                      href={TOKEN_DANCE_CREDITS_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      TokenDance 余额与充值
                    </a>
                    <button
                      className="text-button danger"
                      onClick={async () => {
                        activeTask.current?.controller.abort();
                        await disconnectWallet();
                        await refreshWallet();
                        pushToast(
                          "已删除此浏览器保存的 Key；平台 Key 如需撤销请到 TokenDance 管理。",
                        );
                      }}
                    >
                      断开并忘记钱包
                    </button>
                  </div>
                )}
                <details className="disclosure">
                  <summary>授权与费用说明</summary>
                  <p>
                    未勾选“记住”时，刷新或关闭页面后需重新连接。Key
                    不进入备份，也不发送给 TypeTada
                    服务器；同源脚本或扩展可能读取已保存凭据。
                  </p>
                  <p>
                    排版使用 {MODEL || "尚未配置的模型"}
                    。关闭页面会中断任务，已发出的请求仍可能计费。断开只删除本机凭据，平台
                    Key 请在 TokenDance 管理。
                  </p>
                </details>
              </div>
            )}
            {drawer === "history" && (
              <div className="versions">
                <div className="history-toolbar">
                  <button
                    type="button"
                    className="text-button"
                    disabled={recoveringJobId !== null || busy || !doc}
                    onClick={() => reportRef.current?.click()}
                  >
                    <Upload size={14} />{" "}
                    {recoveringJobId === "report"
                      ? "正在恢复…"
                      : "从失败报告 JSON 恢复"}
                  </button>
                </div>
                {versions.length === 0 && failedJobs.length === 0 ? (
                  <p className="drawer-description">
                    还没有排版版本。完成一次排版后，结果会保存在这里。
                  </p>
                ) : (
                  [
                    ...versions.map((v, i) => ({
                      kind: "version" as const,
                      time: v.createdAt,
                      v,
                      num: versions.length - i,
                    })),
                    ...failedJobs.map((j) => ({
                      kind: "failed" as const,
                      time: j.startedAt,
                      j,
                    })),
                  ]
                    .sort((a, b) => b.time - a.time)
                    .map((entry) => {
                      if (entry.kind === "version") {
                        const { v, num } = entry;
                        const isCurrent = result?.resultId === v.id;
                        return (
                          <div
                            key={v.id}
                            className={
                              "version-item " +
                              (isCurrent ? "current-version" : "")
                            }
                          >
                            <button
                              type="button"
                              className="version-main"
                              onClick={async () => {
                                try {
                                  const r = await local.getResult(v.id);
                                  setResult(r);
                                  setDrawer(null);
                                } catch (e) {
                                  showError(e);
                                }
                              }}
                            >
                              <span className="version-info">
                                <b>
                                  排版版本 {num}
                                  {v.needsReview && (
                                    <em className="version-badge">待核对</em>
                                  )}
                                  {isCurrent && (
                                    <em className="version-badge">当前预览</em>
                                  )}
                                </b>
                                <small>
                                  {new Date(v.createdAt * 1000).toLocaleString(
                                    "zh-CN",
                                  )}
                                </small>
                              </span>
                              <span className="version-theme-link">
                                {v.themeLabel ||
                                  themes.find((t) => t.id === v.themeId)
                                    ?.name ||
                                  (isBlindBoxThemeId(v.themeId)
                                    ? formatBlindBoxLabel(undefined, v.themeId)
                                    : v.themeId)}
                                <ArrowRight size={14} />
                              </span>
                            </button>
                            <div className="version-actions">
                              <button
                                type="button"
                                className="icon-button version-icon-btn"
                                aria-label={
                                  v.needsReview
                                    ? "下载待核对稿 HTML"
                                    : "下载完整版 HTML"
                                }
                                data-tip={
                                  v.needsReview
                                    ? "下载待核对稿 HTML"
                                    : "下载完整版 HTML (.html)"
                                }
                                onClick={() =>
                                  void local
                                    .getResult(v.id)
                                    .then((value) =>
                                      exportResult(value, "preview"),
                                    )
                                    .catch(showError)
                                }
                              >
                                <ArrowDownToLine size={14} />
                              </button>
                              <button
                                type="button"
                                className="icon-button version-icon-btn danger delete-version"
                                aria-label="删除这个版本"
                                title="删除这个历史版本"
                                data-tip="删除这个版本"
                                onClick={async () => {
                                  if (
                                    !(await askConfirm({
                                      title: "删除历史版本",
                                      message:
                                        "确认删除这个历史排版版本？原稿与其余版本会保留。",
                                      confirmText: "确认删除",
                                      cancelText: "取消",
                                      danger: true,
                                    }))
                                  )
                                    return;
                                  try {
                                    await local.deleteResult(v.id);
                                    setVersions((old) =>
                                      old.filter((row) => row.id !== v.id),
                                    );
                                    if (result?.resultId === v.id)
                                      setResult(null);
                                    pushToast("已删除该历史版本");
                                  } catch (e) {
                                    showError(e);
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      }
                      const j = entry.j;
                      const canRecover = recoverableJobIds.has(j.id);
                      const themeName = j.layout?.themeId
                        ? themes.find((t) => t.id === j.layout!.themeId)
                            ?.name ||
                          (isBlindBoxThemeId(j.layout.themeId)
                            ? formatBlindBoxLabel(undefined, j.layout.themeId)
                            : j.layout.themeId)
                        : "";
                      const label =
                        j.stage === "validate"
                          ? "校验未通过"
                          : j.status === "outcome_unknown"
                            ? "结果未知"
                            : "排版未完成";
                      return (
                        <div
                          key={j.id}
                          className="version-item failed-version"
                          ref={j.id === visibleHistoryTarget ? historyRowRef : undefined}
                          tabIndex={j.id === visibleHistoryTarget ? -1 : undefined}
                        >
                          <div className="failed-version-top">
                            <span className="version-info">
                              <b>
                                {label}
                                <em className="version-badge failed-badge">
                                  已请求 {j.callCount} 次
                                </em>
                              </b>
                              <small className="failed-version-meta">
                                {new Date(j.startedAt * 1000).toLocaleString(
                                  "zh-CN",
                                )}
                                {j.diagnostic
                                  ? ` · 正文 ${j.diagnostic.contentCharacters} 字 · 输出 ${formatTokens(j.diagnostic.outputTokens)} tokens`
                                  : ""}
                              </small>
                            </span>
                            {themeName && (
                              <span className="version-theme-link">
                                {themeName}
                              </span>
                            )}
                          </div>
                          {j.error?.message && (
                            <p className="failed-version-reason">
                              {friendlyJobMessage(j.error.message, jobBlocks)}
                            </p>
                          )}
                          {j.diagnostic && (
                            <details className="floating-diagnostic">
                              <summary>失败详情与用量</summary>
                              <p>
                                结束原因：{j.diagnostic.finishReason || "未返回"} · 正文{" "}
                                {j.diagnostic.contentCharacters} 字符 · 思考{" "}
                                {j.diagnostic.reasoningCharacters} 字符
                              </p>
                              <p>
                                输入 {formatTokens(j.diagnostic.inputTokens)} · 输出{" "}
                                {formatTokens(j.diagnostic.outputTokens)} tokens
                              </p>
                            </details>
                          )}
                          <div className="failed-version-actions">
                            {canRecover && (
                              <button
                                type="button"
                                className="primary small"
                                disabled={recoveringJobId !== null || busy}
                                onClick={() => void recoverFailure(j)}
                              >
                                <RotateCcw size={13} />{" "}
                                {recoveringJobId === j.id
                                  ? "正在恢复…"
                                  : "重新核对并恢复"}
                              </button>
                            )}
                            <button
                              type="button"
                              className="text-button"
                              onClick={() =>
                                void downloadLayoutFailure(j, false).catch(
                                  showError,
                                )
                              }
                            >
                              <ArrowDownToLine size={13} /> 下载错误
                            </button>
                            {canRecover && (
                              <button
                                type="button"
                                className="text-button"
                                onClick={() =>
                                  void downloadLayoutFailure(j, true).catch(
                                    showError,
                                  )
                                }
                              >
                                <ArrowDownToLine size={13} /> 含正文报告
                              </button>
                            )}
                            <button
                              type="button"
                              className="icon-button version-icon-btn danger delete-version"
                              aria-label="删除这条失败记录"
                              title="删除这条失败记录"
                              data-tip="删除记录"
                              onClick={async () => {
                                if (
                                  !(await askConfirm({
                                    title: "删除失败记录",
                                    message:
                                      "确认删除这条排版失败记录及留存的模型响应？",
                                    confirmText: "确认删除",
                                    cancelText: "取消",
                                    danger: true,
                                  }))
                                )
                                  return;
                                try {
                                  await local.deleteJob(j.id);
                                  if (job?.id === j.id && doc) {
                                    setJob(await local.latestJob(doc.id));
                                  }
                                  await refreshHistory();
                                  pushToast("已删除该失败记录");
                                } catch (e) {
                                  showError(e);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
            {drawer === "help" && (
              <div className="help-content">
                <p className="drawer-description">
                  即用即走的公众号排版工具，无需注册TypeTada账号。
                </p>
                <h3>怎样开始？</h3>
                <ol>
                  <li>粘贴原稿或在本浏览器导入Markdown/Word。</li>
                  <li>
                    选真实主题样张，授权TokenDance钱包，确认模型处理及用量范围。
                  </li>
                  <li>
                    检查正文、金句和头尾卡片，复制到公众号，保存草稿后重开、手机预览。
                  </li>
                </ol>
                <h3>保存与备份</h3>
                <p>
                  原稿、成稿、配图和设置保存在当前浏览器IndexedDB，没有30天主动清理。无痕、清理站点数据、存储回收、换浏览器或设备可能丢失；不承诺永久保存或跨设备同步。请定期下载备份，JSON备份含私有稿件但不含钱包Key。
                </p>
                <div className="backup-actions">
                  <button className="secondary" onClick={() => void backup()}>
                    导出全部备份
                  </button>
                  <button
                    className="secondary"
                    disabled={!doc}
                    onClick={() => void backup(doc?.id)}
                  >
                    备份当前文章
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => backupRef.current?.click()}
                  >
                    导入JSON备份
                  </button>
                </div>
                <h3>页面关闭与费用</h3>
                <p>
                  关闭或刷新页面会中断任务，已发出的请求可能计费。手选主题调用一次，AI 自动选主题另需一次分析。AI 修复由你另行发起。
                </p>
                <h3>图片如何处理？</h3>
                <p>
                  不自建托管。远程图沿用HTTPS地址；Word/本机图片仅存浏览器，成稿包含data
                  URL。已认可的Skill双格式复制路径继续沿用；本地图能显示不代表微信会转存，请实际粘贴/保存重开/手机预览，必要时在公众号手动补图。
                </p>
                <button
                  className="quiet danger"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !(await askConfirm({
                        title: "清除所有本地数据",
                        message:
                          "将清除本浏览器全部文章、成稿、配图、设置和钱包凭据，无法撤销！建议先导出备份，其他设备和平台 Key 不受影响。",
                        confirmText: "确认清除",
                        cancelText: "取消",
                        danger: true,
                      }))
                    )
                      return;
                    activeTask.current?.controller.abort();
                    await saveQueue.current.catch(() => {});
                    await disconnectWallet();
                    await local.clearLocal();
                    docRef.current = null;
                    savedRef.current = "";
                    applyPrefs(DEFAULT_PREFERENCES);
                    setRememberWallet(true);
                    setDoc(null);
                    setResult(null);
                    setJob(null);
                    setVersions([]);
                    setFailedJobs([]);
                    setRecoverableJobIds(new Set());
                    setAssets([]);
                    await refreshArticles();
                    await refreshWallet();
                    pushToast("本地数据已清除（未撤销 TokenDance 平台 Key）。");
                    setDrawer(null);
                  }}
                >
                  清除所有本地数据
                </button>
                <h3>开放与复用</h3>
                <p>
                  gzh-design扩展版原作者甲木 ×
                  摸鱼小李，AGPL-3.0-or-later。Skill和模板独立维护，浏览器仅加载静态规则，不执行包内脚本。
                </p>
                <div className="help-links" aria-label="源码与许可">
                  {GITHUB_REPOSITORY_URL ? (
                    <a
                      className="help-link"
                      href={GITHUB_REPOSITORY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>GitHub 开源仓库</span>
                      <ArrowRight size={15} />
                    </a>
                  ) : (
                    <span className="help-link" aria-disabled="true">
                      GitHub 开源仓库（筹备中）
                    </span>
                  )}
                  <a
                    className="help-link"
                    href="https://github.com/isjiamu/gzh-design-skill"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>查看上游项目与许可</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {fullscreenPreview && (display || sampleTheme) && (
        <div
          ref={fullscreenRef}
          className="fullscreen-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label="全屏排版预览"
        >
          <header className="fullscreen-header">
            <div className="fullscreen-title">
              <LayoutTemplate size={16} />
              <b>
                {display
                  ? display.title || "全屏排版预览"
                  : `${sampleTheme?.name} · 主题样张`}
              </b>
              {displayTheme && (
                <span className="preview-theme-pill">
                  <i style={{ background: displayTheme.color }} />
                  {displayTheme.name}
                </span>
              )}
              {doc && sampleTheme && <em>样张预览 · 非当前文章成稿</em>}
            </div>
            <div className="fullscreen-actions">
              <div className="width-switch">
                <ViewportSegmentedSwitch width={width} onChange={setWidth} />
              </div>
              {display && (
                <button
                  className="primary"
                  disabled={!isDisplayUsable && !hasDraft}
                  onClick={() => {
                    if (hasDraft) {
                      setFullscreenPreview(false);
                      setDrawer("inspect");
                    } else void handleCopyResult(display);
                  }}
                >
                  {hasDraft ? <FileText size={15} /> : <Copy size={15} />}
                  {hasDraft ? "查看差异" : "复制到公众号"}
                </button>
              )}
              <button
                className="secondary"
                aria-label="退出全屏"
                onClick={() => setFullscreenPreview(false)}
              >
                <Minimize2 size={15} /> 退出全屏
              </button>
            </div>
          </header>
          <div className="fullscreen-stage">
            <PreviewViewport
              display={display}
              sampleTheme={sampleTheme}
              showImages={showImages}
              width={width}
              fullscreen
              headerTitle={
                display
                  ? display.title
                  : sampleTheme
                    ? `${sampleTheme.name} · 主题样张`
                    : ""
              }
              className="fullscreen-card"
            />
          </div>
        </div>
      )}
      {confirmModal && (
        <div
          className="confirm-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resolveConfirm(false);
          }}
        >
          <div
            ref={confirmRef}
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-body"
          >
            <h3 id="confirm-dialog-title">{confirmModal.title}</h3>
            <p id="confirm-dialog-body">{confirmModal.message}</p>
            <div className="confirm-dialog-actions">
              <button
                className="secondary confirm-cancel"
                onClick={() => resolveConfirm(false)}
              >
                {confirmModal.cancelText || "取消"}
              </button>
              <button
                className={
                  "confirm-accept " +
                  (confirmModal.danger ? "danger-button" : "primary")
                }
                onClick={() => resolveConfirm(true)}
              >
                {confirmModal.confirmText || "确认"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
