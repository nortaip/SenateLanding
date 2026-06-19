import { ImageResponse } from "next/og";

export const alt = "Senate POS — The Complete Restaurant Operating System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #f0d98a, #b8932a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            👑
          </div>
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
