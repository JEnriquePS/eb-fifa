import { GROUP_MATCHES } from "../core/data/groupMatches.js";
import { KO_MATCHES } from "../core/data/knockoutMatches.js";
import { buildContext, koWinner, validScore } from "./polla.js";

// Puntaje de la polla:
//  - Marcador exacto en fase de grupos ........ 3 pts
//  - Resultado acertado (1X2) sin exacto ...... 1 pt
//  - Acertar al ganador de cada llave:
export const KO_POINTS = { R32: 2, R16: 4, QF: 6, SF: 8, "3P": 8, F: 10 };

export function scorePlayer(polla, resultsCtx, results) {
  let exact = 0;
  let outcome = 0;
  let koPts = 0;
  let koHits = 0;

  for (const m of GROUP_MATCHES) {
    const r = results.groupScores[m.m];
    const p = polla.groupScores[m.m];
    if (!validScore(r) || !validScore(p)) continue;
    if (r[0] === p[0] && r[1] === p[1]) exact++;
    else if (Math.sign(r[0] - r[1]) === Math.sign(p[0] - p[1])) outcome++;
  }

  const playerCtx = buildContext(polla.groupScores, polla.koPicks);
  for (const k of KO_MATCHES) {
    const real = koWinner(k.m, resultsCtx);
    const pick = koWinner(k.m, playerCtx);
    if (real && pick && real === pick) {
      koPts += KO_POINTS[k.round];
      koHits++;
    }
  }

  return {
    exact,
    outcome,
    koPts,
    koHits,
    champion: koWinner(104, playerCtx),
    total: exact * 3 + outcome + koPts,
  };
}

export function resultsProgress(resultsCtx, results) {
  const groupsPlayed = GROUP_MATCHES.filter((m) => validScore(results.groupScores[m.m])).length;
  const koDecided = KO_MATCHES.filter((k) => koWinner(k.m, resultsCtx)).length;
  return { groupsPlayed, koDecided };
}
