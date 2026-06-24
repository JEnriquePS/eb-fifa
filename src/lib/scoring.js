import { GROUP_MATCHES } from "../core/data/groupMatches.js";
import { KO_MATCHES } from "../core/data/knockoutMatches.js";
import { buildContext, koWinner, validScore } from "./polla.js";

const R32_IDS = new Set(KO_MATCHES.filter((k) => k.round === "R32").map((k) => k.m));

// Puntaje por fase individual (RT, ET o PEN): 3pts exacto, 1pt resultado correcto.
// En penales no hay empate posible, así que "resultado" = acertar el ganador.
function scorePhase(predH, predA, resH, resA) {
  if (predH == null || predA == null || resH == null || resA == null) return 0;
  if (predH === resH && predA === resA) return 3;
  if (Math.sign(predH - predA) === Math.sign(resH - resA)) return 1;
  return 0;
}

// Puntaje acumulado de un partido KO:
//   RT siempre se puntúa si hay resultado.
//   ET solo si el RT fue empate (resRtH === resRtA).
//   PEN solo si el ET también fue empate (resEtH === resEtA).
function scoreKoMatch(pred, res) {
  let pts = 0;
  const rtDraw = res.rtHome != null && res.rtHome === res.rtAway;
  const etDraw = rtDraw && res.etHome != null && res.etHome === res.etAway;

  pts += scorePhase(pred.rtHome, pred.rtAway, res.rtHome, res.rtAway);
  if (rtDraw) pts += scorePhase(pred.etHome, pred.etAway, res.etHome, res.etAway);
  if (etDraw) pts += scorePhase(pred.penHome, pred.penAway, res.penHome, res.penAway);

  return pts;
}

export function scoreR32Player(polla, koScores) {
  let exact = 0, outcome = 0;
  for (const matchId of R32_IDS) {
    const res = koScores[matchId];
    if (!res?.winner) continue;
    const pred = polla.koPickScores?.[matchId] ?? {};

    const rtDraw = res.rtHome != null && res.rtHome === res.rtAway;
    const etDraw = rtDraw && res.etHome != null && res.etHome === res.etAway;

    const phases = [
      { predH: pred.rtHome, predA: pred.rtAway, resH: res.rtHome, resA: res.rtAway },
      ...(rtDraw ? [{ predH: pred.etHome, predA: pred.etAway, resH: res.etHome, resA: res.etAway }] : []),
      ...(etDraw ? [{ predH: pred.penHome, predA: pred.penAway, resH: res.penHome, resA: res.penAway }] : []),
    ];

    for (const { predH, predA, resH, resA } of phases) {
      const pts = scorePhase(predH, predA, resH, resA);
      if (pts === 3) exact++;
      else if (pts === 1) outcome++;
    }
  }
  return { exact, outcome, total: exact * 3 + outcome };
}

// Puntaje de la polla (fase de grupos):
//  - Marcador exacto ........ 3 pts
//  - Resultado 1X2 .......... 1 pt
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
    total: exact * 3 + outcome,
  };
}

export function resultsProgress(resultsCtx, results) {
  const groupsPlayed = GROUP_MATCHES.filter((m) => validScore(results.groupScores[m.m])).length;
  const koDecided = KO_MATCHES.filter((k) => koWinner(k.m, resultsCtx)).length;
  return { groupsPlayed, koDecided };
}
