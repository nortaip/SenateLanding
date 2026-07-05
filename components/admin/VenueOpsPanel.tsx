"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, ScrollText, ShieldCheck, AlertTriangle } from "lucide-react";
import type { Venue } from "@/lib/monitor";

/**
 * When a venue is selected in the admin console, this panel opens a
 * live view onto that venue's back-office.  Two streams:
 *
 *   • **LIVE ORDERS** — the last N orders currently open on POS.
 *     Poll `/api/venue/orders?venue=<id>` every 3 s.
 *
 *   • **DB LOG STREAM** — tail of the backend's structured log stream.
 *     Poll `/api/venue/logs?venue=<id>` every 2 s.
 *
 * Both go through the HMAC-signed landing proxy — the browser never
 * sees the venue's admin token, only the pre-authorised proxy path.
 *
 * The UI mirrors the existing SENATE.OS aesthetic (Panel wrapper,
 * green HUD, monospace).  It refuses to render if `venue` is null so
 * we never fire polls with an unknown target.
 */

const ORDER_POLL_MS = 3000;
const LOG_POLL_MS = 2000;
const LOG_CAP = 240;

type OrderRow = {
  orderId: number;
  tableName?: string;
  waiterName?: string;
  status?: string;
  itemsCount?: number;
  total?: number;
  createdAt?: string;
};

type LogRow = {
  ts: string;         // ISO
  level?: string;     // INFO / WARN / ERROR
  logger?: string;
  message: string;
};

