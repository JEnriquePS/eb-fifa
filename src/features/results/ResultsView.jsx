import { useState, useContext } from "react";
import { TimezoneContext } from "../../core/hooks/useTimezone";
import { RefreshCw, Lock, KeyRound } from "lucide-react";
import * as XLSX from "xlsx";
import GroupsView from "../groups/GroupsView";
import R32AdminView from "./R32AdminView";
import { syncResultsFromAPI } from "../../lib/sync";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { validScore } from "../../lib/polla";
import { TEAMS } from "../../core/data/teams";
import { Flag } from "../../core/ui/atoms";
import { MatchShareButton } from "./MatchShareCard";

function formatDate(d) {
  const [, m, day] = d.split("-");
  const months = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${parseInt(day)} ${months[parseInt(m)]}`;
}

function calcPts(pred, res) {
  if (!validScore(res)) return null;
  if (!validScore(pred)) return 0;
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

function downloadGlobalExcel(players, allPollas, results) {
  const wb = XLSX.utils.book_new();
  const sorted = [...GROUP_MATCHES].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const usedNames = {};

  for (const player of players) {
    const polla = allPollas[player.id] ?? { groupScores: {} };
    const rows = [["Fecha", "Hora", "Grupo", "Local", "Visitante", "Pronóstico", "Resultado", "Puntos"]];
    for (const m of sorted) {
      const pred = polla.groupScores?.[m.m];
      const res = results.groupScores?.[m.m];
      const pts = calcPts(pred, res);
      rows.push([
        m.date, m.time, m.g, m.h, m.a,
        validScore(pred) ? `${pred[0]}-${pred[1]}` : "",
        validScore(res) ? `${res[0]}-${res[1]}` : "",
        pts !== null ? pts : "",
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 7 }, { wch: 7 }, { wch: 6 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 7 }];
    let baseName = player.name.slice(0, 31).replace(/[:\\/?*[\]|]/g, "").trim() || "Jugador";
    let sheetName = baseName;
    if (usedNames[sheetName]) {
      sheetName = baseName.slice(0, 29) + usedNames[sheetName];
    }
    usedNames[baseName] = (usedNames[baseName] ?? 1) + 1;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  XLSX.writeFile(wb, "quiniela-mundialista-2026.xlsx");
}



function PlayerPredictionsView({ players, allPollas, results, baseUrl }) {
  const [selectedId, setSelectedId] = useState(players[0]?.id ?? "");

  const selectedPlayer = players.find((p) => p.id === selectedId) ?? players[0];
  const polla = allPollas[selectedId] ?? { groupScores: {} };
  const byDate = Object.groupBy
    ? Object.groupBy(GROUP_MATCHES, (m) => m.date)
    : GROUP_MATCHES.reduce((acc, m) => { (acc[m.date] = acc[m.date] || []).push(m); return acc; }, {});

  const dates = [...new Set(GROUP_MATCHES.map((m) => m.date))].sort();

  return (
    <div>
      {/* Selector de jugador + botón CSV */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block font-cond text-xs uppercase tracking-widest text-mist mb-2">Jugador</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="cursor-pointer rounded-lg border border-line bg-panel px-3 py-2 font-cond text-sm text-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-grass w-full sm:w-auto"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.email ? ` — ${p.email}` : ""}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => downloadGlobalExcel(players, allPollas, results)}
          className="cursor-pointer rounded-lg border border-grass/50 bg-grass/10 hover:bg-grass/20 px-3 py-2 font-cond text-sm font-semibold text-grass transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass"
        >
          ↓ Excel Global
        </button>
      </div>

      {/* Tabla de pronósticos */}
      <div className="space-y-5">
        {dates.map((date) => {
          const matches = (byDate[date] ?? []).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={date}>
              <p className="font-display text-sm uppercase tracking-wide text-chalk mb-2">{formatDate(date)}</p>
              <div className="rounded-xl border border-line overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-turf/80 font-cond text-xs uppercase tracking-wider text-mist">
                      <th className="py-2 px-3 text-left">Partido</th>
                      <th className="py-2 px-3 text-center">Pronóstico</th>
                      <th className="py-2 px-3 text-center">Resultado</th>
                      <th className="py-2 px-3 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => {
                      const pred = polla.groupScores?.[m.m];
                      const res = results.groupScores?.[m.m];
                      const hasPred = validScore(pred);
                      const hasRes = validScore(res);
                      const pts = calcPts(pred, res);

                      return (
                        <tr key={m.m} className="border-b border-line/40 last:border-b-0 bg-panel">
                          <td className="py-2.5 px-3 font-cond text-xs text-mist">
                            <span className="inline-flex items-center gap-1">
                              <Flag code={m.h} size={20} />
                              <span className="font-semibold text-chalk">{m.h}</span>
                            </span>
                            <span className="mx-1.5 text-mist/50">vs</span>
                            <span className="inline-flex items-center gap-1">
                              <Flag code={m.a} size={20} />
                              <span className="font-semibold text-chalk">{m.a}</span>
                            </span>
                            <span className="ml-2 text-mist/50">{m.time}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-cond">
                            {hasPred
                              ? <span className="text-chalk tabular-nums">{pred[0]} – {pred[1]}</span>
                              : <span className="text-mist/40 italic text-xs">—</span>
                            }
                          </td>
                          <td className="py-2.5 px-3 text-center font-cond">
                            {hasRes
                              ? <span className="text-gold tabular-nums">{res[0]} – {res[1]}</span>
                              : <span className="text-mist/40 italic text-xs">—</span>
                            }
                          </td>
                          <td className="py-2.5 px-3 text-center font-cond font-bold tabular-nums">
                            {pts === null ? <span className="text-mist/30">—</span>
                              : pts === 3 ? <span className="text-grass">+3</span>
                              : pts === 1 ? <span className="text-amber">+1</span>
                              : <span className="text-mist/50">0</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultsView({ me, resultsCtx, results, onScore, onPick, onResultKoScore, players, allPollas }) {
  const [sub, setSub] = useState("results");
  const [resultPhase, setResultPhase] = useState("groups");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const tz = useContext(TimezoneContext);

  if (!me?.is_admin) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Lock className="w-12 h-12 text-mist/50" />
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
      const { synced, total, notFound } = await syncResultsFromAPI(tz);
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
      <div className="mb-5 rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 flex flex-wrap items-start gap-4">
        <KeyRound className="w-5 h-5 mt-0.5 text-gold shrink-0" />
        <div className="flex-1 min-w-[200px]">
          <p className="font-cond font-bold uppercase tracking-wider text-gold text-sm">Modo Admin — Resultados Oficiales</p>
          <p className="font-cond text-sm text-chalk mt-0.5">
            Los cambios que hagas aquí se reflejan en tiempo real en la tabla de posiciones de todos los jugadores.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0 cursor-pointer rounded-lg border border-gold/50 bg-gold/10 hover:bg-gold/20 px-3 py-1.5 font-cond text-sm font-semibold uppercase tracking-wider text-gold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </button>
          <p className="font-cond text-[11px] text-mist/70 text-right max-w-[200px]">
            Importa marcadores finales desde football-data.org
          </p>
        </div>
      </div>

      {syncMsg && (
        <div className={`mb-5 rounded-lg border px-4 py-2.5 font-cond text-sm ${syncMsg.ok ? "border-grass/40 bg-grass/10 text-grass" : "border-gold/40 bg-gold/10 text-gold"}`}>
          {syncMsg.text}
        </div>
      )}

      <div className="mb-5 flex border-b border-line">
        {[
          { id: "results", label: "Ingresar Resultados" },
          { id: "predictions", label: "Pronósticos" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`cursor-pointer border-b-2 px-4 py-2.5 font-cond font-bold uppercase tracking-wider text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
              sub === s.id ? "border-gold text-gold" : "border-transparent text-mist hover:text-chalk"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sub === "results" ? (
        <>
          {/* Toggle Grupos / R32 */}
          <div className="mb-5 flex gap-1 rounded-lg border border-line bg-turf/40 p-1 w-fit">
            {[{ id: "groups", label: "Grupos" }, { id: "r32", label: "Dieciseisavos" }].map((t) => (
              <button
                key={t.id}
                onClick={() => setResultPhase(t.id)}
                className={`cursor-pointer rounded-md px-4 py-1.5 font-cond font-bold text-sm uppercase tracking-wider transition-colors duration-150 focus:outline-none ${
                  resultPhase === t.id
                    ? "bg-gold text-night"
                    : "text-mist hover:text-chalk"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {resultPhase === "groups" ? (
            <GroupsView
              ctx={resultsCtx}
              scores={results.groupScores}
              onScore={onScore}
              adminMode={true}
              matchActions={Object.fromEntries(
                GROUP_MATCHES.map((m) => [
                  m.m,
                  <MatchShareButton
                    key={m.m}
                    match={m}
                    players={players ?? []}
                    allPollas={allPollas ?? {}}
                    results={results}
                    baseUrl={import.meta.env.BASE_URL}
                  />,
                ])
              )}
            />
          ) : (
            <R32AdminView
              resultsCtx={resultsCtx}
              koScores={results.koScores ?? {}}
              onResultKoScore={onResultKoScore}
            />
          )}
        </>
      ) : (
        <PlayerPredictionsView players={players ?? []} allPollas={allPollas ?? {}} results={results} baseUrl={import.meta.env.BASE_URL} />
      )}
    </div>
  );
}
