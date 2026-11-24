import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { nodeInputRule } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import Highlight from "@tiptap/extension-highlight";
import Image, { inputRegex as imageInputRegex } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
  type NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  X,
} from "lucide-react";
import {
  editorHtmlToMarkdown,
  isValidEditorImageSrc,
  markdownToEditorHtml,
} from "./editor-markdown";
import { localImageId } from "./images";

export const EditorAssetsContext = createContext<Map<string, string>>(new Map());

export type SourceEditorHandle = {
  focus: (pos?: "start" | "end") => void;
  insertImage: (src: string, alt?: string) => void;
  insertMarkdown: (md: string) => void;
};

export type RichPastePayload = {
  html: string;
  text: string;
  files: File[];
};

type SourceRichEditorProps = {
  articleId: string;
  value: string;
  assets: Map<string, string>;
  busy?: boolean;
  onChange: (markdown: string) => void;
  onRequestImageUpload: () => void;
  onDropImageFiles: (files: File[]) => void;
  onRichPaste: (payload: RichPastePayload) => void;
};

const DATA_IMAGE_URL = /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i;
const SAFE_HTTP_URL = /^https?:\/\/[^\s<>]+$/i;
const MARKDOWN_PASTE_HINT =
  /(?:^|\n)\s{0,3}(?:#{1,6} |```|(?:[-*_]\s*){3,}$)|!\[[^\]]*\]\(|\*\*[^*]+\*\*/m;

function SourceImageNodeView({
  node,
  selected,
  deleteNode,
  editor,
}: NodeViewProps) {
  const assets = useContext(EditorAssetsContext);
  const rawSrc = String(node.attrs.src || "").trim();
  const alt = String(node.attrs.alt || "");
  const localId = localImageId(rawSrc);

  let displayUrl = "";
  if (localId) {
    const candidate = assets.get(localId) || "";
    if (DATA_IMAGE_URL.test(candidate)) displayUrl = candidate;
  } else if (/^https:\/\/[^\s<>]+$/i.test(rawSrc)) {
    displayUrl = rawSrc;
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={
        "editor-image-figure " +
        (!displayUrl ? "editor-image-missing " : "") +
        (selected ? "is-selected" : "")
      }
      contentEditable={false}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span className="editor-image-missing-text">
          〔图片暂不可用{alt ? `：${alt}` : ""}〕
        </span>
      )}
      {editor.isEditable && (
        <button
          type="button"
          className="editor-image-remove"
          aria-label="移除图片"
          title="移除图片"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => deleteNode()}
        >
          <X size={13} />
        </button>
      )}
    </NodeViewWrapper>
  );
}

const SourceImage = Image.extend({
  group: "block",
  inline: false,
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const candidate = (
            element.getAttribute("data-source-src") ||
            element.getAttribute("src") ||
            ""
          ).trim();
          return isValidEditorImageSrc(candidate) ? candidate : null;
        },
      },
      alt: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("alt"),
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("title"),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "img[data-source-src]",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const src = (node.getAttribute("data-source-src") || "").trim();
          return isValidEditorImageSrc(src) ? {} : false;
        },
      },
      {
        tag: "img[src]",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const src = (node.getAttribute("src") || "").trim();
          return isValidEditorImageSrc(src) ? {} : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src || "").trim();
    if (!isValidEditorImageSrc(src)) {
      return ["p", {}, "〔图片暂不可用〕"];
    }
    const attrs: Record<string, string> = {
      "data-source-src": src,
      alt: String(HTMLAttributes.alt || ""),
    };
    if (HTMLAttributes.title) attrs.title = String(HTMLAttributes.title);
    return ["img", attrs];
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: imageInputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match;
          if (!src || !isValidEditorImageSrc(src)) return false;
          return { src: src.trim(), alt, title };
        },
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SourceImageNodeView);
  },
});

export const SourceRichEditor = forwardRef<
  SourceEditorHandle,
  SourceRichEditorProps
