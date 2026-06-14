import { GROUP_MATCHES } from "../core/data/groupMatches";
import { db, supabase } from "./supabase";

// Códigos de football-data.org que difieren de nuestros códigos FIFA
const API_CODE_MAP = {
  HTI: "HAI", // Haití
};

function normalize(tla) {
  return API_CODE_MAP[tla] ?? tla;
}

// Lookup "LOCAL-VISITA" → nuestro match_id
const MATCH_LOOKUP = Object.fromEntries(
  GROUP_MATCHES.map((m) => [`${m.h}-${m.a}`, m.m])
);

export async function syncResultsFromAPI() {
  // La Edge Function llama a football-data.org server-side (sin CORS)
  const { data, error } = await supabase.functions.invoke("sync-results");

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  const { matches } = data;

  const finished = (matches ?? []).filter(
    (m) =>
      m.status === "FINISHED" &&
      m.score?.fullTime?.home != null &&
      m.score?.fullTime?.away != null
  );

  let synced = 0;
  const notFound = [];

  for (const apiMatch of finished) {
    const home = normalize(apiMatch.homeTeam.tla);
    const away = normalize(apiMatch.awayTeam.tla);
    const matchId = MATCH_LOOKUP[`${home}-${away}`];

    if (!matchId) {
      notFound.push(`${home} vs ${away}`);
      continue;
    }

    const { error: upsertError } = await db.upsertResultGroup(
      matchId,
      apiMatch.score.fullTime.home,
      apiMatch.score.fullTime.away
    );
    if (!upsertError) synced++;
  }

  return { synced, total: finished.length, notFound };
}
