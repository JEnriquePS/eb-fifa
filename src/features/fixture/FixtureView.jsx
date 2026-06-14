import { useMemo, useState } from "react";
import { TEAMS } from "../../core/data/teams";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { KO_MATCHES, ROUND_LABELS } from "../../core/data/knockoutMatches";
import { resolveKoMatch, koWinner, slotLabel } from "../../lib/polla";
import { Flag, TimeChip, formatDate, todayISO } from "../../core/ui/atoms";

function TeamCell({ code, placeholder, align = "left", winner }) {
  const right = align === "right";
  if (!code) {
    return (
      <span className={`font-cond text-mist italic text-sm ${right ? "text-right" : ""} block truncate`}>
        {placeholder}
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-2 min-w-0 ${right ? "flex-row-reverse" : ""}`}>
      <Flag code={code} />
      <span
        className={`font-cond font-semibold truncate ${winner === false ? "text-mist" : ""} ${
          winner === true ? "text-gold" : ""
        }`}
      >
        {TEAMS[code].name}
      </span>
    </span>
  );
}

function FixtureRow({ entry, ctx, groupScores, results }) {
  const isKO = !!entry.round;
  let home = entry.h;
  let away = entry.a;
  let homePh, awayPh, winner;
  if (isKO) {
    const resolved = resolveKoMatch(entry.m, ctx);
    home = resolved.home;
    away = resolved.away;
    homePh = slotLabel(entry.hs);
    awayPh = slotLabel(entry.as);
    winner = koWinner(entry.m, ctx);
  }
  const valid = (s) => s && Number.isInteger(s[0]) && Number.isInteger(s[1]);
  const official = !isKO ? results?.groupScores[entry.m] : null;
  const isOfficial = valid(official);
  const score = isOfficial ? official : !isKO ? groupScores[entry.m] : null;
  const hasScore = valid(score);

  return (
    <li className="grid grid-cols-[auto_1fr] sm:grid-cols-[5.5rem_1fr_auto] items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-panel px-3 py-2.5 hover:border-mist/40 hover:bg-panel-2/60 transition-colors duration-200">
      <div className="flex flex-col items-start gap-1">
        <TimeChip time={entry.time} className="text-xs" />
        <span className="font-cond text-[11px] uppercase tracking-widest text-mist">
          {isKO ? ROUND_LABELS[entry.round] : `Grupo ${entry.g}`} · P{entry.m}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-w-0">
        <div className="justify-self-end min-w-0 max-w-full">
          <TeamCell code={home} placeholder={homePh} align="right" winner={winner ? winner === home : undefined} />
        </div>
        <div className="px-1 text-center">
          {hasScore ? (
            <>
              <span
                className={`font-cond font-bold text-lg tabular-nums whitespace-nowrap ${
                  isOfficial ? "text-grass" : "text-gold"
                }`}
              >
                {score[0]} – {score[1]}
              </span>
              <span className="block font-cond text-[9px] uppercase tracking-widest text-mist leading-none">
                {isOfficial ? "oficial" : "tu polla"}
              </span>
            </>
          ) : (
            <span className="text-mist font-cond">vs</span>
          )}
        </div>
        <div className="min-w-0">
          <TeamCell code={away} placeholder={awayPh} winner={winner ? winner === away : undefined} />
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 text-right">
        <p className="font-cond text-xs text-mist leading-tight">{entry.stadium}</p>
        <p className="font-cond text-[11px] uppercase tracking-wider text-mist/70">{entry.city}</p>
      </div>
    </li>
  );
}

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "groups", label: "Fase de grupos" },
  { id: "ko", label: "Eliminatorias" },
];

export default function FixtureView({ ctx, groupScores, results }) {
  const [filter, setFilter] = useState("all");
  const today = todayISO();

  const byDate = useMemo(() => {
    const all = [
      ...(filter !== "ko" ? GROUP_MATCHES : []),
      ...(filter !== "groups" ? KO_MATCHES : []),
    ].sort((x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time) || x.m - y.m);
    const map = new Map();
    for (const m of all) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return [...map.entries()];
  }, [filter]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-cond font-semibold uppercase tracking-wider text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
              filter === f.id
                ? "bg-grass text-night border-grass"
                : "border-line text-mist hover:text-chalk hover:border-mist"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto font-cond text-xs uppercase tracking-widest text-mist">
          Horarios en hora peruana 🇵🇪 (UTC-5)
        </span>
      </div>

      <div className="space-y-7">
        {byDate.map(([date, matches], di) => (
          <section key={date} className="rise" style={{ animationDelay: `${Math.min(di, 8) * 40}ms` }}>
            <header className="sticky top-[3.4rem] z-10 mb-2 flex items-center gap-3 bg-night/95 backdrop-blur-sm py-1.5">
              <h3 className="font-display text-base uppercase tracking-wide text-chalk">
                {formatDate(date)}
              </h3>
              {date === today && (
                <span className="rounded-full bg-card px-2.5 py-0.5 font-cond text-xs font-bold uppercase tracking-widest text-chalk">
                  Hoy
                </span>
              )}
              <span className="font-cond text-xs text-mist">{matches.length} partido{matches.length > 1 ? "s" : ""}</span>
              <div className="chalk-rule flex-1" />
            </header>
            <ul className="space-y-2">
              {matches.map((m) => (
                <FixtureRow key={`${m.m}`} entry={m} ctx={ctx} groupScores={groupScores} results={results} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
