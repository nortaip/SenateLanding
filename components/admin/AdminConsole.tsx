"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Terminal,
  Server,
  Cpu,
  Radio,
  Activity,
  Boxes,
  ScrollText,
  CircleDot,
  Crosshair,
} from "lucide-react";
import type { Device, MonitorSnapshot } from "@/lib/monitor";

const POLL_MS = 4000;
const LOG_CAP = 220;
const HIST_CAP = 48;

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

function clockStr(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function relTime(ts: number, now: number) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 2) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${pad(h)}h ${pad(m)}m`;
}

function msColor(ms: number) {
  if (ms <= 50) return "#46f08a";
  if (ms <= 120) return "#f5c452";
  return "#ff5d6c";
}
function healthColor(h: number) {
  if (h >= 70) return "#46f08a";
  if (h >= 40) return "#f5c452";
  return "#ff5d6c";
}

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
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = h - 4 - ((v - min) / span) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" />
      <polygon
        points={`0,${h} ${pts.join(" ")} ${w},${h}`}
        fill={color}
        fillOpacity="0.12"
      />
    </svg>
  );
}

const ROW_GRID =
  "grid grid-cols-[92px_104px_minmax(150px,1fr)_70px_128px_60px_64px] gap-2 items-center";

/* ----------------------------- main ----------------------------- */

export function AdminConsole() {
  const [snap, setSnap] = useState<MonitorSnapshot | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => 0);
  const [err, setErr] = useState<string | null>(null);

  const mountRef = useRef<number>(0);
  const prevOnline = useRef<Map<string, boolean>>(new Map());
  const histRef = useRef<Map<string, number[]>>(new Map());
  const cycleRef = useRef(0);
  const logIdRef = useRef(0);
  const firstRef = useRef(true);

  const addLog = useCallback((level: Level, tag: string, msg: string) => {
    const line: LogLine = { id: logIdRef.current++, t: Date.now(), level, tag, msg };
    setLogs((prev) => {
      const next = [line, ...prev];
      return next.length > LOG_CAP ? next.slice(0, LOG_CAP) : next;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/monitor", { cache: "no-store" });
      const data: MonitorSnapshot = await res.json();
      setErr(null);

      const cycle = ++cycleRef.current;

      if (firstRef.current) {
        firstRef.current = false;
        addLog("sys", "UPLINK", `ESTABLISHED // src=${data.source.toUpperCase()} · ${data.devices.length} nodes`);
        for (const d of data.devices) {
          prevOnline.current.set(d.id, d.online);
          addLog(
            d.online ? "ok" : "err",
            "REGISTER",
            `${d.id} ${d.name} [${d.online ? "ONLINE" : "OFFLINE"}]`
          );
        }
      } else {
        for (const d of data.devices) {
          const prev = prevOnline.current.get(d.id);
          if (prev === undefined) {
            addLog("info", "JOIN", `${d.id} ${d.name} appeared`);
          } else if (prev !== d.online) {
            if (d.online) {
              addLog("ok", "OPEN", `DEVICE OPENED :: ${d.name} (${d.id}) ${d.ms}ms @ ${d.location ?? "—"}`);
            } else {
              addLog("err", "LOST", `DEVICE LOST :: ${d.name} (${d.id}) last_seen=${relTime(d.lastSeen, Date.now())}`);
            }
          }
          prevOnline.current.set(d.id, d.online);
        }
      }

      // latency history
      for (const d of data.devices) {
        const arr = histRef.current.get(d.id) ?? [];
        arr.push(d.online ? d.ms : 0);
        if (arr.length > HIST_CAP) arr.shift();
        histRef.current.set(d.id, arr);
      }

      // rolling healthchecks keep the stream alive
      const onlineDevices = data.devices.filter((d) => d.online);
      if (onlineDevices.length) {
        for (let k = 0; k < 2; k++) {
          const d = onlineDevices[(cycle * 2 + k) % onlineDevices.length];
          addLog("info", "PROBE", `HEALTHCHECK ${d.id} ok ms=${d.ms} health=${Math.round(d.health)}%`);
        }
      }

      const up = data.devices.filter((d) => d.online).length;
      const avg = up ? Math.round(onlineDevices.reduce((a, d) => a + d.ms, 0) / up) : 0;
      addLog("sys", "SCAN", `#${pad(cycle, 4)} :: ${up}/${data.devices.length} up · avg ${avg}ms · srv ${data.server.ms}ms`);

      setSnap(data);
    } catch {
      setErr("uplink");
      addLog("err", "UPLINK", "TIMEOUT // no response from controller — retrying");
    }
  }, [addLog]);

  // clock
  useEffect(() => {
    mountRef.current = Date.now();
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // polling
  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const devices = useMemo(
    () => (snap ? [...snap.devices].sort((a, b) => a.id.localeCompare(b.id)) : []),
    [snap]
  );

  const agg = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.online);
    const up = online.length;
    const avgMs = up ? Math.round(online.reduce((a, d) => a + d.ms, 0) / up) : 0;
    const avgHealth = up ? Math.round(online.reduce((a, d) => a + d.health, 0) / up) : 0;
    const usage = total ? Math.round(devices.reduce((a, d) => a + d.usage, 0) / total) : 0;
    return { total, up, down: total - up, avgMs, avgHealth, usage };
  }, [devices]);

  const sel = selected ? devices.find((d) => d.id === selected) ?? null : null;
  const sessionUp = now && mountRef.current ? Math.floor((now - mountRef.current) / 1000) : 0;
  const isDemo = snap?.source !== "live" || snap?.ok === false;

  const onSelect = (d: Device) => {
    setSelected(d.id);
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
              <span>NET {snap ? snap.server.ms : "--"}ms</span>
              <span>CPU {snap ? Math.round(snap.server.cpu) : "--"}%</span>
              <span>RAM {snap ? Math.round(snap.server.ram) : "--"}%</span>
              <span>{now ? clockStr(now) : "--:--:--"}</span>
              <span
                className={`rounded-sm px-1.5 py-0.5 ${
                  isDemo ? "bg-[#f5c452]/15 text-[#f5c452]" : "bg-[#46f08a]/15 text-[#46f08a]"
                }`}
              >
                ● {isDemo ? "DEMO" : "LIVE"}
              </span>
            </span>
          }
        >
          <div className="flex items-center justify-between px-3 py-2 text-[11px]">
            <span className="text-[#5f9c7e]">
              DEVICE-CTRL-SYS <span className="text-[#7fe6a8]">v4.5.5</span> · MOBILE-POSS UPLINK
            </span>
            <span className="text-[#5f9c7e]">
              SESSION <span className="text-[#bdeed2]">{fmtUptime(sessionUp)}</span>
              <span className="hud-blink ml-2 text-[#46f08a]">█</span>
            </span>
          </div>
        </Panel>

        {/* ---- Demo / error banner ---- */}
        {(isDemo || err) && (
          <div className="hud-panel border-[#f5c452]/30 px-3 py-2 text-[11px] text-[#f5c452]">
            {err ? "⚠ UPLINK UNSTABLE — retrying controller…" : "⚠ DEMO FEED"} —{" "}
            {snap?.note ??
              "live backend not reachable from this server. Set MONITOR_BACKEND_URL or open from a network that allows appmobile.svurguns.cyou."}
          </div>
        )}

        {/* ---- Main grid ---- */}
        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          {/* LEFT */}
          <div className="space-y-3">
            <Panel title="BACK-END SYS" icon={<Server className="h-3.5 w-3.5" />} bodyClass="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[#5f9c7e]">STATUS</span>
                <span className={snap?.server.online ? "text-[#46f08a]" : "text-[#ff5d6c]"}>
                  ● {snap?.server.online ? "OPERATIONAL" : "DOWN"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5f9c7e]">PING</span>
                <span style={{ color: msColor(snap?.server.ms ?? 0) }}>{snap ? snap.server.ms : "--"} ms</span>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-[#5f9c7e]">
                  <span>CPU</span>
                  <span className="text-[#bdeed2]">{snap ? Math.round(snap.server.cpu) : "--"}%</span>
                </div>
                <Bar value={snap?.server.cpu ?? 0} color={healthColor(100 - (snap?.server.cpu ?? 0))} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-[#5f9c7e]">
                  <span>RAM</span>
                  <span className="text-[#bdeed2]">{snap ? Math.round(snap.server.ram) : "--"}%</span>
                </div>
                <Bar value={snap?.server.ram ?? 0} color={healthColor(100 - (snap?.server.ram ?? 0))} />
              </div>
              <div className="flex items-center justify-between border-t border-[#46f08a]/15 pt-2 text-[10px]">
                <span className="text-[#5f9c7e]">UPTIME</span>
                <span className="text-[#bdeed2]">{snap ? fmtUptime(snap.server.uptimeSec) : "--"}</span>
              </div>
            </Panel>

            <Panel title="FLEET SUMMARY" icon={<Activity className="h-3.5 w-3.5" />} bodyClass="grid grid-cols-2 gap-px bg-[#46f08a]/10">
              {[
                { k: "TOTAL", v: agg.total, c: "#bdeed2" },
                { k: "ONLINE", v: agg.up, c: "#46f08a" },
                { k: "OFFLINE", v: agg.down, c: "#ff5d6c" },
                { k: "AVG MS", v: agg.avgMs, c: msColor(agg.avgMs) },
                { k: "AVG HEALTH", v: `${agg.avgHealth}%`, c: healthColor(agg.avgHealth) },
                { k: "USAGE", v: `${agg.usage}%`, c: "#5be1ff" },
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
                    <span className={sel.online ? "text-[#46f08a]" : "text-[#ff5d6c]"}>
                      ● {sel.online ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <dl className="space-y-1 text-[11px]">
                    {[
                      ["ID", sel.id],
                      ["IP", sel.ip ?? "—"],
                      ["MODEL", sel.model ?? "—"],
                      ["VER", sel.version ?? "—"],
                      ["SITE", sel.location ?? "—"],
                      ["PING", `${sel.ms} ms`],
                      ["HEALTH", `${Math.round(sel.health)} %`],
                      ["USAGE", `${Math.round(sel.usage)} %`],
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
              <span className="text-[10px] text-[#5f9c7e]">
                <span className="text-[#46f08a]">{agg.up}</span>/{agg.total} ACTIVE
              </span>
            }
            bodyClass=""
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
                      <span className="hud-pulse">◌ ACQUIRING NODES…</span>
                    </div>
                  )}
                  {devices.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onSelect(d)}
                      className={`${ROW_GRID} hud-row w-full border-b border-[#0f2a1e] px-3 py-2 text-left ${
                        selected === d.id ? "hud-row-sel" : ""
                      } ${d.online ? "" : "opacity-60"}`}
                    >
                      <span className={`flex items-center gap-1.5 ${d.online ? "text-[#46f08a]" : "text-[#ff5d6c]"}`}>
                        <CircleDot className={`h-3 w-3 ${d.online ? "hud-pulse" : ""}`} />
                        {d.online ? "ONLINE" : "OFFLINE"}
                      </span>
                      <span className="truncate text-[#7fe6a8]">{d.id}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[#bdeed2]">{d.name}</span>
                        <span className="block truncate text-[10px] text-[#3a6b54]">{d.location ?? d.ip ?? "—"}</span>
                      </span>
                      <span className="text-right" style={{ color: d.online ? msColor(d.ms) : "#5f9c7e" }}>
                        {d.online ? d.ms : "--"}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex-1">
                          <Bar value={d.health} color={healthColor(d.health)} />
                        </span>
                        <span className="w-7 text-right text-[10px] text-[#bdeed2]">{Math.round(d.health)}</span>
                      </span>
                      <span className="text-right text-[#5be1ff]">{d.online ? `${Math.round(d.usage)}%` : "--"}</span>
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
              <span className="flex items-center gap-1.5 text-[10px] text-[#46f08a]">
                <Radio className="h-3 w-3 hud-pulse" /> STREAMING
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
          <span className="flex items-center gap-2">
            <Cpu className="h-3 w-3" />
            LINK {isDemo ? "DEMO" : "SECURE"} · POLL {POLL_MS / 1000}s · NODES {agg.total}
          </span>
          <span>MON · SECTOR-4 · SENATE GROUP</span>
        </div>
      </div>
    </main>
  );
}
