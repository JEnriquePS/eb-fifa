import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, db, toPolla, toResults, toTiebreakers } from "../../lib/supabase";

const DEBOUNCE_MS = 900;

export function usePollaData(user) {
  const [dbData, setDbData] = useState(null);
  const [localGroupScores, setLocalGroupScores] = useState({});
  const [localKoPicks, setLocalKoPicks] = useState({});
  const [localKoPickScores, setLocalKoPickScores] = useState({});
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | synced | error
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pendingRef = useRef({});
  const timerRef = useRef(null);

  const reload = useCallback(async () => {
    if (!user) return;
    const data = await db.fetchAll();
    setDbData(data);
    setLocalKoPicks({});
    setLocalKoPickScores({});
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
      .on("postgres_changes", { event: "*", schema: "public", table: "group_tiebreakers" }, reload)
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
    async (matchId, code, rtHome, rtAway, etHome, etAway, penHome, penAway) => {
      // Optimistic update — visible en ambas vistas sin esperar real-time
      if (code !== undefined) {
        setLocalKoPicks(prev => ({ ...prev, [matchId]: code }));
        if (rtHome != null) {
          setLocalKoPickScores(prev => ({
            ...prev,
            [matchId]: {
              rtHome, rtAway: rtAway ?? null,
              etHome: etHome ?? null, etAway: etAway ?? null,
              penHome: penHome ?? null, penAway: penAway ?? null,
            },
          }));
        }
      } else {
        setLocalKoPicks(prev => { const n = { ...prev }; delete n[matchId]; return n; });
        setLocalKoPickScores(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      }
      try {
        if (code === undefined) await db.deleteKoPick(user.id, matchId);
        else await db.upsertKoPick(user.id, matchId, code, rtHome ?? null, rtAway ?? null, etHome ?? null, etAway ?? null, penHome ?? null, penAway ?? null);
      } catch {
        // Rollback en error
        setLocalKoPicks(prev => { const n = { ...prev }; delete n[matchId]; return n; });
        setLocalKoPickScores(prev => { const n = { ...prev }; delete n[matchId]; return n; });
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

  const onResultKoScore = useCallback(async (matchId, winnerCode, rtHome, rtAway, etHome, etAway, penHome, penAway) => {
    try {
      if (winnerCode === undefined) await db.deleteResultKo(matchId);
      else await db.upsertResultKo(matchId, winnerCode, rtHome ?? null, rtAway ?? null, etHome ?? null, etAway ?? null, penHome ?? null, penAway ?? null);
    } catch {
      setSyncStatus("error");
    }
  }, []);

  const onTiebreaker = useCallback(async (groupCode, position, teamCode) => {
    try {
      await db.upsertTiebreaker(groupCode, position, teamCode);
    } catch {
      setSyncStatus("error");
    }
  }, []);

  // ── Datos derivados ──────────────────────────────────────────────────────

  const myDbGroupScores = dbData
    ? toPolla(dbData.groupPreds, [], user?.id).groupScores
    : {};

  // Mis scores: DB + cambios locales sin guardar (local gana)
  const myGroupScores = { ...myDbGroupScores, ...localGroupScores };
  const myDbKoPicks = dbData ? toPolla([], dbData.koPreds, user?.id).koPicks : {};
  const myDbKoPickScores = dbData ? toPolla([], dbData.koPreds, user?.id).koPickScores : {};
  const myKoPicks = { ...myDbKoPicks, ...localKoPicks };
  const myKoPickScores = { ...myDbKoPickScores, ...localKoPickScores };

  const players = dbData?.profiles ?? [];
  const me = players.find((p) => p.id === user?.id) ?? null;

  const allPollas = dbData
    ? Object.fromEntries(
        players.map((p) => {
          if (p.id === user?.id) {
            return [p.id, { groupScores: myGroupScores, koPicks: myKoPicks, koPickScores: myKoPickScores }];
          }
          return [p.id, toPolla(dbData.groupPreds, dbData.koPreds, p.id)];
        })
      )
    : {};

  const results = dbData
    ? toResults(dbData.resultsGroup, dbData.resultsKo)
    : { groupScores: {}, koPicks: {}, koScores: {} };

  const tiebreakers = dbData ? toTiebreakers(dbData.tiebreakersRaw ?? []) : {};

  return {
    loading: !dbData,
    syncStatus,
    connected,
    lastUpdated,
    myGroupScores,
    myKoPicks,
    myKoPickScores,
    players,
    me,
    allPollas,
    results,
    tiebreakers,
    onScore,
    onPick,
    onResultScore,
    onResultPick,
    onResultKoScore,
    onTiebreaker,
    reload,
  };
}
