import { GROUPS, groupOf } from "../core/data/teams.js";
import { GROUP_MATCHES } from "../core/data/groupMatches.js";
import { KO_MATCHES, KO_BY_ID } from "../core/data/knockoutMatches.js";

export const validScore = (s) => s && Number.isInteger(s[0]) && Number.isInteger(s[1]);

// ── Tablas de grupo ──────────────────────────────────────────────────────────

// Desempate FIFA: pts → dg → gf → head-to-head (pts, dg, gf) → sorteo
// El sorteo queda marcado como _tied: true para que el admin lo resuelva.

function applyH2H(chunk, groupMatches, scores) {
  if (chunk.length <= 1) return chunk;

  const codes = chunk.map((r) => r.code);
  const h2h = Object.fromEntries(codes.map((c) => [c, { pts: 0, dg: 0, gf: 0 }]));

  for (const m of groupMatches) {
    if (!codes.includes(m.h) || !codes.includes(m.a)) continue;
    const s = scores[m.m];
    if (!validScore(s)) continue;
    const [gh, ga] = s;
    h2h[m.h].gf += gh;
    h2h[m.h].dg += gh - ga;
    h2h[m.a].gf += ga;
    h2h[m.a].dg += ga - gh;
    if (gh > ga) h2h[m.h].pts += 3;
    else if (gh < ga) h2h[m.a].pts += 3;
    else { h2h[m.h].pts++; h2h[m.a].pts++; }
  }

  const sorted = [...chunk].sort(
    (x, y) =>
      h2h[y.code].pts - h2h[x.code].pts ||
      h2h[y.code].dg - h2h[x.code].dg ||
      h2h[y.code].gf - h2h[x.code].gf
  );

  // Marcar empates que siguen sin resolverse tras el H2H
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = h2h[sorted[i].code];
    const b = h2h[sorted[i + 1].code];
    if (a.pts === b.pts && a.dg === b.dg && a.gf === b.gf) {
      sorted[i] = { ...sorted[i], _tied: true };
      sorted[i + 1] = { ...sorted[i + 1], _tied: true };
    }
  }

  return sorted;
}

// overrides: { 1: "MEX", 2: "RSA" } → posición 1-indexed → código de equipo
function applyOverrides(table, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) return table;

  const result = table.map((r) => ({ ...r }));
  const resolved = new Set();

  for (const [posStr, teamCode] of Object.entries(overrides).sort((a, b) => a[0] - b[0])) {
    const posIdx = parseInt(posStr) - 1;
    const curIdx = result.findIndex((r) => r.code === teamCode);
    if (curIdx === -1) continue;

    const displaced = result[posIdx].code;
    if (curIdx !== posIdx) {
      [result[posIdx], result[curIdx]] = [result[curIdx], result[posIdx]];
    }
    resolved.add(teamCode);
    resolved.add(displaced);
  }

  return result.map((r) => (resolved.has(r.code) ? { ...r, _tied: false } : r));
}

export function computeTable(group, scores, overrides = {}) {
  const rows = Object.fromEntries(
    GROUPS[group].map((c) => [c, { code: c, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }])
  );
  const groupMatches = GROUP_MATCHES.filter((m) => m.g === group);

  for (const match of groupMatches) {
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

  const withDg = Object.values(rows).map((r) => ({ ...r, dg: r.gf - r.gc }));
  withDg.sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf);

  // Aplicar H2H dentro de cada grupo de empate
  let i = 0;
  const sorted = [];
  while (i < withDg.length) {
    let j = i + 1;
    while (
      j < withDg.length &&
      withDg[j].pts === withDg[i].pts &&
      withDg[j].dg === withDg[i].dg &&
      withDg[j].gf === withDg[i].gf
    ) j++;
    const chunk = withDg.slice(i, j);
    sorted.push(...(chunk.length > 1 ? applyH2H(chunk, groupMatches, scores) : chunk));
    i = j;
  }

  return applyOverrides(sorted, overrides);
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

export function computeThirds(tables, complete, provisional = false) {
  if (!provisional && Object.keys(GROUPS).some((g) => !complete[g])) return null;

  const thirds = Object.keys(GROUPS)
    .map((g) => ({ ...tables[g][2], group: g }))
    .filter((t) => t.pj > 0) // solo grupos que ya jugaron al menos 1 partido
    .sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.group.localeCompare(y.group));

  const qualified = thirds.slice(0, 8);
  if (qualified.length === 0) return null;

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
    // En modo provisional: si no hay equipo elegible, saltar el slot
    if (provisional) return solve(i + 1);
    return false;
  };
  solve(0);
  return { ranking: thirds, qualified: new Set(qualified.map((t) => t.code)), assignment };
}

