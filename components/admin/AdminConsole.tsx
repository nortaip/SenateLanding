"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Terminal,
  Radio,
  Activity,
  Boxes,
  ScrollText,
  CircleDot,
  Crosshair,
  Settings2,
  Check,
  Building2,
  RefreshCw,
} from "lucide-react";
import {
  normalize,
  offlineSnapshot,
  normalizeVenues,
  venuesUrl,
  venueDevicesUrl,
  API_BASE,
  type Device,
  type MonitorSnapshot,
  type Venue,
} from "@/lib/monitor";

const POLL_MS = 4000;
const LOG_CAP = 220;
const HIST_CAP = 48;
const BASE_KEY = "monitor-api-base";

type Transport = "direct" | "proxy" | "offline";

/** Fetch JSON: browser-direct first (needs CORS), then the raw server proxy. */
async function fetchJson(url: string): Promise<{ json: unknown; transport: Transport; ms: number }> {
  try {
    const t0 = performance.now();
    const res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json, text/plain, */*" },
    });
    if (res.ok) {
      const json = JSON.parse(await res.text());
      return { json, transport: "direct", ms: Math.round(performance.now() - t0) };
    }
  } catch {
    /* CORS / network — fall through to proxy */
  }
  const t1 = performance.now();
  const res = await fetch(`/api/monitor?raw=1&url=${encodeURIComponent(url)}`, { cache: "no-store" });
  const json = (await res.json()) as { __proxy_error?: string };
  if (!res.ok || json?.__proxy_error) {
    throw new Error(json?.__proxy_error || `proxy HTTP ${res.status}`);
  }
  return { json, transport: "proxy", ms: Math.round(performance.now() - t1) };
}

type Level = "ok" | "info" | "warn" | "err" | "sys";
type LogLine = { id: number; t: number; level: Level; tag: string; msg: string };

const LEVEL_COLOR: Record<Level, string> = {
  ok: "text-[#46f08a]",
  info: "text-[#5be1ff]",
  warn: "text-[#f5c452]",
  err: "text-[#ff5d6c]",
  sys: "text-[#5f9c7e]",
};

/* ----------------------------- utils ----------------------------- */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const clockStr = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
function relTime(ts: number, now: number) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 2) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
function msColor(ms: number | null) {
  if (ms == null) return "#5f9c7e";
  if (ms <= 50) return "#46f08a";
  if (ms <= 120) return "#f5c452";
  return "#ff5d6c";
}
function healthColor(h: number | null) {
  if (h == null) return "#5f9c7e";
  if (h >= 70) return "#46f08a";
  if (h >= 40) return "#f5c452";
  return "#ff5d6c";
}
const avgOf = (nums: (number | null)[]) => {
  const v = nums.filter((n): n is number => n != null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
const dash = (v: number | null, suffix = "") => (v == null ? "—" : `${v}${suffix}`);

/* ----------------------------- atoms ----------------------------- */

function Panel({
  title,
  icon,
  right,
  children,
  className = "",
  bodyClass = "",
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClass?: string;
}) {
  return (
    <section className={`hud-panel hud-corner ${className}`}>
      <header className="hud-head">
        <span className="flex items-center gap-2">
          {icon}
          <span className="hud-glow">{title}</span>
        </span>
        {right}
      </header>
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="hud-bar">
      <i style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 220;
  const h = 40;
  if (data.length < 2) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full">
        <line x1="0" y1={h - 4} x2={w} y2={h - 4} stroke={color} strokeOpacity="0.4" />
      </svg>
    );
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - 4 - ((v - min) / span) * (h - 8)).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={color} fillOpacity="0.12" />
    </svg>
  );
}

const ROW_GRID =
  "grid grid-cols-[92px_104px_minmax(150px,1fr)_70px_128px_60px_64px] gap-2 items-center";

const venueLabel = (v: Venue) => v.name || v.code || v.domain || `Venue #${v.id}`;

/* ----------------------------- main ----------------------------- */

