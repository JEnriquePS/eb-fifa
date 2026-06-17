import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Download } from "lucide-react";
import { TEAMS } from "../../core/data/teams";
import { validScore } from "../../lib/polla";

function calcPts(pred, res) {
  if (!validScore(res)) return null;
  if (!validScore(pred)) return 0;
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

function ShareCard({ cardRef, match, players, allPollas, results, baseUrl }) {
  const res = results?.groupScores?.[match.m];
  const hasRes = validScore(res);

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
      </div>

      {/* Match info */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22 }}>{TEAMS[match.h]?.flag}</div>
            <div style={{ color: "#e8ede8", fontSize: 13, fontWeight: "bold", marginTop: 4 }}>{match.h}</div>
          </div>
          <div style={{ color: "#8fa88f", fontSize: 13, fontWeight: "bold", padding: "0 8px" }}>vs</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 22 }}>{TEAMS[match.a]?.flag}</div>
            <div style={{ color: "#e8ede8", fontSize: 13, fontWeight: "bold", marginTop: 4 }}>{match.a}</div>
          </div>
        </div>
        <div style={{ color: "#8fa88f", fontSize: 11, marginTop: 8, letterSpacing: 1 }}>
          {hasRes ? `${match.date} · ` : ""}{match.time} (Lima)
        </div>
        {hasRes && (
          <div style={{ marginTop: 8, color: "#f0c040", fontSize: 18, fontWeight: "bold", letterSpacing: 2 }}>
            {res[0]} — {res[1]}
          </div>
        )}
        <img
          src={`${baseUrl}images/eb-logo-w.png`}
          alt="EB Consulting"
          style={{ height: 36, objectFit: "contain", display: "block", margin: "0px auto 0px" }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Predictions */}
      <div style={{ padding: "8px 0" }}>
        {players.filter((p) => !p.is_admin).map((p, i) => {
          const pred = allPollas[p.id]?.groupScores?.[match.m];
          const pts = calcPts(pred, res);
          const hasPred = validScore(pred);
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 20px",
              background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            }}>
              <div style={{ color: "#e8ede8", fontSize: 13 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: hasPred ? "#e8ede8" : "#4a5e4a", fontSize: 13, fontWeight: "bold", minWidth: 40, textAlign: "center" }}>
                  {hasPred ? `${pred[0]} - ${pred[1]}` : "—"}
                </div>
                {pts !== null && (
                  <div style={{
                    fontSize: 11, fontWeight: "bold", minWidth: 24, textAlign: "center",
                    color: pts === 3 ? "#4caf50" : pts === 1 ? "#f0c040" : "#4a5e4a",
                  }}>
                    {pts === 3 ? "+3" : pts === 1 ? "+1" : "0"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export function MatchShareButton({ match, players, allPollas, results, baseUrl }) {
  const cardRef = useRef(null);
  const [preview, setPreview] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `quiniela-${match.h}-vs-${match.a}.png`;
      a.click();
    } catch (e) {
      console.error("Error generando imagen:", e);
    }
  }

  return (
    <>
      {/* Hidden card for capture */}
      <div style={{ position: "fixed", left: -9999, top: -9999, zIndex: -1 }}>
        <ShareCard
          cardRef={cardRef}
          match={match}
          players={players}
          allPollas={allPollas}
          results={results}
          baseUrl={baseUrl}
        />
      </div>

      <button
        onClick={() => setPreview(true)}
        title="Ver y compartir pronósticos"
        className="cursor-pointer rounded-md border border-line bg-panel hover:bg-turf px-2 py-1 font-cond text-xs text-mist hover:text-chalk transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass inline-flex items-center gap-1"
      >
        <Share2 className="w-3 h-3" />
        Compartir
      </button>

      {/* Modal preview — portal para escapar de contenedores con opacity */}
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
              <span className="font-cond text-sm font-bold uppercase tracking-wider text-chalk">
                {match.h} vs {match.a}
              </span>
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
            <ShareCard
              match={match}
              players={players}
              allPollas={allPollas}
              results={results}
              baseUrl={baseUrl}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
