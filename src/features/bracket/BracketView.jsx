import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, TEAMS } from "../../core/data/teams";
import { KO_BY_ID, ROUND_LABELS } from "../../core/data/knockoutMatches";
import { resolveKoMatch, koWinner, slotLabel } from "../../lib/polla";
import { Flag, TimeChip, formatDate, todayISO } from "../../core/ui/atoms";

const LEFT  = { R32: [74, 77, 73, 75, 83, 84, 81, 82], R16: [89, 90, 93, 94], QF: [97, 98], SF: [101] };
const RIGHT = { R32: [76, 78, 79, 80, 86, 88, 85, 87], R16: [91, 92, 95, 96], QF: [99, 100], SF: [102] };

// ── Subcomponentes ────────────────────────────────────────────────────────────

function PhaseDivider({ label, draw }) {
  return (
    <div className={`flex justify-center py-0.5 border-y ${draw ? "border-amber/30 bg-amber/5" : "border-line/40 bg-turf/30"}`}>
      <span className={`font-cond text-[9px] uppercase tracking-widest border rounded px-1.5 py-0.5 ${
        draw ? "text-amber border-amber/40" : "text-mist/60 border-mist/20"
      }`}>{label}</span>
    </div>
  );
}

function ScoreBox({ val, onChange, locked, amber }) {
  if (locked) {
    return (
      <div className={`w-8 h-7 shrink-0 flex items-center justify-center rounded border ${
        amber ? "border-amber/50 bg-amber/10" : "border-line bg-turf"
      }`}>
        <span className={`font-display text-sm font-bold tabular-nums leading-none ${amber ? "text-amber" : "text-mist/50"}`}>
          {val !== "" ? val : "–"}
        </span>
      </div>
    );
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      value={val}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className="w-8 h-7 shrink-0 text-center rounded border border-line bg-turf text-chalk font-display text-sm font-bold tabular-nums focus:outline-none focus:border-grass/60 focus:ring-1 focus:ring-grass/30"
    />
  );
}