export function AdminConsole() {
  const [apiBase, setApiBase] = useState<string>(API_BASE);
  const [draftBase, setDraftBase] = useState<string>(API_BASE);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesErr, setVenuesErr] = useState<string | null>(null);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<number | string | null>(null);

  const [snap, setSnap] = useState<MonitorSnapshot | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => 0);
  const [transport, setTransport] = useState<Transport>("offline");
  const [showCfg, setShowCfg] = useState(false);

  const mountRef = useRef<number>(0);
  const prevOnline = useRef<Map<string, boolean>>(new Map());
  const histRef = useRef<Map<string, number[]>>(new Map());
  const cycleRef = useRef(0);
  const logIdRef = useRef(0);
  const firstRef = useRef(true);
  const linkUpRef = useRef<boolean | null>(null);

  const addLog = useCallback((level: Level, tag: string, msg: string) => {
    const line: LogLine = { id: logIdRef.current++, t: Date.now(), level, tag, msg };
    setLogs((prev) => {
      const next = [line, ...prev];
      return next.length > LOG_CAP ? next.slice(0, LOG_CAP) : next;
    });
  }, []);

  const resetStream = useCallback(() => {
    prevOnline.current.clear();
    histRef.current.clear();
    cycleRef.current = 0;
    firstRef.current = true;
    linkUpRef.current = null;
  }, []);

  /* ---- venues ---- */
  const loadVenues = useCallback(async () => {
    setVenuesLoading(true);
    try {
      const { json } = await fetchJson(venuesUrl(apiBase));
      const vs = normalizeVenues(json);
      setVenues(vs);
      setVenuesErr(null);
      addLog("sys", "VENUES", `${vs.length} venues loaded`);
      setSelectedVenueId((prev) => {
        if (prev != null) return prev;
        const first = vs[0]?.id ?? null;
        if (first != null) addLog("ok", "SELECT", `AUTO-SELECT venue :: ${venueLabel(vs[0])}`);
        return first;
      });
    } catch (e) {
      setVenues([]);
      setVenuesErr((e as Error).message);
      addLog("err", "VENUES", `load failed :: ${(e as Error).message}`);
    } finally {
      setVenuesLoading(false);
    }
  }, [apiBase, addLog]);

  const selectVenue = (v: Venue) => {
    if (v.id === selectedVenueId) return;
    resetStream();
    setSnap(null);
    setSelectedDevice(null);
    setSelectedVenueId(v.id);
    addLog("sys", "VENUE", `OPEN ${venueLabel(v)} (#${v.id}) — building device link`);
  };

  /* ---- devices for selected venue ---- */
  const deviceUrl = selectedVenueId != null ? venueDevicesUrl(selectedVenueId, apiBase) : null;

  const poll = useCallback(async () => {
    if (!deviceUrl) return;
    try {
      const { json, transport: tr, ms } = await fetchJson(deviceUrl);
      const data = normalize(json, ms);
      setTransport(tr);

      const cycle = ++cycleRef.current;
      if (linkUpRef.current !== true) {
        linkUpRef.current = true;
        addLog("ok", "UPLINK", `LINK UP // ${tr.toUpperCase()} · ${data.devices.length} nodes`);
      }

      if (firstRef.current) {
        firstRef.current = false;
        addLog("sys", "ROSTER", `${data.devices.length} devices in venue`);
        for (const d of data.devices) {
          prevOnline.current.set(d.id, d.online);
          addLog(d.online ? "ok" : "err", "REGISTER", `${d.id} ${d.name} [${(d.status ?? (d.online ? "active" : "inactive")).toUpperCase()}]`);
        }
      } else {
        for (const d of data.devices) {
          const prev = prevOnline.current.get(d.id);
          if (prev === undefined) {
            addLog("info", "JOIN", `${d.id} ${d.name} appeared`);
          } else if (prev !== d.online) {
            if (d.online) addLog("ok", "OPEN", `DEVICE OPENED :: ${d.name} (${d.id}) @ ${d.location ?? "—"}`);
            else addLog("err", "LOST", `DEVICE LOST :: ${d.name} (${d.id}) status=${d.status ?? "inactive"}`);
          }
          prevOnline.current.set(d.id, d.online);
        }
      }

      for (const d of data.devices) {
        if (d.ms == null) continue;
        const arr = histRef.current.get(d.id) ?? [];
        arr.push(d.ms);
        if (arr.length > HIST_CAP) arr.shift();
        histRef.current.set(d.id, arr);
      }

      const onlineDevices = data.devices.filter((d) => d.online);
      const avg = avgOf(onlineDevices.map((d) => d.ms));
      addLog("sys", "SCAN", `#${pad(cycle, 4)} :: ${onlineDevices.length}/${data.devices.length} active · avg ${dash(avg, "ms")}`);

      setSnap(data);
    } catch (e) {
      setTransport("offline");
      if (linkUpRef.current !== false) {
        linkUpRef.current = false;
        addLog("err", "UPLINK", `LINK DOWN :: ${(e as Error).message}`);
      }
      setSnap(offlineSnapshot((e as Error).message));
    }
  }, [deviceUrl, addLog]);

  // clock
  useEffect(() => {
    mountRef.current = Date.now();
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // load saved base + venues
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BASE_KEY);
      if (saved) {
        setApiBase(saved);
        setDraftBase(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // poll devices when a venue is selected
  useEffect(() => {
    if (!deviceUrl) return;
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll, deviceUrl]);

  const saveBase = () => {
    const next = draftBase.trim();
    if (!next) return;
    try {
      localStorage.setItem(BASE_KEY, next);
    } catch {
      /* ignore */
    }
    resetStream();
    setSnap(null);
    setVenues([]);
    setSelectedVenueId(null);
    addLog("sys", "CONFIG", `API BASE :: ${next}`);
    setApiBase(next);
    setShowCfg(false);
  };

  const devices = useMemo(
    () => (snap ? [...snap.devices].sort((a, b) => a.id.localeCompare(b.id)) : []),
    [snap]
  );

  const agg = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.online);
    return {
      total,
      up: online.length,
      down: total - online.length,
      blocked: devices.filter((d) => d.status === "blocked").length,
      avgMs: avgOf(online.map((d) => d.ms)),
      avgHealth: avgOf(online.map((d) => d.health)),
      usage: avgOf(devices.map((d) => d.usage)),
    };
  }, [devices]);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) ?? null;
  const sel = selectedDevice ? devices.find((d) => d.id === selectedDevice) ?? null : null;
  const sessionUp = now && mountRef.current ? Math.floor((now - mountRef.current) / 1000) : 0;

  const noVenue = selectedVenueId == null;
  const connecting = !noVenue && snap === null;
  const live = !!snap && snap.source === "live" && snap.ok;
  const offline = !noVenue && !connecting && !live;

  const onSelectDevice = (d: Device) => {
    setSelectedDevice(d.id);
    addLog("sys", "TARGET", `OPEN ${d.id} :: inspecting ${d.name}`);
  };

  return (
    <main className="hud relative min-h-screen p-2 text-[12px] leading-relaxed sm:p-3">
      <div className="hud-scanlines" />
      <div className="hud-vignette" />

      <div className="relative z-10 mx-auto max-w-[1500px] space-y-3">
        {/* ---- Header bar ---- */}
        <Panel
          title="SENATE.OS"
          icon={<Terminal className="h-3.5 w-3.5" />}
          right={
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] tracking-widest text-[#7fe6a8]">
              <span>NET {live ? snap.server.ms : "--"}ms</span>
              <span>{now ? clockStr(now) : "--:--:--"}</span>
              <span
                className={`rounded-sm px-1.5 py-0.5 ${
                  live
                    ? "bg-[#46f08a]/15 text-[#46f08a]"
                    : connecting
                      ? "bg-[#5be1ff]/15 text-[#5be1ff]"
                      : "bg-[#ff5d6c]/15 text-[#ff5d6c]"
                }`}
              >
                ● {live ? `LIVE·${transport.toUpperCase()}` : connecting ? "CONNECTING" : noVenue ? "IDLE" : "OFFLINE"}
              </span>
              <button
                onClick={() => setShowCfg((v) => !v)}
                aria-label="Configure API base"
                className="text-[#7fe6a8] transition-colors hover:text-[#46f08a]"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            </span>
          }
        >
          <div className="flex items-center justify-between px-3 py-2 text-[11px]">
            <span className="text-[#5f9c7e]">
              DEVICE-CTRL-SYS <span className="text-[#7fe6a8]">v4.5.5</span> ·{" "}
              {selectedVenue ? (
                <>VENUE <span className="text-[#bdeed2]">{venueLabel(selectedVenue)}</span></>
              ) : (
                "SELECT A VENUE"
              )}
            </span>
            <span className="text-[#5f9c7e]">
              SESSION <span className="text-[#bdeed2]">{pad(Math.floor(sessionUp / 60))}:{pad(sessionUp % 60)}</span>
              <span className="hud-blink ml-2 text-[#46f08a]">█</span>
            </span>
          </div>
          {showCfg && (
            <div className="flex flex-col gap-2 border-t border-[#46f08a]/15 px-3 py-2 sm:flex-row sm:items-center">
              <span className="shrink-0 text-[10px] tracking-widest text-[#5f9c7e]">API BASE</span>
              <input
                value={draftBase}
                onChange={(e) => setDraftBase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBase()}
                spellCheck={false}
                className="min-w-0 flex-1 rounded-sm border border-[#46f08a]/25 bg-[#02060c] px-2 py-1 text-[11px] text-[#bdeed2] outline-none focus:border-[#46f08a]/60"
                placeholder="https://appmobile.svurguns.cyou/Data/MobilePoss/api/"
              />
              <button
                onClick={saveBase}
                className="flex items-center justify-center gap-1.5 rounded-sm border border-[#46f08a]/40 bg-[#46f08a]/10 px-3 py-1 text-[11px] font-semibold text-[#46f08a] hover:bg-[#46f08a]/20"
              >
                <Check className="h-3.5 w-3.5" /> APPLY
              </button>
            </div>
          )}
        </Panel>

        {/* ---- banners ---- */}
        {offline && (
          <div className="hud-panel border-[#ff5d6c]/40 px-3 py-2 text-[11px] text-[#ff5d6c]">
            ⚠ LINK DOWN — {snap?.note}
            <span className="text-[#7a4b52]"> · enable CORS on the PHP (Access-Control-Allow-Origin) for your site origin, or the server proxy must reach the host.</span>
          </div>
        )}
        {connecting && (
          <div className="hud-panel border-[#5be1ff]/30 px-3 py-2 text-[11px] text-[#5be1ff]">
            ◌ CONNECTING to venue #{selectedVenueId} …
          </div>
        )}

        {/* ---- Main grid ---- */}
        <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
          {/* LEFT */}
          <div className="space-y-3">
            <Panel
              title="VENUES"
              icon={<Building2 className="h-3.5 w-3.5" />}
              right={
                <button
                  onClick={loadVenues}
                  aria-label="Reload venues"
                  className="flex items-center gap-1 text-[10px] text-[#5f9c7e] transition-colors hover:text-[#46f08a]"
                >
                  <RefreshCw className={`h-3 w-3 ${venuesLoading ? "hud-pulse" : ""}`} /> {venues.length}
                </button>
              }
              bodyClass="hud-scroll max-h-[260px] overflow-y-auto"
            >
              {venuesErr && <div className="px-3 py-4 text-[11px] text-[#ff5d6c]">⚠ {venuesErr}</div>}
              {!venuesErr && venues.length === 0 && (
                <div className="px-3 py-6 text-center text-[11px] text-[#5f9c7e]">
                  {venuesLoading ? <span className="hud-pulse">◌ LOADING VENUES…</span> : "no venues"}
                </div>
              )}
              {venues.map((v) => {
                const active = v.id === selectedVenueId;
                const c = v.status === "blocked" ? "#f5c452" : v.status === "inactive" ? "#5f9c7e" : "#46f08a";
                return (
                  <button
                    key={String(v.id)}
                    onClick={() => selectVenue(v)}
                    className={`hud-row flex w-full items-center gap-2.5 border-b border-[#0f2a1e] px-3 py-2 text-left ${
                      active ? "hud-row-sel" : ""
                    }`}
                  >
                    <CircleDot className="h-3 w-3 shrink-0" style={{ color: c }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[#bdeed2]">{venueLabel(v)}</span>
                      <span className="block truncate text-[10px] text-[#3a6b54]">
                        #{v.id}
                        {v.code ? ` · ${v.code}` : ""}
                        {v.domain ? ` · ${v.domain}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </Panel>

            <Panel
              title="FLEET SUMMARY"
              icon={<Activity className="h-3.5 w-3.5" />}
              bodyClass="grid grid-cols-2 gap-px bg-[#46f08a]/10"
            >
              {[
                { k: "TOTAL", v: agg.total, c: "#bdeed2" },
                { k: "ACTIVE", v: agg.up, c: "#46f08a" },
                { k: "INACTIVE", v: agg.down - agg.blocked, c: "#ff5d6c" },
                { k: "BLOCKED", v: agg.blocked, c: "#f5c452" },
                { k: "AVG MS", v: dash(agg.avgMs), c: msColor(agg.avgMs) },
                { k: "USAGE", v: dash(agg.usage, "%"), c: "#5be1ff" },
              ].map((s) => (
                <div key={s.k} className="bg-[#02060c] p-3">
                  <div className="text-[10px] tracking-widest text-[#5f9c7e]">{s.k}</div>
                  <div className="mt-1 text-2xl font-bold hud-glow" style={{ color: s.c }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title="DEVICE INSPECT" icon={<Crosshair className="h-3.5 w-3.5" />} bodyClass="p-3">
              {sel ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#bdeed2] hud-glow">{sel.name}</span>
                    <span className={sel.online ? "text-[#46f08a]" : sel.status === "blocked" ? "text-[#f5c452]" : "text-[#ff5d6c]"}>
                      ● {sel.online ? "ONLINE" : sel.status === "blocked" ? "BLOCKED" : "OFFLINE"}
                    </span>
                  </div>
                  <dl className="space-y-1 text-[11px]">
                    {[
                      ["ID", sel.id],
                      ["STATUS", sel.status ?? (sel.online ? "active" : "inactive")],
                      ["IP", sel.ip ?? "—"],
                      ["MODEL", sel.model ?? "—"],
                      ["VER", sel.version ?? "—"],
                      ["SITE", sel.location ?? "—"],
                      ["PING", sel.ms == null ? "—" : `${sel.ms} ms`],
                      ["HEALTH", sel.health == null ? "—" : `${Math.round(sel.health)} %`],
                      ["USAGE", sel.usage == null ? "—" : `${Math.round(sel.usage)} %`],
                      ["SEEN", relTime(sel.lastSeen, now)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-[#5f9c7e]">{k}</dt>
                        <dd className="truncate text-right text-[#bdeed2]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div>
                    <div className="mb-1 text-[10px] tracking-widest text-[#5f9c7e]">LATENCY TRACE</div>
                    <Sparkline data={histRef.current.get(sel.id) ?? []} color={msColor(sel.ms)} />
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-[11px] text-[#5f9c7e]">
                  NO TARGET LOCKED
                  <div className="mt-1 text-[#3a6b54]">select a node from the matrix →</div>
                </div>
              )}
            </Panel>
          </div>

          {/* MIDDLE — device matrix */}
          <Panel
            title="DEVICE MATRIX"
            icon={<Boxes className="h-3.5 w-3.5" />}
            right={
              <span className="truncate text-[10px] text-[#5f9c7e]">
                {selectedVenue ? venueLabel(selectedVenue) : "—"} · <span className="text-[#46f08a]">{agg.up}</span>/{agg.total}
              </span>
            }
          >
            <div className="hud-scroll overflow-x-auto">
              <div className="min-w-[640px]">
                <div className={`${ROW_GRID} border-b border-[#46f08a]/15 px-3 py-2 text-[10px] tracking-widest text-[#5f9c7e]`}>
                  <span>STATUS</span>
                  <span>ID</span>
                  <span>DEVICE</span>
                  <span className="text-right">MS</span>
                  <span>HEALTH</span>
                  <span className="text-right">USE</span>
                  <span className="text-right">SEEN</span>
                </div>
                <div className="hud-scroll max-h-[58vh] overflow-y-auto">
                  {devices.length === 0 && (
                    <div className="px-3 py-10 text-center text-[#5f9c7e]">
                      {noVenue ? (
                        "← SELECT A VENUE"
                      ) : connecting ? (
                        <span className="hud-pulse">◌ ACQUIRING NODES…</span>
                      ) : offline ? (
                        <span className="text-[#ff5d6c]">⚠ NO DATA · LINK DOWN</span>
                      ) : (
                        "no devices in this venue"
                      )}
                    </div>
                  )}
                  {devices.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onSelectDevice(d)}
                      className={`${ROW_GRID} hud-row w-full border-b border-[#0f2a1e] px-3 py-2 text-left ${
                        selectedDevice === d.id ? "hud-row-sel" : ""
                      } ${d.online ? "" : "opacity-60"}`}
                    >
                      <span
                        className={`flex items-center gap-1.5 ${
                          d.online ? "text-[#46f08a]" : d.status === "blocked" ? "text-[#f5c452]" : "text-[#ff5d6c]"
                        }`}
                      >
                        <CircleDot className={`h-3 w-3 ${d.online ? "hud-pulse" : ""}`} />
                        {d.online ? "ONLINE" : d.status === "blocked" ? "BLOCKED" : "OFFLINE"}
                      </span>
                      <span className="truncate text-[#7fe6a8]">{d.id}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[#bdeed2]">{d.name}</span>
                        <span className="block truncate text-[10px] text-[#3a6b54]">{d.location ?? d.ip ?? d.model ?? "—"}</span>
                      </span>
                      <span className="text-right" style={{ color: msColor(d.ms) }}>
                        {d.ms == null ? "—" : d.ms}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex-1">
                          <Bar value={d.health ?? 0} color={healthColor(d.health)} />
                        </span>
                        <span className="w-7 text-right text-[10px] text-[#bdeed2]">
                          {d.health == null ? "—" : Math.round(d.health)}
                        </span>
                      </span>
                      <span className="text-right text-[#5be1ff]">{d.usage == null ? "—" : `${Math.round(d.usage)}%`}</span>
                      <span className="text-right text-[#5f9c7e]">{relTime(d.lastSeen, now)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* RIGHT — live log */}
          <Panel
            title="LIVE LOG"
            icon={<ScrollText className="h-3.5 w-3.5" />}
            right={
              <span className={`flex items-center gap-1.5 text-[10px] ${live ? "text-[#46f08a]" : "text-[#ff5d6c]"}`}>
                <Radio className={`h-3 w-3 ${live ? "hud-pulse" : ""}`} /> {live ? "STREAMING" : "NO LINK"}
              </span>
            }
            bodyClass="p-0"
          >
            <div className="hud-scroll h-[64vh] overflow-y-auto px-3 py-2 lg:h-[calc(58vh+92px)]">
              <div className="text-[#46f08a]">
                <span className="text-[#5f9c7e]">root@senate-ctrl</span>:~$ tail -f /var/log/devices
                <span className="hud-blink">▌</span>
              </div>
              {logs.map((l) => (
                <div key={l.id} className="flex gap-2 whitespace-pre-wrap break-words">
                  <span className="shrink-0 text-[#3a6b54]">{clockStr(l.t)}</span>
                  <span className={`shrink-0 ${LEVEL_COLOR[l.level]}`}>[{l.tag}]</span>
                  <span className={LEVEL_COLOR[l.level]}>{l.msg}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ---- Footer ---- */}
        <div className="hud-panel flex items-center justify-between px-3 py-1.5 text-[10px] tracking-widest text-[#5f9c7e]">
          <span>LINK {live ? `SECURE·${transport.toUpperCase()}` : "DOWN"} · POLL {POLL_MS / 1000}s · NODES {agg.total}</span>
          <span>MON · SECTOR-4 · SENATE GROUP</span>
        </div>
      </div>
    </main>
  );
}
