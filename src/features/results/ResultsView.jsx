import { useState } from "react";
import GroupsView from "../groups/GroupsView";
import BracketView from "../bracket/BracketView";
import { syncResultsFromAPI } from "../../lib/sync";

export default function ResultsView({ me, resultsCtx, results, onScore, onPick }) {
  const [sub, setSub] = useState("groups");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  if (!me?.is_admin) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" role="img" aria-label="Candado">🔒</span>
        <h2 className="font-display text-xl text-chalk">Solo el organizador puede ingresar resultados</h2>
        <p className="font-cond text-sm text-mist max-w-sm leading-relaxed">
          Cuando el admin ingrese los marcadores reales, la tabla de posiciones se actualizará en tiempo real
          para todos los jugadores.
        </p>
        <p className="font-cond text-xs uppercase tracking-widest text-mist/60 mt-2">
          Si eres el organizador, pídele a Yisus que haga tu cuenta admin en el dashboard de Supabase.
        </p>
      </div>
    );
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { synced, total, notFound } = await syncResultsFromAPI();
      const extra = notFound.length ? ` · No encontrados: ${notFound.join(", ")}` : "";
      setSyncMsg({ ok: true, text: `${synced} de ${total} partidos sincronizados${extra}` });
    } catch (e) {
      setSyncMsg({ ok: false, text: e.message });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="mb-5 rounded-lg border border-card/50 bg-card/10 px-4 py-3 flex items-start gap-3">
        <span className="text-xl mt-0.5" role="img" aria-label="Llave">🔑</span>
        <div className="flex-1">
          <p className="font-cond font-bold uppercase tracking-wider text-card text-sm">Modo Admin — Resultados Oficiales</p>
          <p className="font-cond text-sm text-chalk mt-0.5">
            Los cambios que hagas aquí se reflejan en tiempo real en la tabla de posiciones de todos los jugadores.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="shrink-0 cursor-pointer rounded-lg border border-card/50 bg-card/10 hover:bg-card/20 px-3 py-1.5 font-cond text-sm font-semibold uppercase tracking-wider text-card transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-card"
        >
          {syncing ? "Sincronizando…" : "↻ Sincronizar"}
        </button>
      </div>

      {syncMsg && (
        <div className={`mb-5 rounded-lg border px-4 py-2.5 font-cond text-sm ${syncMsg.ok ? "border-grass/40 bg-grass/10 text-grass" : "border-card/40 bg-card/10 text-card"}`}>
          {syncMsg.text}
        </div>
      )}

      <GroupsView ctx={resultsCtx} scores={results.groupScores} onScore={onScore} />
    </div>
  );
}
