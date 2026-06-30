import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Download, Copy, Check, Trophy } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL;

const MATCHES = [
  { home: "ESP", away: "ARG", result: [2, 1] },
  { home: "FRA", away: "BRA", result: [0, 0] },
  { home: "ENG", away: "POR", result: [1, 3] },
];
const PLAYERS = [
  { name: "Jani",    preds: [[2,1],[0,0],[1,2]] },
  { name: "Renzo",   preds: [[1,0],[1,0],[1,3]] },
  { name: "Aladino", preds: [[0,2],[2,2],[0,1]] },
];

function calcPts(pred, res) {
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

function ShareCard({ cardRef }) {
  const players = PLAYERS.map((p) => {
    const pts = MATCHES.map((m, i) => calcPts(p.preds[i], m.result));
    return { ...p, pts, total: pts.reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.total - a.total);

  const ptsColor = (pts) =>
    pts === 3 ? "#4caf50" : pts === 1 ? "#f0c040" : "rgba(143,168,143,0.3)";
  const ptsLabel = (pts) => (pts === 3 ? "+3" : pts === 1 ? "+1" : "–");

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
        <div style={{ color: "#8fa88f", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>¿Cómo puntuar?</div>
      </div>

      {/* Scoring */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Puntuación</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {/* Grupos */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(76,175,80,0.2)" }}>
            <div style={{ color: "#4caf50", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: "bold" }}>Fase de Grupos</div>
            {[
              { icon: "🎯", label: "Marcador exacto", pts: 3, color: "#4caf50" },
              { icon: "✅", label: "Resultado correcto", pts: 1, color: "#e8ede8" },
              { icon: "❌", label: "Incorrecto", pts: 0, color: "rgba(143,168,143,0.5)" },
            ].map(({ icon, label, pts, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: "#8fa88f", fontSize: 10 }}>{icon} {label}</span>
                <span style={{ color, fontSize: 12, fontWeight: "bold" }}>{pts} pts</span>
              </div>
            ))}
          </div>
          {/* Eliminatorias */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(240,192,64,0.2)" }}>
            <div style={{ color: "#f0c040", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: "bold" }}>Eliminatorias</div>
            <div style={{ color: "#8fa88f", fontSize: 10, lineHeight: 1.5, marginBottom: 8 }}>
              Puntúa <span style={{ color: "#e8ede8", fontWeight: "bold" }}>cada período</span> por separado:
            </div>
            {[
              { label: "90'", color: "#4caf50" },
              { label: "AET", color: "#f5a623" },
              { label: "Penales", color: "#f0c040" },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color, fontSize: 10, fontWeight: "bold" }}>{label}</span>
                <span style={{ color: "#8fa88f", fontSize: 10 }}>3 / 1 / 0 pts</span>
              </div>
            ))}
            <div style={{ marginTop: 6, color: "#f0c040", fontSize: 10, fontWeight: "bold" }}>Máximo: 9 pts / partido</div>
          </div>
        </div>
      </div>

      {/* Example */}
      <div style={{ padding: "12px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Ejemplo — 3 partidos</div>

        {/* Match results row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
          {MATCHES.map((m) => (
            <div key={m.home} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "6px 4px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ color: "#8fa88f", fontSize: 9, marginBottom: 3 }}>{m.home} vs {m.away}</div>
              <div style={{ color: "#4caf50", fontSize: 14, fontWeight: "bold" }}>{m.result[0]}–{m.result[1]}</div>
            </div>
          ))}
        </div>

        {/* Players table */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Header row */}
          <div style={{ display: "flex", padding: "5px 10px", background: "rgba(255,255,255,0.04)" }}>
            <div style={{ flex: 1, color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1 }}>Jugador</div>
            {MATCHES.map((m) => (
              <div key={m.home} style={{ width: 56, textAlign: "center", color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1 }}>{m.home}–{m.away}</div>
            ))}
            <div style={{ width: 44, textAlign: "right", color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1 }}>Total</div>
          </div>
          {/* Players */}
          {players.map((p, i) => (
            <div key={p.name} style={{
              display: "flex", alignItems: "center",
              padding: "6px 10px",
              background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#8fa88f", fontSize: 9 }}>{i + 1}.</span>
                <span style={{ color: "#e8ede8", fontSize: 11, fontWeight: "bold" }}>{p.name}</span>
              </div>
              {p.pts.map((pts, j) => (
                <div key={j} style={{ width: 56, textAlign: "center" }}>
                  <div style={{ color: "rgba(143,168,143,0.5)", fontSize: 8 }}>{p.preds[j][0]}–{p.preds[j][1]}</div>
                  <div style={{ color: ptsColor(pts), fontSize: 11, fontWeight: "bold" }}>{ptsLabel(pts)}</div>
                </div>
              ))}
              <div style={{ width: 44, textAlign: "right" }}>
                <span style={{ color: "#f0c040", fontSize: 14, fontWeight: "bold" }}>{p.total}</span>
                <span style={{ color: "#8fa88f", fontSize: 8, marginLeft: 2 }}>pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 0 12px", textAlign: "center" }}>
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

function KoShareCard({ cardRef }) {
  const periods = [
    { label: "90'", color: "#4caf50", pred: [1, 1], result: [1, 1], pts: 3, detail: "Marcador exacto" },
    { label: "AET", color: "#f5a623", pred: [1, 1], result: [2, 2], pts: 1, detail: "Empate correcto, marcador no" },
    { label: "PEN", color: "#f0c040", pred: [5, 4], result: [5, 4], pts: 3, detail: "Tanda exacta" },
  ];
  const ptsColor = (pts) => pts === 3 ? "#4caf50" : pts === 1 ? "#f0c040" : "rgba(143,168,143,0.4)";

  return (
    <div
      ref={cardRef}
      style={{ width: 380, background: "#0d1f0f", borderRadius: 16, overflow: "hidden", fontFamily: "'Arial', sans-serif", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Header */}
      <div style={{ background: "#122614", padding: "14px 20px 12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 3 }}>
          <Trophy style={{ width: 16, height: 16, color: "#f0c040", strokeWidth: 2 }} />
          <div style={{ color: "#f0c040", fontSize: 12, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase" }}>La Quiniela Mundialista</div>
          <Trophy style={{ width: 16, height: 16, color: "#f0c040", strokeWidth: 2 }} />
        </div>
        <div style={{ color: "#8fa88f", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Eliminatorias — ¿Cómo puntuar?</div>
      </div>

      {/* Intro */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ color: "#8fa88f", fontSize: 10, lineHeight: 1.6 }}>
          En cada partido eliminatorio puntúa <span style={{ color: "#e8ede8", fontWeight: "bold" }}>cada período por separado</span>.
          Si el partido termina en 90', solo puntúa ese período. Si va a tiempo extra o penales, también puntúan.
        </div>
      </div>

      {/* Phase chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { label: "90'", color: "#4caf50", border: "rgba(76,175,80,0.3)" },
          { label: "AET", color: "#f5a623", border: "rgba(245,166,35,0.3)" },
          { label: "PEN", color: "#f0c040", border: "rgba(240,192,64,0.3)" },
        ].map(({ label, color, border }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ color, fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ color: "#4caf50", fontSize: 10 }}>3 pts · exacto</div>
            <div style={{ color: "#e8ede8", fontSize: 10 }}>1 pt · resultado</div>
            <div style={{ color: "rgba(143,168,143,0.5)", fontSize: 10 }}>0 pts · mal</div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(245,166,35,0.05)" }}>
        <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
        <div style={{ color: "#8fa88f", fontSize: 10, lineHeight: 1.6 }}>
          Los campos de <span style={{ color: "#f5a623", fontWeight: "bold" }}>AET</span> se habilitan solo si pronosticas empate en 90'.
          Los de <span style={{ color: "#f0c040", fontWeight: "bold" }}>PEN</span> se habilitan solo si pronosticas empate en AET.
        </div>
      </div>

      {/* Example */}
      <div style={{ padding: "12px 16px 14px" }}>
        <div style={{ color: "#8fa88f", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Ejemplo — FRA vs ESP · va a penales</div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 56px", gap: 4, marginBottom: 4 }}>
          <div style={{ color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1 }}>Período</div>
          <div style={{ color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Tu pronóstico</div>
          <div style={{ color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Resultado</div>
          <div style={{ color: "#8fa88f", fontSize: 8, textTransform: "uppercase", letterSpacing: 1, textAlign: "right" }}>Pts</div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {periods.map((p, i) => (
            <div key={p.label} style={{
              display: "grid", gridTemplateColumns: "48px 1fr 1fr 56px",
              gap: 4, alignItems: "center", padding: "8px 10px",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <div style={{ color: p.color, fontSize: 10, fontWeight: "bold", textTransform: "uppercase" }}>{p.label}</div>
              {/* Pronóstico */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {[p.pred[0], "–", p.pred[1]].map((v, j) => (
                  v === "–"
                    ? <span key={j} style={{ color: "rgba(143,168,143,0.5)", fontSize: 9 }}>–</span>
                    : <span key={j} style={{ width: 22, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1a10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#e8ede8", fontSize: 11, fontWeight: "bold" }}>{v}</span>
                ))}
              </div>
              {/* Resultado */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {[p.result[0], "–", p.result[1]].map((v, j) => (
                  v === "–"
                    ? <span key={j} style={{ color: "rgba(143,168,143,0.5)", fontSize: 9 }}>–</span>
                    : <span key={j} style={{ width: 22, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 4, color: "#4caf50", fontSize: 11, fontWeight: "bold" }}>{v}</span>
                ))}
              </div>
              {/* Pts */}
              <div style={{ textAlign: "right" }}>
                <span style={{ color: ptsColor(p.pts), fontSize: 13, fontWeight: "bold" }}>{p.pts === 0 ? "–" : `+${p.pts}`}</span>
                <div style={{ color: "rgba(143,168,143,0.6)", fontSize: 8, marginTop: 1 }}>{p.detail}</div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ color: "#e8ede8", fontSize: 11, fontWeight: "bold" }}>Total del partido</span>
            <div>
              <span style={{ color: "#4caf50", fontSize: 16, fontWeight: "bold" }}>7</span>
              <span style={{ color: "#8fa88f", fontSize: 9, marginLeft: 3 }}>pts</span>
              <span style={{ color: "#8fa88f", fontSize: 9, marginLeft: 6 }}>(máx. 9)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 0 12px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <img src={`${BASE_URL}images/eb-logo-w.png`} alt="EB Consulting" style={{ height: 26, objectFit: "contain", display: "block", margin: "0 auto" }} crossOrigin="anonymous" />
      </div>
    </div>
  );
}

function ShareButtonBase({ CardComponent, label, previewTitle, filename, shareText }) {
  const cardRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generatePng() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
  }
  async function dataUrlToBlob(dataUrl) { return (await fetch(dataUrl)).blob(); }

  async function handleOpen() {
    setPreview(true); setGenerating(true);
    try { setPreviewUrl(await generatePng()); } finally { setGenerating(false); }
  }
  function handleClose() { setPreview(false); setPreviewUrl(null); setCopied(false); }

  async function handleShare() {
    try {
      const blob = await dataUrlToBlob(previewUrl ?? await generatePng());
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "La Quiniela Mundialista 🏆", text: shareText });
    } catch (e) { if (e.name !== "AbortError") console.error(e); }
  }
  async function handleCopy() {
    try {
      const blob = await dataUrlToBlob(previewUrl ?? await generatePng());
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  }
  async function handleDownload() {
    try {
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const a = document.createElement("a"); a.href = dataUrl; a.download = filename; a.click();
    } catch (e) { console.error(e); }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <>
      <div style={{ position: "fixed", left: -9999, top: -9999, zIndex: -1 }}>
        <CardComponent cardRef={cardRef} />
      </div>
      <button onClick={handleOpen} className="cursor-pointer rounded-lg border border-grass/40 bg-grass/10 hover:bg-grass/20 px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-grass transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass inline-flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />{label}
      </button>
      {preview && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4" onClick={handleClose}>
          <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 bg-turf/95 backdrop-blur-sm px-4 py-2.5 border-b border-line">
              <span className="font-cond text-sm font-bold uppercase tracking-wider text-chalk">{previewTitle}</span>
              <button onClick={handleClose} className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf p-1.5 text-mist hover:text-chalk transition-colors duration-150 focus:outline-none"><X className="w-4 h-4" /></button>
            </div>
            {!generating && previewUrl && (
              <div className="flex items-center justify-center gap-2 bg-turf/80 backdrop-blur-sm px-4 py-2 border-b border-line">
                {canShare && <button onClick={handleShare} className="cursor-pointer rounded-lg border border-grass/50 bg-grass/10 hover:bg-grass/20 px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-grass transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"><Share2 className="w-3.5 h-3.5" />Compartir</button>}
                <button onClick={handleCopy} className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none">
                  {copied ? <Check className="w-3.5 h-3.5 text-grass" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copiado" : "Copiar"}
                </button>
                <button onClick={handleDownload} className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"><Download className="w-3.5 h-3.5" />Descargar</button>
              </div>
            )}
            <div className="overflow-y-auto" style={{ flex: 1 }}>
              {generating && <div className="flex items-center justify-center p-8 text-mist text-sm font-cond">Generando imagen...</div>}
              {!generating && previewUrl && <img src={previewUrl} alt={previewTitle} style={{ display: "block", width: "100%", maxWidth: 380 }} />}
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}

export function RulesShareButton() {
  return <ShareButtonBase CardComponent={ShareCard} label="Compartir reglas" previewTitle="¿Cómo puntuar?" filename="como-jugar-quiniela-mundialista.png" shareText="¿Cómo puntuar en la quiniela? 👀" />;
}

export function KoRulesShareButton() {
  return <ShareButtonBase CardComponent={KoShareCard} label="Compartir" previewTitle="Eliminatorias — Cómo puntuar" filename="eliminatorias-quiniela-mundialista.png" shareText="¿Cómo puntúan las eliminatorias? 👀" />;
}
