// Local, model-free edits to a finished layout. Every edit is re-checked
// against the source so it can never change the author's text.
import {
  addedPlaceholders,
  checkResult,
  inert,
  restoreOriginalBlock,
  serialize,
  sha256,
  sourceManifest,
} from "./content";
import { epoch, saveResult } from "./db";
import { hydrateImages, imageMap } from "./images";
import { id, type LayoutResult } from "./types";

const ANY = /\{\{[^{}]*\}\}/g;
const NAME = /( ?)\{\{\s*(?:作者名|作者|笔名|署名|昵称|名字)[^{}]*\}\}( ?)/g;
const BIO =
  /([，,、：:]\s*)?\{\{\s*(?:一句话简介|一句话介绍|作者简介|个人简介|简介|作者身份|身份|介绍)[^{}]*\}\}/g;

function textNodes(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

export function hasAddedPlaceholders(result: LayoutResult) {
  return (
    addedPlaceholders(
      result.sourceHtml || result.htmlFragment,
      result.sourceMarkdown,
    ).length > 0
  );
}

/** Fills author placeholders; returns null when nothing could be filled. */
export function fillAuthorPlaceholders(
  html: string,
  sourceMarkdown: string,
  author: { name: string; bio: string },
) {
  const name = author.name.trim(),
    bio = author.bio.trim();
  if (!name) return null;
  const own = new Set(sourceMarkdown.match(ANY) || []);
  const cjk = /^[\u3400-\u9fff]/.test(name);
  const dom = inert(html);
  let changed = false;
  for (const node of textNodes(dom)) {
    const before = node.data;
    const after = before
      .replace(NAME, (whole, lead: string, trail: string) => {
        const placeholder = whole.slice(
          lead.length,
          whole.length - trail.length,
        );
        if (own.has(placeholder)) return whole;
        return cjk ? name : lead + name + trail;
      })
      .replace(BIO, (whole, sep: string | undefined) => {
        const placeholder = whole.slice((sep || "").length);
        if (own.has(placeholder)) return whole;
        return bio ? (sep || "") + bio : "";
      });
    if (after !== before) {
      node.data = after;
      changed = true;
    }
  }
  return changed ? serialize(dom) : null;
}

const meaningful = (el: Element) =>
  !!(el.textContent || "").replace(/[\u200b-\u200d\ufeff\s]/g, "") ||
  !!el.querySelector("img");

/** Removes the added paragraphs that still contain template placeholders. */
export function removePlaceholderParagraphs(
  html: string,
  sourceMarkdown: string,
) {
  const own = new Set(sourceMarkdown.match(ANY) || []);
  const dom = inert(html);
  const root = dom.firstElementChild;
  const targets = new Set<Element>();
  for (const node of textNodes(dom)) {
    if (!(node.data.match(ANY) || []).some((p) => !own.has(p))) continue;
    const block = node.parentElement?.closest(
      "p,h3,h4,li,figcaption,blockquote,section",
    );
    if (block && block !== root) targets.add(block);
  }
  if (!targets.size) return null;
  for (const el of targets) {
    let parent: Element | null = el.parentElement;
    el.remove();
    // Drop wrappers (cards) that became empty, but never the article root.
    while (parent && parent !== root && !meaningful(parent)) {
      const next: Element | null = parent.parentElement;
      parent.remove();
      parent = next;
    }
  }
  return serialize(dom);
}

/** Saves an edited copy as a new version after the full source check. */
export async function saveLocalEdit(
  result: LayoutResult,
  markedHtml: string,
  note: string,
) {
  const generation = await epoch();
  const { blocks, images } = sourceManifest(result.sourceMarkdown);
  const checked = checkResult(markedHtml, blocks, images);
  if (!checked.validation.ready)
    throw new Error("这个修改会影响原文，已取消，原来的成稿没有变化。");
  return saveCheckedEdit(result, checked, note, generation);
}

export async function restoreLayoutSource(
  result: LayoutResult,
  sourceId: string,
) {
  const generation = await epoch();
  const { blocks, images } = sourceManifest(result.sourceMarkdown);
  const checked =
    result.sourceHtml &&
    restoreOriginalBlock(result.sourceHtml, blocks, images, sourceId);
  if (!checked)
    throw new Error("这处差异无法准确定位，原成稿已保留。");
  return saveCheckedEdit(result, checked, "已在本机恢复一处原文。", generation);
}

async function saveCheckedEdit(
  result: LayoutResult,
  checked: ReturnType<typeof checkResult>,
  note: string,
  generation: number,
) {
  const fragment = hydrateImages(checked.htmlFragment, await imageMap());
  const next: LayoutResult = {
    ...result,
    ...checked,
    reviewAcceptedAt: undefined,
    notice: undefined,
    htmlFragment: fragment,
    htmlSha256: await sha256(fragment),
    resultId: id("result"),
    createdAt: Date.now() / 1000,
    decisions: [...result.decisions, note],
  };
  await saveResult(next, generation);
  return next;
}
