import { GROUP_MATCHES } from "../core/data/groupMatches";
import { KO_MATCHES } from "../core/data/knockoutMatches";
import { TEAMS } from "../core/data/teams";
import { db, supabase } from "./supabase";

// Códigos de football-data.org que difieren de nuestros códigos FIFA
const API_CODE_MAP = {
  HTI: "HAI", // Haití
};

function normalize(tla) {
  return API_CODE_MAP[tla] ?? tla;
}

// Lookup "LOCAL-VISITA" → nuestro match_id (grupos)
const MATCH_LOOKUP = Object.fromEntries(
  GROUP_MATCHES.map((m) => [`${m.h}-${m.a}`, m.m])
);

// Lookup KO — solo partidos con equipos reales resueltos (no slots "W73")
const KO_LOOKUP = Object.fromEntries(
  KO_MATCHES
    .filter((m) => TEAMS[m.hs] && TEAMS[m.as])
    .map((m) => [`${m.hs}-${m.as}`, m.m])
);

function isToday(utcDate, tz, todayLocal) {
  return new Date(utcDate).toLocaleDateString("en-CA", { timeZone: tz }) === todayLocal;
}

export async function syncResultsFromAPI(tz = "America/Lima") {
  const todayLocal = new Date().toLocaleDateString("en-CA", { timeZone: tz });

  // La Edge Function llama a football-data.org server-side (sin CORS)
  const { data, error } = await supabase.functions.invoke("sync-results");

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  const { matches } = data;

  // ── Grupos ────────────────────────────────────────────────────────────────
  const finished = (matches ?? []).filter(
    (m) =>
      m.stage === "GROUP_STAGE" &&
      m.status === "FINISHED" &&
      m.score?.fullTime?.home != null &&
      isToday(m.utcDate, tz, todayLocal)
  );

  let synced = 0;
  const notFound = [];

  for (const apiMatch of finished) {
    const home = normalize(apiMatch.homeTeam.tla);
    const away = normalize(apiMatch.awayTeam.tla);
    const matchId = MATCH_LOOKUP[`${home}-${away}`];

    if (!matchId) { notFound.push(`${home} vs ${away}`); continue; }

    const { error: upsertError } = await db.upsertResultGroup(
      matchId,
      apiMatch.score.fullTime.home,
      apiMatch.score.fullTime.away
    );
    if (!upsertError) synced++;
  }

  // ── Eliminatorias (LAST_32 por ahora) ────────────────────────────────────
  const finishedKo = (matches ?? []).filter(
    (m) =>
      m.stage === "LAST_32" &&
      m.status === "FINISHED" &&
      m.score?.fullTime?.home != null &&
      isToday(m.utcDate, tz, todayLocal)
  );

  let syncedKo = 0;

  for (const apiMatch of finishedKo) {
    const home = normalize(apiMatch.homeTeam.tla);
    const away = normalize(apiMatch.awayTeam.tla);
    const matchId = KO_LOOKUP[`${home}-${away}`];

    if (!matchId) { notFound.push(`${home} vs ${away}`); continue; }

    const s = apiMatch.score;
    const winnerCode = s.winner === "HOME_TEAM" ? home : away;

    // regularTime = 90' score; fullTime solo existe para REGULAR (sin regularTime)
    const rt = s.regularTime ?? s.fullTime;
    // extraTime = goles solo del tiempo extra; acumulamos con 90' para et_home/et_away
    const et = s.extraTime;
    const etHome = et != null ? rt.home + et.home : null;
    const etAway = et != null ? rt.away + et.away : null;
    const penHome = s.penalties?.home ?? null;
    const penAway = s.penalties?.away ?? null;

    const { error: upsertError } = await db.upsertResultKo(
      matchId, winnerCode,
      rt.home, rt.away,
      etHome, etAway,
      penHome, penAway
    );
    if (!upsertError) syncedKo++;
  }

  return {
    synced: synced + syncedKo,
    total: finished.length + finishedKo.length,
    notFound,
  };
}
