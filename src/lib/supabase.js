import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Faltan variables de entorno.\n" +
      "Copia .env.example → .env.local y pon tu URL y clave de Supabase."
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

// ── DB helpers ───────────────────────────────────────────────────────────────

export const db = {
  async fetchAll() {
    const [p, gp, kp, rg, rk] = await Promise.all([
      supabase.from("profiles").select("id, name, email, is_admin, created_at").order("created_at"),
      supabase.from("predictions_group").select("user_id, match_id, home_score, away_score"),
      supabase.from("predictions_ko").select("user_id, match_id, winner_code"),
      supabase.from("results_group").select("match_id, home_score, away_score"),
      supabase.from("results_ko").select("match_id, winner_code"),
    ]);
    return {
      profiles: p.data ?? [],
      groupPreds: gp.data ?? [],
      koPreds: kp.data ?? [],
      resultsGroup: rg.data ?? [],
      resultsKo: rk.data ?? [],
    };
  },

  async getProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data;
  },

  async upsertProfile(userId, name, email) {
    return supabase
      .from("profiles")
      .upsert({ id: userId, name, ...(email ? { email } : {}) }, { onConflict: "id" });
  },

  async upsertGroupPred(userId, matchId, homeScore, awayScore) {
    return supabase.from("predictions_group").upsert(
      { user_id: userId, match_id: matchId, home_score: homeScore, away_score: awayScore },
      { onConflict: "user_id,match_id" }
    );
  },

  async deleteGroupPred(userId, matchId) {
    return supabase
      .from("predictions_group")
      .delete()
      .eq("user_id", userId)
      .eq("match_id", matchId);
  },

  async upsertKoPick(userId, matchId, winnerCode) {
    return supabase.from("predictions_ko").upsert(
      { user_id: userId, match_id: matchId, winner_code: winnerCode },
      { onConflict: "user_id,match_id" }
    );
  },

  async deleteKoPick(userId, matchId) {
    return supabase
      .from("predictions_ko")
      .delete()
      .eq("user_id", userId)
      .eq("match_id", matchId);
  },

  async upsertResultGroup(matchId, homeScore, awayScore) {
    return supabase.from("results_group").upsert(
      { match_id: matchId, home_score: homeScore, away_score: awayScore, updated_at: new Date().toISOString() },
      { onConflict: "match_id" }
    );
  },

  async deleteResultGroup(matchId) {
    return supabase.from("results_group").delete().eq("match_id", matchId);
  },

  async upsertResultKo(matchId, winnerCode) {
    return supabase.from("results_ko").upsert(
      { match_id: matchId, winner_code: winnerCode, updated_at: new Date().toISOString() },
      { onConflict: "match_id" }
    );
  },

  async deleteResultKo(matchId) {
    return supabase.from("results_ko").delete().eq("match_id", matchId);
  },
};

// ── Format converters ────────────────────────────────────────────────────────

/** Convierte filas planas de DB al formato {groupScores, koPicks} de polla.js */
export function toPolla(groupPreds, koPreds, userId) {
  const groupScores = {};
  for (const p of userId ? groupPreds.filter((r) => r.user_id === userId) : groupPreds) {
    groupScores[p.match_id] = [p.home_score, p.away_score];
  }
  const koPicks = {};
  for (const p of userId ? koPreds.filter((r) => r.user_id === userId) : koPreds) {
    koPicks[p.match_id] = p.winner_code;
  }
  return { groupScores, koPicks };
}

export function toResults(resultsGroup, resultsKo) {
  const groupScores = {};
  for (const r of resultsGroup) groupScores[r.match_id] = [r.home_score, r.away_score];
  const koPicks = {};
  for (const r of resultsKo) koPicks[r.match_id] = r.winner_code;
  return { groupScores, koPicks };
}
