function Section({ title, children }) {
  return (
    <section className="rise rounded-xl border border-line bg-panel overflow-hidden">
      <header className="px-5 py-3 bg-turf/50 border-b border-line">
        <h2 className="font-display text-lg text-grass uppercase tracking-wide">{title}</h2>
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
        <p className="font-cond text-mist text-sm max-w-sm mx-auto leading-relaxed">
          Predice los marcadores de la fase de grupos y los resultados de la llave eliminatoria.
          Cada fase tiene su propia tabla — compite en todas.
        </p>
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

      {/* Eliminatorias */}
      <Section title="Eliminatorias — Dieciseisavos en adelante">
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
        </div>

        {/* Ejemplo */}
        <div className="rounded-lg border border-line bg-turf/20 px-4 py-3 space-y-1.5">
          <p className="font-cond text-xs text-mist uppercase tracking-widest mb-2">Ejemplo — partido que va a penales</p>
          <div className="flex items-center justify-between font-cond text-sm">
            <span className="text-mist">90' — pronóstico <span className="text-chalk">1-1</span>, resultado <span className="text-grass">1-1</span></span>
            <span className="text-grass font-bold">+3 pts <span className="text-mist font-normal">(exacto)</span></span>
          </div>
          <div className="flex items-center justify-between font-cond text-sm">
            <span className="text-mist">AET — pronóstico <span className="text-chalk">1-1</span>, resultado <span className="text-grass">2-2</span></span>
            <span className="text-gold font-bold">+1 pt <span className="text-mist font-normal">(empate correcto, marcador no)</span></span>
          </div>
          <div className="flex items-center justify-between font-cond text-sm">
            <span className="text-mist">PEN — pronóstico <span className="text-chalk">5-4</span>, resultado <span className="text-grass">5-4</span></span>
            <span className="text-grass font-bold">+3 pts <span className="text-mist font-normal">(exacto)</span></span>
          </div>
          <div className="flex items-center justify-between border-t border-line/50 pt-2 mt-1">
            <span className="font-cond text-sm font-bold text-chalk">Total del partido</span>
            <span className="font-display text-lg text-grass">7 pts</span>
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
