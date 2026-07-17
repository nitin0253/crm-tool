"use client";

import { useEffect, useState } from "react";

type CrmStatus =
  | "qc_unassigned"
  | "qc_assigned"
  | "qc_inprogress"
  | "qc_done";

const CRM_OPTIONS: { value: CrmStatus; label: string }[] = [
  { value: "qc_unassigned", label: "QC Unassigned" },
  { value: "qc_assigned", label: "QC Assigned" },
  { value: "qc_inprogress", label: "QC In Progress" },
  { value: "qc_done", label: "QC Done" },
];

const TOKEN_KEY = "spyne_crm_tool_token";
const COOKIE_KEY = "spyne_crm_tool_cookie";
const HEADERS_KEY = "spyne_crm_tool_extra_headers";

export default function Page() {
  const [videoId, setVideoId] = useState("");
  const [toUnHide, setToUnHide] = useState(false);
  const [toReject, setToReject] = useState(false);
  const [crmStatus, setCrmStatus] = useState<CrmStatus>("qc_unassigned");

  const [authToken, setAuthToken] = useState("");
  const [sessionCookie, setSessionCookie] = useState("");
  const [extraHeaders, setExtraHeaders] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rememberToken, setRememberToken] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    ok: boolean;
    status?: number;
    body?: unknown;
    error?: string;
  }>(null);
  const [history, setHistory] = useState<
    { time: string; videoId: string; crmStatus: string; ok: boolean; status?: number }[]
  >([]);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const c = localStorage.getItem(COOKIE_KEY);
    const h = localStorage.getItem(HEADERS_KEY);
    if (t) setAuthToken(t);
    if (c) setSessionCookie(c);
    if (h) setExtraHeaders(h);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!videoId.trim()) {
      setResult({ ok: false, error: "Video ID is required." });
      return;
    }
    if (!authToken.trim()) {
      setResult({ ok: false, error: "Auth token is required." });
      return;
    }
    if (!sessionCookie.trim()) {
      setResult({ ok: false, error: "Session cookie is required." });
      return;
    }

    if (rememberToken) {
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(COOKIE_KEY, sessionCookie);
      localStorage.setItem(HEADERS_KEY, extraHeaders);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(COOKIE_KEY);
      localStorage.removeItem(HEADERS_KEY);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/update-video-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: videoId.trim(),
          toUnHide,
          crmStatus,
          toReject,
          authToken,
          sessionCookie,
          extraHeaders,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, error: data.error ?? "Request failed" });
      } else {
        setResult({ ok: data.ok, status: data.status, body: data.body });
        setHistory((prev) =>
          [
            {
              time: new Date().toLocaleTimeString(),
              videoId: videoId.trim(),
              crmStatus,
              ok: data.ok,
              status: data.status,
            },
            ...prev,
          ].slice(0, 8)
        );
      }
    } catch (err: any) {
      setResult({ ok: false, error: err?.message ?? "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base text-[#e6edf3] font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#7d8590] mb-1">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            Video Service
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Update Video CRM Status
          </h1>
          <p className="text-sm text-[#7d8590] mt-1">
            POST /video-service/v1/studio/qc/update-video-states
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-line rounded-lg p-6 space-y-5"
        >
          <div>
            <label className="block text-sm mb-1.5 text-[#9da7b3]">
              Video ID
            </label>
            <input
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="vid-617bf65caba94016b1b71a98cb74fe34"
              className="w-full bg-[#0d1117] border border-line rounded-md px-3 py-2 font-mono text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-[#9da7b3]">
              CRM Status
            </label>
            <select
              value={crmStatus}
              onChange={(e) => setCrmStatus(e.target.value as CrmStatus)}
              className="w-full bg-[#0d1117] border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {CRM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={toUnHide}
                onChange={(e) => setToUnHide(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              Unhide video
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={toReject}
                onChange={(e) => setToReject(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              Reject video
            </label>
          </div>

          <div className="h-px bg-line" />

          <div>
            <label className="block text-sm mb-1.5 text-[#9da7b3]">
              Your auth token
            </label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="The value after 'Bearer ' in Postman's Authorization header"
              className="w-full bg-[#0d1117] border border-line rounded-md px-3 py-2 font-mono text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-[#9da7b3]">
              Your session cookie
            </label>
            <input
              type="password"
              value={sessionCookie}
              onChange={(e) => setSessionCookie(e.target.value)}
              placeholder="sails.sid=s%3A..."
              className="w-full bg-[#0d1117] border border-line rounded-md px-3 py-2 font-mono text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <label className="flex items-center gap-2 text-xs text-[#7d8590] mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberToken}
                onChange={(e) => setRememberToken(e.target.checked)}
                className="w-3.5 h-3.5 accent-accent"
              />
              Remember on this device (stored only in this browser)
            </label>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="text-xs text-accent hover:underline"
            >
              {showAdvanced ? "Hide" : "Show"} additional headers
            </button>
            {showAdvanced && (
              <div className="mt-2">
                <textarea
                  value={extraHeaders}
                  onChange={(e) => setExtraHeaders(e.target.value)}
                  placeholder='Optional. Paste any other required headers as JSON, e.g. {"x-tenant-id": "spyne"}'
                  rows={3}
                  className="w-full bg-[#0d1117] border border-line rounded-md px-3 py-2 font-mono text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-[#3d7ae0] disabled:opacity-50 disabled:cursor-not-allowed rounded-md py-2.5 font-medium text-sm transition-colors"
          >
            {loading ? "Sending…" : "Update status"}
          </button>
        </form>

        {result && (
          <div
            className={`mt-5 border rounded-lg p-4 text-sm ${
              result.ok
                ? "border-good/40 bg-good/10"
                : "border-bad/40 bg-bad/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={result.ok ? "text-good" : "text-bad"}>
                {result.ok ? "Success" : "Failed"}
                {result.status ? ` — ${result.status}` : ""}
              </span>
            </div>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-[#9da7b3]">
              {result.error
                ? result.error
                : JSON.stringify(result.body, null, 2)}
            </pre>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs uppercase tracking-wide text-[#7d8590] mb-2">
              Recent updates
            </h2>
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-panel border border-line rounded-md px-3 py-2"
                >
                  <span className="font-mono text-[#9da7b3] truncate max-w-[45%]">
                    {h.videoId}
                  </span>
                  <span className="text-[#7d8590]">{h.crmStatus}</span>
                  <span className={h.ok ? "text-good" : "text-bad"}>
                    {h.status}
                  </span>
                  <span className="text-[#7d8590]">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
