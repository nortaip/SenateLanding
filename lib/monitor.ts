/**
 * Device-monitoring data layer for the admin console.
 *
 * The real backend lives at BACKEND_URL. Because we cannot guarantee its exact
 * JSON shape, `normalize()` accepts almost anything and maps it onto a stable
 * model. When the backend is unreachable, `buildDemo()` produces a live-looking
 * roster so the console is never blank (clearly flagged as source: "demo").
 */

export const BACKEND_URL = "https://appmobile.svurguns.cyou/Data/MobilePoss/";

export type Device = {
  id: string;
  name: string;
  online: boolean;
  ms: number; // latency / ping
  health: number; // 0-100
  usage: number; // active usage 0-100
  lastSeen: number; // epoch ms
  ip?: string;
  model?: string;
  version?: string;
  location?: string;
};

export type ServerHealth = {
  online: boolean;
  ms: number;
  cpu: number; // 0-100
  ram: number; // 0-100
  uptimeSec: number;
};

export type MonitorSnapshot = {
  ok: boolean;
  source: "live" | "demo";
  ts: number;
  server: ServerHealth;
  devices: Device[];
  note?: string;
};

/* ----------------------------- helpers ----------------------------- */

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    for (const actual of Object.keys(obj)) {
      if (actual.toLowerCase() === k.toLowerCase() && obj[actual] != null) {
        return obj[actual];
      }
    }
  }
  return undefined;
}

function toEpoch(v: unknown): number | undefined {
  const n = num(v);
  if (n != null) return n < 1e12 ? n * 1000 : n; // seconds vs ms
  if (typeof v === "string") {
    const p = Date.parse(v);
    if (!Number.isNaN(p)) return p;
  }
  return undefined;
}

function truthyOnline(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  const n = num(v);
  if (n != null) return n > 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["online", "active", "connected", "up", "on", "ready", "1", "true", "yes"].includes(s))
      return true;
    if (["offline", "inactive", "disconnected", "down", "off", "0", "false", "no", "dead"].includes(s))
      return false;
  }
  return undefined;
}

/** Locate the array of device-like records inside an arbitrary payload. */
function findDeviceArray(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    const keys = ["devices", "data", "items", "result", "results", "list", "objects", "rows", "mobileposs", "records"];
    for (const k of Object.keys(obj)) {
      if (keys.includes(k.toLowerCase()) && Array.isArray(obj[k])) {
        return obj[k] as Record<string, unknown>[];
      }
    }
    // object keyed by id -> values that are objects
    const vals = Object.values(obj);
    if (vals.length && vals.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
      return vals as Record<string, unknown>[];
    }
  }
  return [];
}

function mapDevice(raw: Record<string, unknown>, i: number, now: number): Device {
  const id = String(
    pick(raw, ["id", "deviceId", "device_id", "uuid", "serial", "mac", "imei", "token", "_id"]) ??
      `DEV-${String(i + 1).padStart(3, "0")}`
  );
  const name = String(
    pick(raw, ["name", "deviceName", "device_name", "model", "device", "title", "label", "hostname"]) ?? id
  );

  const lastSeen = toEpoch(pick(raw, ["lastSeen", "last_seen", "lastseen", "updatedAt", "updated_at", "timestamp", "time", "seenAt", "last_active"]));

  let online = truthyOnline(pick(raw, ["online", "active", "isOnline", "is_online", "status", "state", "connected", "enabled"]));
  if (online == null) online = lastSeen != null ? now - lastSeen < 120_000 : false;

  const ms = clamp(num(pick(raw, ["ms", "ping", "latency", "responseTime", "response_time", "rtt", "delay"])) ?? (online ? 0 : 0), 0, 9999);
  const usage = clamp(num(pick(raw, ["usage", "activeUsage", "load", "cpu", "sessions", "active"])) ?? 0, 0, 100);

  let health = num(pick(raw, ["health", "healthScore", "health_score", "score"]));
  if (health == null) {
    health = online ? clamp(100 - ms / 4 - usage / 6, 25, 100) : 0;
  }
  health = clamp(health, 0, 100);

  return {
    id,
    name,
    online,
    ms: online ? ms : 0,
    health,
    usage: online ? usage : 0,
    lastSeen: lastSeen ?? (online ? now : now - 600_000),
    ip: (pick(raw, ["ip", "ipAddress", "ip_address", "address"]) as string) || undefined,
    model: (pick(raw, ["model", "deviceModel", "type"]) as string) || undefined,
    version: (pick(raw, ["version", "appVersion", "app_version", "build", "fw"]) as string) || undefined,
    location: (pick(raw, ["location", "branch", "store", "site", "region"]) as string) || undefined,
  };
}

