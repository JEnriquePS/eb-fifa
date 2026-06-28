import { useState } from "react";
import { X } from "lucide-react";

const LS_KEY = "eb_scoring_seen";

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
            <p className="font-cond text-xs uppercase tracking-widest text-gold mb-2">Eliminatorias — cada período puntúa</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "90'", color: "border-grass/30", pts: "3 / 1 / 0" },
                { label: "AET", color: "border-amber/30", pts: "3 / 1 / 0" },
                { label: "PEN", color: "border-gold/30", pts: "3 / 1 / 0" },
              ].map(({ label, color, pts }) => (
                <div key={label} className={`rounded-lg border ${color} bg-turf/20 px-2.5 py-2 text-center`}>
                  <p className="font-cond text-xs font-bold text-chalk uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-display text-sm text-grass">{pts}</p>
                  <p className="font-cond text-[10px] text-mist/60">exacto/result./mal</p>
                </div>
              ))}
            </div>
            <p className="font-cond text-xs text-mist mt-2 leading-relaxed">
              AET = marcador total acumulado. PEN = tanda (ej. 5-4). Máximo por partido: <span className="text-chalk font-semibold">9 pts</span>.
            </p>
          </div>

          {/* Tip rápido */}
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
