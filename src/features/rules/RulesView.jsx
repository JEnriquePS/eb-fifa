import { KO_POINTS } from "../../lib/scoring";

const ROUND_NAMES = {
  R32: "Ronda de 32",
  R16: "Octavos de final",
  QF: "Cuartos de final",
  SF: "Semifinal",
  "3P": "Tercer puesto",
  F: "Final",
};

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

function ScoreRow({ label, pts, highlight }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-line/50 last:border-b-0 ${highlight ? "text-chalk" : "text-mist"}`}>
      <span className="font-cond text-sm">{label}</span>
      <span className={`font-display text-lg tabular-nums ${highlight ? "text-grass" : "text-chalk"}`}>
        {pts} <span className="font-cond text-xs text-mist">pts</span>
      </span>
    </div>
  );
}

function ExampleMatch({ home, away, homeScore, awayScore, prediction, result }) {
  const exact = prediction[0] === result[0] && prediction[1] === result[1];
  const correctOutcome = !exact && Math.sign(result[0] - result[1]) === Math.sign(prediction[0] - prediction[1]);
  const pts = exact ? 3 : correctOutcome ? 1 : 0;
  const color = pts === 3 ? "text-grass" : pts === 1 ? "text-gold" : "text-card";
  const label = pts === 3 ? "Exacto" : pts === 1 ? "Resultado" : "Sin puntos";

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

export default function RulesView() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Intro */}
      <div className="rise text-center py-8">
        <p className="font-display text-3xl text-chalk mb-1">¿Cómo jugar?</p>
        <p className="font-cond text-mist text-sm max-w-sm mx-auto leading-relaxed">
          Predice los marcadores de la fase de grupos y los clasificados en la llave eliminatoria.
          El que más puntos acumule al final del torneo gana.
        </p>
      </div>

      {/* Fase de grupos */}
      <Section title="Fase de Grupos">
        <p className="font-cond text-sm text-mist mb-4 leading-relaxed">
          Ingresa el marcador que crees que tendrá cada partido. Ganas puntos según qué tan cerca estés del resultado real.
        </p>
        <div className="mb-5">
          <ScoreRow label="🎯 Marcador exacto — aciertas el resultado y los goles" pts={3} highlight />
          <ScoreRow label="✅ Resultado correcto — aciertas quién gana o el empate, pero no el marcador" pts={1} />
          <ScoreRow label="❌ Resultado incorrecto" pts={0} />
          <ScoreRow label="⬜ Sin pronóstico — dejaste el marcador en blanco" pts={0} />
        </div>
        <p className="font-cond text-xs uppercase tracking-widest text-mist mb-3">Ejemplos</p>
        <div className="space-y-2">
          <ExampleMatch home="ARG" away="BRA" prediction={[2, 1]} result={[2, 1]} />
          <ExampleMatch home="ARG" away="BRA" prediction={[1, 0]} result={[2, 1]} />
          <ExampleMatch home="ARG" away="BRA" prediction={[0, 1]} result={[2, 1]} />
        </div>
      </Section>

      {/* Eliminatorias */}
      <Section title="Eliminatorias">
        <p className="font-cond text-sm text-mist mb-4 leading-relaxed">
          Una vez terminada la fase de grupos, elige qué equipo avanza en cada partido de la llave.
          Cuanto más lejos llegue el equipo que elegiste, más puntos sumas.
        </p>
        <div>
          {Object.entries(KO_POINTS)
            .filter(([round]) => round !== "SF")
            .map(([round, pts]) => (
              <ScoreRow
                key={round}
                label={`${ROUND_NAMES[round]}`}
                pts={pts}
                highlight={round === "F"}
              />
            ))}
        </div>
        <p className="font-cond text-xs text-mist mt-4 leading-relaxed border-t border-line/50 pt-3">
          Los puntos se acumulan por cada ronda que avance correctamente el equipo que elegiste.
          Si aciertas al campeón completo (desde octavos hasta la final) sumas <span className="text-chalk font-semibold">2+4+6+8+10 = 30 pts</span> solo de esa rama.
        </p>
      </Section>

      {/* Resumen */}
      <Section title="Ejemplo de puntuación total">
        <div className="space-y-3">
          {[
            { label: "72 pronósticos de grupos, todos exactos", pts: "216 pts" },
            { label: "Aciertas todos los clasificados de la Ronda de 32", pts: `16 × ${KO_POINTS.R32} = ${16 * KO_POINTS.R32} pts` },
            { label: "Aciertas todos los octavos de final", pts: `8 × ${KO_POINTS.R16} = ${8 * KO_POINTS.R16} pts` },
            { label: "Aciertas todos los cuartos de final", pts: `4 × ${KO_POINTS.QF} = ${4 * KO_POINTS.QF} pts` },
            { label: "Aciertas ambas semis + 3er puesto + campeón", pts: `2×${KO_POINTS.SF} + ${KO_POINTS["3P"]} + ${KO_POINTS.F} = ${2 * KO_POINTS.SF + KO_POINTS["3P"] + KO_POINTS.F} pts` },
          ].map(({ label, pts }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="font-cond text-sm text-mist leading-snug">{label}</span>
              <span className="font-cond font-bold text-chalk tabular-nums shrink-0 text-sm">{pts}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-line pt-3 mt-1">
            <span className="font-cond text-sm font-bold text-chalk uppercase tracking-wider">Total</span>
            <span className="font-display text-xl text-grass">
              {216 + 16 * KO_POINTS.R32 + 8 * KO_POINTS.R16 + 4 * KO_POINTS.QF + 2 * KO_POINTS.SF + KO_POINTS["3P"] + KO_POINTS.F} pts
            </span>
          </div>
        </div>
      </Section>

      {/* Tips */}
      <Section title="Consejos">
        <ul className="space-y-2.5">
          {[
            "Completa todos los partidos de grupos — cada uno suma.",
            "No dejes la llave para último momento, se habilita al terminar la fase de grupos.",
            "El campeón vale 10 pts solo en la final, más todos los puntos acumulados en rondas anteriores.",
            "Un marcador exacto vale 3 veces más que solo acertar el resultado — vale la pena arriesgar.",
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
