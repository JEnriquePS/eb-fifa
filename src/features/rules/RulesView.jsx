import { RulesShareButton, KoRulesShareButton } from "./RulesShareCard";

function Section({ title, action, children }) {
  return (
    <section className="rise rounded-xl border border-line bg-panel overflow-hidden">
      <header className="px-5 py-3 bg-turf/50 border-b border-line flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-grass uppercase tracking-wide">{title}</h2>
        {action}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function ScoreRow({ label, pts, highlight, sub }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-line/50 last:border-b-0 ${highlight ? "text-chalk" : "text-mist"}`}>
      <div>
        <span className="font-cond text-sm">{label}</span>
        {sub && <p className="font-cond text-xs text-mist/60 mt-0.5">{sub}</p>}
      </div>
      <span className={`font-display text-lg tabular-nums shrink-0 ml-4 ${highlight ? "text-grass" : "text-chalk"}`}>
        {pts} <span className="font-cond text-xs text-mist">pts</span>
      </span>
    </div>
  );
}

function ExampleMatch({ home, away, prediction, result, label: overrideLabel }) {
  const exact = prediction[0] === result[0] && prediction[1] === result[1];
  const correctOutcome = !exact && Math.sign(result[0] - result[1]) === Math.sign(prediction[0] - prediction[1]);
  const pts = exact ? 3 : correctOutcome ? 1 : 0;
  const color = pts === 3 ? "text-grass" : pts === 1 ? "text-gold" : "text-mist/50";
  const label = overrideLabel ?? (pts === 3 ? "Exacto" : pts === 1 ? "Resultado" : "Sin puntos");

  return (
    <div className="rounded-lg border border-line bg-night/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-cond text-xs uppercase tracking-widest text-mist">{home} vs {away}</span>
        <span className={`font-cond text-xs font-bold uppercase tracking-widest ${color}`}>{label} · +{pts} pt{pts !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-cond text-mist text-[11px] uppercase tracking-wider w-16">Tu pronóstico</span>
          <span className="font-cond font-bold tabular-nums">{prediction[0]} – {prediction[1]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-cond text-mist text-[11px] uppercase tracking-wider w-16">Resultado</span>
          <span className="font-cond font-bold tabular-nums text-grass">{result[0]} – {result[1]}</span>
        </div>
      </div>
    </div>
  );
}

const LIVE_MATCHES = [
  { home: "ESP", away: "ARG", result: [2, 1] },
  { home: "FRA", away: "BRA", result: [0, 0] },
  { home: "ENG", away: "POR", result: [1, 3] },
];

const LIVE_PLAYERS = [
  { name: "Jani",    preds: [[2,1],[0,0],[1,2]] },
  { name: "Renzo",   preds: [[1,0],[1,0],[1,3]] },
  { name: "Aladino", preds: [[0,2],[2,2],[0,1]] },
];

function calcMatchPts(pred, res) {
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

function LiveExample() {
  const players = LIVE_PLAYERS.map((p) => {
    const breakdown = LIVE_MATCHES.map((m, i) => calcMatchPts(p.preds[i], m.result));
    return { ...p, breakdown, total: breakdown.reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.total - a.total);

  const ptsColor = (pts) =>
    pts === 3 ? "text-grass" : pts === 1 ? "text-gold" : "text-mist/30";

  return (
    <section className="rise rounded-xl border border-line bg-panel overflow-hidden">
      <header className="px-5 py-3 bg-turf/50 border-b border-line">
        <h2 className="font-display text-lg text-grass uppercase tracking-wide">Ejemplo en vivo</h2>
      </header>
      <div className="px-5 py-4">
        <p className="font-cond text-sm text-mist mb-4 leading-relaxed">
          Tres jugadores, tres partidos, distintos pronósticos — así se forma la tabla.
        </p>

        {/* Resultados oficiales */}
        <p className="font-cond text-[11px] uppercase tracking-widest text-mist mb-2">Resultados oficiales</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {LIVE_MATCHES.map((m) => (
            <div key={m.home} className="rounded-lg border border-line bg-night/60 px-2 py-2 text-center">
              <p className="font-cond text-[11px] text-mist mb-1">{m.home} vs {m.away}</p>
              <p className="font-display text-lg text-grass tabular-nums">{m.result[0]}–{m.result[1]}</p>
            </div>
          ))}
        </div>

        {/* Tabla de pronósticos */}
        <p className="font-cond text-[11px] uppercase tracking-widest text-mist mb-2">Pronósticos y puntos</p>
        <div className="rounded-xl border border-line overflow-hidden mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-turf/80">
                <th className="py-2 px-3 text-left font-cond text-xs uppercase tracking-wider text-mist">Jugador</th>
                {LIVE_MATCHES.map((m) => (
                  <th key={m.home} className="py-2 px-2 text-center font-cond text-xs uppercase tracking-wider text-mist">
                    {m.home}<span className="text-mist/40">–</span>{m.away}
                  </th>
                ))}
                <th className="py-2 px-3 text-right font-cond text-xs uppercase tracking-wider text-mist">Total</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, rank) => (
                <tr key={p.name} className="border-b border-line/40 last:border-b-0">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-cond text-xs text-mist w-4">{rank + 1}.</span>
                      <span className="font-cond font-semibold text-chalk text-sm">{p.name}</span>
                    </div>
                  </td>
                  {p.breakdown.map((pts, i) => (
                    <td key={i} className="py-2.5 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-cond text-xs text-mist/50 tabular-nums">
                          {p.preds[i][0]}–{p.preds[i][1]}
                        </span>
                        <span className={`font-display text-sm tabular-nums font-bold ${ptsColor(pts)}`}>
                          {pts === 3 ? "+3" : pts === 1 ? "+1" : "–"}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-display text-lg text-gold tabular-nums font-bold">{p.total}</span>
                    <span className="font-cond text-xs text-mist ml-1">pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 font-cond text-xs text-mist">
          <span><span className="text-grass font-bold">+3</span> · Marcador exacto</span>
          <span><span className="text-gold font-bold">+1</span> · Resultado correcto</span>
          <span><span className="text-mist/40 font-bold">–</span> · Sin puntos</span>
        </div>
      </div>
    </section>
  );
}

function PhaseBlock({ phase, color, rows }) {
  return (
    <div className={`rounded-lg border ${color} overflow-hidden`}>
      <div className={`px-3 py-1.5 border-b ${color} bg-turf/40`}>
        <span className="font-cond text-xs font-bold uppercase tracking-widest text-chalk">{phase}</span>
      </div>
      <div className="px-3 divide-y divide-line/40">
        {rows.map(({ label, pts, highlight }) => (
          <div key={label} className={`flex items-center justify-between py-2 ${highlight ? "text-chalk" : "text-mist"}`}>
            <span className="font-cond text-xs">{label}</span>
            <span className={`font-display text-base tabular-nums ml-3 shrink-0 ${highlight ? "text-grass" : "text-chalk"}`}>
              {pts} <span className="font-cond text-[10px] text-mist">pts</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RulesView() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Intro */}
      <div className="rise text-center py-8">
        <p className="font-display text-3xl text-chalk mb-1">¿Cómo jugar?</p>
        <p className="font-cond text-mist text-sm max-w-sm mx-auto leading-relaxed mb-5">
          Predice los marcadores de la fase de grupos y los resultados de la llave eliminatoria.
          Cada fase tiene su propia tabla — compite en todas.
        </p>
        <RulesShareButton />
      </div>

      {/* Fase de grupos */}
      <Section title="Fase de Grupos">
        <p className="font-cond text-sm text-mist mb-4 leading-relaxed">
          Ingresa el marcador que crees que tendrá cada partido. Los puntos de esta fase forman la <span className="text-chalk font-semibold">tabla principal</span>.
        </p>
        <div className="mb-5">
          <ScoreRow label="🎯 Marcador exacto — aciertas el resultado y los goles" pts={3} highlight />
          <ScoreRow label="✅ Resultado correcto — aciertas quién gana o el empate, pero no el marcador" pts={1} />
          <ScoreRow label="❌ Resultado incorrecto" pts={0} />
        </div>
        <p className="font-cond text-xs uppercase tracking-widest text-mist mb-3">Ejemplos</p>
        <div className="space-y-2">
          <ExampleMatch home="ARG" away="BRA" prediction={[2, 1]} result={[2, 1]} />
          <ExampleMatch home="ARG" away="BRA" prediction={[1, 0]} result={[2, 1]} />
          <ExampleMatch home="ARG" away="BRA" prediction={[0, 1]} result={[2, 1]} />
        </div>
      </Section>

      <LiveExample />

      {/* Eliminatorias */}
      <Section title="Eliminatorias — Dieciseisavos en adelante" action={<KoRulesShareButton />}>
        <p className="font-cond text-sm text-mist mb-4 leading-relaxed">
          Cada fase eliminatoria tiene su <span className="text-chalk font-semibold">tabla propia</span>.
          Las reglas de puntuación son iguales en todas las fases: se puntúa <span className="text-chalk">cada período independientemente</span>.
        </p>

        {/* Tabla de puntos por fase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <PhaseBlock
            phase="90 minutos"
            color="border-grass/30"
            rows={[
              { label: "Marcador exacto", pts: 3, highlight: true },
              { label: "Resultado correcto", pts: 1 },
              { label: "Incorrecto", pts: 0 },
            ]}
          />
          <PhaseBlock
            phase="AET — marcador total"
            color="border-amber/30"
            rows={[
              { label: "Marcador exacto", pts: 3, highlight: true },
              { label: "Resultado correcto", pts: 1 },
              { label: "Incorrecto", pts: 0 },
            ]}
          />
          <PhaseBlock
            phase="Penales — tanda"
            color="border-gold/30"
            rows={[
              { label: "Tanda exacta (ej. 5-4)", pts: 3, highlight: true },
              { label: "Aciertas el ganador", pts: 1 },
              { label: "Incorrecto", pts: 0 },
            ]}
          />
        </div>

        {/* Qué ingresar en cada campo */}
        <div className="rounded-lg border border-line bg-turf/20 px-4 py-3 mb-4">
          <p className="font-cond text-xs text-mist uppercase tracking-widest mb-3">¿Qué marcador ingresar en cada período?</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="font-cond text-xs font-bold text-grass uppercase tracking-wider shrink-0 w-8">90'</span>
              <span className="font-cond text-xs text-mist leading-relaxed">El marcador al pitazo final. Ej: <span className="text-chalk font-bold">1-1</span></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-cond text-xs font-bold text-amber uppercase tracking-wider shrink-0 w-8">AET</span>
              <span className="font-cond text-xs text-mist leading-relaxed">
                El marcador <span className="text-chalk font-bold">total</span> al terminar el tiempo extra — incluye los goles de 90'.
                Si en 90' iba 1-1 y en el tiempo extra se anotó 1-1 más, ingresas <span className="text-chalk font-bold">2-2</span>.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-cond text-xs font-bold text-gold uppercase tracking-wider shrink-0 w-8">PEN</span>
              <span className="font-cond text-xs text-mist leading-relaxed">El resultado de la tanda. Ej: <span className="text-chalk font-bold">5-4</span></span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-line/40 flex items-start gap-2">
            <span className="text-amber shrink-0 mt-px">💡</span>
            <p className="font-cond text-xs text-mist leading-relaxed">
              Los campos de <span className="text-amber font-semibold">AET</span> se habilitan solo si pronosticas empate en 90'.
              Los de <span className="text-gold font-semibold">PEN</span> se habilitan solo si pronosticas empate en AET.
              Si crees que el partido se define en 90', no necesitas llenar los demás.
            </p>
          </div>
        </div>

        {/* Ejemplo visual */}
        <div className="rounded-lg border border-line bg-turf/20 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-line/50 flex items-center justify-between">
            <p className="font-cond text-xs text-mist uppercase tracking-widest">Ejemplo — FRA vs ESP va a penales</p>
          </div>

          {/* Encabezado columnas */}
          <div className="grid grid-cols-[80px_1fr_1fr_72px] gap-2 px-4 py-1.5 bg-turf/40 border-b border-line/30">
            <span className="font-cond text-[10px] uppercase tracking-widest text-mist">Período</span>
            <span className="font-cond text-[10px] uppercase tracking-widest text-mist text-center">Tu pronóstico</span>
            <span className="font-cond text-[10px] uppercase tracking-widest text-mist text-center">Resultado</span>
            <span className="font-cond text-[10px] uppercase tracking-widest text-mist text-right">Pts</span>
          </div>

          {/* 90' — exacto */}
          <div className="grid grid-cols-[80px_1fr_1fr_72px] gap-2 items-center px-4 py-3 border-b border-line/20">
            <span className="font-cond text-xs font-bold text-grass uppercase tracking-wider">90'</span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-8 h-7 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
              <span className="font-cond text-xs text-mist">–</span>
              <span className="w-8 h-7 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-8 h-7 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">1</span>
              <span className="font-cond text-xs text-mist">–</span>
              <span className="w-8 h-7 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">1</span>
            </div>
            <div className="text-right">
              <span className="font-display text-base text-grass font-bold">+3</span>
              <p className="font-cond text-[10px] text-grass/70">exacto 🎯</p>
            </div>
          </div>

          {/* AET — resultado correcto */}
          <div className="grid grid-cols-[80px_1fr_1fr_72px] gap-2 items-center px-4 py-3 border-b border-line/20">
            <span className="font-cond text-xs font-bold text-amber uppercase tracking-wider">AET</span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-8 h-7 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
              <span className="font-cond text-xs text-mist">–</span>
              <span className="w-8 h-7 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-8 h-7 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">2</span>
              <span className="font-cond text-xs text-mist">–</span>
              <span className="w-8 h-7 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">2</span>
            </div>
            <div className="text-right">
              <span className="font-display text-base text-gold font-bold">+1</span>
              <p className="font-cond text-[10px] text-gold/70">empate ✓</p>
            </div>
          </div>

          {/* PEN — exacto */}
          <div className="grid grid-cols-[80px_1fr_1fr_72px] gap-2 items-center px-4 py-3">
            <span className="font-cond text-xs font-bold text-gold uppercase tracking-wider">PEN</span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-8 h-7 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">5</span>
              <span className="font-cond text-xs text-mist">–</span>
              <span className="w-8 h-7 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">4</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-8 h-7 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">5</span>
              <span className="font-cond text-xs text-mist">–</span>
              <span className="w-8 h-7 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">4</span>
            </div>
            <div className="text-right">
              <span className="font-display text-base text-grass font-bold">+3</span>
              <p className="font-cond text-[10px] text-grass/70">exacto 🎯</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-turf/30 border-t border-line/50">
            <span className="font-cond text-sm font-bold text-chalk">Total del partido</span>
            <span className="font-display text-xl text-grass">7 <span className="font-cond text-xs text-mist font-normal">pts</span></span>
          </div>
        </div>

        <p className="font-cond text-xs text-mist mt-3 leading-relaxed">
          Máximo posible en un partido que llega a penales: <span className="text-chalk font-semibold">9 pts</span> (exacto en las tres fases).
          Si el partido se decide en 90', solo puntúa ese período — máximo <span className="text-chalk font-semibold">3 pts</span>.
        </p>
      </Section>

      {/* Consejos */}
      <Section title="Consejos">
        <ul className="space-y-2.5">
          {[
            "Completa todos los pronósticos de grupos — cada partido suma a la tabla principal.",
            "La llave se habilita al terminar la fase de grupos. Puedes explorar el bracket antes, pero no ingresar resultados.",
            "En eliminatorias puntúa cada período por separado — vale la pena pronosticar AET y penales.",
            "Un marcador exacto vale 3 veces más que solo acertar el resultado — vale la pena arriesgar el marcador.",
            "Cada fase eliminatoria tiene su propia tabla. Puedes brillar en una aunque no en otra.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-3 font-cond text-sm text-mist leading-relaxed">
              <span className="text-grass font-bold shrink-0">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      </Section>

    </div>
  );
}
