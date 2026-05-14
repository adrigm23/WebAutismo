import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          padding: 64
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            borderRadius: 36,
            background: "rgba(255,255,255,0.9)",
            padding: 48,
            boxShadow: "0 24px 60px rgba(34,34,33,0.12)"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                color: "#0c71c3",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase"
              }}
            >
              {siteConfig.shortName}
            </div>
            <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
              Formacion digital especializada en autismo
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.4, maxWidth: 900, color: "#4e6173" }}>
              Cursos, seguimiento, recursos privados y comunidad docente en un campus preparado para
              proyectos reales.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 26,
              color: "#35506a"
            }}
          >
            <div>{siteConfig.name}</div>
            <div>Plataforma profesional</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
