import { useMemo, useState } from "react";
import { useAuth } from "./core/hooks/useAuth";
import { usePollaData } from "./core/hooks/usePollaData";
import { buildContext, pendingMatchesProgress, koWinner } from "./lib/polla";
import { TEAMS } from "./core/data/teams";
import { Flag } from "./core/ui/atoms";
import AuthGate from "./features/auth/AuthGate";
import GroupsView from "./features/groups/GroupsView";
import BracketView from "./features/bracket/BracketView";
import ResultsView from "./features/results/ResultsView";
import LeaderboardView from "./features/leaderboard/LeaderboardView";
import RulesView from "./features/rules/RulesView";

const ALL_TABS = [
  { id: "groups", label: "Grupos" },
  { id: "results", label: "Resultados", adminOnly: true },
  { id: "table", label: "Tabla" },
  { id: "rules", label: "Cómo Jugar" },
];

const SYNC_LABELS = {
  idle: null,
  saving: { text: "Guardando…", cls: "text-mist" },
  synced: { text: "✓ Guardado", cls: "text-grass" },
  error: { text: "⚠ Error al guardar", cls: "text-card" },
};

function AppShell({ user, signOut }) {
  const [tab, setTab] = useState("groups");
  const data = usePollaData(user);

  const ctx = useMemo(
    () => buildContext(data.myGroupScores, data.myKoPicks),
    [data.myGroupScores, data.myKoPicks]
  );

  const resultsCtx = useMemo(
    () => buildContext(data.results.groupScores, data.results.koPicks),
    [data.results]
  );

  const tabs = ALL_TABS.filter((t) => !t.adminOnly || data.me?.is_admin);

  const today = new Date().toISOString().slice(0, 10);
  const { predicted, total: pendingTotal } = pendingMatchesProgress(data.myGroupScores, today);
  const champion = koWinner(104, ctx);
  const syncInfo = SYNC_LABELS[data.syncStatus];

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span
            className="text-5xl inline-block animate-spin"
            style={{ animationDuration: "1.2s" }}
            role="img"
            aria-label="Cargando"
          >
            ⚽
          </span>
          <p className="mt-4 font-cond uppercase tracking-widest text-mist text-sm">Cargando quiniela…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-7xl px-4 pt-7 pb-5">
          <p className="font-cond text-xs font-semibold uppercase tracking-[0.3em] text-grass">
            Copa Mundial FIFA · 🇺🇸 USA · 🇲🇽 México · 🇨🇦 Canadá · 11 jun – 19 jul 2026
          </p>
          <div className="flex items-end justify-between gap-4 mt-2">
            <h1 className="font-display leading-none">
              <span className="block text-2xl sm:text-4xl text-chalk">LA QUINIELA</span>
              <span className="block text-2xl sm:text-4xl">
                <span className="text-gold">MUNDIALISTA</span>{" "}
                <span className="text-outline text-3xl sm:text-5xl align-baseline">2026</span>
              </span>
            </h1>
            {/* Usuario activo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="font-cond font-semibold text-chalk text-sm">{data.me?.name ?? "—"}</p>
                {data.me?.is_admin && (
                  <span className="font-cond text-[10px] uppercase tracking-wider text-amber">Admin</span>
                )}
              </div>
              <button
                onClick={signOut}
                title="Salir"
                aria-label="Salir"
                className="cursor-pointer text-mist hover:text-card transition-colors duration-150 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Barra progreso mis pronósticos */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 sm:w-48 overflow-hidden rounded-full bg-panel border border-line">
                <div
                  className="h-full bg-grass transition-all duration-500"
                  style={{ width: `${pendingTotal > 0 ? (predicted / pendingTotal) * 100 : 100}%` }}
                />
              </div>
              <span className="font-cond text-sm text-mist tabular-nums">
                {predicted}/{pendingTotal}
              </span>
            </div>

            {/* Campeón elegido */}
            {champion && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-2.5 py-0.5 font-cond text-sm font-semibold text-gold">
                🏆 <Flag code={champion} className="text-base" /> {TEAMS[champion].name}
              </span>
            )}

            {/* Estado sync */}
            {syncInfo && (
              <span className={`ml-auto font-cond text-xs ${syncInfo.cls}`}>
                {syncInfo.text}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav
        className="sticky top-0 z-20 border-b border-line bg-night/92 backdrop-blur-md"
        aria-label="Secciones"
      >
        <div className="mx-auto flex max-w-7xl gap-0.5 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`shrink-0 cursor-pointer border-b-2 px-3 sm:px-4 py-3 font-cond font-bold uppercase tracking-[0.15em] text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
                tab === t.id
                  ? "border-gold text-gold"
                  : "border-transparent text-mist hover:text-chalk"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Contenido ── */}
      <main className="mx-auto max-w-7xl px-4 py-7">
        {tab === "groups" && (
          <GroupsView ctx={ctx} resultsCtx={resultsCtx} scores={data.myGroupScores} onScore={data.onScore} results={data.results.groupScores} />
        )}
        {tab === "bracket" && (
          <BracketView ctx={ctx} onPick={data.onPick} />
        )}
        {tab === "results" && (
          <ResultsView
            me={data.me}
            resultsCtx={resultsCtx}
            results={data.results}
            onScore={data.onResultScore}
            onPick={data.onResultPick}
            players={data.players}
            allPollas={data.allPollas}
          />
        )}
        {tab === "table" && (
          <LeaderboardView
            players={data.players}
            allPollas={data.allPollas}
            resultsCtx={resultsCtx}
            results={data.results}
            activeId={user.id}
            connected={data.connected}
            lastUpdated={data.lastUpdated}
          />
        )}
        {tab === "rules" && <RulesView />}
      </main>

      <footer className="border-t border-line py-5">
        <p className="text-center font-cond text-xs uppercase tracking-widest text-mist">
          Calendario oficial FIFA · Horarios en hora de Lima (UTC-5) · {data.players.length} jugador{data.players.length !== 1 ? "es" : ""} en la quiniela
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  return (
    <AuthGate user={user} authLoading={authLoading}>
      <AppShell user={user} signOut={signOut} />
    </AuthGate>
  );
}
