import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Download } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL;

function ShareCard({ cardRef, ranking }) {
  return (
    <div
      ref={cardRef}
      style={{
        width: 480,
        background: "#0d1f0f",
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "'Arial', sans-serif",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Header */}
      <div style={{ background: "#122614", padding: "16px 24px 14px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ color: "#f0c040", fontSize: 13, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase" }}>La Quiniela Mundialista</div>
        <div style={{ color: "#8fa88f", fontSize: 10, letterSpacing: 2, marginTop: 3, textTransform: "uppercase" }}>Tabla de posiciones</div>
      </div>

      {/* Table */}
      <div>
        {/* Thead */}
        <div style={{ display: "flex", alignItems: "center", padding: "6px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#122614" }}>
          <div style={{ width: 28, color: "#8fa88f", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>#</div>
          <div style={{ flex: 1, color: "#8fa88f", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Jugador</div>
          <div style={{ width: 48, textAlign: "center", color: "#8fa88f", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Exact.</div>
          <div style={{ width: 48, textAlign: "center", color: "#8fa88f", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Acert.</div>
          <div style={{ width: 48, textAlign: "right", color: "#8fa88f", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Total</div>
        </div>

        {ranking.filter((p) => !p.is_admin).map((p, i) => (
          <div
            key={p.id}
            style={{
              display: "flex", alignItems: "center",
              padding: "9px 16px",
              background: i === 0 && p.total > 0 ? "rgba(240,192,64,0.06)" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ width: 28, color: i < 3 && p.total > 0 ? "#f0c040" : "#8fa88f", fontSize: 12, fontWeight: "bold" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, color: "#e8ede8", fontSize: 13, fontWeight: i === 0 && p.total > 0 ? "bold" : "normal" }}>
              {p.name}
            </div>
            <div style={{ width: 48, textAlign: "center", color: "#4caf50", fontSize: 12, fontWeight: "bold" }}>{p.exact}</div>
            <div style={{ width: 48, textAlign: "center", color: "#e8ede8", fontSize: 12 }}>{p.outcome}</div>
            <div style={{ width: 48, textAlign: "right", color: "#f0c040", fontSize: 14, fontWeight: "bold" }}>{p.total}</div>
          </div>
        ))}
      </div>

      {/* Footer logo */}
      <div style={{ padding: "12px 0 14px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <img
          src={`${BASE_URL}images/eb-logo-w.png`}
          alt="EB Consulting"
          style={{ height: 28, objectFit: "contain", display: "block", margin: "0 auto" }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

export function LeaderboardShareButton({ ranking }) {
  const cardRef = useRef(null);
  const [preview, setPreview] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "tabla-quiniela-mundialista.png";
      a.click();
    } catch (e) {
      console.error("Error generando imagen:", e);
    }
  }

  return (
    <>
      {/* Hidden card for capture */}
      <div style={{ position: "fixed", left: -9999, top: -9999, zIndex: -1 }}>
        <ShareCard cardRef={cardRef} ranking={ranking} />
      </div>

      <button
        onClick={() => setPreview(true)}
        title="Compartir tabla como imagen"
        className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass inline-flex items-center gap-1.5"
      >
        <Share2 className="w-3.5 h-3.5" />
        Compartir tabla
      </button>

      {preview && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="relative max-h-[90vh] overflow-y-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-turf/95 backdrop-blur-sm px-4 py-2.5 rounded-t-2xl border-b border-line">
              <span className="font-cond text-sm font-bold uppercase tracking-wider text-chalk">Tabla de posiciones</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="cursor-pointer rounded-lg border border-grass/50 bg-grass/10 hover:bg-grass/20 px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-grass transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
                <button
                  onClick={() => setPreview(false)}
                  className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf p-1.5 text-mist hover:text-chalk transition-colors duration-150 focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ShareCard ranking={ranking} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