function TeamRow({ code, placeholder, isWinner, isLoser, scoreBox }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 ${isWinner ? "bg-gold/15" : ""}`}>
      {code ? (
        <>
          <Flag code={code} className="text-xl shrink-0" />
          <span className={`font-cond font-semibold text-sm truncate flex-1 ${
            isWinner ? "text-gold" : isLoser ? "text-mist line-through decoration-mist/50" : ""
          }`}>
            {TEAMS[code].name}
          </span>
          {isWinner && !scoreBox && <Check className="ml-auto w-4 h-4 text-gold shrink-0" />}
          {scoreBox}
        </>
      ) : (
        <span className="font-cond text-xs italic text-mist/60 truncate py-0.5 flex-1">{placeholder}</span>
      )}
    </div>
  );
}

// ── KoCard (interactivo) ──────────────────────────────────────────────────────

function KoCard({ matchId, ctx, onPick, fluid = false, disabled = false, koPickScores = {}, koScores = {} }) {
  const k = KO_BY_ID[matchId];
  const { home, away } = resolveKoMatch(matchId, ctx, true);
  const winner = koWinner(matchId, ctx, true);
  const bothKnown = !!home && !!away;
  // Partido bloqueado si ya tiene resultado en BD o si su horario ya pasó (tiempos en UTC-5)
  const matchStarted = new Date(`${k.date}T${k.time}:00-05:00`) < new Date();
  const isPlayed = !!koScores[matchId]?.winner || matchStarted;
  const isToday = k.date === todayISO();
  const saved = koPickScores[matchId];

  const [rtH, setRtH] = useState("");
  const [rtA, setRtA] = useState("");
  const [etH, setEtH] = useState("");
  const [etA, setEtA] = useState("");
  const [penH, setPenH] = useState("");
  const [penA, setPenA] = useState("");
  const [phase, setPhase] = useState("rt");
  const [flash, setFlash] = useState(false);
  const timer = useRef(null);
  const prevWinnerRef = useRef(winner);
  const restoringRef = useRef(false);

  const teamsKey = `${home ?? ""}-${away ?? ""}`;
  useEffect(() => {
    // Solo limpiar cuando cambian los equipos, no cuando se borra el ganador
    setRtH(""); setRtA(""); setEtH(""); setEtA(""); setPenH(""); setPenA("");
    setPhase("rt");
  }, [teamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (winner && !prevWinnerRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 650);
      return () => clearTimeout(t);
    }
    prevWinnerRef.current = winner;
  }, [winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const rtHn = parseInt(rtH, 10), rtAn = parseInt(rtA, 10);
  const rtValid = rtH !== "" && rtA !== "" && !isNaN(rtHn) && !isNaN(rtAn);
  useEffect(() => {
    if (!rtValid || !bothKnown || !!winner) return;
    if (timer.current) clearTimeout(timer.current);
    if (rtHn !== rtAn) {
      const code = rtHn > rtAn ? home : away;
      timer.current = setTimeout(() => {
        if (!restoringRef.current) onPick(matchId, code, rtHn, rtAn, null, null);
      }, 600);
    } else if (phase === "rt") { setPhase("et"); }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [rtH, rtA]); // eslint-disable-line react-hooks/exhaustive-deps

  const etHn = parseInt(etH, 10), etAn = parseInt(etA, 10);
  const etValid = etH !== "" && etA !== "" && !isNaN(etHn) && !isNaN(etAn);
  useEffect(() => {
    if (phase !== "et" || !etValid || !bothKnown || !!winner) return;
    if (timer.current) clearTimeout(timer.current);
    if (etHn !== etAn) {
      const code = etHn > etAn ? home : away;
      const rh = parseInt(rtH, 10), ra = parseInt(rtA, 10);
      timer.current = setTimeout(() => {
        if (!restoringRef.current) onPick(matchId, code, rh, ra, etHn, etAn);
      }, 600);
    } else { setPhase("pen"); }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [etH, etA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const penHn = parseInt(penH, 10), penAn = parseInt(penA, 10);
  const penValid = penH !== "" && penA !== "" && !isNaN(penHn) && !isNaN(penAn);
  useEffect(() => {
    if (phase !== "pen" || !penValid || !bothKnown || !!winner || penHn === penAn) return;
    const code = penHn > penAn ? home : away;
    const rh = parseInt(rtH, 10), ra = parseInt(rtA, 10);
    const eh = parseInt(etH, 10), ea = parseInt(etA, 10);
    timer.current = setTimeout(() => {
      if (!restoringRef.current) onPick(matchId, code, rh, ra, eh, ea, penHn, penAn);
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [penH, penA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    restoringRef.current = true;
    setTimeout(() => { restoringRef.current = false; }, 700);
    setRtH(saved?.rtHome != null ? String(saved.rtHome) : "");
    setRtA(saved?.rtAway != null ? String(saved.rtAway) : "");
    setEtH(saved?.etHome != null ? String(saved.etHome) : "");
    setEtA(saved?.etAway != null ? String(saved.etAway) : "");
    setPenH(saved?.penHome != null ? String(saved.penHome) : "");
    setPenA(saved?.penAway != null ? String(saved.penAway) : "");
    setPhase(saved?.penHome != null ? "pen" : saved?.etHome != null ? "et" : "rt");
    onPick(matchId, undefined);
  };

  const isRtLocked = phase === "et" || phase === "pen";
  const isEtLocked = phase === "pen";
  // Inputs activos solo si: equipos conocidos, sin ganador, partido no jugado, no deshabilitado
  const showScoreInputs = bothKnown && !winner && !isPlayed && !disabled;
  // Mostrar marcadores guardados en modo solo lectura cuando hay ganador elegido
  const showSavedScores = !!winner && saved?.rtHome != null;
  // Botón cambiar solo para partidos no jugados (los jugados ya están cerrados)
  const showCambiar = !!winner && !isPlayed;

  return (
    <div
      className={`${fluid ? "w-full" : "w-44 shrink-0"} overflow-hidden rounded-lg backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}
      style={{
        backgroundImage: [
          "linear-gradient(rgba(12,32,20,0.82), rgba(12,32,20,0.82))",
          "linear-gradient(135deg, rgba(63,220,129,0.2) 0%, rgba(255,255,255,0.03) 50%, rgba(238,200,94,0.15) 100%)",
        ].join(", "),
        backgroundOrigin: "padding-box, border-box",
        backgroundClip: "padding-box, border-box",
        border: "1px solid transparent",
        boxShadow: flash
          ? "inset 3px 0 0 #3fdc81, 0 0 0 2px rgba(63,220,129,0.35), 0 8px 24px rgba(63,220,129,0.15)"
          : winner
          ? "inset 3px 0 0 rgba(238,200,94,0.75), 0 4px 16px rgba(0,0,0,0.4)"
          : isToday && !isPlayed
          ? "inset 3px 0 0 rgba(240,192,64,0.9), 0 0 0 1px rgba(240,192,64,0.3), 0 4px 16px rgba(240,192,64,0.12)"
          : "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <header className="flex items-center justify-between bg-turf/80 px-2.5 py-1 border-b border-line">
        <span className="font-cond text-[10px] font-semibold uppercase tracking-widest text-mist flex items-center gap-1.5">
          P{k.m} · {formatDate(k.date, { weekday: false })}
          {isToday && !isPlayed && (
            <span className="rounded-full bg-amber/20 border border-amber/50 text-amber px-1.5 py-px text-[9px] font-bold uppercase tracking-widest leading-none">Hoy</span>
          )}
        </span>
        <TimeChip time={k.time} className="text-[10px]" />
      </header>

      <TeamRow
        code={home} placeholder={slotLabel(k.hs)}
        isWinner={!!winner && winner === home}
        isLoser={!!winner && winner !== home && !!home}
        scoreBox={
          showScoreInputs ? <ScoreBox val={rtH} onChange={setRtH} locked={isRtLocked} amber={isRtLocked} /> :
          showSavedScores ? <ScoreBox val={String(saved.rtHome)} onChange={() => {}} locked amber={false} /> :
          null
        }
      />
      <PhaseDivider label="90'" draw={isRtLocked || (showSavedScores && saved.etHome != null)} />
      <TeamRow
        code={away} placeholder={slotLabel(k.as)}
        isWinner={!!winner && winner === away}
        isLoser={!!winner && winner !== away && !!away}
        scoreBox={
          showScoreInputs ? <ScoreBox val={rtA} onChange={setRtA} locked={isRtLocked} amber={isRtLocked} /> :
          showSavedScores ? <ScoreBox val={String(saved.rtAway)} onChange={() => {}} locked amber={false} /> :
          null
        }
      />

      {/* Inputs activos — ET */}
      {showScoreInputs && (phase === "et" || phase === "pen") && (
        <>
          <PhaseDivider label="AET — marcador total" draw={isEtLocked} />
          <TeamRow code={home} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={etH} onChange={setEtH} locked={isEtLocked} amber={isEtLocked} />} />
          <div className="h-px bg-line/40" />
          <TeamRow code={away} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={etA} onChange={setEtA} locked={isEtLocked} amber={isEtLocked} />} />
        </>
      )}
      {showScoreInputs && phase === "pen" && (
        <>
          <PhaseDivider label="PEN — tanda (ej. 5-4)" draw={false} />
          <TeamRow code={home} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={penH} onChange={setPenH} locked={false} amber={false} />} />
          <div className="h-px bg-line/40" />
          <TeamRow code={away} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={penA} onChange={setPenA} locked={false} amber={false} />} />
        </>
      )}

      {/* Marcadores guardados en modo solo lectura — ET */}
      {showSavedScores && saved.etHome != null && (
        <>
          <PhaseDivider label="AET — marcador total" draw={saved.penHome != null} />
          <TeamRow code={home} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={String(saved.etHome)} onChange={() => {}} locked amber />} />
          <div className="h-px bg-line/40" />
          <TeamRow code={away} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={String(saved.etAway)} onChange={() => {}} locked amber />} />
        </>
      )}
      {showSavedScores && saved.penHome != null && (
        <>
          <PhaseDivider label="PEN — tanda (ej. 5-4)" draw={false} />
          <TeamRow code={home} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={String(saved.penHome)} onChange={() => {}} locked amber={false} />} />
          <div className="h-px bg-line/40" />
          <TeamRow code={away} isWinner={false} isLoser={false}
            scoreBox={<ScoreBox val={String(saved.penAway)} onChange={() => {}} locked amber={false} />} />
        </>
      )}

      {/* Sin pronóstico — partido ya jugado */}
      {isPlayed && !winner && bothKnown && (
        <div className="px-2.5 py-1 border-t border-line/30">
          <span className="font-cond text-[10px] text-mist/35 italic">sin pronóstico</span>
        </div>
      )}

      {showCambiar && (
        <button onClick={clear}
          className="w-full py-1 font-cond text-[10px] text-mist/40 hover:text-mist cursor-pointer transition-colors text-center border-t border-line/40">
          cambiar ×
        </button>
      )}
      <footer className="px-2.5 py-1 border-t border-line/60">
        <span className="font-cond text-[10px] uppercase tracking-wider text-mist/70 truncate block">
          {k.stadium} · {k.city}
        </span>
      </footer>
    </div>
  );
}

