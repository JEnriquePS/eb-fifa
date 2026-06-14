import { useMemo, useRef, useEffect, useState, Fragment } from "react";
import { GROUPS, TEAMS } from "../../core/data/teams";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { Flag, ScoreInput, TimeChip, formatDate, todayISO } from "../../core/ui/atoms";

// Returns true if the match kickoff has already passed (Lima time = UTC-5)
function isMatchLocked(match) {
  const kickoff = new Date(`${match.date}T${match.time}:00-05:00`);
  return Date.now() >= kickoff.getTime();
}


function ScoreCenter({ score, result, locked, set, homeLabel, awayLabel }) {
  const hasResult = result != null && result[0] != null && result[1] != null;
  return (
    <div
      className="flex flex-col items-center gap-1"
      title={locked ? "Partido iniciado — pronóstico cerrado 🔒" : undefined}
      style={locked ? { cursor: "not-allowed" } : undefined}
    >
      {/* User prediction inputs — always shown */}
      <div className="flex items-center gap-1.5">
        <ScoreInput value={score?.[0]} onChange={(v) => set(0, v)} label={homeLabel} disabled={locked} />
        <span className="text-mist font-cond">–</span>
        <ScoreInput value={score?.[1]} onChange={(v) => set(1, v)} label={awayLabel} disabled={locked} />
      </div>
      {/* Official result below when available */}
      {hasResult && (
        <div className="flex items-center gap-1 leading-none">
          <span className="font-cond text-[10px] text-mist/50 uppercase tracking-wider">res.</span>
          <span className="font-cond text-[11px] font-bold text-grass tabular-nums">
            {result[0]}–{result[1]}
          </span>
        </div>
      )}
    </div>
  );
}

