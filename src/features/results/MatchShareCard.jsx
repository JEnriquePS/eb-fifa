import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Download, Copy, Check } from "lucide-react";
import { TEAMS } from "../../core/data/teams";
import { validScore } from "../../lib/polla";
import { scoreKoMatch } from "../../lib/scoring";

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
        width: 360,
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
            <div style={{ width: 40, height: 27, overflow: "hidden", borderRadius: 3, display: "inline-block" }}>
              <img
                src={`${baseUrl}images/flags/${TEAMS[match.h]?.iso2}.png`}
                alt={match.h}
                style={{ width: 40, height: 27, objectFit: "cover", display: "block" }}
                crossOrigin="anonymous"
              />
            </div>
            <div style={{ color: "#e8ede8", fontSize: 13, fontWeight: "bold", marginTop: 4 }}>{match.h}</div>
          </div>
          <div style={{ color: "#8fa88f", fontSize: 13, fontWeight: "bold", padding: "0 8px" }}>vs</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ width: 40, height: 27, overflow: "hidden", borderRadius: 3, display: "inline-block" }}>
              <img
                src={`${baseUrl}images/flags/${TEAMS[match.a]?.iso2}.png`}
                alt={match.a}
                style={{ width: 40, height: 27, objectFit: "cover", display: "block" }}
                crossOrigin="anonymous"
              />
            </div>
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const filename = `quiniela-${match.h}-vs-${match.a}.png`;

  async function generatePng() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
  }

  async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function handleOpen() {
    setPreview(true);
    setGenerating(true);
    try {
      const url = await generatePng();
      setPreviewUrl(url);
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
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "La Quiniela Mundialista 🏆",
          text: `Pronósticos del grupo para ${match.h} vs ${match.a} 👀`,
        });
      }
    } catch (e) {
      if (e.name !== "AbortError") console.error("Error compartiendo:", e);
    }
  }

  async function handleCopy() {
    try {
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const blob = await dataUrlToBlob(dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Error copiando imagen:", e);
    }
  }

  async function handleDownload() {
    try {
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch (e) {
      console.error("Error descargando imagen:", e);
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

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
        onClick={handleOpen}
        title="Ver y compartir pronósticos"
        className="cursor-pointer rounded-md border border-line bg-panel hover:bg-turf px-2 py-1 font-cond text-xs text-mist hover:text-chalk transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass inline-flex items-center gap-1"
      >
        <Share2 className="w-3 h-3" />
        Compartir
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
            {/* Header */}
            <div className="flex items-center justify-between gap-2 bg-turf/95 backdrop-blur-sm px-4 py-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                {!generating && previewUrl && canShare && (
                  <button
                    onClick={handleShare}
                    className="cursor-pointer rounded-lg border border-grass/50 bg-grass/10 hover:bg-grass/20 px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-grass transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir
                  </button>
                )}
                {!generating && previewUrl && (
                  <button
                    onClick={handleCopy}
                    className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-grass" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                )}
                {!generating && previewUrl && (
                  <button
                    onClick={handleDownload}
                    className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf p-1.5 text-mist hover:text-chalk transition-colors duration-150 focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

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
                  alt="Preview de la imagen a compartir"
                  style={{ display: "block", width: "100%", maxWidth: 360 }}
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

// ── KO Share (R32) ────────────────────────────────────────────────────────────

function KoShareCard({ cardRef, matchId, home, away, players, allPollas, koScores, baseUrl }) {
  const res = koScores?.[matchId];
  const hasRes = !!res?.winner;
  const homeTeam = TEAMS[home] ?? { name: home, iso2: home };
  const awayTeam = TEAMS[away] ?? { name: away, iso2: away };

  const nonAdminPlayers = players.filter((p) => !p.is_admin);

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
      <div style={{ background: "#122614", padding: "14px 24px 12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ color: "#f0c040", fontSize: 11, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase" }}>La Quiniela Mundialista · Dieciseisavos</div>
      </div>

      {/* Match info */}
      <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          {/* Home */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 27, overflow: "hidden", borderRadius: 3 }}>
              <img src={`${baseUrl}images/flags/${homeTeam.iso2}.png`} alt={home} style={{ width: 40, height: 27, objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
            </div>
            <div style={{ color: hasRes && res.winner === home ? "#f0c040" : "#e8ede8", fontSize: 12, fontWeight: "bold" }}>{homeTeam.name}</div>
          </div>

          {/* Score */}
          <div style={{ textAlign: "center", minWidth: 90 }}>
            {hasRes ? (
              <div>
                {res.rtHome != null && (
                  <div style={{ color: "#4caf50", fontSize: 18, fontWeight: "bold", letterSpacing: 2 }}>{res.rtHome}–{res.rtAway}</div>
                )}
                {res.etHome != null && (
                  <div style={{ color: "#ffa726", fontSize: 12, fontWeight: "bold", marginTop: 2 }}>AET {res.etHome}–{res.etAway}</div>
                )}
                {res.penHome != null && (
                  <div style={{ color: "#f0c040", fontSize: 12, fontWeight: "bold", marginTop: 1 }}>PEN {res.penHome}–{res.penAway}</div>
                )}
              </div>
            ) : (
              <div style={{ color: "#4a5e4a", fontSize: 14, fontWeight: "bold" }}>vs</div>
            )}
          </div>

          {/* Away */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 27, overflow: "hidden", borderRadius: 3 }}>
              <img src={`${baseUrl}images/flags/${awayTeam.iso2}.png`} alt={away} style={{ width: 40, height: 27, objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
            </div>
            <div style={{ color: hasRes && res.winner === away ? "#f0c040" : "#e8ede8", fontSize: 12, fontWeight: "bold" }}>{awayTeam.name}</div>
          </div>
        </div>

        <img
          src={`${baseUrl}images/eb-logo-w.png`}
          alt="EB Consulting"
          style={{ height: 30, objectFit: "contain", display: "block", margin: "8px auto 0" }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Player predictions */}
      <div style={{ padding: "6px 0" }}>
        {/* Column headers */}
        <div style={{
          display: "flex", alignItems: "center", padding: "2px 16px 6px", gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 2,
        }}>
          <div style={{ flex: "0 0 80px" }} />
          <div style={{ flex: "0 0 56px", fontSize: 9, color: "#8fa88f", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>Ganador</div>
          <div style={{ flex: 1, display: "flex" }}>
            <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#7ab87a", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>RT</div>
            <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#cc8844", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>AET</div>
            <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#c0a030", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>PEN</div>
          </div>
          <div style={{ flex: "0 0 24px", fontSize: 9, color: "#8fa88f", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" }}>Pts</div>
        </div>

        {nonAdminPlayers.map((p, i) => {
          const polla = allPollas[p.id] ?? {};
          const winnerPick = polla.koPicks?.[matchId];
          const pred = polla.koPickScores?.[matchId] ?? {};
          const pts = hasRes && res.rtHome != null ? scoreKoMatch(pred, res) : null;
          const winnerTeam = winnerPick ? TEAMS[winnerPick] : null;
          const hasPred = pred.rtHome != null;

          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "7px 16px",
                background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                gap: 8,
              }}
            >
              {/* Name */}
              <div style={{ color: "#e8ede8", fontSize: 12, flex: "0 0 80px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</div>

              {/* Winner pick */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "0 0 56px" }}>
                {winnerPick ? (
                  <>
                    <div style={{ width: 20, height: 14, overflow: "hidden", borderRadius: 2, flexShrink: 0 }}>
                      <img src={`${baseUrl}images/flags/${winnerTeam?.iso2}.png`} alt={winnerPick} style={{ width: 20, height: 14, objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                    </div>
                    <span style={{ fontSize: 11, color: hasRes ? (res.winner === winnerPick ? "#4caf50" : "#5a6e5a") : "#e8ede8", fontWeight: "bold" }}>{winnerPick}</span>
                  </>
                ) : (
                  <span style={{ color: "#4a5e4a", fontSize: 11 }}>—</span>
                )}
              </div>

              {/* Phase scores */}
              <div style={{ flex: 1, display: "flex" }}>
                <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#9ec69e" }}>
                  {hasPred ? `${pred.rtHome}–${pred.rtAway}` : <span style={{ color: "#3a4e3a" }}>—</span>}
                </div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#ffa726" }}>
                  {pred.etHome != null ? `${pred.etHome}–${pred.etAway}` : ""}
                </div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#f0c040" }}>
                  {pred.penHome != null ? `${pred.penHome}–${pred.penAway}` : ""}
                </div>
              </div>

              {/* Points */}
              <div style={{ flex: "0 0 24px", textAlign: "right", fontSize: 12, fontWeight: "bold",
                color: pts === null ? "#3a4e3a" : pts >= 7 ? "#4caf50" : pts >= 4 ? "#f0c040" : pts > 0 ? "#ffa726" : "#4a5e4a" }}>
                {pts === null ? "—" : pts > 0 ? `+${pts}` : "0"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KoMatchShareButton({ matchId, home, away, players, allPollas, koScores, baseUrl }) {
  const cardRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const filename = `quiniela-r32-${home ?? matchId}-vs-${away ?? "?"}.png`;

  if (!home || !away) return null;

  async function generatePng() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
  }

  async function dataUrlToBlob(dataUrl) {
    const r = await fetch(dataUrl);
    return r.blob();
  }

  async function handleOpen() {
    setPreview(true);
    setGenerating(true);
    try {
      const url = await generatePng();
      setPreviewUrl(url);
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
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "La Quiniela Mundialista 🏆", text: `Pronósticos R32: ${home} vs ${away}` });
      }
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }
  }

  async function handleCopy() {
    try {
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const blob = await dataUrlToBlob(dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDownload() {
    try {
      const dataUrl = previewUrl ?? await generatePng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch (e) {
      console.error(e);
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <>
      <div style={{ position: "fixed", left: -9999, top: -9999, zIndex: -1 }}>
        <KoShareCard
          cardRef={cardRef}
          matchId={matchId}
          home={home}
          away={away}
          players={players}
          allPollas={allPollas}
          koScores={koScores}
          baseUrl={baseUrl}
        />
      </div>

      <button
        onClick={handleOpen}
        title="Ver y compartir pronósticos"
        className="cursor-pointer rounded-md border border-line bg-panel hover:bg-turf px-2 py-1 font-cond text-xs text-mist hover:text-chalk transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass inline-flex items-center gap-1"
      >
        <Share2 className="w-3 h-3" />
        Compartir
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
            <div className="flex items-center gap-2 bg-turf/95 backdrop-blur-sm px-4 py-2.5 border-b border-line">
              {!generating && previewUrl && canShare && (
                <button onClick={handleShare} className="cursor-pointer rounded-lg border border-grass/50 bg-grass/10 hover:bg-grass/20 px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-grass transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none">
                  <Share2 className="w-3.5 h-3.5" />Compartir
                </button>
              )}
              {!generating && previewUrl && (
                <button onClick={handleCopy} className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none">
                  {copied ? <Check className="w-3.5 h-3.5 text-grass" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              )}
              {!generating && previewUrl && (
                <button onClick={handleDownload} className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf px-3 py-1.5 font-cond text-xs font-semibold uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none">
                  <Download className="w-3.5 h-3.5" />Descargar
                </button>
              )}
              <button onClick={handleClose} className="cursor-pointer rounded-lg border border-line bg-panel hover:bg-turf p-1.5 text-mist hover:text-chalk transition-colors duration-150 focus:outline-none">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ flex: 1 }}>
              {generating && <div className="flex items-center justify-center p-8 text-mist text-sm font-cond">Generando imagen...</div>}
              {!generating && previewUrl && <img src={previewUrl} alt="Preview de la imagen a compartir" style={{ display: "block", width: "100%", maxWidth: 380 }} />}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
