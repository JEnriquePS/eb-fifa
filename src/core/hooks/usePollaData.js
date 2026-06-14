import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, db, toPolla, toResults } from "../../lib/supabase";

const DEBOUNCE_MS = 900;

export function usePollaData(user) {
  const [dbData, setDbData] = useState(null);
  const [localGroupScores, setLocalGroupScores] = useState({});
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | synced | error
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pendingRef = useRef({});
  const timerRef = useRef(null);

  const reload = useCallback(async () => {
    if (!user) return;
    const data = await db.fetchAll();
    setDbData(data);
    setLastUpdated(new Date());
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga inicial + subscripciones real-time
  useEffect(() => {
    if (!user) return;
    reload();

    const channel = supabase
      .channel("polla-rt-v1")
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions_group" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions_ko" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "results_group" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "results_ko" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, reload)
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, reload]);

  // Flush: escribe el batch de scores pendientes en DB
  const flush = useCallback(async () => {
    const pending = { ...pendingRef.current };
    pendingRef.current = {};
    if (!Object.keys(pending).length) return;

    setSyncStatus("saving");
    try {
      await Promise.all(
        Object.entries(pending).map(([matchId, score]) =>
          score === null
            ? db.deleteGroupPred(user.id, Number(matchId))
            : db.upsertGroupPred(user.id, Number(matchId), score[0], score[1])
        )
      );
      // Solo limpiar del local las entradas eliminadas (score === null).
      // Las guardadas se mantienen en local para evitar el parpadeo entre
      // el flush y el reload del real-time.
      setLocalGroupScores((prev) => {
        const next = { ...prev };
        for (const [key, score] of Object.entries(pending)) {
          if (score === null) delete next[key];
        }
        return next;
      });
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
      // Devolver los fallidos al pendiente para reintentar
      pendingRef.current = { ...pending, ...pendingRef.current };
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }, [flush]);

  // Mutaciones — pronósticos del usuario activo
  const onScore = useCallback(
    (matchId, score) => {
      setLocalGroupScores((prev) => {
        const next = { ...prev };
        if (score === undefined) delete next[matchId];
        else next[matchId] = score;
        return next;
      });
      pendingRef.current[matchId] = score ?? null;
      setSyncStatus("saving");
      scheduleFlush();
    },
    [scheduleFlush]
  );

  const onPick = useCallback(
    async (matchId, code) => {
      try {
        if (code === undefined) await db.deleteKoPick(user.id, matchId);
        else await db.upsertKoPick(user.id, matchId, code);
        // El real-time actualizará el estado
      } catch {
        setSyncStatus("error");
      }
    },
    [user?.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Mutaciones — resultados oficiales (admin)
  const onResultScore = useCallback(async (matchId, score) => {
    if (score === undefined) await db.deleteResultGroup(matchId);
    else await db.upsertResultGroup(matchId, score[0], score[1]);
  }, []);

  const onResultPick = useCallback(async (matchId, code) => {
    if (code === undefined) await db.deleteResultKo(matchId);
    else await db.upsertResultKo(matchId, code);
  }, []);

  // ── Datos derivados ──────────────────────────────────────────────────────

  const myDbGroupScores = dbData
    ? toPolla(dbData.groupPreds, [], user?.id).groupScores
    : {};

  // Mis scores: DB + cambios locales sin guardar (local gana)
  const myGroupScores = { ...myDbGroupScores, ...localGroupScores };
  const myKoPicks = dbData ? toPolla([], dbData.koPreds, user?.id).koPicks : {};

  const players = dbData?.profiles ?? [];
  const me = players.find((p) => p.id === user?.id) ?? null;

  const allPollas = dbData
    ? Object.fromEntries(
        players.map((p) => [
          p.id,
          p.id === user?.id
            ? { groupScores: myGroupScores, koPicks: myKoPicks }
            : toPolla(dbData.groupPreds, dbData.koPreds, p.id),
        ])
      )
    : {};

  const results = dbData
    ? toResults(dbData.resultsGroup, dbData.resultsKo)
    : { groupScores: {}, koPicks: {} };

  return {
    loading: !dbData,
    syncStatus,
    connected,
    lastUpdated,
    myGroupScores,
    myKoPicks,
    players,
    me,
    allPollas,
    results,
    onScore,
    onPick,
    onResultScore,
    onResultPick,
    reload,
  };
}