// ── Podium ────────────────────────────────────────────────────────────────────

function Podium({ ctx }) {
  const champion = koWinner(104, ctx, true);
  const final = resolveKoMatch(104, ctx, true);
  const runnerUp = champion ? (champion === final.home ? final.away : final.home) : null;
  const third = koWinner(103, ctx);

  return (
    <div className="relative w-44">
      {/* Trophy image con padding */}
      <div className="p-4">
        <img
          src={`${import.meta.env.BASE_URL}images/2026_FIFA_World_Cup.webp`}
          alt="FIFA World Cup 2026"
          className="w-full h-auto object-contain block mix-blend-multiply"
          draggable={false}
        />
      </div>
      {/* Winner overlay at bottom */}
      <div className="absolute inset-0 flex flex-col items-center justify-end from-night/95 to-transparent gap-1">
        {champion ? (
          <>
            <div className="flex items-center gap-1.5">
              <Flag code={champion} className="text-xl" />
              <span className="font-display text-base text-gold leading-tight">{TEAMS[champion].name}</span>
            </div>
            <span className="font-cond text-[10px] uppercase tracking-[0.2em] text-gold/70">Tu campeón</span>
            <div className="flex flex-col items-center gap-0.5 font-cond text-xs text-mist mt-0.5">
              {runnerUp && (
                <span className="inline-flex items-center gap-1">
                  🥈 <Flag code={runnerUp} className="text-sm" /> {TEAMS[runnerUp].name}
                </span>
              )}
              {third && (
                <span className="inline-flex items-center gap-1">
                  🥉 <Flag code={third} className="text-sm" /> {TEAMS[third].name}
                </span>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── Bracket visual (tabs por fase + horizontal con conectores) ───────────────

const BRACKET_PHASES = [
  { id: "r32", label: "16vos", leftIds: LEFT.R32, rightIds: RIGHT.R32, mobileIds: [...LEFT.R32, ...RIGHT.R32] },
  { id: "r16", label: "8vos",  leftIds: LEFT.R16, rightIds: RIGHT.R16, mobileIds: [...LEFT.R16, ...RIGHT.R16] },
  { id: "qf",  label: "4tos",  leftIds: LEFT.QF,  rightIds: RIGHT.QF,  mobileIds: [...LEFT.QF,  ...RIGHT.QF]  },
  { id: "sf",  label: "Semi",  leftIds: LEFT.SF,  rightIds: RIGHT.SF,  mobileIds: [...LEFT.SF,  ...RIGHT.SF]  },
  { id: "f",   label: "Final", leftIds: [],        rightIds: [],        mobileIds: [104, 103]                  },
];

// Slot mini para fases inactivas: solo bandera + nombre o placeholder
function KoCardSlot({ matchId, ctx }) {
  const k = KO_BY_ID[matchId];
  const { home, away } = resolveKoMatch(matchId, ctx, true);
  const winner = koWinner(matchId, ctx, true);

  const Row = ({ code, label }) => (
    <div className={`flex items-center gap-1 px-1.5 py-1.5 ${winner === code ? "bg-gold/10" : ""}`}>
      {code ? (
        <>
          <Flag code={code} className="text-base shrink-0" />
          <span className={`font-cond text-xs truncate flex-1 ${
            winner === code ? "text-gold" : winner ? "text-mist/35" : "text-chalk/70"
          }`}>{TEAMS[code].name}</span>
        </>
      ) : (
        <span className="text-[11px] italic text-mist/40 truncate py-0.5 flex-1">{label}</span>
      )}
    </div>
  );

  return (
    <div
      className="w-20 shrink-0 overflow-hidden rounded border border-line/25 bg-turf/50"
      style={{ boxShadow: winner ? "inset 2px 0 0 rgba(238,200,94,0.4)" : undefined }}
    >
      <Row code={home} label={slotLabel(k.hs)} />
      <div className="h-px bg-line/20" />
      <Row code={away} label={slotLabel(k.as)} />
    </div>
  );
}

function BracketConnector({ pairCount, reversed = false }) {
  const W = 30;
  const segs = [];
  const N = pairCount * 2;
  for (let j = 0; j < pairCount; j++) {
    const yTop = ((2 * j + 0.5) / N) * 100;
    const yBot = ((2 * j + 1.5) / N) * 100;
    const yMid = (yTop + yBot) / 2;
    if (!reversed) {
      segs.push(
        `M 0 ${yTop} L ${W * 0.6} ${yTop} L ${W * 0.6} ${yMid}`,
        `M 0 ${yBot} L ${W * 0.6} ${yBot} L ${W * 0.6} ${yMid}`,
        `M ${W * 0.6} ${yMid} L ${W} ${yMid}`
      );
    } else {
      // Drawn outer→center (right→left) so dashoffset flows toward trophy
      segs.push(
        `M ${W} ${yTop} L ${W * 0.4} ${yTop} L ${W * 0.4} ${yMid}`,
        `M ${W} ${yBot} L ${W * 0.4} ${yBot} L ${W * 0.4} ${yMid}`,
        `M ${W * 0.4} ${yMid} L 0 ${yMid}`
      );
    }
  }

  const shared = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" };

  return (
    <div className="self-stretch shrink-0 relative" style={{ width: W }}>
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }}
        viewBox={`0 0 ${W} 100`} preserveAspectRatio="none"
      >
        {/* Outer halo — wide soft gold bloom */}
        {segs.map((d, i) => (
          <path key={`h${i}`} d={d} stroke="rgba(238,200,94,0.07)" strokeWidth="7" {...shared} />
        ))}
        {/* Mid glow */}
        {segs.map((d, i) => (
          <path key={`m${i}`} d={d} stroke="rgba(238,200,94,0.13)" strokeWidth="3" {...shared} />
        ))}
        {/* Core line */}
        {segs.map((d, i) => (
          <path key={`c${i}`} d={d} stroke="rgba(238,200,94,0.35)" strokeWidth="1" {...shared} />
        ))}
        {/* Animated dashes — bright core with neon drop-shadow */}
        <g style={{ filter: "drop-shadow(0 0 2px rgba(238,200,94,0.95)) drop-shadow(0 0 5px rgba(238,200,94,0.5))" }}>
          {segs.map((d, i) => (
            <path key={`f${i}`} d={d} stroke="rgba(238,200,94,1)" strokeWidth="1.5" {...shared}
              strokeDasharray="2 6"
              className="bracket-flow-path"
              style={{ animation: "bracket-flow 0.9s linear infinite" }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function BracketColumn({ ids, ctx, onPick, active = false, disabled = false, koPickScores = {}, koScores = {} }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-1 flex-col justify-around gap-3">
        {ids.map((id) => active
          ? <KoCard key={id} matchId={id} ctx={ctx} onPick={onPick} disabled={disabled} koPickScores={koPickScores} koScores={koScores} />
          : <KoCardSlot key={id} matchId={id} ctx={ctx} />
        )}
      </div>
    </div>
  );
}

function KoListRow({ matchId, ctx, onPick, disabled = false, koPickScores = {}, koScores = {}, isLast }) {
  const k = KO_BY_ID[matchId];
  const { home, away } = resolveKoMatch(matchId, ctx, true);
  const winner = koWinner(matchId, ctx, true);
  const bothKnown = !!home && !!away;
  const matchStarted = new Date(`${k.date}T${k.time}:00-05:00`) < new Date();
  const isPlayed = !!koScores[matchId]?.winner || matchStarted;
  const saved = koPickScores[matchId];
  const res = koScores[matchId] ?? null;

  const [rtH, setRtH] = useState("");
  const [rtA, setRtA] = useState("");
  const [etH, setEtH] = useState("");
  const [etA, setEtA] = useState("");
  const [penH, setPenH] = useState("");
  const [penA, setPenA] = useState("");
  const [phase, setPhase] = useState("rt");
  const timer = useRef(null);
  const restoringRef = useRef(false);

  const teamsKey = `${home ?? ""}-${away ?? ""}`;
  useEffect(() => {
    setRtH(""); setRtA(""); setEtH(""); setEtA(""); setPenH(""); setPenA(""); setPhase("rt");
  }, [teamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const rtHn = parseInt(rtH, 10), rtAn = parseInt(rtA, 10);
  const rtValid = rtH !== "" && rtA !== "" && !isNaN(rtHn) && !isNaN(rtAn);
  useEffect(() => {
    if (!rtValid || !bothKnown || !!winner) return;
    if (timer.current) clearTimeout(timer.current);
    if (rtHn !== rtAn) {
      const code = rtHn > rtAn ? home : away;
      timer.current = setTimeout(() => { if (!restoringRef.current) onPick(matchId, code, rtHn, rtAn, null, null); }, 600);
    } else if (phase === "rt") { setPhase("et"); }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [rtH, rtA]); // eslint-disable-line react-hooks/exhaustive-deps

  const etHn = parseInt(etH, 10), etAn = parseInt(etA, 10);
  const etValid = etH !== "" && etA !== "" && !isNaN(etHn) && !isNaN(etAn);
  useEffect(() => {
    if (phase !== "et" || !etValid || !bothKnown || !!winner) return;
    if (timer.current) clearTimeout(timer.current);
    if (etHn !== etAn) {
      const code = etHn > etAn ? home : away;
      timer.current = setTimeout(() => { if (!restoringRef.current) onPick(matchId, code, parseInt(rtH,10), parseInt(rtA,10), etHn, etAn); }, 600);
    } else { setPhase("pen"); }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [etH, etA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const penHn = parseInt(penH, 10), penAn = parseInt(penA, 10);
  const penValid = penH !== "" && penA !== "" && !isNaN(penHn) && !isNaN(penAn);
  useEffect(() => {
    if (phase !== "pen" || !penValid || !bothKnown || !!winner || penHn === penAn) return;
    const code = penHn > penAn ? home : away;
    timer.current = setTimeout(() => { if (!restoringRef.current) onPick(matchId, code, parseInt(rtH,10), parseInt(rtA,10), parseInt(etH,10), parseInt(etA,10), penHn, penAn); }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [penH, penA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    restoringRef.current = true;
    setTimeout(() => { restoringRef.current = false; }, 700);
    setRtH(saved?.rtHome != null ? String(saved.rtHome) : "");
    setRtA(saved?.rtAway != null ? String(saved.rtAway) : "");
    setEtH(saved?.etHome != null ? String(saved.etHome) : "");
    setEtA(saved?.etAway != null ? String(saved.etAway) : "");
    setPenH(saved?.penHome != null ? String(saved.penHome) : "");
    setPenA(saved?.penAway != null ? String(saved.penAway) : "");
    setPhase(saved?.penHome != null ? "pen" : saved?.etHome != null ? "et" : "rt");
    onPick(matchId, undefined);
  };

  const isRtLocked = phase === "et" || phase === "pen";
  const isEtLocked = phase === "pen";
  const showInputs = bothKnown && !winner && !isPlayed && !disabled;
  const showSaved = !!winner && saved?.rtHome != null;
  const showCambiar = !!winner && !isPlayed;

  // Center: resultado oficial o inputs/pronóstico guardado
  const center = res ? (
    // Partido jugado — mostrar resultado oficial + predicción del jugador
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-grass/50 bg-turf shadow-inner">
          <span className="font-display text-lg font-bold text-grass tabular-nums leading-none">{res.rtHome}</span>
        </div>
        <span className="font-cond text-[8px] uppercase tracking-widest text-grass border border-grass/40 rounded px-1 py-px">FT</span>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-grass/50 bg-turf shadow-inner">
          <span className="font-display text-lg font-bold text-grass tabular-nums leading-none">{res.rtAway}</span>
        </div>
      </div>
      {res.etHome != null && (
        <div className="flex items-center gap-1">
          <span className="font-display text-xs font-bold text-amber tabular-nums">{res.etHome}</span>
          <span className="font-cond text-[8px] text-amber border border-amber/40 rounded px-0.5 py-px">AET</span>
          <span className="font-display text-xs font-bold text-amber tabular-nums">{res.etAway}</span>
        </div>
      )}
      {res.penHome != null && (
        <div className="flex items-center gap-1">
          <span className="font-display text-xs font-bold text-gold tabular-nums">{res.penHome}</span>
          <span className="font-cond text-[8px] text-gold border border-gold/40 rounded px-0.5 py-px">PEN</span>
          <span className="font-display text-xs font-bold text-gold tabular-nums">{res.penAway}</span>
        </div>
      )}
      {saved?.rtHome != null && (() => {
        const exact = saved.rtHome === res.rtHome && saved.rtAway === res.rtAway;
        const outcome = !exact && Math.sign(saved.rtHome - saved.rtAway) === Math.sign(res.rtHome - res.rtAway);
        const dot = exact ? "bg-grass" : outcome ? "bg-gold" : "bg-red-400/80";
        return (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-cond text-[10px] tabular-nums text-chalk">{saved.rtHome}–{saved.rtAway}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          </div>
        );
      })()}
    </div>
  ) : showInputs ? (
    // Partido no jugado — inputs activos
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <ScoreBox val={rtH} onChange={setRtH} locked={isRtLocked} />
        <span className="font-cond text-[8px] uppercase tracking-widest text-mist/40 border border-mist/15 rounded px-1 py-px">
          {phase === "et" ? "AET" : phase === "pen" ? "PEN" : "RT"}
        </span>
        <ScoreBox val={rtA} onChange={setRtA} locked={isRtLocked} />
      </div>
      {(phase === "et" || phase === "pen") && (
        <div className="flex items-center gap-1">
          <ScoreBox val={etH} onChange={setEtH} locked={isEtLocked} amber />
          <span className="font-cond text-[8px] text-amber border border-amber/30 rounded px-0.5 py-px">AET</span>
          <ScoreBox val={etA} onChange={setEtA} locked={isEtLocked} amber />
        </div>
      )}
      {phase === "pen" && (
        <div className="flex items-center gap-1">
          <ScoreBox val={penH} onChange={setPenH} locked={false} amber={false} />
          <span className="font-cond text-[8px] text-gold border border-gold/30 rounded px-0.5 py-px">PEN</span>
          <ScoreBox val={penA} onChange={setPenA} locked={false} amber={false} />
        </div>
      )}
    </div>
  ) : showSaved ? (
    // Ganador elegido, solo lectura
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <ScoreBox val={String(saved.rtHome)} onChange={() => {}} locked />
        <span className="font-cond text-[8px] uppercase tracking-widest text-mist/40 border border-mist/15 rounded px-1 py-px">RT</span>
        <ScoreBox val={String(saved.rtAway)} onChange={() => {}} locked />
      </div>
      {showCambiar && (
        <button onClick={clear} className="font-cond text-[9px] text-mist/40 hover:text-mist cursor-pointer transition-colors">cambiar ×</button>
      )}
    </div>
  ) : (
    <span className="font-cond text-[9px] uppercase tracking-widest text-mist/30 border border-mist/15 rounded px-1 py-0.5">VS</span>
  );

  const homeName = home ? (TEAMS[home]?.name ?? home) : null;
  const awayName = away ? (TEAMS[away]?.name ?? away) : null;

  return (
    <div className={`bg-panel px-4 ${isLast ? "" : "border-b border-line/40"}`}>
      <div className="py-2 flex items-center gap-3">
        <TimeChip date={k.date} time={k.time} className="text-[11px] w-[4.5rem] shrink-0 justify-center" />
        <div className="flex-1 min-w-0" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", alignItems: "center", columnGap: "0.5rem" }}>
          <div className="flex items-center justify-end gap-1.5 min-w-0">
            <span className={`font-cond font-semibold text-sm flex-1 min-w-0 text-right truncate ${winner && winner === home ? "text-gold" : winner && home ? "text-mist line-through decoration-mist/50" : ""}`}>
              {homeName ?? <span className="text-mist/40 italic font-normal">{k.hs ? `1° Gr.${k.hs[1]}` : "—"}</span>}
            </span>
            {home && <Flag code={home} className="shrink-0 text-xl leading-none" />}
          </div>
          {center}
          <div className="flex items-center gap-1.5 min-w-0">
            {away && <Flag code={away} className="shrink-0 text-xl leading-none" />}
            <span className={`font-cond font-semibold text-sm flex-1 min-w-0 truncate ${winner && winner === away ? "text-gold" : winner && away ? "text-mist line-through decoration-mist/50" : ""}`}>
              {awayName ?? <span className="text-mist/40 italic font-normal">{k.as ? `2° Gr.${k.as[1]}` : "—"}</span>}
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:flex sm:flex-col sm:items-end w-[130px] shrink-0">
          <p className="font-cond text-xs text-mist leading-tight truncate">{k.stadium}</p>
          <p className="font-cond text-[10px] uppercase tracking-wider text-mist/60 truncate">{k.city}</p>
        </div>
      </div>
    </div>
  );
}

function MobileBracketByDate({ ids, ctx, onPick, disabled, koPickScores, koScores }) {
  const today = todayISO();
  const focusRef = useRef(null);

  const byDate = useMemo(() => {
    const sorted = ids
      .map(id => ({ id, ...KO_BY_ID[id] }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const map = new Map();
    for (const m of sorted) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m.id);
    }
    return [...map.entries()];
  }, [ids]);

  const [collapsed, setCollapsed] = useState(
    () => new Set(byDate.map(([d]) => d).filter(d => d < today))
  );

  const focusDate = useMemo(() => {
    const dates = byDate.map(([d]) => d);
    if (dates.includes(today)) return today;
    return dates.find(d => d > today) ?? dates[dates.length - 1];
  }, [byDate, today]);

  useEffect(() => {
    setCollapsed(new Set(byDate.map(([d]) => d).filter(d => d < today)));
  }, [byDate, today]);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggle = (date) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(date) ? next.delete(date) : next.add(date);
    return next;
  });

  return (
    <div className="space-y-5">
      {byDate.map(([date, matchIds]) => {
        const isToday = date === today;
        const isFocus = date === focusDate;
        const isPast = date < today;
        const isCollapsed = collapsed.has(date);
        return (
          <section key={date} ref={isFocus ? focusRef : null} className="scroll-mt-20">
            <header
              className={`sticky top-[3.4rem] z-10 mb-3 flex items-center gap-2 bg-night/95 backdrop-blur-sm py-1.5 ${isPast ? "cursor-pointer select-none" : ""}`}
              onClick={isPast ? () => toggle(date) : undefined}
            >
              <h3 className={`font-display text-sm uppercase tracking-wide ${isToday ? "text-grass" : "text-chalk"}`}>
                {formatDate(date)}
              </h3>
              {isToday && (
                <span className="rounded-full bg-grass text-night px-2 py-px font-cond text-[10px] font-bold uppercase tracking-widest">Hoy</span>
              )}
              <span className="font-cond text-xs text-mist">{matchIds.length}p</span>
              <div className="chalk-rule flex-1" />
              {isPast && (
                <ChevronDown
                  className="w-4 h-4 text-mist/60 shrink-0 transition-transform duration-300"
                  style={{ transform: isCollapsed ? "rotate(90deg)" : "rotate(0deg)" }}
                />
              )}
            </header>
            <div style={{ display: "grid", gridTemplateRows: isCollapsed ? "0fr" : "1fr", transition: "grid-template-rows 300ms ease" }}>
              <div style={{ overflow: "hidden" }}>
                <div className="rounded-xl border border-line overflow-hidden">
                  {matchIds.map((id, idx) => (
                    <KoListRow key={id} matchId={id} ctx={ctx} onPick={onPick} disabled={disabled} koPickScores={koPickScores} koScores={koScores} isLast={idx === matchIds.length - 1} />
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

function BracketVisual({ ctx, onPick, koPickScores = {}, koScores = {} }) {
  const [activePhase, setActivePhase] = useState("r32");
  const [mobileView, setMobileView] = useState(() => window.innerWidth >= 768 ? "llave" : "lista");
  const groupsLocked = Object.keys(GROUPS).filter((g) => ctx.complete[g]).length < 12;
  return (
    <div>
      {/* Toggle vista: Lista / Llave */}
      <div className="flex justify-center mb-4">
        <div className="flex gap-1 rounded-full border border-line bg-turf/40 p-1">
          {[{ id: "lista", label: "Lista" }, { id: "llave", label: "Llave" }].map(v => (
            <button
              key={v.id}
              onClick={() => setMobileView(v.id)}
              className={`cursor-pointer rounded-full px-5 py-1.5 font-cond font-bold text-sm uppercase tracking-wider transition-colors duration-150 focus:outline-none ${
                mobileView === v.id ? "bg-gold text-night" : "text-mist hover:text-chalk"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Phase tab nav */}
      <div className="overflow-x-auto mb-5 scrollbar-hide">
        <div className="flex gap-1 rounded-lg border border-line bg-turf/40 p-1 w-max mx-auto">
          {BRACKET_PHASES.map((p) => {
            const pIds = [...p.leftIds, ...p.rightIds];
            const picked = pIds.filter((id) => koWinner(id, ctx, true)).length;
            const isActive = activePhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className={`cursor-pointer rounded-md px-4 py-1.5 font-bold text-sm uppercase tracking-wider transition-colors duration-150 focus:outline-none whitespace-nowrap ${
                  isActive ? "bg-gold text-night" : "text-mist hover:text-chalk"
                }`}
              >
                {p.label}
                {pIds.length > 0 && (
                  <span className={`ml-1.5 font-cond text-[10px] tabular-nums ${
                    isActive ? "text-night/60" : picked === pIds.length ? "text-grass" : "text-mist/50"
                  }`}>{picked}/{pIds.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile */}
      {(() => {
        const phase = BRACKET_PHASES.find(p => p.id === activePhase);
        const leftIds  = phase?.leftIds  ?? [];
        const rightIds = phase?.rightIds ?? [];
        const isFinal  = activePhase === "f";
        const allIds   = [...leftIds, ...rightIds];
        return (
          <div key={`mob-${activePhase}-${mobileView}`} className={`${mobileView === "lista" ? "block" : "md:hidden"} phase-enter`}>
            {isFinal ? (
              <div className="flex flex-col gap-3">
                <KoCard matchId={104} ctx={ctx} onPick={onPick} disabled={groupsLocked} fluid koPickScores={koPickScores} koScores={koScores} />
                <KoCard matchId={103} ctx={ctx} onPick={onPick} disabled={groupsLocked} fluid koPickScores={koPickScores} koScores={koScores} />
                <div className="flex justify-center pt-2"><Podium ctx={ctx} /></div>
              </div>
            ) : mobileView === "lista" ? (
              <MobileBracketByDate
                ids={allIds}
                ctx={ctx}
                onPick={onPick}
                disabled={groupsLocked}
                koPickScores={koPickScores}
                koScores={koScores}
              />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-3">
                  {leftIds.map(id => <KoCard key={id} matchId={id} ctx={ctx} onPick={onPick} disabled={groupsLocked} fluid koPickScores={koPickScores} koScores={koScores} />)}
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {rightIds.map(id => <KoCard key={id} matchId={id} ctx={ctx} onPick={onPick} disabled={groupsLocked} fluid koPickScores={koPickScores} koScores={koScores} />)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Desktop: horizontal bracket (solo en vista Llave) */}
      <div key={activePhase} className={`${mobileView === "llave" ? "block" : "hidden"} overflow-x-auto pb-4 phase-enter`}>
        <div
          className="flex items-stretch w-fit mx-auto"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(63,220,129,0.07) 0%, transparent 70%)" }}
        >
          <BracketColumn ids={LEFT.R32}  ctx={ctx} onPick={onPick} active={activePhase === "r32"} disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={4} />
          <BracketColumn ids={LEFT.R16}  ctx={ctx} onPick={onPick} active={activePhase === "r16"} disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={2} />
          <BracketColumn ids={LEFT.QF}   ctx={ctx} onPick={onPick} active={activePhase === "qf"}  disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={1} />
          <BracketColumn ids={LEFT.SF}   ctx={ctx} onPick={onPick} active={activePhase === "sf"}  disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={1} reversed />

          <div className="flex flex-col self-stretch relative min-h-[72rem]">
            {/* Copa — absoluta en el centro en todas las fases */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
              {activePhase === "f"
                ? <Podium ctx={ctx} />
                : <img
                    src={`${import.meta.env.BASE_URL}images/2026_FIFA_World_Cup.webp`}
                    alt=""
                    aria-hidden="true"
                    className="w-16 h-auto object-contain mix-blend-multiply"
                    draggable={false}
                  />
              }
            </div>

            {/* Final — mitad superior, centrada en su mitad → conector apunta al 25% */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
              <h4 className={`text-center font-display text-sm uppercase tracking-widest ${
                activePhase === "f" ? "text-gold" : "text-gold/40"
              }`}>Final</h4>
              {activePhase === "f"
                ? <KoCard matchId={104} ctx={ctx} onPick={onPick} disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
                : <KoCardSlot matchId={104} ctx={ctx} />}
            </div>

            {/* 3er puesto — mitad inferior, centrada en su mitad → conector apunta al 75% */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
              <h4 className="text-center font-cond text-xs font-bold uppercase tracking-[0.2em] text-mist/60">
                3er puesto
              </h4>
              {activePhase === "f"
                ? <KoCard matchId={103} ctx={ctx} onPick={onPick} disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
                : <KoCardSlot matchId={103} ctx={ctx} />}
            </div>
          </div>

          <BracketConnector pairCount={1} />
          <BracketColumn ids={RIGHT.SF}  ctx={ctx} onPick={onPick} active={activePhase === "sf"}  disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={1} reversed />
          <BracketColumn ids={RIGHT.QF}  ctx={ctx} onPick={onPick} active={activePhase === "qf"}  disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={2} reversed />
          <BracketColumn ids={RIGHT.R16} ctx={ctx} onPick={onPick} active={activePhase === "r16"} disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
          <BracketConnector pairCount={4} reversed />
          <BracketColumn ids={RIGHT.R32} ctx={ctx} onPick={onPick} active={activePhase === "r32"} disabled={groupsLocked} koPickScores={koPickScores} koScores={koScores} />
        </div>
      </div>
    </div>
  );
}


// ── Vista principal ───────────────────────────────────────────────────────────

export default function BracketView({ ctx, onPick, koPickScores = {}, koScores = {} }) {
  const groupsComplete = Object.keys(GROUPS).filter((g) => ctx.complete[g]).length;
  const allGroupsDone = groupsComplete === 12;

  return (
    <div>
      <BracketVisual ctx={ctx} onPick={onPick} koPickScores={koPickScores} koScores={koScores} />
      {!allGroupsDone && (
        <div className="mt-4 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 flex flex-col gap-1">
          <p className="font-cond text-sm text-chalk">
            Los pronósticos de eliminatorias se habilitarán cuando terminen los grupos —{" "}
            <span className="text-amber font-semibold">{groupsComplete}/12 grupos finalizados.</span>
          </p>
          <p className="font-cond text-xs text-mist">
            Puedes explorar el bracket con los equipos que ya clasificaron, pero aún no puedes ingresar resultados.
          </p>
        </div>
      )}
    </div>
  );
}
