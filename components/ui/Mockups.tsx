import type { ReactNode } from "react";

/* ---------- Shared faux-UI atoms ---------- */

function Bar({ h, accent }: { h: number; accent?: string }) {
  return (
    <div
      className="w-full rounded-t-[3px]"
      style={{
        height: `${h}%`,
        background: accent
          ? `linear-gradient(180deg, ${accent}, ${accent}33)`
          : "linear-gradient(180deg, #d4af37, #d4af3733)",
      }}
    />
  );
}

function Sparkline({ accent = "#d4af37" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 320 90" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 70 C 30 60, 50 30, 80 38 S 140 70, 170 48 S 230 8, 260 26 S 300 50, 320 30"
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M0 70 C 30 60, 50 30, 80 38 S 140 70, 170 48 S 230 8, 260 26 S 300 50, 320 30 L 320 90 L 0 90 Z"
        fill={`url(#fill-${accent})`}
      />
    </svg>
  );
}

function Donut({ accent = "#d4af37" }: { accent?: string }) {
  const c = 2 * Math.PI * 26;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16">
      <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff14" strokeWidth="8" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke={accent}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${c * 0.68} ${c}`}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

function Line({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return (
    <div
      className={`h-2 rounded-full ${dim ? "bg-white/5" : "bg-white/10"}`}
      style={{ width: w }}
    />
  );
}

/* ---------- Window chrome ---------- */

export function BrowserFrame({
  children,
  label = "app.senatepos.com",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
        <div className="ml-3 flex-1">
          <div className="mx-auto w-fit rounded-md bg-black/30 px-3 py-1 text-[10px] text-mist-400">
            {label}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ---------- Back Office Dashboard ---------- */

export function DashboardMockup({ accent = "#d4af37" }: { accent?: string }) {
  return (
    <div className="flex bg-ink-900/80 text-left">
      {/* sidebar */}
      <div className="hidden w-40 shrink-0 flex-col gap-3 border-r border-white/5 bg-black/20 p-4 sm:flex">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gold-500/90" />
          <Line w="56px" />
        </div>
        <div className="mt-3 space-y-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ background: i === 1 ? accent : "#ffffff14" }}
              />
              <Line w={`${70 - i * 4}%`} dim={i !== 1} />
            </div>
          ))}
        </div>
      </div>
      {/* main */}
      <div className="flex-1 space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Line w="120px" />
            <Line w="80px" dim />
          </div>
          <div
            className="rounded-md px-3 py-1.5 text-[10px] font-semibold text-ink-900"
            style={{ background: accent }}
          >
            + New
          </div>
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: "$48.2k", a: accent },
            { v: "1,284", a: "#93c5fd" },
            { v: "98.6%", a: "#86efac" },
          ].map((k, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <Line w="40%" dim />
              <div className="mt-2 font-display text-sm font-semibold text-mist-100">
                {k.v}
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: "66%", background: k.a }} />
              </div>
            </div>
          ))}
        </div>
        {/* chart + donut */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <Line w="50%" dim />
            <div className="mt-3 h-20">
              <Sparkline accent={accent} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <Donut accent={accent} />
            <div className="mt-2 w-full space-y-1.5">
              <Line w="80%" dim />
              <Line w="55%" dim />
            </div>
          </div>
        </div>
        {/* bottom bars */}
        <div className="hidden items-end gap-1.5 rounded-xl border border-white/5 bg-white/[0.03] p-3 sm:flex h-24">
          {[40, 65, 50, 80, 55, 90, 60, 75, 45, 85, 70, 95].map((h, i) => (
            <Bar key={i} h={h} accent={accent} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Phone (Mobile POS / Ordering) ---------- */

export function PhoneMockup({ accent = "#d4af37" }: { accent?: string }) {
  return (
    <div className="relative mx-auto w-[210px]">
      <div className="rounded-[2.2rem] border border-white/10 bg-ink-950 p-2.5 shadow-2xl glow-gold">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-ink-900">
          <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/15" />
          <div className="space-y-3 p-4 pt-7 text-left">
            <div className="flex items-center justify-between">
              <Line w="70px" />
              <div className="h-7 w-7 rounded-full" style={{ background: `${accent}33` }} />
            </div>
            <div
              className="rounded-2xl p-3"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}66)` }}
            >
              <div className="text-[9px] font-medium text-ink-900/70">Table 12 · Open</div>
              <div className="mt-1 font-display text-lg font-bold text-ink-900">$86.40</div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5"
              >
                <div className="h-9 w-9 rounded-lg" style={{ background: `${accent}22` }} />
                <div className="flex-1 space-y-1.5">
                  <Line w={`${60 + i * 6}%`} />
                  <Line w="35%" dim />
                </div>
                <div className="text-[10px] font-semibold" style={{ color: accent }}>
                  ×{i}
                </div>
              </div>
            ))}
            <div
              className="rounded-xl py-2.5 text-center text-[11px] font-semibold text-ink-900"
              style={{ background: accent }}
            >
              Send to Kitchen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tablet (Kitchen Display) ---------- */

export function KitchenMockup({ accent = "#fca5a5" }: { accent?: string }) {
  const cols = [
    { t: "02:14", n: 3, c: "#86efac" },
    { t: "05:41", n: 5, c: accent },
    { t: "08:02", n: 2, c: "#fca5a5" },
    { t: "01:07", n: 4, c: "#86efac" },
  ];
  return (
    <div className="bg-ink-900/80 p-4 text-left">
      <div className="mb-3 flex items-center justify-between">
        <Line w="120px" />
        <div className="flex gap-2">
          <div className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-mist-400">All Stations</div>
          <div className="rounded-md px-2 py-1 text-[9px] font-semibold text-ink-900" style={{ background: accent }}>
            Live
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cols.map((col, ci) => (
          <div key={ci} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-mist-200">#{120 + ci}</span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: `${col.c}22`, color: col.c }}
              >
                {col.t}
              </span>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: col.n }).map((_, ri) => (
                <div key={ri} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: col.c }} />
                  <Line w={`${55 + ((ri * 13) % 40)}%`} dim={ri % 2 === 1} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Kiosk / Self-service ordering ---------- */

export function KioskMockup({ accent = "#d4af37" }: { accent?: string }) {
  return (
    <div className="flex flex-col gap-3 bg-ink-900/80 p-4 text-left sm:flex-row">
      {/* Menu grid */}
      <div className="flex-1">
        <div className="mb-3 flex items-center justify-between">
          <Line w="90px" />
          <div className="flex gap-1.5">
            {["All", "Mains", "Sides"].map((c, i) => (
              <span
                key={c}
                className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{
                  background: i === 0 ? accent : "rgba(255,255,255,0.05)",
                  color: i === 0 ? "#081120" : "#8392ad",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-2">
              <div
                className="mb-2 h-12 w-full rounded-lg"
                style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)` }}
              />
              <Line w="80%" />
              <div className="mt-1.5 text-[10px] font-bold" style={{ color: accent }}>
                ${9 + i}.50
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Order cart */}
      <div className="w-full shrink-0 rounded-xl border border-white/5 bg-black/20 p-3 sm:w-40">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
          Your Order
        </div>
        <div className="mt-3 space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <Line w={`${50 + i * 8}%`} />
              <span className="text-[9px] font-semibold" style={{ color: accent }}>
                ×{i}
              </span>
            </div>
          ))}
        </div>
        <div className="my-3 h-px w-full bg-white/5" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-mist-400">Total</span>
          <span className="font-display text-sm font-bold text-mist-100">$42.50</span>
        </div>
        <div
          className="mt-3 rounded-lg py-2 text-center text-[11px] font-semibold text-ink-900"
          style={{ background: accent }}
        >
          Pay &amp; Order
        </div>
      </div>
    </div>
  );
}

