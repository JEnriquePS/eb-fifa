import { useRef, useEffect, useMemo } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { GROUP_MATCHES } from "../../core/data/groupMatches";
import { validScore } from "../../lib/polla";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const PLAYER_COLORS = [
  "#4caf50", "#f0c040", "#64b5f6", "#f06292",
  "#ffb74d", "#ba68c8", "#4fc3f7", "#e57373",
  "#aed581", "#ff8a65", "#81c784", "#90a4ae",
];

function calcPts(pred, res) {
  if (!validScore(res) || !validScore(pred)) return 0;
  if (pred[0] === res[0] && pred[1] === res[1]) return 3;
  return Math.sign(pred[0] - pred[1]) === Math.sign(res[0] - res[1]) ? 1 : 0;
}

export function ScoreEvolutionChart({ players, allPollas, results }) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  const activePlayers = useMemo(() => players.filter((p) => !p.is_admin), [players]);

  const playedMatches = useMemo(
    () => GROUP_MATCHES.filter((m) => validScore(results.groupScores?.[m.m])),
    [results.groupScores]
  );

  const option = useMemo(() => {
    if (playedMatches.length === 0) return null;

    const xLabels = playedMatches.map((m) => `${m.h}–${m.a}`);

    const series = activePlayers.map((player, idx) => {
      let cumulative = 0;
      const data = playedMatches.map((match) => {
        const res = results.groupScores?.[match.m];
        const pred = allPollas[player.id]?.groupScores?.[match.m];
        cumulative += calcPts(pred, res);
        return cumulative;
      });
      return {
        name: player.name,
        type: "line",
        data,
        smooth: false,
        showSymbol: false,
        emphasis: { focus: "series" },
        lineStyle: { width: 2, color: PLAYER_COLORS[idx % PLAYER_COLORS.length] },
        itemStyle: { color: PLAYER_COLORS[idx % PLAYER_COLORS.length] },
      };
    });

    return {
      backgroundColor: "transparent",
      animation: true,
      grid: { top: 16, right: 16, bottom: 60, left: 36 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0d1f0f",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        textStyle: { color: "#e8ede8", fontSize: 12 },
        formatter(params) {
          const match = playedMatches[params[0].dataIndex];
          const header = `<div style="color:#8fa88f;font-size:10px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">${match.h} vs ${match.a}</div>`;
          const rows = [...params]
            .sort((a, b) => b.value - a.value)
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">` +
                `<span style="color:${p.color}">● ${p.seriesName}</span>` +
                `<strong style="color:#e8ede8">${p.value} pts</strong></div>`
            )
            .join("");
          return `<div style="min-width:160px">${header}${rows}</div>`;
        },
      },
      legend: {
        bottom: 0,
        type: "scroll",
        textStyle: { color: "#e8ede8", fontSize: 11 },
        pageTextStyle: { color: "#8fa88f" },
        pageIconColor: "#8fa88f",
        pageIconInactiveColor: "#4a5e4a",
        inactiveColor: "#4a5e4a",
      },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#8fa88f",
          fontSize: 10,
          interval: "auto",
          rotate: playedMatches.length > 12 ? 35 : 0,
          formatter: (val) => val.split("–")[0],
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#8fa88f", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)", type: "dashed" } },
      },
      series,
    };
  }, [activePlayers, playedMatches, allPollas, results.groupScores]);

  // Init chart instance
  useEffect(() => {
    if (!chartRef.current) return;
    instanceRef.current = echarts.init(chartRef.current, null, { renderer: "canvas" });
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  // Update option whenever data changes
  useEffect(() => {
    if (!instanceRef.current || !option) return;
    instanceRef.current.setOption(option, true);
  }, [option]);

  // Resize on container width change
  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => instanceRef.current?.resize());
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  if (playedMatches.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-line bg-panel shadow-md p-4 pb-3">
      <p className="font-cond text-xs font-bold uppercase tracking-widest text-mist mb-3">
        Evolución de puntos · {playedMatches.length} partido{playedMatches.length !== 1 ? "s" : ""} jugados
      </p>
      <div ref={chartRef} style={{ height: 280, width: "100%" }} />
    </div>
  );
}
