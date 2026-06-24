import { useMemo, useRef, useEffect, useState, Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { GROUPS, TEAMS } from "../../core/data/teams";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { Flag, ScoreInput, TimeChip, formatDate, todayISO } from "../../core/ui/atoms";
import { useTimezone, TIMEZONES } from "../../core/hooks/useTimezone";

// Returns true if the match kickoff has already passed (Lima time = UTC-5)
function isMatchLocked(match) {
  const kickoff = new Date(`${match.date}T${match.time}:00-05:00`);
  return Date.now() >= kickoff.getTime();
}

// Returns true if the match is currently in progress (~110 min window after kickoff)
function isMatchInProgress(match) {
  const kickoff = new Date(`${match.date}T${match.time}:00-05:00`).getTime();
  const elapsed = (Date.now() - kickoff) / 60000;
  return elapsed >= 0 && elapsed < 110;
}

// Forces a re-render exactly when the next upcoming match kicks off
function useKickoffTimer() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const next = GROUP_MATCHES
      .map((m) => new Date(`${m.date}T${m.time}:00-05:00`).getTime())
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b)[0];
    if (!next) return;
    const delay = next - Date.now() + 500; // +500ms de margen
    const id = setTimeout(() => setTick((n) => n + 1), delay);
    return () => clearTimeout(id);
  });
}


function ScoreCenter({ score, result, locked, inProgress, adminMode, set, homeLabel, awayLabel }) {
  const hasResult = result != null && result[0] != null && result[1] != null;
  const hasPrediction = score?.[0] != null && score?.[1] != null;

  if (hasResult) {
    const exactMatch = hasPrediction && score[0] === result[0] && score[1] === result[1];
    const outcomeMatch = hasPrediction && Math.sign(score[0] - score[1]) === Math.sign(result[0] - result[1]);
    const dotColor = exactMatch ? "bg-grass" : outcomeMatch ? "bg-gold" : "bg-red-400/80";

    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-grass/50 bg-turf shadow-inner">
            <span className="font-display text-xl font-bold text-grass tabular-nums leading-none">{result[0]}</span>
          </div>
          <span className="font-cond text-[9px] uppercase tracking-widest text-grass border border-grass/40 rounded px-1 py-0.5">FT</span>
          <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-grass/50 bg-turf shadow-inner">
            <span className="font-display text-xl font-bold text-grass tabular-nums leading-none">{result[1]}</span>
          </div>
        </div>
        {!adminMode && hasPrediction && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-cond text-sm font-semibold tabular-nums text-chalk">{score[0]}–{score[1]}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
            </div>
            <span className="font-cond text-[9px] text-mist/40 uppercase tracking-wider">Mi marcador</span>
          </div>
        )}
      </div>
    );
  }

  if (locked && inProgress) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {hasPrediction && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-mist/20 bg-turf shadow-inner">
                <span className="font-display text-xl font-bold text-mist/60 tabular-nums leading-none">{score[0]}</span>
              </div>
              <span className="font-cond text-[9px] uppercase tracking-widest text-mist/30 border border-mist/15 rounded px-1 py-0.5">VS</span>
              <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-mist/20 bg-turf shadow-inner">
                <span className="font-display text-xl font-bold text-mist/60 tabular-nums leading-none">{score[1]}</span>
              </div>
            </div>
            {!adminMode && <span className="font-cond text-[9px] text-mist/30 uppercase tracking-wider">Mi marcador</span>}
          </div>
        )}
      </div>
    );
  }

  if (locked && hasPrediction) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-grass/50 bg-turf shadow-inner">
            <span className="font-display text-xl font-bold text-grass tabular-nums leading-none">{score[0]}</span>
          </div>
          <span className="font-cond text-[9px] uppercase tracking-widest text-grass border border-grass/40 rounded px-1 py-0.5">FT</span>
          <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-grass/50 bg-turf shadow-inner">
            <span className="font-display text-xl font-bold text-grass tabular-nums leading-none">{score[1]}</span>
          </div>
        </div>
        {!adminMode && <span className="font-cond text-[9px] text-mist/30 uppercase tracking-wider">Mi marcador</span>}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      title={locked ? "Partido iniciado — pronóstico cerrado 🔒" : undefined}
      style={locked ? { cursor: "not-allowed" } : undefined}
    >
      <div className="flex items-center gap-1.5">
        <ScoreInput value={score?.[0]} onChange={(v) => set(0, v)} label={homeLabel} disabled={locked} />
        <span className="text-mist font-cond">–</span>
        <ScoreInput value={score?.[1]} onChange={(v) => set(1, v)} label={awayLabel} disabled={locked} />
      </div>
      <div className="h-4 flex items-center justify-center gap-1 leading-none">
        {hasPrediction && !locked ? (
          <span className="font-cond text-[10px] text-grass/70">✓ guardado</span>
        ) : null}
      </div>
    </div>
  );
}

