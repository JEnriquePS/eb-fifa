import { useEffect, useMemo, useRef, useState } from "react";
import { TEAMS } from "../../core/data/teams";
import { KO_BY_ID } from "../../core/data/knockoutMatches";
import { resolveKoMatch } from "../../lib/polla";
import { Flag, TimeChip, formatDate } from "../../core/ui/atoms";

// ─── Score boxes ──────────────────────────────────────────────────────────────

function ScoreBox({ val, onChange, locked, color = "grass" }) {
  if (locked) {
    return (
      <div className={`w-9 h-9 flex items-center justify-center rounded-lg border border-${color}/50 bg-turf shadow-inner`}>
        <span className={`font-display text-xl font-bold text-${color} tabular-nums leading-none`}>
          {val !== "" && val != null ? val : "–"}
        </span>
      </div>
    );
  }
  return (
    <input
      type="number"
      min="0"
      max="99"
      value={val}
      onChange={(e) => onChange(e.target.value)}
      className="w-9 h-9 text-center rounded-lg border border-line bg-turf text-chalk font-display text-xl font-bold tabular-nums focus:outline-none focus:border-grass/60 focus:ring-1 focus:ring-grass/30 shadow-inner"
    />
  );
}

const PHASE_COLORS = {
  ft:  "text-grass border-grass/40",
  rt:  "text-mist/50 border-mist/20",
  aet: "text-amber border-amber/40",
  pen: "text-gold border-gold/40",
};

function PhaseLabel({ label, variant }) {
  return (
    <span className={`font-cond text-[9px] uppercase tracking-widest border rounded px-1 py-0.5 ${PHASE_COLORS[variant] ?? PHASE_COLORS.rt}`}>
      {label}
    </span>
  );
}

// ─── KO score center (same logic as before, new visual layout) ────────────────

