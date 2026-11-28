import type { BlockDiagnostic } from "./types";

export type DiffRun = {
  type: "same" | "del" | "add";
  text: string;
};

export type DiffSummary = {
  label: string;
  tone: "mild" | "warn" | "danger";
};

/**
 * 将文本拆分为适合中英文混排 Diff 的 token：
 * 英文/数字串整体保留，空白保留，中文及标点符号按单字符切分。
 */
function tokenize(text: string): string[] {
  return text.match(/[A-Za-z0-9]+|\s+|[\s\S]/g) ?? [];
}

function pushRun(runs: DiffRun[], type: DiffRun["type"], text: string) {
  if (!text) return;
  const last = runs[runs.length - 1];
  if (last && last.type === type) {
    last.text += text;
    return;
  }
  runs.push({ type, text });
}

function countVisibleChars(runs: DiffRun[], targetType: "add" | "del"): number {
  let count = 0;
  for (const run of runs) {
    if (run.type !== targetType) continue;
    const stripped = run.text.replace(/\s+/g, "");
    count += [...stripped].length;
  }
  return count;
}

function isSymbolsOnly(runs: DiffRun[], targetType: "add" | "del"): boolean {
  const combined = runs
    .filter((r) => r.type === targetType)
    .map((r) => r.text.replace(/\s+/g, ""))
    .join("");
  if (!combined) return false;
  return /^[^\p{L}\p{N}]+$/u.test(combined);
}

function summarizeDiff(
  kind: BlockDiagnostic["kind"],
  actual: string,
  expectedRuns: DiffRun[],
  actualRuns: DiffRun[],
): DiffSummary {
  if (kind === "missing" || !actual.trim()) {
    return { label: "内容缺失", tone: "danger" };
  }
  if (kind === "out_of_order") {
    return { label: "段落顺序变化", tone: "warn" };
  }
  if (kind === "outside_body") {
    return { label: "位于正文外", tone: "warn" };
  }

  const addedChars = countVisibleChars(actualRuns, "add");
  const deletedChars = countVisibleChars(expectedRuns, "del");

  if (deletedChars === 0 && addedChars > 0) {
    if (isSymbolsOnly(actualRuns, "add")) {
      return { label: "多出符号", tone: "mild" };
    }
    return {
      label: `多出 ${addedChars} 字`,
      tone: addedChars <= 8 ? "mild" : "warn",
    };
  }
  if (addedChars === 0 && deletedChars > 0) {
    return {
      label: `少了 ${deletedChars} 字`,
      tone: deletedChars <= 3 ? "warn" : "danger",
    };
  }
  if (addedChars > 0 && deletedChars > 0) {
    return {
      label: `改动 ${deletedChars + addedChars} 字`,
      tone: deletedChars <= 3 && addedChars <= 6 ? "warn" : "danger",
    };
  }
  return { label: "仅空白差异", tone: "mild" };
}

/**
 * 对原文片段与成稿片段计算字符/词元级 Diff，用于核对抽屉内行内高亮展示。
 */
export function diffBlockText(
  expected: string,
  actual: string,
  kind: BlockDiagnostic["kind"],
): {
  expectedRuns: DiffRun[];
  actualRuns: DiffRun[];
  summary: DiffSummary;
} {
  const tokensA = tokenize(expected || "");
  const tokensB = tokenize(actual || "");

  let prefixLen = 0;
  const minLen = Math.min(tokensA.length, tokensB.length);
  while (prefixLen < minLen && tokensA[prefixLen] === tokensB[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    tokensA[tokensA.length - 1 - suffixLen] ===
      tokensB[tokensB.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const prefixText = tokensA.slice(0, prefixLen).join("");
  const suffixText =
    suffixLen > 0 ? tokensA.slice(tokensA.length - suffixLen).join("") : "";
  const midA = tokensA.slice(prefixLen, tokensA.length - suffixLen);
  const midB = tokensB.slice(prefixLen, tokensB.length - suffixLen);

  const expectedRuns: DiffRun[] = [];
  const actualRuns: DiffRun[] = [];

  pushRun(expectedRuns, "same", prefixText);
  pushRun(actualRuns, "same", prefixText);

  const m = midA.length;
  const n = midB.length;
  if (m === 0 && n > 0) {
    pushRun(actualRuns, "add", midB.join(""));
  } else if (n === 0 && m > 0) {
    pushRun(expectedRuns, "del", midA.join(""));
  } else if (m > 0 && n > 0) {
    if (m * n <= 200_000) {
      // 标准 LCS 动态规划表，仅覆盖剥离公共前后缀后的中间区间
      const cols = n + 1;
      const dp = new Uint32Array((m + 1) * cols);
      for (let i = m - 1; i >= 0; i--) {
        const row = i * cols;
        const nextRow = (i + 1) * cols;
        for (let j = n - 1; j >= 0; j--) {
          if (midA[i] === midB[j]) {
            dp[row + j] = dp[nextRow + j + 1] + 1;
          } else {
            const down = dp[nextRow + j];
            const right = dp[row + j + 1];
            dp[row + j] = down >= right ? down : right;
          }
        }
      }
      let i = 0;
      let j = 0;
      while (i < m && j < n) {
        if (midA[i] === midB[j]) {
          pushRun(expectedRuns, "same", midA[i]);
          pushRun(actualRuns, "same", midB[j]);
          i++;
          j++;
        } else if (dp[(i + 1) * cols + j] >= dp[i * cols + (j + 1)]) {
          pushRun(expectedRuns, "del", midA[i]);
          i++;
        } else {
          pushRun(actualRuns, "add", midB[j]);
          j++;
        }
      }
      while (i < m) {
        pushRun(expectedRuns, "del", midA[i]);
        i++;
      }
      while (j < n) {
        pushRun(actualRuns, "add", midB[j]);
        j++;
      }
    } else {
      pushRun(expectedRuns, "del", midA.join(""));
      pushRun(actualRuns, "add", midB.join(""));
    }
  }

  pushRun(expectedRuns, "same", suffixText);
  pushRun(actualRuns, "same", suffixText);

  return {
    expectedRuns,
    actualRuns,
    summary: summarizeDiff(kind, actual, expectedRuns, actualRuns),
  };
}
