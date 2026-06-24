import { Trophy, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GROUPS, TEAMS } from "../../core/data/teams";
import { KO_BY_ID, ROUND_LABELS } from "../../core/data/knockoutMatches";
import { resolveKoMatch, koWinner, slotLabel } from "../../lib/polla";
import { Flag, TimeChip, formatDate } from "../../core/ui/atoms";

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
      type="number"
      min="0"
      max="99"
      value={val}
      onChange={(e) => onChange(e.target.value)}
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

function KoCard({ matchId, ctx, onPick, fluid = false, disabled = false }) {
  const k = KO_BY_ID[matchId];
  const { home, away } = resolveKoMatch(matchId, ctx, true);
  const winner = koWinner(matchId, ctx, true);
  const bothKnown = !!home && !!away;

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

  const winnerKey = winner ?? "";
  const teamsKey = `${home ?? ""}-${away ?? ""}`;
  useEffect(() => {
    if (!winner) {
      setRtH(""); setRtA(""); setEtH(""); setEtA(""); setPenH(""); setPenA("");
      setPhase("rt");
    }
  }, [winnerKey, teamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
      timer.current = setTimeout(() => onPick(matchId, code, rtHn, rtAn, null, null), 600);
    } else { setPhase("et"); }
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
      timer.current = setTimeout(() => onPick(matchId, code, rh, ra, etHn, etAn), 600);
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
    timer.current = setTimeout(() => onPick(matchId, code, rh, ra, eh, ea, penHn, penAn), 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [penH, penA, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    setRtH(""); setRtA(""); setEtH(""); setEtA(""); setPenH(""); setPenA("");
    setPhase("rt");
    onPick(matchId, undefined);
  };

  const isRtLocked = phase === "et" || phase === "pen";
  const isEtLocked = phase === "pen";
  const showScoreInputs = bothKnown && !winner && !disabled;

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
          : "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <header className="flex items-center justify-between bg-turf/80 px-2.5 py-1 border-b border-line">
        <span className="font-cond text-[10px] font-semibold uppercase tracking-widest text-mist">
          P{k.m} · {formatDate(k.date, { weekday: false })}
        </span>
        <TimeChip time={k.time} className="text-[10px]" />
      </header>

      <TeamRow
        code={home} placeholder={slotLabel(k.hs)}
        isWinner={!!winner && winner === home}
        isLoser={!!winner && winner !== home && !!home}
        scoreBox={showScoreInputs ? <ScoreBox val={rtH} onChange={setRtH} locked={isRtLocked} amber={isRtLocked} /> : null}
      />
      <PhaseDivider label="90'" draw={isRtLocked} />
      <TeamRow
        code={away} placeholder={slotLabel(k.as)}
        isWinner={!!winner && winner === away}
        isLoser={!!winner && winner !== away && !!away}
        scoreBox={showScoreInputs ? <ScoreBox val={rtA} onChange={setRtA} locked={isRtLocked} amber={isRtLocked} /> : null}
      />

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

      {!!winner && (
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
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gold/40 bg-panel px-5 py-4 text-center shadow-md">
      <Trophy className={`w-12 h-12 text-gold ${champion ? "trophy-shine" : "opacity-30"}`} />
      {champion ? (
        <>
          <div className="flex items-center gap-2">
            <Flag code={champion} className="text-3xl" />
            <span className="font-display text-lg text-gold">{TEAMS[champion].name}</span>
          </div>
          <span className="font-cond text-xs uppercase tracking-[0.25em] text-gold/80">Tu campeón del mundo</span>
          <div className="mt-1 flex flex-col gap-1 font-cond text-sm text-mist">
            {runnerUp && (
              <span className="inline-flex items-center justify-center gap-1.5">
                🥈 <Flag code={runnerUp} className="text-base" /> {TEAMS[runnerUp].name}
              </span>
            )}
            {third && (
              <span className="inline-flex items-center justify-center gap-1.5">
                🥉 <Flag code={third} className="text-base" /> {TEAMS[third].name}
              </span>
            )}
          </div>
        </>
      ) : (
        <span className="font-cond text-sm text-mist max-w-[12rem]">
          Completa tu llave para coronar a tu campeón
        </span>
      )}
    </div>
  );
}

// ── Bracket visual (tabs por fase + horizontal con conectores) ───────────────

const BRACKET_PHASES = [
  { id: "r32", label: "16vos",     leftIds: LEFT.R32,  rightIds: RIGHT.R32  },
  { id: "r16", label: "8vos",   leftIds: LEFT.R16,  rightIds: RIGHT.R16  },
  { id: "qf",  label: "4tos",  leftIds: LEFT.QF,   rightIds: RIGHT.QF   },
  { id: "sf",  label: "Semi",  leftIds: LEFT.SF,   rightIds: RIGHT.SF   },
  { id: "f",   label: "Final",     leftIds: [],        rightIds: []          },
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
      segs.push(
        `M 0 ${yMid} L ${W * 0.4} ${yMid}`,
        `M ${W * 0.4} ${yMid} L ${W * 0.4} ${yTop} L ${W} ${yTop}`,
        `M ${W * 0.4} ${yMid} L ${W * 0.4} ${yBot} L ${W} ${yBot}`
      );
    }
  }
  return (
    <div className="self-stretch shrink-0 relative" style={{ width: W }}>
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        viewBox={`0 0 ${W} 100`} preserveAspectRatio="none">
        {segs.map((d, i) => (
          <path key={i} d={d} stroke="rgba(63,220,129,0.22)" strokeWidth="1.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

function BracketColumn({ ids, ctx, onPick, active = false, disabled = false }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-1 flex-col justify-around gap-3">
        {ids.map((id) => active
          ? <KoCard key={id} matchId={id} ctx={ctx} onPick={onPick} disabled={disabled} />
          : <KoCardSlot key={id} matchId={id} ctx={ctx} />
        )}
      </div>
    </div>
  );
}

function BracketVisual({ ctx, onPick }) {
  const [activePhase, setActivePhase] = useState("r32");
  const groupsLocked = Object.keys(GROUPS).filter((g) => ctx.complete[g]).length < 12;
  return (
    <div>
      {/* Phase tab nav */}
      <div className="flex justify-center mb-5">
        <div className="flex gap-1 rounded-lg border border-line bg-turf/40 p-1 overflow-x-auto">
          {BRACKET_PHASES.map((p) => {
            const pIds = [...p.leftIds, ...p.rightIds];
            const picked = pIds.filter((id) => koWinner(id, ctx, true)).length;
            const isActive = activePhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className={`cursor-pointer rounded-md px-4 py-1.5 font-bold text-[11px] uppercase tracking-wider transition-colors duration-150 focus:outline-none whitespace-nowrap ${
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

      {/* Horizontal bracket */}
      <div className="overflow-x-auto pb-4">
        <div
          className="flex items-stretch w-fit mx-auto"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(63,220,129,0.07) 0%, transparent 70%)" }}
        >
          <BracketColumn ids={LEFT.R32}  ctx={ctx} onPick={onPick} active={activePhase === "r32"} disabled={groupsLocked} />
          <BracketConnector pairCount={4} />
          <BracketColumn ids={LEFT.R16}  ctx={ctx} onPick={onPick} active={activePhase === "r16"} disabled={groupsLocked} />
          <BracketConnector pairCount={2} />
          <BracketColumn ids={LEFT.QF}   ctx={ctx} onPick={onPick} active={activePhase === "qf"}  disabled={groupsLocked} />
          <BracketConnector pairCount={1} />
          <BracketColumn ids={LEFT.SF}   ctx={ctx} onPick={onPick} active={activePhase === "sf"}  disabled={groupsLocked} />
          <BracketConnector pairCount={1} reversed />

          <div className="flex flex-col self-stretch">
            {/* Mitad superior → Final (25%) */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
              <h4 className={`text-center font-display text-sm uppercase tracking-widest ${
                activePhase === "f" ? "text-gold" : "text-gold/40"
              }`}>Final</h4>
              {activePhase === "f"
                ? <KoCard matchId={104} ctx={ctx} onPick={onPick} disabled={groupsLocked} />
                : <KoCardSlot matchId={104} ctx={ctx} />}
            </div>
            {/* Mitad inferior → 3er puesto (75%) */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
              {activePhase === "f" && <Podium ctx={ctx} />}
              <h4 className="text-center font-cond text-xs font-bold uppercase tracking-[0.2em] text-mist/60">
                3er puesto
              </h4>
              {activePhase === "f"
                ? <KoCard matchId={103} ctx={ctx} onPick={onPick} disabled={groupsLocked} />
                : <KoCardSlot matchId={103} ctx={ctx} />}
            </div>
          </div>

          <BracketConnector pairCount={1} />
          <BracketColumn ids={RIGHT.SF}  ctx={ctx} onPick={onPick} active={activePhase === "sf"}  disabled={groupsLocked} />
          <BracketConnector pairCount={1} reversed />
          <BracketColumn ids={RIGHT.QF}  ctx={ctx} onPick={onPick} active={activePhase === "qf"}  disabled={groupsLocked} />
          <BracketConnector pairCount={2} reversed />
          <BracketColumn ids={RIGHT.R16} ctx={ctx} onPick={onPick} active={activePhase === "r16"} disabled={groupsLocked} />
          <BracketConnector pairCount={4} reversed />
          <BracketColumn ids={RIGHT.R32} ctx={ctx} onPick={onPick} active={activePhase === "r32"} disabled={groupsLocked} />
        </div>
      </div>
    </div>
  );
}


// ── Vista principal ───────────────────────────────────────────────────────────

export default function BracketView({ ctx, onPick }) {
  const groupsComplete = Object.keys(GROUPS).filter((g) => ctx.complete[g]).length;
  const allGroupsDone = groupsComplete === 12;

  return (
    <div>
      {!allGroupsDone && (
        <div className="mb-4 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 flex flex-col gap-1">
          <p className="font-cond text-sm text-chalk">
            Los pronósticos de eliminatorias se habilitarán cuando terminen los grupos —{" "}
            <span className="text-amber font-semibold">{groupsComplete}/12 grupos finalizados.</span>
          </p>
          <p className="font-cond text-xs text-mist">
            Puedes explorar el bracket con los equipos que ya clasificaron, pero aún no puedes ingresar resultados.
          </p>
        </div>
      )}
      <BracketVisual ctx={ctx} onPick={onPick} />
    </div>
  );
}
