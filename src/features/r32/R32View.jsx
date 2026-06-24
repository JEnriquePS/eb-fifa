import { AlertTriangle, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GROUPS, TEAMS } from "../../core/data/teams";
import { KO_BY_ID } from "../../core/data/knockoutMatches";
import { koWinner, slotLabel } from "../../lib/polla";
import { Flag, TimeChip, formatDate } from "../../core/ui/atoms";

const LEFT  = [74, 77, 73, 75, 83, 84, 81, 82];
const RIGHT = [76, 78, 79, 80, 86, 88, 85, 87];

// ── Resolución provisional ────────────────────────────────────────────────────

function resolveCurrentSlot(slot, matchId, ctx) {
  if (/^[12][A-L]$/.test(slot)) {
    const g = slot[1];
    const idx = slot[0] === "1" ? 0 : 1;
    const entry = ctx.tables[g]?.[idx];
    if (!entry || entry.pj === 0 || entry._tied) return { code: null, provisional: false };
    return { code: entry.code, provisional: !ctx.complete[g] };
  }
  if (slot.startsWith("3")) {
    return { code: ctx.thirds?.assignment[matchId] ?? null, provisional: false };
  }
  const ref = Number(slot.slice(1));
  const winner = koWinner(ref, ctx);
  if (!winner) return { code: null, provisional: false };
  const homeCode = resolveCurrentSlot(KO_BY_ID[ref].hs, ref, ctx).code;
  const awayCode = resolveCurrentSlot(KO_BY_ID[ref].as, ref, ctx).code;
  const resolved = slot[0] === "W" ? winner : winner === homeCode ? awayCode : homeCode;
  return { code: resolved, provisional: false };
}

function getSlotTie(slot, ctx) {
  if (!/^[12][A-L]$/.test(slot)) return null;
  const g = slot[1];
  const posIdx = slot[0] === "1" ? 0 : 1;
  return (ctx.groupTies?.[g] ?? []).find((t) => t.positions.includes(posIdx)) ?? null;
}

// ── KoCard ────────────────────────────────────────────────────────────────────

