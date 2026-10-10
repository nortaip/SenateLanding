import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Senate POS — The Complete Restaurant Operating System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const icon = await readFile(join(process.cwd(), "public/brand/senate-icon.png"));
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(1000px 500px at 50% -10%, #16213a 0%, #081120 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc} width={64} height={64} alt="" />
          <div
            style={{
              display: "flex",
              gap: 10,
              fontSize: 34,
              fontWeight: 700,
              color: "#e8edf6",
            }}
          >
            <span>Senate</span>
            <span style={{ color: "#d4af37" }}>POS</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 50,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#e8edf6",
            maxWidth: 980,
          }}
        >
          <span style={{ marginRight: 20 }}>The Complete</span>
          <span style={{ color: "#d4af37" }}>Restaurant Operating System</span>
        </div>

        <div
          style={{
            marginTop: 30,
            fontSize: 30,
            color: "#aab6cc",
            maxWidth: 900,
          }}
        >
          Sales · Tables · Kitchen · Inventory · Staff · Reporting — one platform.
        </div>
      </div>
    ),
    { ...size }
  );
}