type OrdersPayload = {
  __err?: string;
  __checksum_warn?: boolean;
  orders?: OrderRow[];
};
type LogsPayload = {
  __err?: string;
  __checksum_warn?: boolean;
  lines?: LogRow[];
};

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
function hhmmss(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtMoney(v: number | undefined) {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("az-AZ", { maximumFractionDigits: 2 });
}

const LEVEL_COLOR: Record<string, string> = {
  ERROR: "text-[#ff5d6c]",
  WARN: "text-[#f5c452]",
  WARNING: "text-[#f5c452]",
  INFO: "text-[#5be1ff]",
  DEBUG: "text-[#5f9c7e]",
};

export function VenueOpsPanel({ venue }: { venue: Venue }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersErr, setOrdersErr] = useState<string | null>(null);
  const [ordersCS, setOrdersCS] = useState(false);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsErr, setLogsErr] = useState<string | null>(null);
  const [logsCS, setLogsCS] = useState(false);

  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/venue/orders?venue=${encodeURIComponent(venue.id)}`, {
        cache: "no-store",
      });
      const j: OrdersPayload = await res.json();
      if (!alive.current) return;
      if (j.__err) {
        setOrdersErr(j.__err);
        return;
      }
      setOrdersErr(null);
      setOrders(Array.isArray(j.orders) ? j.orders.slice(0, 60) : []);
      setOrdersCS(!!j.__checksum_warn);
    } catch (e) {
      if (alive.current) setOrdersErr((e as Error).message);
    }
  }, [venue.id]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/venue/logs?venue=${encodeURIComponent(venue.id)}`, {
        cache: "no-store",
      });
      const j: LogsPayload = await res.json();
      if (!alive.current) return;
      if (j.__err) {
        setLogsErr(j.__err);
        return;
      }
      setLogsErr(null);
      const next = Array.isArray(j.lines) ? j.lines : [];
      // Newest lines on top, capped
      setLogs(next.slice(0, LOG_CAP));
      setLogsCS(!!j.__checksum_warn);
    } catch (e) {
      if (alive.current) setLogsErr((e as Error).message);
    }
  }, [venue.id]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, ORDER_POLL_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, LOG_POLL_MS);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const anyChecksumWarn = ordersCS || logsCS;

  const orderTotal = useMemo(
    () => orders.reduce((s, o) => s + (typeof o.total === "number" ? o.total : 0), 0),
    [orders]
  );

  return (
    <section className="hud-panel hud-corner">
      <header className="hud-head">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hud-glow">BACKEND OPERATIONS · {venue.name || venue.code || `#${venue.id}`}</span>
        </span>
        <span className="flex items-center gap-3 text-[10px] tracking-widest text-[#5f9c7e]">
          <span>ORD·{orders.length}</span>
          <span>LOG·{logs.length}</span>
          {anyChecksumWarn && (
            <span className="flex items-center gap-1 rounded-sm bg-[#f5c452]/10 px-1.5 py-0.5 text-[#f5c452]">
              <AlertTriangle className="h-3 w-3" /> HMAC-ACK-MISMATCH
            </span>
          )}
        </span>
      </header>

      <div className="grid gap-px bg-[#46f08a]/10 lg:grid-cols-2">
        {/* ─── LIVE ORDERS ─────────────────────────────────────── */}
        <div className="bg-[#02060c] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] tracking-widest text-[#5f9c7e]">
              <ShoppingCart className="h-3 w-3" /> LIVE ORDERS
            </span>
            <span className="text-[10px] text-[#7fe6a8]">
              Σ {fmtMoney(orderTotal)}
            </span>
          </div>
          {ordersErr && (
            <div className="rounded-sm border border-[#ff5d6c]/40 bg-[#ff5d6c]/5 px-2 py-1.5 text-[10.5px] text-[#ff5d6c]">
              ⚠ {ordersErr}
            </div>
          )}
          {!ordersErr && orders.length === 0 && (
            <div className="py-6 text-center text-[10.5px] text-[#5f9c7e]">
              <span className="hud-pulse">◌ waiting for orders…</span>
            </div>
          )}
          <div className="hud-scroll max-h-[46vh] overflow-y-auto">
            {orders.map((o) => (
              <div
                key={`${o.orderId}-${o.createdAt ?? ""}`}
                className="hud-row grid grid-cols-[70px_minmax(90px,1fr)_70px_78px_60px] gap-2 border-b border-[#0f2a1e] px-2 py-1.5 text-[10.5px]"
              >
                <span className="text-[#7fe6a8]">#{o.orderId}</span>
                <span className="truncate text-[#bdeed2]">
                  {o.tableName ?? "—"}
                  {o.waiterName ? (
                    <span className="ml-1 text-[10px] text-[#3a6b54]">· {o.waiterName}</span>
                  ) : null}
                </span>
                <span
                  className={
                    o.status === "Closed"
                      ? "text-[#5f9c7e]"
                      : o.status === "Opened"
                        ? "text-[#46f08a]"
                        : "text-[#5be1ff]"
                  }
                >
                  {o.status ?? "—"}
                </span>
                <span className="text-right text-[#5be1ff]">{fmtMoney(o.total)}</span>
                <span className="text-right text-[10px] text-[#5f9c7e]">
                  {o.itemsCount == null ? "—" : `${o.itemsCount}✕`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── DB LOG STREAM ───────────────────────────────────── */}
        <div className="bg-[#02060c] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] tracking-widest text-[#5f9c7e]">
              <ScrollText className="h-3 w-3" /> DB LOG STREAM
            </span>
            <span className="text-[10px] text-[#5f9c7e]">TAIL·{LOG_POLL_MS / 1000}s</span>
          </div>
          {logsErr && (
            <div className="rounded-sm border border-[#ff5d6c]/40 bg-[#ff5d6c]/5 px-2 py-1.5 text-[10.5px] text-[#ff5d6c]">
              ⚠ {logsErr}
            </div>
          )}
          {!logsErr && logs.length === 0 && (
            <div className="py-6 text-center text-[10.5px] text-[#5f9c7e]">
              <span className="hud-pulse">◌ waiting for log lines…</span>
            </div>
          )}
          <div className="hud-scroll max-h-[46vh] overflow-y-auto font-mono">
            {logs.map((l, i) => {
              const level = (l.level || "INFO").toUpperCase();
              const color = LEVEL_COLOR[level] || "text-[#bdeed2]";
              const t = l.ts ? new Date(l.ts).getTime() : Date.now();
              return (
                <div
                  key={`${l.ts}-${i}`}
                  className="flex gap-2 whitespace-pre-wrap break-words border-b border-[#0f2a1e]/60 py-1 text-[10.5px]"
                >
                  <span className="shrink-0 text-[#3a6b54]">{hhmmss(t)}</span>
                  <span className={`shrink-0 ${color}`}>[{level}]</span>
                  {l.logger && (
                    <span className="shrink-0 text-[#5f9c7e]">{l.logger}</span>
                  )}
                  <span className={color}>{l.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
