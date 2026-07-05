/**
 * HMAC-signed proxy from the SENATE.OS admin console to a specific
 * venue's back-office backend.
 *
 * Security posture:
 *
 *  1. **Domain allow-list.**  The admin can only reach a venue whose
 *     domain came from the trusted venues list (`svurguns.cyou`
 *     subdomain).  Arbitrary `?venue=` values are rejected — no SSRF.
 *
 *  2. **HMAC-SHA256 request signing.**  Each request to the venue
 *     backend carries a `X-Senate-Sig: sha256=<hex>` header derived
 *     from `<timestamp>.<op>.<venue-id>` and a shared secret
 *     (`ADMIN_MONITOR_SECRET` env).  The venue backend rejects
 *     requests older than 60s or with the wrong signature.
 *
 *  3. **Fixed operation set.**  Only `orders` / `logs` / `db` /
 *     `health` are proxied; any other value returns 400 to prevent
 *     path-injection into the venue backend.
 *
 *  4. **Bearer-less body.**  Admin token stays server-side (only
 *     landing server has `ADMIN_MONITOR_SECRET`) — the browser never
 *     sees or handles it.
 *
 *  5. **Server-side audit.**  Each call logs `venue`, `op`, `caller
 *     IP`, `X-Forwarded-For` and duration to stdout so a SIEM can
 *     ship it downstream.  No caller controls the log content.
 *
 *  6. **Cache disabled + timeout.**  8-second hard timeout, no cache,
 *     no revalidation — always live.
 *
 * Wire format on the venue backend side (possflutterback):
 *   GET /admin/monitor/<op>?ts=<epoch>
 *   Headers:
 *     X-Senate-Sig: sha256=<hex(HMAC(secret, "<ts>.<op>.<venueId>"))>
 *     X-Senate-Venue: <venueId>
 *   Returns JSON.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { BACKEND_URL, venuesUrl, normalizeVenues, type Venue } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ─── Allowed operations ────────────────────────────────────────── */
const ALLOWED_OPS = new Set(["orders", "logs", "db", "health"]);

/* ─── Trust root (only allow subdomains of `.svurguns.cyou`) ────── */
function rootDomain(host: string) {
  return host.split(".").slice(-2).join(".");
}
const TRUST_ROOT = rootDomain(new URL(BACKEND_URL).hostname);

/* ─── Venue cache — refreshed at most every 15s ─────────────────── */
type VenueCache = { at: number; list: Venue[] };
let venueCache: VenueCache | null = null;

async function loadVenues(): Promise<Venue[]> {
  const now = Date.now();
  if (venueCache && now - venueCache.at < 15_000) return venueCache.list;
  const res = await fetch(venuesUrl(), {
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`venues HTTP ${res.status}`);
  const list = normalizeVenues(await res.json());
  venueCache = { at: now, list };
  return list;
}

/* ─── Resolve a venue by its id → its own trusted backend origin ──
 * The venues list carries `domain` per row (e.g. `bar-a.svurguns.cyou`).
 * We only accept an origin whose registrable domain matches TRUST_ROOT.
 */
function trustedOrigin(domain: string | undefined): string | null {
  if (!domain) return null;
  const host = domain.replace(/^https?:\/\//i, "").split("/")[0];
  if (!host) return null;
  if (rootDomain(host) !== TRUST_ROOT) return null;
  return `https://${host}`;
}

/* ─── HMAC signing ──────────────────────────────────────────────── */
function sign(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/* ─── Audit log line — stdout, one JSON per line ────────────────── */
function audit(o: Record<string, unknown>) {
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ evt: "venue-proxy", ...o }));
  } catch {
    /* no-op */
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ op: string }> }
) {
  const { op } = await params;
  const url = new URL(request.url);
  const venueParam = url.searchParams.get("venue");
  const started = Date.now();

  // 1. Operation whitelist
  if (!ALLOWED_OPS.has(op)) {
    return NextResponse.json(
      { __err: "unknown op" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  // 2. Shared secret must be configured server-side
  const secret = process.env.ADMIN_MONITOR_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      { __err: "server misconfigured: ADMIN_MONITOR_SECRET missing" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  // 3. Venue exists in the trusted registry?
  if (!venueParam) {
    return NextResponse.json({ __err: "venue required" }, { status: 400 });
  }
  let venues: Venue[];
  try {
    venues = await loadVenues();
  } catch (e) {
    return NextResponse.json(
      { __err: `venue registry unreachable: ${(e as Error).message}` },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
  const target = venues.find(
    (v) => String(v.id) === String(venueParam) || v.code === venueParam
  );
  if (!target) {
    return NextResponse.json(
      { __err: "venue not in registry" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }
  const origin = trustedOrigin(target.domain);
  if (!origin) {
    return NextResponse.json(
      { __err: "venue has no trusted domain" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }

  // 4. Sign the request — <ts>.<op>.<venueId>
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = sign(secret, `${ts}.${op}.${target.id}`);

  const upstream = `${origin}/admin/monitor/${op}?ts=${ts}`;
  let status = 502;
  let body: unknown = { __err: "no response" };
  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "x-senate-sig": `sha256=${sig}`,
        "x-senate-venue": String(target.id),
      },
      signal: AbortSignal.timeout(8000),
    });
    status = res.status;
    try {
      body = await res.json();
    } catch {
      body = { __err: `upstream non-JSON HTTP ${res.status}` };
    }
  } catch (e) {
    body = { __err: `upstream error: ${(e as Error).message}` };
  }

  // Constant-time compare on returned checksum (if backend echoes it)
  // — a light integrity check for the payload marker.
  if (body && typeof body === "object" && "checksum" in body) {
    try {
      const raw = String((body as { checksum?: string }).checksum || "");
      const expected = sign(secret, `${ts}.${op}.${target.id}.ack`);
      const a = Buffer.from(raw);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        (body as { __checksum_warn?: boolean }).__checksum_warn = true;
      }
    } catch {
      /* ignore */
    }
  }

  audit({
    venue: target.id,
    op,
    status,
    ms: Date.now() - started,
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null,
  });

  return NextResponse.json(body, {
    status: status >= 200 && status < 300 ? 200 : status,
    headers: { "cache-control": "no-store" },
  });
}