function MatchRow({ match, score, result, onScore, hideDate = false, action, adminMode }) {
  const locked = isMatchLocked(match);

  const set = (idx, v) => {
    if (locked) return;
    const next = [score?.[0] ?? null, score?.[1] ?? null];
    next[idx] = v;
    onScore(match.m, next[0] === null && next[1] === null ? undefined : next);
  };

  const homeLabel = `Goles ${TEAMS[match.h].name}`;
  const awayLabel = `Goles ${TEAMS[match.a].name}`;
  const hasResult = result != null && result[0] != null && result[1] != null;
  const hasPrediction = score?.[0] != null && score?.[1] != null;
  const inProgress = locked && !hasResult && isMatchInProgress(match);
  const dimmed = locked && !hasResult && !hasPrediction && !inProgress;

  const teamRow = (size = "sm") => (
    <div
      style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 6.5rem minmax(0,1fr)", alignItems: "center", columnGap: "0.5rem" }}
    >
      <div className="flex items-center justify-end gap-1.5 min-w-0">
        <span className={`font-cond font-semibold text-${size} flex-1 min-w-0 text-right truncate`} title={TEAMS[match.h].name}>
          {TEAMS[match.h].name}
        </span>
        <Flag code={match.h} className="shrink-0 text-xl leading-none" />
      </div>
      <ScoreCenter score={score} result={result} locked={locked} inProgress={inProgress} adminMode={adminMode} set={set} homeLabel={homeLabel} awayLabel={awayLabel} />
      <div className="flex items-center gap-1.5 min-w-0">
        <Flag code={match.a} className="shrink-0 text-xl leading-none" />
        <span className={`font-cond font-semibold text-${size} flex-1 min-w-0 truncate`} title={TEAMS[match.a].name}>
          {TEAMS[match.a].name}
        </span>
      </div>
    </div>
  );

  // Date-view layout
  if (hideDate) {
    return (
      <div className={`py-2 flex items-center gap-3 ${dimmed ? "opacity-50" : ""}`}>
        <TimeChip date={match.date} time={match.time} className="text-[11px] w-[4.5rem] shrink-0 justify-center" />
        <div className="flex-1 min-w-0">{teamRow("sm")}</div>
        {action ? (
          <div className="shrink-0">{action}</div>
        ) : (
          <div className="text-right hidden sm:flex sm:flex-col sm:items-end w-[130px] shrink-0">
            <p className="font-cond text-xs text-mist leading-tight truncate">{match.stadium}</p>
            <p className="font-cond text-[10px] uppercase tracking-wider text-mist/60 truncate">{match.city}</p>
          </div>
        )}
      </div>
    );
  }

  // Group-card layout
  return (
    <div className={`py-2.5 border-b border-line/60 last:border-b-0 ${dimmed ? "opacity-50" : ""}`}>
      {teamRow("base")}
      <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-mist">
        <span>{formatDate(match.date)}</span>
        <TimeChip date={match.date} time={match.time} className="text-[11px]" />
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
function GroupCard({ group, ctx, resultsCtx, scores, results, onScore, index, adminMode }) {
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
          <MatchRow key={match.m} match={match} score={scores[match.m]} result={results?.[match.m]} onScore={onScore} adminMode={adminMode} />
        ))}
      </div>
    </section>
  );
}

