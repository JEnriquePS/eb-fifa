import { createPortal } from "react-dom";
import { X, Target, Check, Minus, AlertCircle, Flame, TrendingUp } from "lucide-react";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { validScore } from "../../lib/polla";
import { Flag } from "../../core/ui/atoms";

function matchPts(pred, res) {
  if (!validScore(res)) return null;        // no jugado
  if (!validScore(pred)) return "nopred";   // jugado sin pronóstico
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

function buildStats(playerId, allPollas, results) {
  const groupScores = results.groupScores ?? {};
  const predictions = allPollas[playerId]?.groupScores ?? {};

  const played = GROUP_MATCHES.filter((m) => validScore(groupScores[m.m]));

  let exact = 0, acertado = 0, fallado = 0, sinPred = 0;
  const rows = [];

  played.forEach((m) => {
    const res = groupScores[m.m];
    const pred = predictions[m.m];
    const pts = matchPts(pred, res);
    if (pts === 3) exact++;
    else if (pts === 1) acertado++;
    else if (pts === 0) fallado++;
    else if (pts === "nopred") sinPred++;
    rows.push({ match: m, pred, res, pts });
  });

  // Racha activa (desde el partido más reciente hacia atrás con pts > 0)
  let currentStreak = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const { pts } = rows[i];
    if (pts === 3 || pts === 1) currentStreak++;
    else break;
  }

  // Mejor racha histórica
  let bestStreak = 0, tmp = 0;
  rows.forEach(({ pts }) => {
    if (pts === 3 || pts === 1) { tmp++; bestStreak = Math.max(bestStreak, tmp); }
    else tmp = 0;
  });

  const withPred = exact + acertado + fallado;
  const pctAcierto = withPred > 0 ? Math.round(((exact + acertado) / withPred) * 100) : null;
  const avgPts = withPred > 0 ? ((exact * 3 + acertado) / withPred).toFixed(1) : null;

  return { exact, acertado, fallado, sinPred, currentStreak, bestStreak, pctAcierto, avgPts, rows, played: played.length };
}

const PTS_STYLE = {
  3:        { label: "+3", bg: "rgba(76,175,80,0.15)", color: "#4caf50", icon: <Check className="w-3 h-3" /> },
  1:        { label: "+1", bg: "rgba(240,192,64,0.15)", color: "#f0c040", icon: <Check className="w-3 h-3" /> },
  0:        { label: "0",  bg: "rgba(229,115,115,0.12)", color: "#e57373", icon: <Minus className="w-3 h-3" /> },
  nopred:   { label: "—",  bg: "rgba(255,255,255,0.04)", color: "#4a5e4a", icon: <AlertCircle className="w-3 h-3" /> },
};

function StatBox({ label, value, sub, color = "#e8ede8" }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-line bg-night px-3 py-2.5 min-w-0">
      <span className="font-display text-2xl tabular-nums" style={{ color }}>{value}</span>
      <span className="font-cond text-[10px] uppercase tracking-wider text-mist text-center leading-tight">{label}</span>
      {sub && <span className="font-cond text-[9px] text-mist/50 mt-0.5">{sub}</span>}
    </div>
  );
}

export function PlayerProfileModal({ player, rank, allPollas, results, onClose }) {
  if (!player) return null;

  const stats = buildStats(player.id, allPollas, results);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-turf/80 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-cond text-2xl font-bold text-mist shrink-0">#{rank}</span>
            <div className="min-w-0">
              <p className="font-display text-xl text-chalk truncate">{player.name}</p>
              {player.email && <p className="font-cond text-xs text-mist/60 truncate">{player.email}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer shrink-0 rounded-lg border border-line bg-panel hover:bg-turf p-1.5 text-mist hover:text-chalk transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {stats.played === 0 ? (
            <p className="text-center font-cond text-sm text-mist py-6">
              Aún no hay partidos jugados.
            </p>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-5 gap-2">
                <StatBox label="Exactos" value={stats.exact} sub="×3 pts" color="#4caf50" />
                <StatBox label="Acertados" value={stats.acertado} sub="×1 pt" color="#f0c040" />
                <StatBox label="Fallados" value={stats.fallado} color="#e57373" />
                <StatBox label="S/Pron." value={stats.sinPred} color="#4a5e4a" />
                <StatBox
                  label="% Acierto"
                  value={stats.pctAcierto !== null ? `${stats.pctAcierto}%` : "—"}
                  sub={stats.avgPts ? `${stats.avgPts} pts/p` : undefined}
                  color="#64b5f6"
                />
              </div>

              {/* Racha */}
              {(stats.currentStreak > 0 || stats.bestStreak > 0) && (
                <div className="flex gap-3">
                  {stats.currentStreak > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 flex-1">
                      <Flame className="w-4 h-4 text-amber shrink-0" />
                      <div>
                        <p className="font-display text-lg text-amber tabular-nums">{stats.currentStreak}</p>
                        <p className="font-cond text-[10px] uppercase tracking-wider text-mist">Racha activa</p>
                      </div>
                    </div>
                  )}
                  {stats.bestStreak > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-night px-3 py-2 flex-1">
                      <TrendingUp className="w-4 h-4 text-mist shrink-0" />
                      <div>
                        <p className="font-display text-lg text-chalk tabular-nums">{stats.bestStreak}</p>
                        <p className="font-cond text-[10px] uppercase tracking-wider text-mist">Mejor racha</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Match list */}
              <div>
                <p className="font-cond text-[10px] uppercase tracking-widest text-mist mb-2">
                  Partidos jugados ({stats.played})
                </p>
                <div className="rounded-xl border border-line overflow-hidden">
                  {[...stats.rows].reverse().map(({ match, pred, res, pts }, i) => {
                    const style = PTS_STYLE[pts ?? "nopred"] ?? PTS_STYLE["nopred"];
                    return (
                      <div
                        key={match.m}
                        className="flex items-center gap-3 px-3 py-2 border-b border-line/60 last:border-b-0"
                        style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}
                      >
                        {/* Partido */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Flag code={match.h} size={14} />
                          <span className="font-cond text-xs text-mist shrink-0">{match.h}</span>
                          <span className="font-cond text-[10px] text-mist/40">vs</span>
                          <span className="font-cond text-xs text-mist shrink-0">{match.a}</span>
                          <Flag code={match.a} size={14} />
                        </div>

                        {/* Resultado + pronóstico */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-0.5">
                            <div className="w-7 h-7 flex items-center justify-center rounded border border-grass/50 bg-turf">
                              <span className="font-display text-sm font-bold text-grass tabular-nums leading-none">{res[0]}</span>
                            </div>
                            <span className="font-cond text-[8px] uppercase tracking-widest text-grass border border-grass/40 rounded px-0.5 py-px">FT</span>
                            <div className="w-7 h-7 flex items-center justify-center rounded border border-grass/50 bg-turf">
                              <span className="font-display text-sm font-bold text-grass tabular-nums leading-none">{res[1]}</span>
                            </div>
                          </div>
                          {validScore(pred) && (() => {
                            const exact = pred[0] === res[0] && pred[1] === res[1];
                            const outcome = Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]);
                            const dotColor = exact ? "bg-grass" : outcome ? "bg-gold" : "bg-red-400/80";
                            return (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-cond text-xs font-semibold tabular-nums text-chalk">{pred[0]}–{pred[1]}</span>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                </div>
                                <span className="font-cond text-[9px] text-mist/40 uppercase tracking-wider">Mi marc.</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Badge pts */}
                        <div
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 font-cond text-[11px] font-bold shrink-0 w-12 justify-center"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {style.icon}
                          {style.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
