import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: (...a: unknown[]) => getSession(...a) } },
}));

import { fetchMoneyConfig, newRequestId, postMoney } from "./money-client";

const fetchMock = vi.fn();

beforeEach(() => {
  getSession.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const signedIn = () => getSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
const signedOut = () => getSession.mockResolvedValue({ data: { session: null } });

describe("newRequestId", () => {
  it("returns a v4-shaped uuid and differs between calls", () => {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const a = newRequestId();
    expect(a).toMatch(re);
    expect(newRequestId()).not.toBe(a);
  });
  it("falls back to a v4-shaped id when crypto.randomUUID is missing", () => {
    vi.stubGlobal("crypto", {});
    const id = newRequestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("falls back when crypto is undefined", () => {
    vi.stubGlobal("crypto", undefined);
    expect(newRequestId()).toHaveLength(36);
  });
});

describe("fetchMoneyConfig", () => {
  it("throws not_signed_in without calling fetch when there is no session", async () => {
    signedOut();
    await expect(fetchMoneyConfig({})).rejects.toThrow("not_signed_in");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("builds the query string, sends the bearer token and passes the signal", async () => {
    signedIn();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ wallet_balance: 5 }) });
    const ctrl = new AbortController();
    const out = await fetchMoneyConfig({ source: "pool", poolId: "p1", amount: 1500 }, ctrl.signal);
    expect(out).toEqual({ wallet_balance: 5 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/money-config?source=pool&pool_id=p1&amount=1500");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.signal).toBe(ctrl.signal);
  });
  it("omits empty params but keeps amount 0", async () => {
    signedIn();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    await fetchMoneyConfig({ poolId: "", amount: 0 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/money-config?amount=0");
    await fetchMoneyConfig({});
    expect(fetchMock.mock.calls[1][0]).toBe("/api/money-config?");
  });
  it("throws with the status on a non-ok response", async () => {
    signedIn();
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchMoneyConfig({})).rejects.toThrow("money-config 503");
  });
});

describe("postMoney", () => {
  it("returns 401 without calling fetch when signed out", async () => {
    signedOut();
    const r = await postMoney("/api/x", {});
    expect(r).toEqual({ ok: false, status: 401, data: { error: "Please log in again" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("posts JSON with auth and returns ok data", async () => {
    signedIn();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ result: "ok" }) });
    const r = await postMoney("/api/withdraw", { amount: 100 });
    expect(r).toEqual({ ok: true, status: 200, data: { result: "ok" } });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/withdraw");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer tok",
    });
    expect(init.body).toBe(JSON.stringify({ amount: 100 }));
  });
  it("is not ok when a 200 body carries an error", async () => {
    signedIn();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ error: "nope" }) });
    const r = await postMoney("/api/x", {});
    expect(r.ok).toBe(false);
    expect(r.status).toBe(200);
  });
  it("keeps status and body on an error response", async () => {
    signedIn();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ code: "quote_changed" }),
    });
    expect(await postMoney("/api/x", {})).toEqual({
      ok: false,
      status: 409,
      data: { code: "quote_changed" },
    });
  });
  it("tolerates a non-JSON body", async () => {
    signedIn();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("bad json");
      },
    });
    expect(await postMoney("/api/x", {})).toEqual({ ok: false, status: 502, data: {} });
  });
  it("maps a network failure to status 0 with a friendly message", async () => {
    signedIn();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const r = await postMoney("/api/x", {});
    expect(r.ok).toBe(false);
    expect(r.status).toBe(0);
    expect(String(r.data.error)).toContain("No connection");
  });
});