export function normalize(json: unknown, measuredMs: number): MonitorSnapshot {
  const now = Date.now();
  const arr = findDeviceArray(json);
  const devices = arr.map((d, i) => mapDevice(d, i, now));

  // server block, if present
  let server: ServerHealth = {
    online: true,
    ms: clamp(measuredMs, 0, 9999),
    cpu: 0,
    ram: 0,
    uptimeSec: 0,
  };
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const sraw = pick(json as Record<string, unknown>, ["server", "health", "system", "host"]);
    if (sraw && typeof sraw === "object") {
      const s = sraw as Record<string, unknown>;
      server = {
        online: truthyOnline(pick(s, ["online", "status", "up"])) ?? true,
        ms: clamp(num(pick(s, ["ms", "ping", "latency"])) ?? measuredMs, 0, 9999),
        cpu: clamp(num(pick(s, ["cpu", "cpuUsage", "load"])) ?? 0, 0, 100),
        ram: clamp(num(pick(s, ["ram", "memory", "mem", "ramUsage"])) ?? 0, 0, 100),
        uptimeSec: num(pick(s, ["uptime", "uptimeSec", "uptime_seconds"])) ?? 0,
      };
    }
  }

  return { ok: true, source: "live", ts: now, server, devices };
}

/* ----------------------------- demo data ----------------------------- */

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

type RosterEntry = { id: string; name: string; model: string; ip: string; version: string; location: string; pinned?: boolean };

const ROSTER: RosterEntry[] = [
  { id: "SRV-CORE-00", name: "core-api", model: "Senate Cloud", ip: "10.0.0.2", version: "16.4.2", location: "DC / Frankfurt", pinned: true },
  { id: "POS-WIN-01", name: "Windows POS · Bar", model: "WinTerm X3", ip: "192.168.1.21", version: "4.5.5", location: "Harbor House" },
  { id: "POS-WIN-02", name: "Windows POS · Floor", model: "WinTerm X3", ip: "192.168.1.22", version: "4.5.5", location: "Harbor House" },
  { id: "KDS-KIT-03", name: "Kitchen Display", model: "KDS-22", ip: "192.168.1.31", version: "4.5.4", location: "Harbor House" },
  { id: "MOB-POS-04", name: "Mobile POS · Sec A", model: "iPad Air", ip: "192.168.1.41", version: "4.5.5", location: "Cedar & Sage" },
  { id: "MOB-POS-05", name: "Mobile POS · Sec B", model: "Galaxy Tab", ip: "192.168.1.42", version: "4.5.3", location: "Cedar & Sage" },
  { id: "KSK-SELF-06", name: "Self-Order Kiosk", model: "Kiosk Pro", ip: "192.168.1.51", version: "4.5.5", location: "Lumen Lounge" },
  { id: "KSK-SELF-07", name: "Self-Order Kiosk", model: "Kiosk Pro", ip: "192.168.1.52", version: "4.5.5", location: "Lumen Lounge" },
  { id: "PRN-KIT-08", name: "Kitchen Printer", model: "Epson TM", ip: "192.168.1.61", version: "1.2.0", location: "Trattoria Nove" },
  { id: "PRN-BAR-09", name: "Bar Printer", model: "Epson TM", ip: "192.168.1.62", version: "1.2.0", location: "Trattoria Nove" },
  { id: "QR-GATE-10", name: "QR Order Gateway", model: "Edge Node", ip: "10.0.0.7", version: "16.3.6", location: "DC / Frankfurt", pinned: true },
  { id: "MOB-POS-11", name: "Mobile POS · Patio", model: "iPad Mini", ip: "192.168.1.43", version: "4.5.2", location: "Spice Route" },
  { id: "RTR-EDGE-12", name: "Branch Router", model: "MikroTik", ip: "192.168.1.1", version: "7.14", location: "Urban Plate" },
  { id: "KDS-KIT-13", name: "Kitchen Display", model: "KDS-22", ip: "192.168.1.32", version: "4.5.4", location: "Urban Plate" },
];

export function buildDemo(now = Date.now()): MonitorSnapshot {
  const devices: Device[] = ROSTER.map((r) => {
    const onWin = Math.floor(now / 25_000); // state holds ~25s
    const online = r.pinned ? true : hash(`${r.id}:on:${onWin}`) % 100 > 14; // ~86% up
    const msWin = Math.floor(now / 4_000);
    const ms = online ? 6 + (hash(`${r.id}:ms:${msWin}`) % 70) : 0;
    const usage = online ? hash(`${r.id}:us:${Math.floor(now / 8_000)}`) % 96 : 0;
    const health = online ? clamp(100 - ms / 4 - usage / 6, 25, 100) : 0;
    const lastSeen = online ? now - (hash(`${r.id}:ls:${msWin}`) % 4_000) : now - (60_000 + (hash(r.id) % 600_000));
    return {
      id: r.id,
      name: r.name,
      online,
      ms,
      health,
      usage,
      lastSeen,
      ip: r.ip,
      model: r.model,
      version: r.version,
      location: r.location,
    };
  });

  const sMs = 14 + (hash(`srv:${Math.floor(now / 4_000)}`) % 22);
  const server: ServerHealth = {
    online: true,
    ms: sMs,
    cpu: 28 + (hash(`cpu:${Math.floor(now / 6_000)}`) % 46),
    ram: 41 + (hash(`ram:${Math.floor(now / 9_000)}`) % 38),
    uptimeSec: 1_492_800 + Math.floor(now / 1000) % 1_000_000,
  };

  return { ok: true, source: "demo", ts: now, server, devices };
}