>(function SourceRichEditor(
  {
    articleId,
    value,
    assets,
    busy = false,
    onChange,
    onRequestImageUpload,
    onDropImageFiles,
    onRichPaste,
  },
  ref,
) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const linkInputRef = useRef<HTMLInputElement>(null);
  const isSyncingRef = useRef(false);
  const lastSyncedRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onRichPasteRef = useRef(onRichPaste);
  const onDropImagesRef = useRef(onDropImageFiles);
  const openLinkBarRef = useRef<() => void>(() => {});

  onChangeRef.current = onChange;
  onRichPasteRef.current = onRichPaste;
  onDropImagesRef.current = onDropImageFiles;

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
          link: {
            openOnClick: false,
            autolink: true,
            protocols: ["http", "https"],
            HTMLAttributes: {
              rel: "noreferrer noopener",
              target: "_blank",
            },
          },
        }),
        Highlight,
        SourceImage,
        TableKit.configure({
          table: { resizable: false },
        }),
        Placeholder.configure({
          placeholder:
            "在这里开始写作，支持 ## 标题、- 列表、> 引用，或直接粘贴/拖入图片…",
        }),
      ],
      content: markdownToEditorHtml(value),
      editorProps: {
        attributes: {
          class: "source-prose tiptap-prose",
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": "文章原稿可视化编辑",
        },
        handleKeyDown: (view, event) => {
          if (event.key === "Tab") {
            const { $from } = view.state.selection;
            for (let depth = $from.depth; depth > 0; depth--) {
              const name = $from.node(depth).type.name;
              if (name === "bulletList" || name === "orderedList") {
                event.preventDefault();
                return true;
              }
            }
          }
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "k"
          ) {
            event.preventDefault();
            openLinkBarRef.current();
            return true;
          }
          return false;
        },
        handlePaste: (_view, event) => {
          const clipboard = event.clipboardData;
          if (!clipboard) return false;
          const html = clipboard.getData("text/html");
          const text = clipboard.getData("text/plain");
          const files = [...clipboard.files];
          const hasImages = files.some((f) => f.type.startsWith("image/"));
          const hasMarkdown = MARKDOWN_PASTE_HINT.test(text);
          if (!hasImages && !html && !hasMarkdown) return false;
          event.preventDefault();
          onRichPasteRef.current({ html, text, files });
          return true;
        },
        handleDrop: (view, event) => {
          const files = [...(event.dataTransfer?.files || [])].filter((f) =>
            f.type.startsWith("image/"),
          );
          if (!files.length) return false;
          event.preventDefault();
          setDragActive(false);
          const coords = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (coords) {
            const tr = view.state.tr.setSelection(
              TextSelection.near(view.state.doc.resolve(coords.pos)),
            );
            view.dispatch(tr);
          }
          onDropImagesRef.current(files);
          return true;
        },
      },
      onUpdate: ({ editor: current }) => {
        if (isSyncingRef.current) return;
        const nextMd = editorHtmlToMarkdown(current.getHTML());
        if (nextMd === lastSyncedRef.current) return;
        lastSyncedRef.current = nextMd;
        onChangeRef.current(nextMd);
      },
    },
    [articleId],
  );

  // 初始化与切换文章时对齐基准值，严格避免初始化触发假 dirty
  useEffect(() => {
    lastSyncedRef.current = value;
  }, [articleId]);

  // 响应外部 value 变化（如清空恢复、导入、源码态改写）并静默同步内容
  useEffect(() => {
    if (!editor || value === lastSyncedRef.current) return;
    isSyncingRef.current = true;
    try {
      editor.commands.setContent(markdownToEditorHtml(value), {
        emitUpdate: false,
      });
      lastSyncedRef.current = value;
    } finally {
      isSyncingRef.current = false;
    }
  }, [editor, articleId, value]);

  const openLinkBar = useCallback(() => {
    if (!editor) return;
    if (linkOpen) {
      setLinkOpen(false);
      setLinkError("");
      editor.commands.focus();
      return;
    }
    const existing = String(editor.getAttributes("link").href || "");
    setLinkUrl(existing);
    setLinkError("");
    setLinkOpen(true);
    requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
  }, [editor, linkOpen]);

  openLinkBarRef.current = openLinkBar;

  useEffect(() => {
    setLinkOpen(false);
    setLinkError("");
  }, [articleId]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      setLinkError("");
      return;
    }
    const candidate = /^[a-z]+:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    if (!SAFE_HTTP_URL.test(candidate)) {
      setLinkError("仅支持 http:// 或 https:// 网址");
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: candidate })
      .run();
    setLinkOpen(false);
    setLinkError("");
  }, [editor, linkUrl]);

  useImperativeHandle(
    ref,
    () => ({
      focus(pos?: "start" | "end") {
        if (!editor) return;
        editor.commands.focus(pos ?? "end");
      },
      insertImage(src: string, alt = "") {
        if (!editor || !isValidEditorImageSrc(src)) return;
        editor.chain().focus().setImage({ src: src.trim(), alt }).run();
      },
      insertMarkdown(md: string) {
        if (!editor) return;
        const clean = md.trim();
        if (!clean) return;
        const html = markdownToEditorHtml(clean);
        if (!html) return;
        editor
          .chain()
          .focus()
          .insertContent(html, { parseOptions: { preserveWhitespace: false } })
          .run();
      },
    }),
    [editor],
  );

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) {
        return {
          h2: false,
          h3: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          codeBlock: false,
          bold: false,
          italic: false,
          underline: false,
          highlight: false,
          link: false,
          canUndo: false,
          canRedo: false,
        };
      }
      return {
        h2: current.isActive("heading", { level: 2 }),
        h3: current.isActive("heading", { level: 3 }),
        blockquote: current.isActive("blockquote"),
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        codeBlock: current.isActive("codeBlock"),
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        highlight: current.isActive("highlight"),
        link: current.isActive("link"),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
      };
    },
  });

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if ([...(e.dataTransfer?.types || [])].includes("Files")) {
      e.preventDefault();
      if (!dragActive) setDragActive(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null))
      setDragActive(false);
  }

  const preserveFocus = (fn: () => void) => ({
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
    onClick: fn,
  });

  return (
    <EditorAssetsContext.Provider value={assets}>
      <div
        className={
          "rich-editor-shell " + (dragActive ? "editor-drop-active" : "")
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={() => setDragActive(false)}
      >
        <div
          className="editor-format-bar"
          role="toolbar"
          aria-label="原稿极简格式工具"
        >
          <div className="editor-format-group">
            <button
              type="button"
              aria-label="二级章节标题"
              title="章节标题 (H2)"
              aria-pressed={!!toolbarState?.h2}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run(),
              )}
            >
              <Heading2 size={15} />
            </button>
            <button
              type="button"
              aria-label="三级小节标题"
              title="小节标题 (H3)"
              aria-pressed={!!toolbarState?.h3}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleHeading({ level: 3 }).run(),
              )}
            >
              <Heading3 size={15} />
            </button>
            <button
              type="button"
              aria-label="引用块"
              title="引用段落 (> )"
              aria-pressed={!!toolbarState?.blockquote}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleBlockquote().run(),
              )}
            >
              <Quote size={14} />
            </button>
            <button
              type="button"
              aria-label="无序列表"
              title="无序列表 (- )"
              aria-pressed={!!toolbarState?.bulletList}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleBulletList().run(),
              )}
            >
              <List size={15} />
            </button>
            <button
              type="button"
              aria-label="有序列表"
              title="有序列表 (1. )"
              aria-pressed={!!toolbarState?.orderedList}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleOrderedList().run(),
              )}
            >
              <ListOrdered size={15} />
            </button>
            <button
              type="button"
              aria-label="分割线"
              title="分割线 (---)"
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().setHorizontalRule().run(),
              )}
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              aria-label="代码块"
              title="代码块 (```)"
              aria-pressed={!!toolbarState?.codeBlock}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleCodeBlock().run(),
              )}
            >
              <Code2 size={14} />
            </button>
          </div>

          <span className="editor-format-divider" aria-hidden="true" />

          <div className="editor-format-group">
            <button
              type="button"
              aria-label="加粗"
              title="加粗 (⌘B)"
              aria-pressed={!!toolbarState?.bold}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleBold().run(),
              )}
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              aria-label="斜体"
              title="斜体 (⌘I)"
              aria-pressed={!!toolbarState?.italic}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleItalic().run(),
              )}
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              aria-label="下划线"
              title="下划线 (⌘U)"
              aria-pressed={!!toolbarState?.underline}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleUnderline().run(),
              )}
            >
              <UnderlineIcon size={14} />
            </button>
            <button
              type="button"
              aria-label="高亮标记"
              title="重点高亮 (==文字==)"
              aria-pressed={!!toolbarState?.highlight}
              disabled={!editor}
              {...preserveFocus(() =>
                editor?.chain().focus().toggleHighlight().run(),
              )}
            >
              <Highlighter size={14} />
            </button>
            <button
              type="button"
              aria-label="插入或编辑链接"
              title="插入链接 (⌘K)"
              aria-pressed={linkOpen || !!toolbarState?.link}
              disabled={!editor}
              {...preserveFocus(openLinkBar)}
            >
              <Link2 size={14} />
            </button>
          </div>

          <span className="editor-format-divider" aria-hidden="true" />

          <div className="editor-format-group">
            <button
              type="button"
              aria-label="上传配图"
              title="上传并插入图片（也支持直接拖拽/粘贴）"
              disabled={busy}
              {...preserveFocus(onRequestImageUpload)}
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              aria-label="撤销"
              title="撤销 (⌘Z)"
              disabled={!toolbarState?.canUndo}
              {...preserveFocus(() => editor?.chain().focus().undo().run())}
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              aria-label="重做"
              title="重做 (⇧⌘Z)"
              disabled={!toolbarState?.canRedo}
              {...preserveFocus(() => editor?.chain().focus().redo().run())}
            >
              <Redo2 size={14} />
            </button>
          </div>
        </div>

        {linkOpen && (
          <div className="editor-link-bar" role="group" aria-label="编辑链接">
            <input
              ref={linkInputRef}
              type="url"
              placeholder="输入 https:// 链接地址…"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (linkError) setLinkError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  setLinkOpen(false);
                  setLinkError("");
                  editor?.commands.focus();
                }
              }}
            />
            <button type="button" className="editor-link-apply" onClick={applyLink}>
              应用
            </button>
            {toolbarState?.link && (
              <button
                type="button"
                aria-label="移除链接"
                title="移除链接"
                onClick={() => {
                  editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                  setLinkOpen(false);
                  setLinkError("");
                }}
              >
                <Unlink size={14} />
              </button>
            )}
            <button
              type="button"
              aria-label="取消链接编辑"
              onClick={() => {
                setLinkOpen(false);
                setLinkError("");
                editor?.commands.focus();
              }}
            >
              <X size={14} />
            </button>
            {linkError && <span className="editor-link-error">{linkError}</span>}
          </div>
        )}

        <div className="editor-canvas-scroll">
          <EditorContent editor={editor} className="editor-content-host" />
        </div>
      </div>
    </EditorAssetsContext.Provider>
  );
});
