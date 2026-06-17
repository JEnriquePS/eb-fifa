import { GROUPS, groupOf } from "../core/data/teams.js";
import { GROUP_MATCHES } from "../core/data/groupMatches.js";
import { KO_MATCHES, KO_BY_ID } from "../core/data/knockoutMatches.js";

export const validScore = (s) => s && Number.isInteger(s[0]) && Number.isInteger(s[1]);

// ── Tablas de grupo ──────────────────────────────────────────────────────────

export function computeTable(group, scores) {
  const rows = Object.fromEntries(
    GROUPS[group].map((c) => [c, { code: c, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }])
  );
  for (const match of GROUP_MATCHES) {
    if (match.g !== group) continue;
    const s = scores[match.m];
    if (!validScore(s)) continue;
    const [gh, ga] = s;
    const H = rows[match.h];
    const A = rows[match.a];
    H.pj++; A.pj++;
    H.gf += gh; H.gc += ga;
    A.gf += ga; A.gc += gh;
    if (gh > ga) { H.g++; A.p++; H.pts += 3; }
    else if (gh < ga) { A.g++; H.p++; A.pts += 3; }
    else { H.e++; A.e++; H.pts++; A.pts++; }
  }
  return Object.values(rows)
    .map((r) => ({ ...r, dg: r.gf - r.gc }))
    .sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.code.localeCompare(y.code));
}

export const isGroupComplete = (group, scores) =>
  GROUP_MATCHES.filter((m) => m.g === group).every((m) => validScore(scores[m.m]));

export const countPredicted = (scores) =>
  GROUP_MATCHES.filter((m) => validScore(scores[m.m])).length;

export function pendingMatchesProgress(scores, today) {
  const pending = GROUP_MATCHES.filter((m) => m.date >= today);
  const predicted = pending.filter((m) => validScore(scores[m.m])).length;
  return { predicted, total: pending.length };
}

// ── Mejores terceros ─────────────────────────────────────────────────────────
// Con los 12 grupos completos: se rankean los 12 terceros (pts, dg, gf) y
// clasifican los 8 mejores. Luego se asignan a los slots "3XXXXX" del bracket
// respetando los grupos permitidos de cada slot (búsqueda con backtracking).

export function computeThirds(tables, complete) {
  if (Object.keys(GROUPS).some((g) => !complete[g])) return null;
  const thirds = Object.keys(GROUPS)
    .map((g) => ({ ...tables[g][2], group: g }))
    .sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.group.localeCompare(y.group));
  const qualified = thirds.slice(0, 8);

  const slots = KO_MATCHES.filter((k) => k.as.startsWith("3")).map((k) => ({
    matchId: k.m,
    allowed: k.as.slice(1),
  }));

  const assignment = {};
  const used = new Set();
  const solve = (i) => {
    if (i === slots.length) return true;
    const slot = slots[i];
    for (const t of qualified) {
      if (used.has(t.group) || !slot.allowed.includes(t.group)) continue;
      used.add(t.group);
      assignment[slot.matchId] = t.code;
      if (solve(i + 1)) return true;
      used.delete(t.group);
      delete assignment[slot.matchId];
    }
    return false;
  };
  solve(0);
  return { ranking: thirds, qualified: new Set(qualified.map((t) => t.code)), assignment };
}

// ── Resolución del bracket ───────────────────────────────────────────────────
// ctx = { tables, complete, thirds, koPicks }

export function resolveSlot(slot, matchId, ctx) {
  if (/^[12][A-L]$/.test(slot)) {
    const g = slot[1];
    return ctx.complete[g] ? ctx.tables[g][slot[0] === "1" ? 0 : 1].code : null;
  }
  if (slot.startsWith("3")) return ctx.thirds?.assignment[matchId] ?? null;
  const ref = Number(slot.slice(1));
  const { home, away } = resolveKoMatch(ref, ctx);
  const winner = koWinner(ref, ctx);
  if (!winner) return null;
  return slot[0] === "W" ? winner : winner === home ? away : home;
}

export function resolveKoMatch(matchId, ctx) {
  const k = KO_BY_ID[matchId];
  return {
    home: resolveSlot(k.hs, matchId, ctx),
    away: resolveSlot(k.as, matchId, ctx),
  };
}

export function koWinner(matchId, ctx) {
  const pick = ctx.koPicks[matchId];
  if (!pick) return null;
  const { home, away } = resolveKoMatch(matchId, ctx);
  return home && away && (pick === home || pick === away) ? pick : null;
}

export function buildContext(groupScores, koPicks) {
  const tables = {};
  const complete = {};
  for (const g of Object.keys(GROUPS)) {
    tables[g] = computeTable(g, groupScores);
    complete[g] = isGroupComplete(g, groupScores);
  }
  const thirds = computeThirds(tables, complete);
  return { tables, complete, thirds, koPicks };
}

// ── Etiquetas ────────────────────────────────────────────────────────────────

export function slotLabel(slot) {
  if (/^[12][A-L]$/.test(slot)) return `${slot[0]}° Grupo ${slot[1]}`;
  if (slot.startsWith("3")) return `3° ${slot.slice(1).split("").join("/")}`;
  return `${slot[0] === "W" ? "Ganador" : "Perdedor"} P${slot.slice(1)}`;
}

export const thirdGroupOf = groupOf;
