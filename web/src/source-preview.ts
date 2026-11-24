import DOMPurify from "dompurify";
import { markdown, serialize } from "./content";
import { localImageId } from "./images";

// This renders the user's Markdown, never model output or arbitrary pasted HTML.
export function sourcePreview(source: string, assets: Map<string, string>) {
  const template = document.createElement("template");
  template.innerHTML = markdown.render(source);
  for (const image of template.content.querySelectorAll("img")) {
    const original = image.getAttribute("src") || "";
    const local = localImageId(original);
    const url = local ? assets.get(local) : original;
    if (
      !url ||
      !(
        /^https:\/\/[^\s<>]+$/i.test(url) ||
        (local &&
          /^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(url))
      )
    ) {
      const placeholder = document.createElement("p");
      placeholder.textContent = `〔图片暂不可用${image.alt ? `：${image.alt}` : ""}〕`;
      image.replaceWith(placeholder);
      continue;
    }
    image.setAttribute("src", url);
    image.setAttribute("referrerpolicy", "no-referrer");
    image.setAttribute("loading", "lazy");
  }
  const clean = DOMPurify.sanitize(template.content, {
    ALLOWED_TAGS: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "s",
      "del",
      "u",
      "mark",
      "br",
      "hr",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "start",
      "referrerpolicy",
      "loading",
    ],
    RETURN_DOM_FRAGMENT: true,
  });
  for (const link of clean.querySelectorAll("a")) {
    const href = link.getAttribute("href") || "";
    if (!/^https?:\/\/[^\s<>]+$/i.test(href)) link.removeAttribute("href");
    else {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer noopener");
    }
  }
  return serialize(clean);
}
