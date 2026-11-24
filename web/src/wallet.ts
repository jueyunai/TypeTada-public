import { database, epoch, getMeta, putMeta, changed } from "./db";
import { APP_URL, KEY_NAME, APPLICATION, AUTH_CONFIG_ERROR } from "./config";
export const ENDPOINTS = {
  auth: "https://tokendance.space/auth",
  exchange: "https://tokendance.space/portal/api/v1/auth/keys",
  chat: "https://tokendance.space/gateway/v1/chat/completions",
  balance: "https://tokendance.space/portal/api/v1/user/balance",
};
export type Recovery =
  "top_up_balance" | "reauthorize_api_key" | "api_key_quota";
export type Wallet = {
  connected: boolean;
  remember: boolean;
  balanceYuan: number | null;
  recoveryAction?: Recovery;
  message?: string;
};
type Credential = {
  key: string;
  version: string;
  remember: boolean;
  epoch: number;
  application?: string;
};
let memory: Credential | undefined;
export class PlatformError extends Error {
  constructor(
    message: string,
    public recovery?: Recovery,
    public unknown = false,
  ) {
    super(message);
  }
}
export async function readPlatform(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
  } catch {
    throw new PlatformError(
      "平台连接中断，结果未知，可能已计费；不会自动重发",
      undefined,
      true,
    );
  }
  const reader = response.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 3_000_000) {
          await reader.cancel();
          throw new PlatformError("平台响应过大，结果未知", undefined, true);
        }
        chunks.push(value);
      }
    }
  } catch (e) {
    if (e instanceof PlatformError) throw e;
    throw new PlatformError(
      "平台响应读取中断，结果未知；不会自动重发",
      undefined,
      true,
    );
  }
  let data: unknown;
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    if (response.ok)
      throw new PlatformError("平台响应无法解析，结果未知", undefined, true);
  }
  if (!response.ok) {
    const action = response.headers.get("TokenDance-Recovery-Action");
    const recovery = [
      "top_up_balance",
      "reauthorize_api_key",
      "api_key_quota",
    ].includes(action || "")
      ? (action as Recovery)
      : undefined;
    throw new PlatformError(
      `平台请求失败（HTTP ${response.status}）${recovery ? "，请按钱包提示处理" : "，未提供可识别恢复指令，请到平台检查"}`,
      recovery,
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new PlatformError("平台响应形状无效，结果未知", undefined, true);
  return data as Record<string, any>; // External protocol is checked by each caller; never displayed verbatim.
}
export async function credential() {
  const liveEpoch = await epoch(),
    stored = await getMeta<Credential>("wallet");
  if (stored && stored.epoch === liveEpoch) memory = stored;
  if (
    !memory ||
    !!AUTH_CONFIG_ERROR ||
    memory.application !== APPLICATION ||
    memory.epoch !== liveEpoch ||
    (await getMeta<string>("walletVersion")) !== memory.version
  ) {
    memory = undefined;
    return undefined;
  }
  return memory;
}
export async function walletStatus(refresh = false): Promise<Wallet> {
  const saved = await credential();
  const state: Wallet = {
    connected: !!saved,
    remember: !!saved?.remember,
    balanceYuan: null,
    recoveryAction: await getMeta<Recovery>("walletRecovery"),
  };
  if (!saved && (await getMeta<Credential>("wallet")))
    state.message = "应用配置已更新，请重新连接钱包；文章和排版历史不受影响。";
  if (refresh && saved) {
    try {
      const r = await readPlatform(ENDPOINTS.balance, {
        headers: { Authorization: "Bearer " + saved.key },
        signal: AbortSignal.timeout(20000),
      });
      const value = r.balance?.balance;
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new Error("余额响应不完整");
      state.balanceYuan = value / 1e6;
      if (value > 0) {
        await clearWalletRecovery(saved.version, saved.epoch, "top_up_balance");
        state.recoveryAction = await getMeta<Recovery>("walletRecovery");
      }
    } catch (e) {
      state.message = e instanceof Error ? e.message : "余额暂不可用";
      if (e instanceof PlatformError) {
        state.recoveryAction = e.recovery;
        if (e.recovery) await putMeta("walletRecovery", e.recovery);
      }
    }
  }
  return state;
}
export async function clearWalletRecovery(
  version: string,
  expectedEpoch: number,
  action?: Recovery,
) {
  const tx = (await database).transaction("meta", "readwrite");
  if (
    (await tx.store.get("walletVersion")) === version &&
    ((await tx.store.get("epoch")) || 0) === expectedEpoch &&
    (!action || (await tx.store.get("walletRecovery")) === action)
  )
    await tx.store.delete("walletRecovery");
  await tx.done;
}
export async function setRemember(remember: boolean) {
  const saved = await credential();
  if (!saved) return;
  const db = await database,
    tx = db.transaction("meta", "readwrite");
  if (
    (await tx.store.get("walletVersion")) !== saved.version ||
    ((await tx.store.get("epoch")) || 0) !== saved.epoch
  ) {
    await tx.done;
    throw new Error("钱包已断开或本地数据已清除，请重新连接");
  }
  const next = { ...saved, remember };
  if (remember) await tx.store.put(next, "wallet");
  else await tx.store.delete("wallet");
  await tx.done;
  memory = next;
  changed();
}
export async function disconnectWallet() {
  memory = undefined;
  const db = await database,
    tx = db.transaction("meta", "readwrite");
  await tx.store.delete("wallet");
  await tx.store.delete("walletRecovery");
  await tx.store.put(crypto.randomUUID(), "walletVersion");
  await tx.store.delete("authFlow");
  await tx.done;
  sessionStorage.removeItem("typetada-auth-flow");
  changed();
}
function random() {
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48))),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export async function authorizeUrl(remember: boolean) {
  if (AUTH_CONFIG_ERROR) throw new Error(AUTH_CONFIG_ERROR);
  const verifier = random(),
    flow = random(),
    binding = random(),
    challenge = btoa(
      String.fromCharCode(
        ...new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(verifier),
          ),
        ),
      ),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const record = {
    flow,
    binding,
    verifier,
    remember,
    epoch: await epoch(),
    expires: Date.now() + 600000,
    state: "pending",
    application: APPLICATION,
  };
  sessionStorage.setItem(
    "typetada-auth-flow",
    JSON.stringify({ flow, binding }),
  );
  await putMeta("authFlow", record);
  // Use the static entry point. EdgeOne's /editor rewrite can return 404 with a query string.
  const callback = new URL("/", location.origin);
  callback.searchParams.set("flow", flow);
  const url = new URL(ENDPOINTS.auth);
  url.search = new URLSearchParams({
    callback_url: callback.href,
    code_challenge: challenge,
    code_challenge_method: "S256",
    app_url: APP_URL,
    key_name: KEY_NAME,
  }).toString();
  return url.href;
}
export async function finishAuthorization(): Promise<string | null> {
  const params = new URLSearchParams(location.search),
    code = params.get("code"),
    flow = params.get("flow");
  if (!code && !flow) return null;
  history.replaceState(null, "", location.pathname); // Remove sensitive URL before exchange, render or fetch assets.
  if (AUTH_CONFIG_ERROR) throw new Error(AUTH_CONFIG_ERROR);
  let binding: { flow: string; binding: string } | undefined;
  try {
    binding =
      JSON.parse(sessionStorage.getItem("typetada-auth-flow") || "null") ||
      undefined;
  } catch {
    /* Invalid flow is rejected below. */
  }
  sessionStorage.removeItem("typetada-auth-flow");
  const db = await database,
    tx = db.transaction("meta", "readwrite"),
    record = (await tx.store.get("authFlow")) as
      | {
          flow: string;
          binding: string;
          verifier: string;
          remember: boolean;
          epoch: number;
          expires: number;
          state: string;
          application: string;
        }
      | undefined;
  if (!code) {
    // The author cancelled on the TokenDance page: nothing was issued.
    if (record?.flow === flow && record.state === "pending")
      await tx.store.delete("authFlow");
    await tx.done;
    throw new Error(
      "钱包授权已取消，没有连接，也不会产生费用。需要时可以重新连接。",
    );
  }
  if (
    !record ||
    record.application !== APPLICATION ||
    !binding ||
    record.flow !== flow ||
    record.binding !== binding.binding ||
    binding.flow !== flow ||
    record.expires < Date.now() ||
    record.state !== "pending" ||
    !code ||
    code.length > 2000
  ) {
    await tx.done;
    throw new Error("授权流程已失效或不是当前窗口发起，请重新连接钱包");
  }
  await tx.store.put({ ...record, state: "exchanging" }, "authFlow");
  await tx.done;
  try {
    const data = await readPlatform(ENDPOINTS.exchange, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        code_verifier: record.verifier,
        code_challenge_method: "S256",
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (typeof data.key !== "string" || !data.key || data.key.length > 10000)
      throw new PlatformError(
        "授权响应缺少Key，结果未知，请重新授权并清理平台旧Key",
        undefined,
        true,
      );
    const commit = db.transaction("meta", "readwrite"),
      live = (await commit.store.get("authFlow")) as typeof record;
    if (
      !live ||
      live.state !== "exchanging" ||
      live.flow !== flow ||
      ((await commit.store.get("epoch")) || 0) !== record.epoch
    ) {
      await commit.done;
      throw new Error("本地数据或授权已清除，迟到Key不再保存");
    }
    const saved: Credential = {
      key: data.key,
      version: crypto.randomUUID(),
      remember: record.remember,
      epoch: record.epoch,
      application: APPLICATION,
    };
    await commit.store.put(saved.version, "walletVersion");
    if (saved.remember) await commit.store.put(saved, "wallet");
    else await commit.store.delete("wallet");
    await commit.store.delete("authFlow");
    await commit.store.delete("walletRecovery");
    await commit.done;
    memory = saved;
    changed();
    return "钱包已连接，返回后不会自动调用模型。";
  } catch (e) {
    const cleanup = db.transaction("meta", "readwrite");
    const live = (await cleanup.store.get("authFlow")) as typeof record;
    if (live?.flow === flow) await cleanup.store.delete("authFlow");
    await cleanup.done;
    if (e instanceof PlatformError && e.unknown)
      throw new Error(
        "授权交换结果未知，无法自动取回Key；请重新授权并在平台删除旧Key",
      );
    throw e;
  }
}
