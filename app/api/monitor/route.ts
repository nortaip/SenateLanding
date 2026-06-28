import { NextResponse } from "next/server";
import { BACKEND_URL, normalize, offlineSnapshot } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Only allow proxying to the configured backend's registrable domain.
function rootDomain(host: string) {
  return host.split(".").slice(-2).join(".");
}
const ALLOWED_ROOT = rootDomain(new URL(BACKEND_URL).hostname);

function isAllowed(target: string) {
  try {
    const u = new URL(target);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return rootDomain(u.hostname) === ALLOWED_ROOT;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const base = process.env.MONITOR_BACKEND_URL || BACKEND_URL;
  const override = new URL(request.url).searchParams.get("url");
  const target = override && isAllowed(override) ? override : base;

  try {
    const started = Date.now();
    const res = await fetch(target, {
      cache: "no-store",
      headers: { accept: "application/json, text/plain, */*" },
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - started;
    if (!res.ok) throw new Error(`backend HTTP ${res.status}`);

    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("backend did not return JSON");
    }

    const snap = normalize(json, ms);
    if (!snap.devices.length) throw new Error("no devices found in payload");

    return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    // No mock data: report the real failure and an empty fleet.
    const snap = offlineSnapshot(`backend error: ${(err as Error).message}`);
    return NextResponse.json(snap, {
      status: 502,
      headers: { "cache-control": "no-store" },
    });
  }
}
