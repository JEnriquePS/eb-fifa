import { useState } from "react";
import { X } from "lucide-react";

const LS_KEY = "eb_scoring_seen_v2";

function Row({ label, pts, color = "text-chalk" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line/40 last:border-b-0">
      <span className="font-cond text-sm text-mist">{label}</span>
      <span className={`font-display text-base tabular-nums shrink-0 ml-3 ${color}`}>
        {pts} <span className="font-cond text-xs text-mist">pts</span>
      </span>
    </div>
  );
}

function PeriodChip({ label, labelColor, borderColor }) {
  return (
    <div className={`rounded-lg border ${borderColor} bg-night/30 px-2 py-2.5 text-center`}>
      <p className={`font-cond text-xs font-bold uppercase tracking-wider mb-2 ${labelColor}`}>{label}</p>
      <p className="font-cond text-[11px] text-grass">3 pts · exacto</p>
      <p className="font-cond text-[11px] text-chalk">1 pt · resultado</p>
      <p className="font-cond text-[11px] text-mist/50">0 pts · mal</p>
    </div>
  );
}

export default function ScoringModal() {
  const [open, setOpen] = useState(() => !localStorage.getItem(LS_KEY));

  function dismiss() {
    localStorage.setItem(LS_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(5,15,10,0.85)" }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-turf/60">
          <p className="font-display text-lg text-chalk uppercase tracking-wide">¿Cómo puntúa?</p>
          <button onClick={dismiss} className="text-mist hover:text-chalk transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Grupos */}
          <div>
            <p className="font-cond text-xs uppercase tracking-widest text-grass mb-2">Fase de grupos</p>
            <div className="rounded-lg border border-line bg-night/40 px-3">
              <Row label="🎯 Marcador exacto" pts={3} color="text-grass" />
              <Row label="✅ Resultado correcto (ganador o empate)" pts={1} />
              <Row label="❌ Resultado incorrecto" pts={0} />
            </div>
          </div>

          {/* Eliminatorias */}
          <div>
            <p className="font-cond text-xs uppercase tracking-widest text-gold mb-2">Eliminatorias — dieciseisavos en adelante</p>
            <p className="font-cond text-xs text-mist mb-3 leading-relaxed">
              Cada fase eliminatoria tiene su <span className="text-chalk font-semibold">tabla propia</span>.
              Las reglas son iguales en todas: se puntúa <span className="text-chalk">cada período independientemente</span>.
            </p>

            {/* Chips de período */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <PeriodChip label="90'" labelColor="text-grass" borderColor="border-grass/30" />
              <PeriodChip label="AET" labelColor="text-amber" borderColor="border-amber/30" />
              <PeriodChip label="PEN" labelColor="text-gold" borderColor="border-gold/30" />
            </div>

            {/* ¿Qué ingresar? */}
            <div className="rounded-lg border border-line bg-turf/20 px-4 py-3 mb-3">
              <p className="font-cond text-[10px] text-mist uppercase tracking-widest mb-3">¿Qué marcador ingresar en cada período?</p>
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
              <div className="px-4 py-2.5 border-b border-line/50">
                <p className="font-cond text-[10px] text-mist uppercase tracking-widest">Ejemplo — FRA vs ESP va a penales</p>
              </div>

              {/* Encabezado columnas */}
              <div className="grid grid-cols-[64px_1fr_1fr_60px] gap-2 px-3 py-1.5 bg-turf/40 border-b border-line/30">
                <span className="font-cond text-[10px] uppercase tracking-widest text-mist">Período</span>
                <span className="font-cond text-[10px] uppercase tracking-widest text-mist text-center">Tu pronóstico</span>
                <span className="font-cond text-[10px] uppercase tracking-widest text-mist text-center">Resultado</span>
                <span className="font-cond text-[10px] uppercase tracking-widest text-mist text-right">Pts</span>
              </div>

              {/* 90' — exacto */}
              <div className="grid grid-cols-[64px_1fr_1fr_60px] gap-2 items-center px-3 py-3 border-b border-line/20">
                <span className="font-cond text-xs font-bold text-grass uppercase tracking-wider">90'</span>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
                  <span className="font-cond text-xs text-mist">–</span>
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">1</span>
                  <span className="font-cond text-xs text-mist">–</span>
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">1</span>
                </div>
                <div className="text-right">
                  <span className="font-display text-base text-grass font-bold">+3</span>
                  <p className="font-cond text-[10px] text-grass/70">exacto 🎯</p>
                </div>
              </div>

              {/* AET — resultado correcto */}
              <div className="grid grid-cols-[64px_1fr_1fr_60px] gap-2 items-center px-3 py-3 border-b border-line/20">
                <span className="font-cond text-xs font-bold text-amber uppercase tracking-wider">AET</span>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
                  <span className="font-cond text-xs text-mist">–</span>
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">1</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">2</span>
                  <span className="font-cond text-xs text-mist">–</span>
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">2</span>
                </div>
                <div className="text-right">
                  <span className="font-display text-base text-gold font-bold">+1</span>
                  <p className="font-cond text-[10px] text-gold/70">empate ✓</p>
                </div>
              </div>

              {/* PEN — exacto */}
              <div className="grid grid-cols-[64px_1fr_1fr_60px] gap-2 items-center px-3 py-3">
                <span className="font-cond text-xs font-bold text-gold uppercase tracking-wider">PEN</span>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">5</span>
                  <span className="font-cond text-xs text-mist">–</span>
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-line bg-turf font-display text-sm font-bold text-chalk tabular-nums">4</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">5</span>
                  <span className="font-cond text-xs text-mist">–</span>
                  <span className="w-7 h-6 flex items-center justify-center rounded border border-grass/50 bg-grass/10 font-display text-sm font-bold text-grass tabular-nums">4</span>
                </div>
                <div className="text-right">
                  <span className="font-display text-base text-grass font-bold">+3</span>
                  <p className="font-cond text-[10px] text-grass/70">exacto 🎯</p>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-turf/30 border-t border-line/50">
                <span className="font-cond text-sm font-bold text-chalk">Total del partido</span>
                <span className="font-display text-xl text-grass">7 <span className="font-cond text-xs text-mist font-normal">pts</span></span>
              </div>
            </div>

            <p className="font-cond text-xs text-mist mt-3 leading-relaxed">
              Máximo posible en un partido que llega a penales: <span className="text-chalk font-semibold">9 pts</span> (exacto en las tres fases).
              Si el partido se decide en 90', solo puntúa ese período — máximo <span className="text-chalk font-semibold">3 pts</span>.
            </p>
          </div>

          {/* Tip */}
          <div className="rounded-lg border border-grass/20 bg-grass/5 px-4 py-3">
            <p className="font-cond text-xs text-mist leading-relaxed">
              <span className="text-chalk font-semibold">Tip:</span> completa todos los grupos — cada partido suma. La llave se habilita cuando terminen los grupos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-line bg-turf/40">
          <button
            onClick={dismiss}
            className="w-full rounded-lg bg-grass text-night font-bold font-cond uppercase tracking-widest py-2.5 text-sm hover:bg-grass/90 transition-colors cursor-pointer"
          >
            Entendido, a jugar
          </button>
        </div>
      </div>
    </div>
  );
}
