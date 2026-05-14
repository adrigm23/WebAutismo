import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, rgba(12,113,195,1) 0%, rgba(248,246,243,1) 56%, rgba(255,182,6,0.92) 100%)",
          color: "#1f2d3d",
          fontFamily: "Arial, sans-serif",
          padding: 48
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            borderRadius: 32,
            background: "rgba(255,255,255,0.92)",
            padding: 42
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                color: "#0c71c3",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase"
              }}
            >
              {siteConfig.shortName}
            </div>
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08 }}>
              Campus profesional para formacion en autismo
            </div>
            <div style={{ fontSize: 26, lineHeight: 1.35, color: "#4e6173", maxWidth: 960 }}>
              Recursos privados, seguimiento academico y comunidad docente en una sola plataforma.
            </div>
          </div>
          <div style={{ fontSize: 22, color: "#35506a" }}>{siteConfig.name}</div>
        </div>
      </div>
    ),
    size
  );
}