function KoScoreCenter({ matchId, home, away, existingResult, onResultKoScore, bothKnown }) {
  const winner = existingResult?.winner ?? null;

  const resultKey = existingResult
    ? `${existingResult.rtHome}-${existingResult.rtAway}-${existingResult.etHome}-${existingResult.etAway}-${existingResult.penHome}-${existingResult.penAway}-${existingResult.winner}`
    : "none";

  const [rtH, setRtH] = useState(() => existingResult?.rtHome != null ? String(existingResult.rtHome) : "");
  const [rtA, setRtA] = useState(() => existingResult?.rtAway != null ? String(existingResult.rtAway) : "");
  const [etH, setEtH] = useState(() => existingResult?.etHome != null ? String(existingResult.etHome) : "");
  const [etA, setEtA] = useState(() => existingResult?.etAway != null ? String(existingResult.etAway) : "");
  const [penH, setPenH] = useState(() => existingResult?.penHome != null ? String(existingResult.penHome) : "");
  const [penA, setPenA] = useState(() => existingResult?.penAway != null ? String(existingResult.penAway) : "");
  const [phase, setPhase] = useState(() => existingResult?.penHome != null ? "pen" : existingResult?.etHome != null ? "et" : "rt");
  const [showPen, setShowPen] = useState(
    () => !!(existingResult?.etHome != null && existingResult.etHome === existingResult.etAway)
  );
  const timer = useRef(null);

  useEffect(() => {
    setRtH(existingResult?.rtHome != null ? String(existingResult.rtHome) : "");
    setRtA(existingResult?.rtAway != null ? String(existingResult.rtAway) : "");
    setEtH(existingResult?.etHome != null ? String(existingResult.etHome) : "");
    setEtA(existingResult?.etAway != null ? String(existingResult.etAway) : "");
    setPenH(existingResult?.penHome != null ? String(existingResult.penHome) : "");
    setPenA(existingResult?.penAway != null ? String(existingResult.penAway) : "");
    setPhase(existingResult?.penHome != null ? "pen" : existingResult?.etHome != null ? "et" : "rt");
    setShowPen(!!(existingResult?.etHome != null && existingResult.etHome === existingResult.etAway));
  }, [resultKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const rtHn = parseInt(rtH, 10), rtAn = parseInt(rtA, 10);
  const rtValid = rtH !== "" && rtA !== "" && !isNaN(rtHn) && !isNaN(rtAn);
  const etHn = parseInt(etH, 10), etAn = parseInt(etA, 10);
  const etValid = etH !== "" && etA !== "" && !isNaN(etHn) && !isNaN(etAn);
  const penHn = parseInt(penH, 10), penAn = parseInt(penA, 10);
  const penValid = penH !== "" && penA !== "" && !isNaN(penHn) && !isNaN(penAn);

  useEffect(() => {
    if (!rtValid || !bothKnown || !!winner) return;
    if (timer.current) clearTimeout(timer.current);
    if (rtHn !== rtAn) {
      const code = rtHn > rtAn ? home : away;
      timer.current = setTimeout(() => onResultKoScore(matchId, code, rtHn, rtAn, null, null), 600);
    } else {
      setShowPen(false);
      setPhase("et");
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [rtH, rtA]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "et" || !etValid || !bothKnown || !!winner) return;
    if (timer.current) clearTimeout(timer.current);
    if (etHn !== etAn) {
      const code = etHn > etAn ? home : away;
      timer.current = setTimeout(() => onResultKoScore(matchId, code, rtHn, rtAn, etHn, etAn), 600);
    } else {
      setShowPen(true);
      setPhase("pen");
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [etH, etA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "pen" || !penValid || !bothKnown || !!winner || penHn === penAn) return;
    if (timer.current) clearTimeout(timer.current);
    const code = penHn > penAn ? home : away;
    timer.current = setTimeout(() => onResultKoScore(matchId, code, rtHn, rtAn, etHn, etAn, penHn, penAn), 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [penH, penA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    setRtH(""); setRtA(""); setEtH(""); setEtA(""); setPenH(""); setPenA("");
    setPhase("rt"); setShowPen(false);
    onResultKoScore(matchId, undefined);
  };

  const isRtLocked = phase === "et" || phase === "pen" || !!winner;
  const showEt = phase === "et" || phase === "pen" || (!!winner && existingResult?.etHome != null);

  if (!bothKnown) {
    return (
      <div className="flex items-center justify-center px-2">
        <span className="font-cond text-[9px] uppercase tracking-widest text-mist/30 border border-mist/15 rounded px-1 py-0.5">VS</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <ScoreBox val={rtH} onChange={setRtH} locked={isRtLocked} color="grass" />
        <PhaseLabel label={isRtLocked ? "FT" : "–"} variant={isRtLocked ? "ft" : "rt"} />
        <ScoreBox val={rtA} onChange={setRtA} locked={isRtLocked} color="grass" />
      </div>
      {showEt && (
        <div className="flex items-center gap-1">
          <ScoreBox val={etH} onChange={setEtH} locked={phase === "pen" || !!winner} color="amber" />
          <PhaseLabel label="AET" variant="aet" />
          <ScoreBox val={etA} onChange={setEtA} locked={phase === "pen" || !!winner} color="amber" />
        </div>
      )}
      {showPen && (
        <div className="flex items-center gap-1">
          <ScoreBox val={penH} onChange={setPenH} locked={!!winner} color="gold" />
          <PhaseLabel label="PEN" variant="pen" />
          <ScoreBox val={penA} onChange={setPenA} locked={!!winner} color="gold" />
        </div>
      )}
      {!!winner && (
        <button onClick={clear} className="font-cond text-[10px] text-mist/40 hover:text-mist cursor-pointer transition-colors">
          cambiar ×
        </button>
      )}
    </div>
  );
}

// ─── Match row — mismo layout que ByDateView en GroupsView ────────────────────

function KoMatchRow({ matchId, resultsCtx, existingResult, onResultKoScore, isLast }) {
  const k = KO_BY_ID[matchId];
  const { home, away } = resolveKoMatch(matchId, resultsCtx, true);
  const bothKnown = !!home && !!away;
  const winner = existingResult?.winner ?? null;

  const homeName = home ? (TEAMS[home]?.name ?? home) : null;
  const awayName = away ? (TEAMS[away]?.name ?? away) : null;

  return (
    <div className={`bg-panel px-4 ${isLast ? "" : "border-b border-line/40"}`}>
      <div className="py-2 flex items-center gap-3">
        {/* Hora — misma posición que TimeChip en ByDateView */}
        <TimeChip date={k.date} time={k.time} className="text-[11px] w-[4.5rem] shrink-0 justify-center" />

        {/* Equipo local — score — equipo visitante */}
        <div
          className="flex-1 min-w-0"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
            alignItems: "center",
            columnGap: "0.5rem",
          }}
        >
          {/* Local */}
          <div className="flex items-center justify-end gap-1.5 min-w-0">
            <span
              className={`font-cond font-semibold text-sm flex-1 min-w-0 text-right truncate ${
                winner && winner === home
                  ? "text-gold"
                  : winner && winner !== home && home
                    ? "text-mist line-through decoration-mist/50"
                    : ""
              }`}
            >
              {homeName ?? (
                <span className="text-mist/40 italic font-normal">
                  {k.hs ? `1° Grupo ${k.hs[1]}` : "Por definir"}
                </span>
              )}
            </span>
            {home && <Flag code={home} className="shrink-0 text-xl leading-none" />}
          </div>

          <KoScoreCenter
            matchId={matchId}
            home={home}
            away={away}
            existingResult={existingResult}
            onResultKoScore={onResultKoScore}
            bothKnown={bothKnown}
          />

          {/* Visitante */}
          <div className="flex items-center gap-1.5 min-w-0">
            {away && <Flag code={away} className="shrink-0 text-xl leading-none" />}
            <span
              className={`font-cond font-semibold text-sm flex-1 min-w-0 truncate ${
                winner && winner === away
                  ? "text-gold"
                  : winner && winner !== away && away
                    ? "text-mist line-through decoration-mist/50"
                    : ""
              }`}
            >
              {awayName ?? (
                <span className="text-mist/40 italic font-normal">
                  {k.as ? `2° Grupo ${k.as[1]}` : "Por definir"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Estadio */}
        <div className="text-right hidden sm:flex sm:flex-col sm:items-end w-[130px] shrink-0">
          <p className="font-cond text-xs text-mist leading-tight truncate">{k.stadium}</p>
          <p className="font-cond text-[10px] uppercase tracking-wider text-mist/60 truncate">{k.city}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal — organizada por fecha como ByDateView ───────────────────

const R32_IDS = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];

export default function R32AdminView({ resultsCtx, koScores, onResultKoScore }) {
  const byDate = useMemo(() => {
    const sorted = R32_IDS
      .map((id) => ({ id, ...KO_BY_ID[id] }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const map = new Map();
    for (const m of sorted) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m.id);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="space-y-7">
      <p className="font-cond text-xs text-mist uppercase tracking-wider">
        Marcadores finales acumulados · 90' → AET (incluye goles de 90') → PEN (tanda, ej. 5-4)
      </p>

      {byDate.map(([date, ids]) => (
        <section key={date} className="rise scroll-mt-24">
          {/* Cabecera de fecha — igual que ByDateView */}
          <header className="mb-3 flex items-center gap-3">
            <h3 className="font-display text-base uppercase tracking-wide text-chalk">
              {formatDate(date)}
            </h3>
            <span className="font-cond text-xs text-mist">
              {ids.length} partido{ids.length > 1 ? "s" : ""}
            </span>
            <div className="chalk-rule flex-1" />
          </header>

          {/* Partidos del día */}
          <div className="rounded-xl border border-line overflow-hidden mb-3">
            {ids.map((id, idx) => (
              <KoMatchRow
                key={id}
                matchId={id}
                resultsCtx={resultsCtx}
                existingResult={koScores[id]}
                onResultKoScore={onResultKoScore}
                isLast={idx === ids.length - 1}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
