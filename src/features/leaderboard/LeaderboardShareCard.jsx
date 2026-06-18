import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Download, Copy, Check, Trophy, Crown } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL;

const MEDAL = ["🥇", "🥈", "🥉"];
const PODIUM_BG = [
  "rgba(240,192,64,0.12)",
  "rgba(200,200,200,0.07)",
  "rgba(180,120,60,0.07)",
];
const PODIUM_BORDER = [
  "rgba(240,192,64,0.35)",
  "rgba(200,200,200,0.2)",
  "rgba(180,120,60,0.2)",
];
const PODIUM_COLOR = ["#f0c040", "#c0c0c0", "#b47c3c"];

function buildGroups(players) {
  const groups = [];
  for (let i = 0; i < players.length; ) {
    let j = i;
    while (j < players.length && players[j].total === players[i].total) j++;
    groups.push({ rank: i + 1, players: players.slice(i, j) });
    i = j;
  }
  return groups;
}

function ShareCard({ cardRef, ranking }) {
  const players = ranking.filter((p) => !p.is_admin);
  const groups = buildGroups(players);

  const g1 = groups[0] ?? { rank: 1, players: [] };
  const restGroups = groups.slice(1);
  // displayRank usa dense ranking: g1=1, restGroups[0]=2, restGroups[1]=3, ...
  const restPlayers = restGroups.flatMap((g, gIdx) =>
    g.players.map((p) => ({ ...p, displayRank: gIdx + 2 }))
  );

  return (
    <div
      ref={cardRef}
      style={{
        width: 380,
        background: "#0d1f0f",
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "'Arial', sans-serif",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Header */}
      <div style={{ background: "#122614", padding: "14px 20px 12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 3 }}>
          <Trophy style={{ width: 16, height: 16, color: "#f0c040", strokeWidth: 2 }} />
          <div style={{ color: "#f0c040", fontSize: 12, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase" }}>La Quiniela Mundialista</div>
          <Trophy style={{ width: 16, height: 16, color: "#f0c040", strokeWidth: 2 }} />
        </div>
        <div style={{ color: "#8fa88f", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Tabla de posiciones</div>
      </div>

      {/* Podium */}
      {g1.players.length > 0 && (
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

          {/* 1st place — full width, all tied players stacked */}
          <div style={{
            background: PODIUM_BG[0],
            border: `1px solid ${PODIUM_BORDER[0]}`,
            borderRadius: 10, marginBottom: 8,
            boxShadow: "0 0 10px rgba(240,192,64,0.35), 0 0 24px rgba(240,192,64,0.15)",
            overflow: "hidden",
          }}>
            {g1.players.map((p, i) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 14px",
                borderTop: i > 0 ? "1px solid rgba(240,192,64,0.15)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {i === 0
                    ? <Crown style={{ width: 20, height: 20, color: "#f0c040", strokeWidth: 1.5, filter: "drop-shadow(0 0 8px rgba(238,200,94,0.85))", flexShrink: 0 }} />
                    : <Crown style={{ width: 20, height: 20, color: "#f0c040", strokeWidth: 1.5, opacity: 0.5, flexShrink: 0 }} />
                  }
                  <div>
                    <div style={{ color: PODIUM_COLOR[0], fontSize: 14, fontWeight: "bold" }}>{p.name}</div>
                    <div style={{ color: "#8fa88f", fontSize: 9, marginTop: 1 }}>{p.exact * 3}E · {p.outcome}A</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: PODIUM_COLOR[0], fontSize: 20, fontWeight: "bold", lineHeight: 1 }}>{p.total}</div>
                  <div style={{ color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>pts</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Rest of table */}
      {restPlayers.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", padding: "5px 14px", background: "#0f1e10" }}>
            <div style={{ width: 26, color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>#</div>
            <div style={{ flex: 1, color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Jugador</div>
            <div style={{ width: 64, textAlign: "center", color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Exact. ×3</div>
            <div style={{ width: 64, textAlign: "center", color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Acert.</div>
            <div style={{ width: 64, textAlign: "center", color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Total</div>
          </div>
          {restPlayers.map((p, i) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center",
              padding: "7px 14px",
              background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{ width: 26, fontSize: 12, fontWeight: "bold" }}>
                {p.displayRank === 2 ? "🥈" : p.displayRank === 3 ? "🥉" : <span style={{ color: "#8fa88f", fontSize: 11 }}>{p.displayRank}</span>}
              </div>
              <div style={{ flex: 1, color: "#e8ede8", fontSize: 12 }}>{p.name}</div>
              <div style={{ width: 64, textAlign: "center", color: "#4caf50", fontSize: 11, fontWeight: "bold" }}>{p.exact * 3}</div>
              <div style={{ width: 64, textAlign: "center", color: "#e8ede8", fontSize: 11 }}>{p.outcome}</div>
              <div style={{ width: 64, textAlign: "center", color: "#f0c040", fontSize: 13, fontWeight: "bold" }}>{p.total}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "10px 0 12px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <img
          src={`${BASE_URL}images/eb-logo-w.png`}
          alt="EB Consulting"
          style={{ height: 26, objectFit: "contain", display: "block", margin: "0 auto" }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

export function LeaderboardShareButton({ ranking }) {
  const cardRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generatePng() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
  }

  async function dataUrlToBlob(dataUrl) {
    return (await fetch(dataUrl)).blob();
  }

  async function handleOpen() {
    setPreview(true);
    setGenerating(true);
    try {
      setPreviewUrl(await generatePng());
    } catch (e) {
      console.error("Error generando imagen:", e);
    } finally {
      setGenerating(false);
    }
  }

  function handleClose() {
    setPreview(false);
    setPreviewUrl(null);
    setCopied(false);
  }

  async function handleShare() {
    try {
      const blob = await dataUrlToBlob(previewUrl ?? await generatePng());
      const file = new File([blob], "tabla-quiniela.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "La Quiniela Mundialista 🏆",
          text: "Así va la tabla de posiciones del grupo 👀",
        });
      }
    } catch (e) {
      if (e.name !== "AbortError") console.error("Error compartiendo:", e);
    }
  }

  async function handleCopy() {
    try {
      const blob = await dataUrlToBlob(previewUrl ?? await generatePng());
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Error copiando:", e);
    }
  }

  async function handleDownload() {
    try {
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "tabla-quiniela-mundialista.png";
      a.click();
    } catch (e) {
      console.error("Error descargando:", e);
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <>
      {/* Hidden card for capture */}
      <div style={{ position: "fixed", left: -9999, top: -9999, zIndex: -1 }}>
        <ShareCard cardRef={cardRef} ranking={ranking} />
      </div>

      <button
        onClick={handleOpen}
        title="Compartir tabla como imagen"
        className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass inline-flex items-center gap-1.5"
      >
        <Share2 className="w-3.5 h-3.5" />
        Compartir tabla
      </button>

      {preview && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Row 1: título + cerrar */}
            <div className="flex items-center justify-between gap-2 bg-turf/95 backdrop-blur-sm px-4 py-2.5 border-b border-line">
              <span className="font-cond text-sm font-bold uppercase tracking-wider text-chalk">Tabla de posiciones</span>
              <button
                onClick={handleClose}
                className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf p-1.5 text-mist hover:text-chalk transition-colors duration-150 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: acciones */}
            {!generating && previewUrl && (
              <div className="flex items-center justify-center gap-2 bg-turf/80 backdrop-blur-sm px-4 py-2 border-b border-line">
                {canShare && (
                  <button
                    onClick={handleShare}
                    className="cursor-pointer rounded-lg border border-grass/50 bg-grass/10 hover:bg-grass/20 px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-grass transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-grass" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  onClick={handleDownload}
                  className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
              </div>
            )}

            {/* Preview */}
            <div className="overflow-y-auto" style={{ flex: 1 }}>
              {generating && (
                <div className="flex items-center justify-center p-8 text-mist text-sm font-cond">
                  Generando imagen...
                </div>
              )}
              {!generating && previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview tabla de posiciones"
                  style={{ display: "block", width: "100%", maxWidth: 380 }}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