// ── Resolución del bracket ───────────────────────────────────────────────────
// ctx = { tables, complete, thirds, koPicks, groupTies }

// provisional=true: muestra el líder actual aunque el grupo no haya terminado
export function resolveSlot(slot, matchId, ctx, provisional = false) {
  if (/^[12][A-L]$/.test(slot)) {
    const g = slot[1];
    const idx = slot[0] === "1" ? 0 : 1;
    if (!provisional && !ctx.complete[g]) return null;
    const entry = ctx.tables[g]?.[idx];
    if (!entry || entry.pj === 0 || entry._tied) return null;
    return entry.code;
  }
  if (slot.startsWith("3")) {
    const src = provisional ? ctx.thirdsProvisional : ctx.thirds;
    return src?.assignment[matchId] ?? null;
  }
  const ref = Number(slot.slice(1));
  const { home, away } = resolveKoMatch(ref, ctx, provisional);
  const winner = koWinner(ref, ctx, provisional);
  if (!winner) return null;
  return slot[0] === "W" ? winner : winner === home ? away : home;
}

export function resolveKoMatch(matchId, ctx, provisional = false) {
  const k = KO_BY_ID[matchId];
  return {
    home: resolveSlot(k.hs, matchId, ctx, provisional),
    away: resolveSlot(k.as, matchId, ctx, provisional),
  };
}

export function koWinner(matchId, ctx, provisional = false) {
  const pick = ctx.koPicks[matchId];
  if (!pick) return null;
  const { home, away } = resolveKoMatch(matchId, ctx, provisional);
  return home && away && (pick === home || pick === away) ? pick : null;
}

// tiebreakers: { "A": { 1: "MEX", 2: "RSA" }, ... }  (posición 1-indexed → código)
export function buildContext(groupScores, koPicks, tiebreakers = {}) {
  const tables = {};
  const complete = {};
  const groupTies = {};

  for (const g of Object.keys(GROUPS)) {
    tables[g] = computeTable(g, groupScores, tiebreakers[g] ?? {});
    complete[g] = isGroupComplete(g, groupScores);

    // Detectar posiciones que siguen empatadas después de aplicar overrides
    if (complete[g]) {
      const ties = [];
      let i = 0;
      while (i < tables[g].length) {
        if (tables[g][i]._tied) {
          const start = i;
          while (i + 1 < tables[g].length && tables[g][i + 1]._tied) i++;
          ties.push({
            positions: Array.from({ length: i - start + 1 }, (_, k) => start + k),
            candidates: tables[g].slice(start, i + 1).map((r) => r.code),
          });
        }
        i++;
      }
      if (ties.length > 0) groupTies[g] = ties;
    }
  }

  const thirds = computeThirds(tables, complete);
  const thirdsProvisional = thirds ?? computeThirds(tables, complete, true);
  return { tables, complete, thirds, thirdsProvisional, koPicks, groupTies };
}

// ── Etiquetas ────────────────────────────────────────────────────────────────

export function slotLabel(slot) {
  if (/^[12][A-L]$/.test(slot)) return `${slot[0]}° Grupo ${slot[1]}`;
  if (slot.startsWith("3")) return `3° ${slot.slice(1).split("").join("/")}`;
  return `${slot[0] === "W" ? "Ganador" : "Perdedor"} P${slot.slice(1)}`;
}

export const thirdGroupOf = groupOf;
