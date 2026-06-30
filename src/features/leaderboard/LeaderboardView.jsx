import { useMemo, useState } from "react";
import { Trophy, Award, Crown } from "lucide-react";
import { TEAMS } from "../../core/data/teams";
import { Flag } from "../../core/ui/atoms";
import { scorePlayer, scoreR32Player, resultsProgress, KO_POINTS } from "../../lib/scoring";
import { buildContext, koWinner, pendingMatchesProgress } from "../../lib/polla";
import { LeaderboardShareButton } from "./LeaderboardShareCard";
import { ScoreEvolutionChart } from "./ScoreEvolutionChart";
import { PlayerProfileModal } from "./PlayerProfileModal";

const MEDALS = [
  <Trophy className="w-5 h-5 text-gold" />,
  <Award className="w-5 h-5 text-mist" />,
  <Award className="w-5 h-5 text-amber" />,
];

function Delta({ prev, curr }) {
  if (prev === undefined || prev === curr) return null;
  const d = curr - prev;
  return (
    <span className={`ml-1 font-cond text-xs tabular-nums ${d > 0 ? "text-grass" : "text-card"}`}>
      {d > 0 ? `+${d}` : d}
    </span>
  );
}

export default function LeaderboardView({
  players,
  allPollas,
  resultsCtx,
  results,
  activeId,
  connected,
  lastUpdated,
}) {
  const [prev] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [phase, setPhase] = useState("r32"); // "grupos" | "r32"

  const today = new Date().toISOString().slice(0, 10);

  const ranking = useMemo(() => {
    return players
      .map((p) => {
        const polla = allPollas[p.id] ?? { groupScores: {}, koPicks: {} };
        const { predicted, total: pendingTotal } = pendingMatchesProgress(polla.groupScores, today);
        return {
          ...p,
          ...scorePlayer(polla, resultsCtx, results),
          champion: koWinner(104, buildContext(polla.groupScores, polla.koPicks)),
          pendingPredicted: predicted,
          pendingTotal,
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total || b.exact - a.exact || b.koPts - a.koPts || a.name.localeCompare(b.name)
      );
  }, [players, allPollas, resultsCtx, results]);

  const r32Ranking = useMemo(() => {
    return players
      .map((p) => {
        const polla = allPollas[p.id] ?? { groupScores: {}, koPicks: {}, koPickScores: {} };
        return { ...p, ...scoreR32Player(polla, results.koScores ?? {}) };
      })
      .sort((a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name));
  }, [players, allPollas, results]);

  const { groupsPlayed, koDecided } = resultsProgress(resultsCtx, results);
  const activeRanking = phase === "r32" ? r32Ranking : ranking;
  const leader = activeRanking[0];
  const hasResults = phase === "r32"
    ? Object.keys(results.koScores ?? {}).length > 0
    : groupsPlayed > 0 || koDecided > 0;

  const fmtTime = (d) => {
    if (!d) return null;
    return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div>
      {/* Toggle Grupos / R32 */}
      <div className="mb-5 flex gap-1 rounded-lg border border-line bg-turf/40 p-1 w-fit">
        {[{ id: "grupos", label: "Grupos" }, { id: "r32", label: "Dieciseisavos" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setPhase(t.id)}
            className={`cursor-pointer rounded-md px-4 py-1.5 font-cond font-bold text-sm uppercase tracking-wider transition-colors duration-150 focus:outline-none ${
              phase === t.id ? "bg-gold text-night" : "text-mist hover:text-chalk"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Estado real-time */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LeaderboardShareButton ranking={ranking} />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-cond text-xs font-semibold uppercase tracking-wider ${
            connected
              ? "border-grass/40 text-grass"
              : "border-amber/40 text-amber"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-grass animate-pulse" : "bg-amber"}`}
          />
          {connected ? "En vivo" : "Reconectando…"}
        </span>
        {lastUpdated && (
          <span className="font-cond text-xs text-mist">
            Actualizado: {fmtTime(lastUpdated)}
          </span>
        )}
        <span className="font-cond text-xs text-mist">
          {players.length} jugador{players.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Líder */}
      {hasResults && leader && leader.total > 0 && (
        <div className="rise mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gold/40 bg-panel px-5 py-4 shadow-md">
          <Crown className="w-10 h-10 text-gold trophy-shine" />
          <div>
            <p className="font-cond text-xs uppercase tracking-[0.25em] text-gold/80">Va ganando</p>
            <p className="font-display text-2xl text-gold">{leader.name}</p>
          </div>
          <div className="flex flex-wrap gap-4 ml-auto">
            <div className="text-right">
              <p className="font-display text-3xl text-chalk tabular-nums">{leader.total}</p>
              <p className="font-cond text-xs uppercase tracking-widest text-mist">puntos</p>
            </div>
            {leader.total > 0 && activeRanking[1] && (
              <div className="text-right border-l border-line pl-4">
                <p className="font-display text-lg text-mist tabular-nums">
                  +{leader.total - activeRanking[1].total}
                </p>
                <p className="font-cond text-xs uppercase tracking-widest text-mist">sobre 2°</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasResults && (
        <div className="mb-6 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3">
          <p className="font-cond text-sm text-chalk">
            {phase === "r32"
              ? "Aún no hay resultados de Dieciseisavos. El admin debe ingresar los marcadores en Resultados → Dieciseisavos."
              : <>Aún no hay resultados oficiales. Cuando el admin ingrese los marcadores reales en{" "}<strong>Resultados</strong>, la tabla se actualizará en tiempo real para todos.</>
            }
          </p>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-line bg-panel shadow-md">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-line bg-turf/80 font-cond uppercase tracking-wider text-xs text-mist">
              <th className="py-3 pl-4 text-left font-semibold w-10">Pos</th>
              <th className="py-3 text-left font-semibold">Jugador</th>
              <th className="py-3 text-center font-semibold" title="Marcadores exactos · 3 pts">Exactos</th>
              <th className="py-3 text-center font-semibold" title="Resultado acertado · 1 pt">Acertados</th>
              {phase === "grupos" && (
                <>
                  <th className="py-3 text-center font-semibold" title="Partidos pendientes pronosticados">Pronóst.</th>
                  <th className="py-3 text-center font-semibold">Campeón</th>
                </>
              )}
              <th className="py-3 pr-4 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {activeRanking.map((p, i) => (
              <tr
                key={p.id}
                className={`row-enter border-b border-line/60 last:border-b-0 tabular-nums transition-all duration-300 ${
                  i === 0 && p.total > 0 ? "bg-gold/8" : ""
                } ${p.id === activeId ? "ring-1 ring-inset ring-grass/30" : ""}`}
                style={{ "--row-delay": `${Math.min(i * 50, 300)}ms` }}
              >
                <td className="py-3 pl-4">
                  {i < 3 && hasResults && p.total > 0 ? (
                    MEDALS[i]
                  ) : (
                    <span className="font-cond font-bold text-mist">{i + 1}</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPlayer({ player: p, rank: i + 1 })}
                      className="font-cond font-semibold text-base text-chalk transition-colors duration-150 focus:outline-none focus-visible:underline text-left cursor-pointer hover:text-gold"
                    >
                      {p.name}
                    </button>
                    {p.id === activeId && (
                      <span className="rounded-full border border-grass/40 px-1.5 py-px font-cond text-[10px] uppercase tracking-wider text-grass">tú</span>
                    )}
                    {p.is_admin && (
                      <span className="rounded-full border border-amber/40 px-1.5 py-px font-cond text-[10px] uppercase tracking-wider text-amber">admin</span>
                    )}
                  </div>
                  {p.email && <div className="font-cond text-xs text-mist/70 mt-0.5">{p.email}</div>}
                </td>
                <td className="py-3 text-center">
                  <span className="font-semibold text-grass">{p.exact}</span>
                  <span className="ml-0.5 font-cond text-[11px] text-mist">×3</span>
                </td>
                <td className="py-3 text-center text-chalk">{p.outcome}</td>
                {phase === "grupos" && (
                  <>
                    <td className="py-3 text-center tabular-nums">
                      <span className={p.pendingPredicted === p.pendingTotal ? "text-grass font-semibold" : "text-mist"}>
                        {p.pendingPredicted}
                      </span>
                      <span className="text-mist/50">/{p.pendingTotal}</span>
                    </td>
                    <td className="py-3 text-center">
                      {p.champion ? (
                        <span className="inline-flex items-center gap-1.5" title={TEAMS[p.champion]?.name}>
                          <Flag code={p.champion} className="text-xl" />
                          <span className="font-cond text-xs text-mist">{p.champion}</span>
                        </span>
                      ) : (
                        <span className="font-cond text-xs italic text-mist/50">—</span>
                      )}
                    </td>
                  </>
                )}
                <td className="py-3 pr-4 text-right">
                  <span className="font-display text-xl text-gold">{p.total}</span>
                  {phase === "grupos" && <Delta prev={prev[p.id]} curr={p.total} />}
                </td>
              </tr>
            ))}
            {activeRanking.length === 0 && (
              <tr>
                <td colSpan={phase === "grupos" ? 7 : 5} className="py-10 text-center font-cond text-mist">
                  Aún no hay jugadores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Evolución de puntos */}
      <ScoreEvolutionChart players={players} allPollas={allPollas} results={results} />

      {/* Perfil de jugador */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer.player}
          rank={selectedPlayer.rank}
          allPollas={allPollas}
          results={results}
          resultsCtx={resultsCtx}
          phase={phase}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Pie con regla de puntaje */}
      <div className="mt-4 flex flex-wrap items-start gap-x-5 gap-y-2 font-cond text-xs uppercase tracking-wider text-mist">
        {phase === "grupos" ? (
          <>
            <div>Partidos jugados: {groupsPlayed}/72 grupos · {koDecided}/32 llaves</div>
            <div className="hidden sm:block chalk-rule flex-1 self-center" />
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              <span>Exacto <strong className="text-chalk">3 pts</strong></span>
              <span>1X2 <strong className="text-chalk">1 pt</strong></span>
              <span>16avos <strong className="text-chalk">{KO_POINTS.R32}</strong></span>
              <span>8vos <strong className="text-chalk">{KO_POINTS.R16}</strong></span>
              <span>4tos <strong className="text-chalk">{KO_POINTS.QF}</strong></span>
              <span>Semis <strong className="text-chalk">{KO_POINTS.SF}</strong></span>
              <span>3° <strong className="text-chalk">{KO_POINTS["3P"]}</strong></span>
              <span>Final <strong className="text-chalk">{KO_POINTS.F}</strong></span>
            </div>
          </>
        ) : (
          <>
            <div>Dieciseisavos: {Object.keys(results.koScores ?? {}).length}/16 resultados</div>
            <div className="hidden sm:block chalk-rule flex-1 self-center" />
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              <span>Exacto (ganador + marcador) <strong className="text-chalk">3 pts</strong></span>
              <span>Ganador correcto <strong className="text-chalk">1 pt</strong></span>
              <span>Penales <strong className="text-chalk">solo ganador</strong></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
