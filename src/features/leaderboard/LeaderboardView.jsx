import { useMemo, useState } from "react";
import { TEAMS } from "../../core/data/teams";
import { Flag } from "../../core/ui/atoms";
import { scorePlayer, resultsProgress, KO_POINTS } from "../../lib/scoring";
import { buildContext, koWinner } from "../../lib/polla";

const MEDALS = ["🥇", "🥈", "🥉"];

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
  const [prev] = useState({}); // snapshot anterior para deltas (solo visual)

  const ranking = useMemo(() => {
    return players
      .map((p) => {
        const polla = allPollas[p.id] ?? { groupScores: {}, koPicks: {} };
        return {
          ...p,
          ...scorePlayer(polla, resultsCtx, results),
          champion: koWinner(104, buildContext(polla.groupScores, polla.koPicks)),
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total || b.exact - a.exact || b.koPts - a.koPts || a.name.localeCompare(b.name)
      );
  }, [players, allPollas, resultsCtx, results]);

  const { groupsPlayed, koDecided } = resultsProgress(resultsCtx, results);
  const leader = ranking[0];
  const hasResults = groupsPlayed > 0 || koDecided > 0;

  const fmtTime = (d) => {
    if (!d) return null;
    return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div>
      {/* Estado real-time */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
          <span className="text-5xl trophy-shine" role="img" aria-label="Líder">👑</span>
          <div>
            <p className="font-cond text-xs uppercase tracking-[0.25em] text-gold/80">Va ganando</p>
            <p className="font-display text-2xl text-gold">{leader.name}</p>
          </div>
          <div className="flex flex-wrap gap-4 ml-auto">
            <div className="text-right">
              <p className="font-display text-3xl text-chalk tabular-nums">{leader.total}</p>
              <p className="font-cond text-xs uppercase tracking-widest text-mist">puntos</p>
            </div>
            {leader.total > 0 && ranking[1] && (
              <div className="text-right border-l border-line pl-4">
                <p className="font-display text-lg text-mist tabular-nums">
                  +{leader.total - ranking[1].total}
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
            Aún no hay resultados oficiales. Cuando el admin ingrese los marcadores reales en{" "}
            <strong>Resultados</strong>, la tabla se actualizará en tiempo real para todos.
          </p>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-line bg-panel shadow-md">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line bg-turf/80 font-cond uppercase tracking-wider text-xs text-mist">
              <th className="py-3 pl-4 text-left font-semibold w-10">Pos</th>
              <th className="py-3 text-left font-semibold">Jugador</th>
              <th className="py-3 text-center font-semibold" title="Marcadores exactos · 3 pts c/u">
                Exactos
              </th>
              <th className="py-3 text-center font-semibold" title="Resultado 1X2 acertado · 1 pt">
                Acertados
              </th>

              <th className="py-3 text-center font-semibold">Campeón</th>
              <th className="py-3 pr-4 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-line/60 last:border-b-0 tabular-nums transition-all duration-300 ${
                  i === 0 && p.total > 0 ? "bg-gold/8" : ""
                } ${p.id === activeId ? "ring-1 ring-inset ring-grass/30" : ""}`}
              >
                <td className="py-3 pl-4">
                  {i < 3 && hasResults && p.total > 0 ? (
                    <span className="text-lg" role="img" aria-label={`Puesto ${i + 1}`}>{MEDALS[i]}</span>
                  ) : (
                    <span className="font-cond font-bold text-mist">{i + 1}</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-cond font-semibold text-base text-chalk">{p.name}</span>
                    {p.id === activeId && (
                      <span className="rounded-full border border-grass/40 px-1.5 py-px font-cond text-[10px] uppercase tracking-wider text-grass">
                        tú
                      </span>
                    )}
                    {p.is_admin && (
                      <span className="rounded-full border border-amber/40 px-1.5 py-px font-cond text-[10px] uppercase tracking-wider text-amber">
                        admin
                      </span>
                    )}
                  </div>
                  {p.email && (
                    <div className="font-cond text-xs text-mist/70 mt-0.5">{p.email}</div>
                  )}
                </td>
                <td className="py-3 text-center">
                  <span className="font-semibold text-grass">{p.exact}</span>
                  <span className="ml-0.5 font-cond text-[11px] text-mist">×3</span>
                </td>
                <td className="py-3 text-center text-chalk">{p.outcome}</td>

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
                <td className="py-3 pr-4 text-right">
                  <span className="font-display text-xl text-gold">{p.total}</span>
                  <Delta prev={prev[p.id]} curr={p.total} />
                </td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center font-cond text-mist">
                  Aún no hay jugadores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pie con regla de puntaje */}
      <div className="mt-4 flex flex-wrap items-start gap-x-5 gap-y-2 font-cond text-xs uppercase tracking-wider text-mist">
        <div>
          Partidos jugados: {groupsPlayed}/72 grupos · {koDecided}/32 llaves
        </div>
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
      </div>
    </div>
  );
}
