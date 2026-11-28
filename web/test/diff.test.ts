import { describe, expect, it } from "vitest";
import { diffBlockText } from "../src/diff";
import { isResultUsable } from "../src/output";
import type { BlockDiagnostic } from "../src/types";

describe("diffBlockText", () => {
  it("highlights a small Chinese prefix addition such as 案例", () => {
    const expected =
      '支付宝那场活动上，火山分享了他做的小程序“钱包请等等”。平时想买个东西又拿不定主意';
    const actual =
      '案例支付宝那场活动上，火山分享了他做的小程序“钱包请等等”。平时想买个东西又拿不定主意';

    const res = diffBlockText(expected, actual, "changed_text");
    expect(res.summary).toEqual({ label: "多出 2 字", tone: "mild" });
    expect(res.expectedRuns.some((r) => r.type === "del")).toBe(false);
    expect(res.actualRuns[0]).toEqual({ type: "add", text: "案例" });
    expect(res.actualRuns[1]?.type).toBe("same");
  });

  it("highlights an added bullet symbol and marks summary as 多出符号", () => {
    const expected = "作为一个合格的 AI 助理，这两种时刻就得拎得清";
    const actual = "•作为一个合格的 AI 助理，这两种时刻就得拎得清";

    const res = diffBlockText(expected, actual, "changed_text");
    expect(res.summary).toEqual({ label: "多出符号", tone: "mild" });
    expect(res.actualRuns[0]).toEqual({ type: "add", text: "•" });
    expect(res.expectedRuns).toEqual([{ type: "same", text: expected }]);
  });

  it("highlights both deleted and added spans when text is replaced", () => {
    const expected = "我们将在十月发布 TypeTada 2.0 正式版";
    const actual = "我们将在年底推出 TypeTada 2.1 正式版";

    const res = diffBlockText(expected, actual, "changed_text");
    const deletedText = res.expectedRuns
      .filter((r) => r.type === "del")
      .map((r) => r.text)
      .join("");
    const addedText = res.actualRuns
      .filter((r) => r.type === "add")
      .map((r) => r.text)
      .join("");

    expect(deletedText).toContain("十月发布");
    expect(addedText).toContain("年底推出");
    expect(deletedText).toContain("0");
    expect(addedText).toContain("1");
    expect(res.expectedRuns.map((r) => r.text).join("")).toBe(expected);
    expect(res.actualRuns.map((r) => r.text).join("")).toBe(actual);
    expect(res.summary.label).toMatch(/^改动 \d+ 字$/);
  });

  it("marks missing block or empty actual text as 内容缺失", () => {
    const res = diffBlockText("第一段核心总结。", "", "missing");
    expect(res.summary).toEqual({ label: "内容缺失", tone: "danger" });
  });
});

describe("isResultUsable", () => {
  const issue: BlockDiagnostic = {
    sourceId: "s001",
    kind: "changed_text",
    expected: "原文",
    actual: "案例原文",
  };

  it("returns true when validation.ready is true", () => {
    expect(
      isResultUsable({
        validation: { ready: true, errors: [], warnings: [] },
      }),
    ).toBe(true);
  });

  it("returns false when validation failed and review is not accepted", () => {
    expect(
      isResultUsable({
        validation: { ready: false, errors: ["原文有差异"], warnings: [] },
        reviewIssues: [issue],
      }),
    ).toBe(false);
  });

  it("returns true when reviewIssues exist and reviewAcceptedAt is set", () => {
    expect(
      isResultUsable({
        validation: { ready: false, errors: ["原文有差异"], warnings: [] },
        reviewIssues: [issue],
        reviewAcceptedAt: 1795702500,
      }),
    ).toBe(true);
  });

  it("returns false when reviewAcceptedAt is set without reviewIssues", () => {
    expect(
      isResultUsable({
        validation: { ready: false, errors: ["严重安全错误"], warnings: [] },
        reviewAcceptedAt: 1795702500,
      }),
    ).toBe(false);
  });
});
