import { Trophy, Check } from "lucide-react";
import { GROUPS, TEAMS } from "../../core/data/teams";
import { KO_BY_ID, ROUND_LABELS } from "../../core/data/knockoutMatches";
import { resolveKoMatch, koWinner, slotLabel } from "../../lib/polla";
import { Flag, TimeChip, formatDate } from "../../core/ui/atoms";

// Mitades del cuadro: arriba alimenta la semifinal 101, abajo la 102.
const LEFT = { R32: [74, 77, 73, 75, 83, 84, 81, 82], R16: [89, 90, 93, 94], QF: [97, 98], SF: [101] };
const RIGHT = { R32: [76, 78, 79, 80, 86, 88, 85, 87], R16: [91, 92, 95, 96], QF: [99, 100], SF: [102] };

function TeamButton({ code, placeholder, picked, eliminated, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass ${
        disabled ? "cursor-default" : "cursor-pointer hover:bg-panel-2"
      } ${picked ? "bg-gold/15" : ""}`}
      title={code ? `Marcar a ${TEAMS[code].name} como ganador` : undefined}
    >
      {code ? (
        <>
          <Flag code={code} className="text-xl" />
          <span
            className={`font-cond font-semibold text-sm truncate ${
              picked ? "text-gold" : eliminated ? "text-mist line-through decoration-mist/50" : ""
            }`}
          >
            {TEAMS[code].name}
          </span>
          {picked && (
            <Check className="ml-auto w-4 h-4 text-gold shrink-0" />
          )}
        </>
      ) : (
        <span className="font-cond text-xs italic text-mist truncate py-0.5">{placeholder}</span>
      )}
    </button>
  );
}

function KoCard({ matchId, ctx, onPick, showRound = false }) {
  const k = KO_BY_ID[matchId];
  const { home, away } = resolveKoMatch(matchId, ctx);
  const winner = koWinner(matchId, ctx);

  const pick = (code) => {
    if (!home || !away || !code) return;
    onPick(matchId, winner === code ? undefined : code);
  };

  return (
    <div className="w-56 shrink-0 overflow-hidden rounded-lg border border-line bg-panel shadow-sm hover:shadow-md hover:border-mist/40 transition-all duration-200">
      <header className="flex items-center justify-between bg-turf/80 px-2.5 py-1 border-b border-line">
        <span className="font-cond text-[10px] font-semibold uppercase tracking-widest text-mist">
          {showRound ? ROUND_LABELS[k.round] : `P${k.m}`} · {formatDate(k.date, { weekday: false })}
        </span>
        <TimeChip time={k.time} className="text-[10px]" />
      </header>
      <TeamButton
        code={home}
        placeholder={slotLabel(k.hs)}
        picked={!!winner && winner === home}
        eliminated={!!winner && winner !== home}
        disabled={!home || !away}
        onClick={() => pick(home)}
      />
      <div className="h-px bg-line/60" />
      <TeamButton
        code={away}
        placeholder={slotLabel(k.as)}
        picked={!!winner && winner === away}
        eliminated={!!winner && winner !== away}
        disabled={!home || !away}
        onClick={() => pick(away)}
      />
      <footer className="px-2.5 py-1 border-t border-line/60">
        <span className="font-cond text-[10px] uppercase tracking-wider text-mist/80 truncate block">
          {k.stadium} · {k.city}
        </span>
      </footer>
    </div>
  );
}

function Column({ title, ids, ctx, onPick }) {
  return (
    <div className="flex flex-col">
      <h4 className="mb-3 text-center font-cond text-xs font-bold uppercase tracking-[0.2em] text-mist">{title}</h4>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {ids.map((id) => (
          <KoCard key={id} matchId={id} ctx={ctx} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function Podium({ ctx }) {
  const champion = koWinner(104, ctx);
  const final = resolveKoMatch(104, ctx);
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

export default function BracketView({ ctx, onPick }) {
  const incomplete = Object.keys(GROUPS).filter((g) => !ctx.complete[g]);

  return (
    <div>
      {incomplete.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3">
          <p className="font-cond text-sm text-chalk">
            La llave se arma con tus pronósticos de grupos. Los cruces de <strong>mejores terceros</strong> se
            desbloquean al completar los 12 grupos — te faltan:
          </p>
          {incomplete.map((g) => (
            <span key={g} className="rounded-full border border-amber/50 px-2 py-0.5 font-cond text-xs font-bold text-amber">
              {g}
            </span>
          ))}
        </div>
      )}

      <div className="bracket-scroll overflow-x-auto pb-4">
        <div className="flex min-w-max gap-5 lg:gap-7 items-stretch min-h-[1100px]">
          <Column title="Dieciseisavos" ids={LEFT.R32} ctx={ctx} onPick={onPick} />
          <Column title="Octavos" ids={LEFT.R16} ctx={ctx} onPick={onPick} />
          <Column title="Cuartos" ids={LEFT.QF} ctx={ctx} onPick={onPick} />
          <Column title="Semifinal" ids={LEFT.SF} ctx={ctx} onPick={onPick} />

          <div className="flex flex-col justify-center gap-5">
            <h4 className="text-center font-display text-base uppercase tracking-widest text-gold">Final</h4>
            <KoCard matchId={104} ctx={ctx} onPick={onPick} />
            <Podium ctx={ctx} />
            <div>
              <h4 className="mb-2 text-center font-cond text-xs font-bold uppercase tracking-[0.2em] text-mist">
                Tercer puesto
              </h4>
              <KoCard matchId={103} ctx={ctx} onPick={onPick} />
            </div>
          </div>

          <Column title="Semifinal" ids={RIGHT.SF} ctx={ctx} onPick={onPick} />
          <Column title="Cuartos" ids={RIGHT.QF} ctx={ctx} onPick={onPick} />
          <Column title="Octavos" ids={RIGHT.R16} ctx={ctx} onPick={onPick} />
          <Column title="Dieciseisavos" ids={RIGHT.R32} ctx={ctx} onPick={onPick} />
        </div>
      </div>

      <p className="mt-2 font-cond text-xs uppercase tracking-wider text-mist text-center">
        Toca un equipo para marcarlo como ganador · vuelve a tocarlo para deshacer · desliza para ver toda la llave
      </p>
    </div>
  );
}
