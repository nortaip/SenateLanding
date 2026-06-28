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
  source: "live" | "offline";
  ts: number;
  server: ServerHealth;
  devices: Device[];
  note?: string;
};

export const OFFLINE_SERVER: ServerHealth = {
  online: false,
  ms: 0,
  cpu: 0,
  ram: 0,
  uptimeSec: 0,
};

export function offlineSnapshot(note: string): MonitorSnapshot {
  return { ok: false, source: "offline", ts: Date.now(), server: OFFLINE_SERVER, devices: [], note };
}

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
