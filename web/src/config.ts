export { version as APP_VERSION } from "../package.json";

export const APP_URL = (import.meta.env.VITE_TOKENDANCE_APP_URL || "").trim();
export const KEY_NAME = (import.meta.env.VITE_TOKENDANCE_KEY_NAME || "").trim();
export const MODEL = (import.meta.env.VITE_TOKENDANCE_MODEL || "").trim();

// Configure only after the public repository is available.
export const GITHUB_REPOSITORY_URL = (() => {
  try {
    const url = new URL(
      (import.meta.env.VITE_GITHUB_REPOSITORY_URL || "").trim(),
    );
    return url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/[a-z\d_-]+\/[a-z\d_.-]+\/?$/i.test(url.pathname)
      ? url.origin + url.pathname.replace(/\/$/, "")
      : "";
  } catch {
    return "";
  }
})();

function validAppUrl() {
  try {
    const url = new URL(APP_URL);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export const AUTH_CONFIG_ERROR =
  !validAppUrl() || !KEY_NAME
    ? "此站点尚未配置有效的 TokenDance 应用信息，钱包授权暂不可用。"
    : "";
export const GENERATION_CONFIG_ERROR =
  AUTH_CONFIG_ERROR ||
  (!MODEL ? "此站点尚未配置排版模型，AI 排版暂不可用。" : "");
export const APPLICATION = APP_URL + "\0" + KEY_NAME;

// Filing numbers belong to whoever operates the deployed site. They are public
// but site-specific, so forks must set their own instead of inheriting ours.
const filing = (value: string | undefined) => (value || "").trim().slice(0, 60);
export const ICP_FILING = filing(import.meta.env.VITE_SITE_ICP_FILING);
export const PUBLIC_SECURITY_FILING = filing(
  import.meta.env.VITE_SITE_PUBLIC_SECURITY_FILING,
);
/** Record number used by the public-security filing lookup link. */
export const PUBLIC_SECURITY_FILING_CODE =
  /\d{10,20}/.exec(PUBLIC_SECURITY_FILING)?.[0] ?? "";
