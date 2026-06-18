import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { validScore } from "../../lib/polla";

const PLAYER_COLORS = [
  "#4caf50", "#f0c040", "#64b5f6", "#f06292",
  "#ffb74d", "#ba68c8", "#4fc3f7", "#e57373",
  "#aed581", "#ff8a65", "#81c784", "#90a4ae",
];

function calcPts(pred, res) {
  if (!validScore(res)) return 0;
  if (!validScore(pred)) return 0;
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const match = payload[0]?.payload?._match;
  return (
    <div style={{
      background: "#0d1f0f", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8, padding: "8px 12px", fontSize: 12, minWidth: 140,
    }}>
      <p style={{ color: "#8fa88f", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
        {match ? `${match.h} vs ${match.a}` : `Partido ${label}`}
      </p>
      {[...payload]
        .sort((a, b) => b.value - a.value)
        .map((e) => (
          <p key={e.dataKey} style={{ color: e.color, margin: "2px 0" }}>
            <span style={{ color: "#e8ede8" }}>{e.name}</span>
            <span style={{ float: "right", marginLeft: 16, fontWeight: "bold" }}>{e.value} pts</span>
          </p>
        ))}
    </div>
  );
}

export function ScoreEvolutionChart({ players, allPollas, results }) {
  const activePlayers = players.filter((p) => !p.is_admin);
  const playedMatches = GROUP_MATCHES.filter((m) =>
    validScore(results.groupScores?.[m.m])
  );

  if (playedMatches.length === 0) return null;

  // Build cumulative series
  const cumulative = Object.fromEntries(activePlayers.map((p) => [p.id, 0]));
  const chartData = playedMatches.map((match, idx) => {
    const point = { x: idx + 1, _match: match };
    activePlayers.forEach((p) => {
      const res = results.groupScores?.[match.m];
      const pred = allPollas[p.id]?.groupScores?.[match.m];
      cumulative[p.id] += calcPts(pred, res);
      point[p.id] = cumulative[p.id];
    });
    return point;
  });

  return (
    <div className="mt-6 rounded-xl border border-line bg-panel shadow-md p-4 pb-2">
      <h3 className="font-cond text-xs font-bold uppercase tracking-widest text-mist mb-4">
        Evolución de puntos · {playedMatches.length} partido{playedMatches.length !== 1 ? "s" : ""} jugados
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="x"
            tick={{ fill: "#8fa88f", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            label={{ value: "Partido #", position: "insideBottomRight", offset: 0, fill: "#8fa88f", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "#8fa88f", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => {
              const player = activePlayers.find((p) => p.id === value);
              return (
                <span style={{ color: "#e8ede8", fontSize: 11, fontFamily: "inherit" }}>
                  {player?.name ?? value}
                </span>
              );
            }}
          />
          {activePlayers.map((player, idx) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              name={player.id}
              stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