function ByDateView({ scores, results, onScore, ctx, resultsCtx, matchActions, adminMode }) {
  const today = todayISO();
  const focusRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => new Set());

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
    setCollapsed(new Set(byDate.map(([d]) => d).filter((d) => d < today)));
  }, [byDate, today]);

  const toggleDate = (date) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-7">
      {byDate.map(([date, matches], di) => {
        const isToday = date === today;
        const isFocus = date === focusDate;
        const groups = [...new Set(matches.map((m) => m.g))].sort();
        const multiGroup = groups.length > 1;

        // Sort by time first so matches render in chronological order
        const sorted = [...matches].sort(
          (a, b) => a.time.localeCompare(b.time) || a.g.localeCompare(b.g)
        );

        const isPast = date < today;
        const isCollapsed = collapsed.has(date);

        return (
          <section
            key={date}
            ref={isFocus ? focusRef : null}
            className="rise scroll-mt-24"
            style={{ animationDelay: `${Math.min(di, 8) * 40}ms` }}
          >
            {/* Date header */}
            <header
              className={`sticky top-[3.4rem] z-10 mb-3 flex items-center gap-3 bg-night/95 backdrop-blur-sm py-1.5 ${isPast ? "cursor-pointer select-none" : ""}`}
              onClick={isPast ? () => toggleDate(date) : undefined}
            >
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
              {isPast && (
                <ChevronDown
                  className="w-4 h-4 text-mist/60 ml-1 shrink-0 transition-transform duration-300"
                  style={{ transform: isCollapsed ? "rotate(90deg)" : "rotate(0deg)" }}
                />
              )}
            </header>

            {/* All matches in one shared container so rows share the same width */}
            <div
              style={{
                display: "grid",
                gridTemplateRows: isCollapsed ? "0fr" : "1fr",
                transition: "grid-template-rows 300ms ease",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <div className="rounded-xl border border-line overflow-hidden mb-3">
                  {sorted.map((m, idx) => {
                    const prevGroup = idx > 0 ? sorted[idx - 1].g : null;
                    const showHeader = multiGroup && m.g !== prevGroup;
                    const isLast = idx === sorted.length - 1;
                    return (
                      <Fragment key={m.m}>
                        {showHeader && (
                          <div className={`flex items-center gap-2 px-4 py-1.5 bg-turf/60 border-b border-line/60 ${idx > 0 ? "border-t border-t-line/60" : ""}`}>
                            <span className="font-cond text-[10px] uppercase tracking-widest text-mist/70">Grupo</span>
                            <span className="font-display text-sm text-grass">{m.g}</span>
                          </div>
                        )}
                        <div className={`bg-panel px-4 ${isLast ? "" : "border-b border-line/40"}`}>
                          <MatchRow match={m} score={scores[m.m]} result={results?.[m.m]} onScore={onScore} hideDate action={matchActions?.[m.m]} adminMode={adminMode} />
                        </div>
                      </Fragment>
                    );
                  })}
                </div>

                {/* Standings */}
                <div className="flex flex-wrap justify-center gap-2">
                  {groups.map((g) => (
                    <div key={g} className="flex-1 min-w-[175px] max-w-[280px]">
                      <StandingsCard group={g} ctx={ctx} resultsCtx={resultsCtx} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function GroupsView({ ctx, resultsCtx, scores, results, onScore, onTzChange, matchActions, adminMode }) {
  const [mode, setMode] = useState("date");
  const tz = useTimezone();
  const tzInfo = TIMEZONES.find((t) => t.tz === tz) ?? TIMEZONES[0];
  useKickoffTimer();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center border-b border-line">
        {[
          { id: "date", label: "Por Fecha" },
          { id: "group", label: "Por Grupo" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`cursor-pointer border-b-2 px-4 py-2.5 font-cond font-bold uppercase tracking-wider text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
              mode === m.id
                ? "border-grass text-grass"
                : "border-transparent text-mist hover:text-chalk"
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="font-cond text-xs uppercase tracking-widest text-mist hidden sm:block">Hora</span>
          <select
            value={tz}
            onChange={(e) => onTzChange?.(e.target.value)}
            className="cursor-pointer rounded-md border border-line bg-panel px-2 py-1 font-cond text-xs text-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-grass"
          >
            {TIMEZONES.map((t) => (
              <option key={t.tz} value={t.tz}>{t.flag} {t.label} ({t.offset})</option>
            ))}
          </select>
        </div>
      </div>

      {mode === "date" && <ByDateView scores={scores} results={results} onScore={onScore} ctx={ctx} resultsCtx={resultsCtx} matchActions={matchActions} adminMode={adminMode} />}

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
              <GroupCard key={g} group={g} ctx={ctx} resultsCtx={resultsCtx} scores={scores} results={results} onScore={onScore} index={i} adminMode={adminMode} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