function KoCard({ matchId, ctx, officialWinner, koScore, isAdmin, onResultKoScore }) {
  const k = KO_BY_ID[matchId];
  const hRes = resolveCurrentSlot(k.hs, matchId, ctx);
  const aRes = resolveCurrentSlot(k.as, matchId, ctx);
  const winner = officialWinner ?? null;
  const bothKnown = !!hRes.code && !!aRes.code;

  // Score state (admin)
  const [homeVal, setHomeVal] = useState(koScore != null ? String(koScore[0]) : "");
  const [awayVal, setAwayVal] = useState(koScore != null ? String(koScore[1]) : "");
  const [showDrawPicker, setShowDrawPicker] = useState(false);
  const saveTimer = useRef(null);

  // Sync inputs when DB pushes an update
  const koKey = koScore != null ? `${koScore[0]}-${koScore[1]}` : "none";
  useEffect(() => {
    setHomeVal(koScore != null ? String(koScore[0]) : "");
    setAwayVal(koScore != null ? String(koScore[1]) : "");
    setShowDrawPicker(false);
  }, [koKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const h = parseInt(homeVal, 10);
  const a = parseInt(awayVal, 10);
  const validNums = homeVal !== "" && awayVal !== "" && !isNaN(h) && !isNaN(a);
  const isDraw = validNums && h === a;

  // Auto-save on input change (debounced, like fase de grupos)
  useEffect(() => {
    if (!isAdmin || !validNums || !bothKnown) return;
    if (isDraw) {
      setShowDrawPicker(true);
      return;
    }
    setShowDrawPicker(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const winnerCode = h > a ? hRes.code : aRes.code;
      onResultKoScore(matchId, h, a, winnerCode);
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [homeVal, awayVal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePickWinner = (code) => {
    setShowDrawPicker(false);
    onResultKoScore(matchId, h, a, code);
  };

  const homeTie = !hRes.code ? getSlotTie(k.hs, ctx) : null;
  const awayTie = !aRes.code ? getSlotTie(k.as, ctx) : null;
  const homePlaceholder = homeTie
    ? homeTie.candidates.map((c) => TEAMS[c]?.name).join(" / ")
    : slotLabel(k.hs);
  const awayPlaceholder = awayTie
    ? awayTie.candidates.map((c) => TEAMS[c]?.name).join(" / ")
    : slotLabel(k.as);

  const renderScore = (side) => {
    if (isAdmin && bothKnown) {
      const val = side === "home" ? homeVal : awayVal;
      const set = side === "home" ? setHomeVal : setAwayVal;
      return (
        <input
          type="number"
          min="0"
          max="99"
          value={val}
          onChange={(e) => set(e.target.value)}
          className="w-8 h-7 shrink-0 text-center rounded border border-line bg-turf text-chalk font-display text-sm font-bold tabular-nums focus:outline-none focus:border-grass/60 focus:ring-1 focus:ring-grass/30"
          placeholder="–"
        />
      );
    }
    if (koScore != null) {
      const n = side === "home" ? koScore[0] : koScore[1];
      return (
        <div className="w-8 h-7 shrink-0 flex items-center justify-center rounded border border-grass/50 bg-turf shadow-inner">
          <span className="font-display text-sm font-bold text-grass tabular-nums leading-none">{n}</span>
        </div>
      );
    }
    return null;
  };

  const renderTeamRow = (res, placeholder, side) => {
    const isWinner = !!winner && winner === res.code;
    const isLoser  = !!winner && winner !== res.code && !!res.code;
    const scoreSlot = renderScore(side);
    return (
      <div className={`flex w-full items-center gap-2 px-2.5 py-1.5 ${isWinner ? "bg-gold/15" : ""}`}>
        {res.code ? (
          <>
            <Flag code={res.code} className="text-xl shrink-0" />
            <span className={`font-cond font-semibold text-sm truncate flex-1 ${
              isWinner ? "text-gold" : isLoser ? "text-mist line-through decoration-mist/50" : ""
            }`}>
              {TEAMS[res.code].name}
            </span>
            {res.provisional && !isWinner && !isLoser && (
              <span className="font-cond text-[8px] text-amber border border-amber/40 rounded px-1 shrink-0">~</span>
            )}
            {isWinner && !scoreSlot && <Check className="ml-auto w-4 h-4 text-gold shrink-0" />}
            {scoreSlot}
          </>
        ) : (
          <>
            <span className="font-cond text-xs italic text-mist/50 truncate py-0.5 flex-1">{placeholder}</span>
            {scoreSlot}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-52 shrink-0 overflow-hidden rounded-lg border border-line bg-panel shadow-sm hover:shadow-md hover:border-mist/40 transition-all duration-200">
      <header className="flex items-center justify-between bg-turf/80 px-2.5 py-1 border-b border-line">
        <span className="font-cond text-[10px] font-semibold uppercase tracking-widest text-mist">
          P{k.m} · {formatDate(k.date, { weekday: false })}
        </span>
        <TimeChip time={k.time} className="text-[10px]" />
      </header>

      {renderTeamRow(hRes, homePlaceholder, "home")}

      {koScore != null && (
        <div className="flex justify-center py-0.5 border-y border-line/40 bg-turf/40">
          <span className="font-cond text-[9px] uppercase tracking-widest text-grass border border-grass/40 rounded px-1.5 py-0.5">FT</span>
        </div>
      )}
      {koScore == null && <div className="h-px bg-line/60" />}

      {renderTeamRow(aRes, awayPlaceholder, "away")}

      {/* Draw picker */}
      {showDrawPicker && (
        <div className="px-2.5 py-2 border-t border-amber/30 bg-amber/5">
          <p className="font-cond text-[10px] text-amber uppercase tracking-wider mb-1.5 text-center">
            ¿Quién avanzó?
          </p>
          <div className="flex gap-1.5">
            {[hRes.code, aRes.code].filter(Boolean).map((code) => (
              <button
                key={code}
                onClick={() => handlePickWinner(code)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-mist/30 px-2 py-1.5 font-cond text-xs text-chalk hover:border-grass/60 hover:bg-grass/10 hover:text-grass cursor-pointer transition-colors duration-150 focus:outline-none"
              >
                <Flag code={code} className="text-base" />
                <span className="font-semibold truncate">{TEAMS[code]?.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="px-2.5 py-1 border-t border-line/60">
        <span className="font-cond text-[10px] uppercase tracking-wider text-mist/70 truncate block">
          {k.stadium} · {k.city}
        </span>
      </footer>
    </div>
  );
}

// ── Panel de desempates (admin) ───────────────────────────────────────────────

function TiebreakerPanel({ groupTies, tiebreakers, onTiebreaker }) {
  const groups = Object.keys(groupTies);
  if (groups.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-gold/40 bg-gold/5 px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-gold shrink-0" />
        <p className="font-cond font-bold text-sm uppercase tracking-wider text-gold">
          Empates sin resolver — Elige quién clasifica
        </p>
      </div>
      <div className="space-y-4">
        {groups.map((group) =>
          groupTies[group].map((tie, i) => {
            const resolvedCode = tiebreakers?.[group]?.[tie.positions[0] + 1];
            return (
              <div key={`${group}-${i}`}>
                <p className="font-cond text-xs text-mist uppercase tracking-wider mb-2">
                  Grupo {group} · {tie.positions.map((p) => `${p + 1}°`).join(" y ")} lugar
                </p>
                <div className="flex flex-wrap gap-2">
                  {tie.candidates.map((code) => {
                    const selected = resolvedCode === code;
                    return (
                      <button
                        key={code}
                        onClick={() => onTiebreaker(group, tie.positions[0] + 1, code)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-cond text-sm transition-colors duration-150 cursor-pointer focus:outline-none ${
                          selected
                            ? "border-grass/60 bg-grass/15 text-grass"
                            : "border-mist/25 text-mist hover:border-mist/50 hover:text-chalk"
                        }`}
                      >
                        <Flag code={code} className="text-lg" />
                        <span className="font-semibold">{TEAMS[code].name}</span>
                        {selected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────────

export default function R32View({ resultsCtx, results, tiebreakers, me, onTiebreaker, onResultKoScore }) {
  const isAdmin = me?.is_admin ?? false;
  const completeCount = Object.keys(GROUPS).filter((g) => resultsCtx.complete[g]).length;
  const hasTies = Object.keys(resultsCtx.groupTies ?? {}).length > 0;
  const koScores = results.koScores ?? {};

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-turf border border-line">
            <div
              className="h-full bg-grass transition-all duration-500"
              style={{ width: `${(completeCount / 12) * 100}%` }}
            />
          </div>
          <span className="font-cond text-sm text-mist tabular-nums">
            {completeCount}/12 grupos finalizados
          </span>
        </div>
        {completeCount < 12 && (
          <span className="font-cond text-xs text-amber/80">~ clasificación provisional</span>
        )}
      </div>

      {isAdmin && hasTies && (
        <TiebreakerPanel
          groupTies={resultsCtx.groupTies}
          tiebreakers={tiebreakers}
          onTiebreaker={onTiebreaker}
        />
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4 justify-center">
          <div className="flex flex-col gap-3">
            <h4 className="text-center font-cond text-xs font-bold uppercase tracking-[0.2em] text-mist mb-1">
              Llave A
            </h4>
            {LEFT.map((id) => (
              <KoCard
                key={id}
                matchId={id}
                ctx={resultsCtx}
                officialWinner={results.koPicks[id]}
                koScore={koScores[id]}
                isAdmin={isAdmin}
                onResultKoScore={onResultKoScore}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-center font-cond text-xs font-bold uppercase tracking-[0.2em] text-mist mb-1">
              Llave B
            </h4>
            {RIGHT.map((id) => (
              <KoCard
                key={id}
                matchId={id}
                ctx={resultsCtx}
                officialWinner={results.koPicks[id]}
                koScore={koScores[id]}
                isAdmin={isAdmin}
                onResultKoScore={onResultKoScore}
              />
            ))}
          </div>
        </div>
      </div>

      {isAdmin && (
        <p className="mt-3 text-center font-cond text-xs text-mist/50 uppercase tracking-wider">
          ~ = provisional · empate → elige quién avanzó
        </p>
      )}
    </div>
  );
}
