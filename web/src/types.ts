export type Article = {
  id: string;
  title: string;
  sourceMarkdown: string;
  revision: number;
  updatedAt: number;
};
export type Theme = {
  id: string;
  name: string;
  color: string;
  description: string;
  skillId: string;
};
export type Validation = {
  ready: boolean;
  errors: string[];
  warnings: string[];
  resolvedExceptions?: string[];
  notice?: string;
};
export type LayoutResult = {
  resultId: string;
  articleId: string;
  createdAt: number;
  title: string;
  sourceMarkdown: string;
  sourceRevision: number;
  themeId: string;
  skillId: string;
  skillRevision: string;
  skillContentHash: string;
  model: string;
  htmlFragment: string;
  sourceHtml?: string;
  plainText: string;
  htmlSha256: string;
  validation: Validation;
  imageStatus: "none" | "remote" | "local_pending";
  demo?: boolean;
  notice?: string;
  usage: { inputTokens: number | null; outputTokens: number | null };
  enhancements: { type: string; text: string; sourceIds: string[]; location?: string }[];
  decisions: string[];
};
export type Version = {
  id: string;
  sourceRevision: number;
  createdAt: number;
  themeId: string;
};
export type Job = {
  id: string;
  articleId: string;
  sourceRevision: number;
  status: "running" | "succeeded" | "failed" | "cancelled" | "outcome_unknown";
  stage: string;
  callCount: number;
  sent: boolean;
  startedAt: number;
  error?: { message: string; recoveryAction?: string; billingState?: string };
  resultId?: string;
  layout?: { model: string; themeId: string; sourceCharacters: number; sourceBlocks: number };
  attempts?: LayoutAttempt[];
  hasFailureResponses?: boolean;
  diagnostic?: {
    finishReason: string | null;
    contentCharacters: number;
    reasoningCharacters: number;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};
export type LayoutAttempt = {
  stage: "analyze" | "generate" | "repair";
  elapsedMs?: number;
  response?: NonNullable<Job["diagnostic"]>;
  validation?: Validation;
  initialValidation?: Validation;
  normalizations?: string[];
};
export type LayoutFailureResponse = {
  stage: "generate" | "repair";
  content: string;
  truncated: boolean;
};
export type Asset = {
  id: string;
  url: string;
  mime: string;
  name: string;
  createdAt: number;
};
export type Preferences = {
  theme: string;
  mode: "format_only" | "auto";
  authorMode: "preserve" | "custom" | "none";
  name: string;
  bio: string;
  note: string;
  consent: boolean;
  showImages: boolean;
};
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "moyu-green",
  mode: "format_only",
  authorMode: "preserve",
  name: "",
  bio: "",
  note: "",
  consent: false,
  showImages: false,
};
export { MODEL } from "./config";
export const MAX_OUTPUT_TOKENS = 65536,
  MAX_CHARACTERS = 5000;
export const id = (prefix: string) => prefix + "_" + crypto.randomUUID();