function MatchRow({ match, score, result, onScore, hideDate = false }) {
  const locked = isMatchLocked(match);
  const hasResult = result != null && result[0] != null && result[1] != null;

  const set = (idx, v) => {
    if (locked) return;
    const next = [score?.[0] ?? null, score?.[1] ?? null];
    next[idx] = v;
    onScore(match.m, next[0] === null && next[1] === null ? undefined : next);
  };

  const homeLabel = `Goles ${TEAMS[match.h].name}`;
  const awayLabel = `Goles ${TEAMS[match.a].name}`;
  const dimmed = locked && !hasResult;

  // Date-view layout
  if (hideDate) {
    return (
      <div className={`py-2 grid grid-cols-[4.5rem_1fr] sm:grid-cols-[4.5rem_1fr_auto] items-center gap-x-3 ${dimmed ? "opacity-50" : ""}`}>
        <TimeChip time={match.time} className="text-[11px] w-full justify-center" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 min-w-0">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <span className="font-cond font-semibold text-sm truncate" title={TEAMS[match.h].name}>
              {TEAMS[match.h].name}
            </span>
            <Flag code={match.h} />
          </div>
          <ScoreCenter score={score} result={result} locked={locked} set={set} homeLabel={homeLabel} awayLabel={awayLabel} />
          <div className="flex items-center gap-2 min-w-0">
            <Flag code={match.a} />
            <span className="font-cond font-semibold text-sm truncate" title={TEAMS[match.a].name}>
              {TEAMS[match.a].name}
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:flex sm:flex-col sm:items-end shrink-0">
          <p className="font-cond text-xs text-mist leading-tight truncate max-w-[130px]">{match.stadium}</p>
          <p className="font-cond text-[10px] uppercase tracking-wider text-mist/60">{match.city}</p>
        </div>
      </div>
    );
  }

  // Group-card layout
  return (
    <div className={`py-2.5 border-b border-line/60 last:border-b-0 ${dimmed ? "opacity-50" : ""}`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
        <div className="flex items-center justify-end gap-2 min-w-0">
          <span className="font-cond font-semibold text-base truncate" title={TEAMS[match.h].name}>
            {TEAMS[match.h].name}
          </span>
          <Flag code={match.h} />
        </div>
        <ScoreCenter score={score} result={result} locked={locked} set={set} homeLabel={homeLabel} awayLabel={awayLabel} />
        <div className="flex items-center gap-2 min-w-0">
          <Flag code={match.a} />
          <span className="font-cond font-semibold text-base truncate" title={TEAMS[match.a].name}>
            {TEAMS[match.a].name}
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-mist">
        <span>{formatDate(match.date)}</span>
        <TimeChip time={match.time} className="text-[11px]" />
        <span className="truncate hidden sm:inline">{match.stadium}</span>
      </div>
    </div>
  );
}

function Standings({ table, complete, qualifiedThird }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-mist font-cond uppercase tracking-wider text-xs">
          <th className="text-left font-semibold py-1 pl-2">Equipo</th>
          <th className="font-semibold w-8" title="Partidos jugados">PJ</th>
          <th className="font-semibold w-8" title="Diferencia de gol">DG</th>
          <th className="font-semibold w-8" title="Puntos">Pts</th>
        </tr>
      </thead>
      <tbody>
        {table.map((row, i) => {
          const direct = complete && i < 2;
          const third = complete && i === 2;
          return (
            <tr
              key={row.code}
              className={`border-t border-line/60 tabular-nums ${
                direct
                  ? "bg-grass/8 border-l-2 border-l-grass"
                  : third
                    ? qualifiedThird
                      ? "bg-gold/8 border-l-2 border-l-gold"
                      : "border-l-2 border-l-amber/50"
                    : "border-l-2 border-l-transparent"
              }`}
            >
              <td className="py-1.5 pl-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-mist font-cond w-3">{i + 1}</span>
                  <Flag code={row.code} className="text-lg" />
                  <span className="font-cond font-semibold">{row.code}</span>
                </span>
              </td>
              <td className="text-center text-mist">{row.pj}</td>
              <td className="text-center">{row.dg > 0 ? `+${row.dg}` : row.dg}</td>
              <td className="text-center font-bold text-chalk">{row.pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Standings card — uses official results ctx, falls back to predictions ctx
function StandingsCard({ group, ctx, resultsCtx }) {
  const activeCtx = resultsCtx ?? ctx;
  const complete = activeCtx.complete[group];
  const thirdCode = activeCtx.tables[group][2]?.code;
  const qualifiedThird = activeCtx.thirds?.qualified.has(thirdCode) ?? false;
  const hasOfficialData = resultsCtx?.tables[group]?.some((r) => r.pj > 0);
  return (
    <div className="rounded-xl border border-line bg-panel overflow-hidden min-w-[180px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-turf/50">
        <span className="font-cond text-xs text-mist uppercase tracking-widest">Grupo</span>
        <span className="font-display text-lg text-grass">{group}</span>
        {complete && (
          <span className="ml-auto font-cond text-[10px] uppercase tracking-widest text-grass border border-grass/40 rounded-full px-1.5 py-0.5">
            Completo
          </span>
        )}
        {!hasOfficialData && (
          <span className="ml-auto font-cond text-[10px] uppercase tracking-widest text-mist/50">
            Tu pronóstico
          </span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <Standings table={activeCtx.tables[group]} complete={complete} qualifiedThird={qualifiedThird} />
      </div>
    </div>
  );
}

// Group card for "Por Grupo" tab
function GroupCard({ group, ctx, resultsCtx, scores, results, onScore, index }) {
  const activeCtx = resultsCtx ?? ctx;
  const matches = GROUP_MATCHES.filter((m) => m.g === group).sort((a, b) => a.md - b.md || a.m - b.m);
  const complete = activeCtx.complete[group];
  const thirdCode = activeCtx.tables[group][2]?.code;
  const qualifiedThird = activeCtx.thirds?.qualified.has(thirdCode) ?? false;

  return (
    <section
      className="rise relative overflow-hidden rounded-xl border border-line bg-panel shadow-md hover:shadow-lg transition-shadow duration-200"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span
        aria-hidden="true"
        className="absolute -right-4 -top-10 font-display text-[10rem] text-chalk/4 select-none pointer-events-none"
      >
        {group}
      </span>

      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="font-display text-xl tracking-wide">
          <span className="text-mist text-sm align-middle mr-2 font-cond uppercase tracking-widest">Grupo</span>
          <span className="text-grass">{group}</span>
        </h3>
        {complete ? (
          <span className="font-cond text-xs uppercase tracking-widest text-grass border border-grass/40 rounded-full px-2 py-0.5">
            Completo
          </span>
        ) : (
          <span className="font-cond text-xs uppercase tracking-widest text-mist">
            {matches.filter((m) => scores[m.m]?.every?.((x) => Number.isInteger(x))).length}/6 tus picks
          </span>
        )}
      </header>
      <div className="chalk-rule mx-4" />

      <div className="bg-turf/70 border-b border-line px-2 py-2 relative">
        <Standings table={activeCtx.tables[group]} complete={complete} qualifiedThird={qualifiedThird} />
      </div>

      <div className="px-4 py-1 relative">
        {matches.map((match) => (
          <MatchRow key={match.m} match={match} score={scores[match.m]} result={results?.[match.m]} onScore={onScore} />
        ))}
      </div>
    </section>
  );
}

function ByDateView({ scores, results, onScore, ctx, resultsCtx }) {
  const today = todayISO();
  const focusRef = useRef(null);

  const byDate = useMemo(() => {
    const sorted = [...GROUP_MATCHES].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    );
    const map = new Map();
    for (const m of sorted) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return [...map.entries()];
  }, []);

  const focusDate = useMemo(() => {
    const dates = byDate.map(([d]) => d);
    if (dates.includes(today)) return today;
    return dates.find((d) => d > today) ?? dates[dates.length - 1];
  }, [byDate, today]);

  useEffect(() => {
    const t = setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-7">
      {byDate.map(([date, matches], di) => {
        const isToday = date === today;
        const isFocus = date === focusDate;
        const groups = [...new Set(matches.map((m) => m.g))].sort();
        const multiGroup = groups.length > 1;

        // Sort by group then time so dividers appear cleanly
        const sorted = [...matches].sort(
          (a, b) => a.time.localeCompare(b.time) || a.g.localeCompare(b.g)
        );
        // Build segments [{group, matches}] for group dividers
        const segments = sorted.reduce((acc, m) => {
          if (!acc.length || acc[acc.length - 1].group !== m.g) {
            acc.push({ group: m.g, matches: [m] });
          } else {
            acc[acc.length - 1].matches.push(m);
          }
          return acc;
        }, []);

        return (
          <section
            key={date}
            ref={isFocus ? focusRef : null}
            className="rise scroll-mt-24"
            style={{ animationDelay: `${Math.min(di, 8) * 40}ms` }}
          >
            {/* Date header */}
            <header className="sticky top-[3.4rem] z-10 mb-3 flex items-center gap-3 bg-night/95 backdrop-blur-sm py-1.5">
              <h3 className={`font-display text-base uppercase tracking-wide ${isToday ? "text-grass" : "text-chalk"}`}>
                {formatDate(date)}
              </h3>
              {isToday && (
                <span className="rounded-full bg-grass text-night px-2.5 py-0.5 font-cond text-[11px] font-bold uppercase tracking-widest">
                  Hoy
                </span>
              )}
              <span className="font-cond text-xs text-mist">
                {matches.length} partido{matches.length > 1 ? "s" : ""}
              </span>
              <div className="chalk-rule flex-1" />
            </header>

            {/* Group cards */}
            <div className="space-y-2 mb-3">
              {segments.map(({ group, matches: gm }) => (
                <div key={group} className="rounded-xl border border-line overflow-hidden">
                  {multiGroup && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-turf/60 border-b border-line/60">
                      <span className="font-cond text-[10px] uppercase tracking-widest text-mist/70">Grupo</span>
                      <span className="font-display text-sm text-grass">{group}</span>
                    </div>
                  )}
                  <div className="bg-panel divide-y divide-line/40 px-4">
                    {gm.map((m) => (
                      <MatchRow key={m.m} match={m} score={scores[m.m]} result={results?.[m.m]} onScore={onScore} hideDate />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Standings */}
            <div className="flex flex-wrap justify-center gap-2">
              {groups.map((g) => (
                <div key={g} className="flex-1 min-w-[175px] max-w-[280px]">
                  <StandingsCard group={g} ctx={ctx} resultsCtx={resultsCtx} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function GroupsView({ ctx, resultsCtx, scores, results, onScore }) {
  const [mode, setMode] = useState("date");

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[
          { id: "date", label: "Por Fecha" },
          { id: "group", label: "Por Grupo" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-cond font-semibold uppercase tracking-wider text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
              mode === m.id
                ? "bg-grass text-night border-grass"
                : "border-line text-mist hover:text-chalk hover:border-mist"
            }`}
          >
            {m.label}
          </button>
        ))}
        <span className="ml-auto font-cond text-xs uppercase tracking-widest text-mist">
          Horarios en hora peruana 🇵🇪 (UTC-5)
        </span>
      </div>

      {mode === "date" && <ByDateView scores={scores} results={results} onScore={onScore} ctx={ctx} resultsCtx={resultsCtx} />}

      {mode === "group" && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-cond uppercase tracking-widest text-mist">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-grass inline-block" /> Clasifica directo (1° y 2°)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gold inline-block" /> Mejor tercero clasificado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber/60 inline-block" /> Tercero en disputa
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Object.keys(GROUPS).map((g, i) => (
              <GroupCard key={g} group={g} ctx={ctx} resultsCtx={resultsCtx} scores={scores} results={results} onScore={onScore} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
