import { TEAMS } from "../data/teams";
import { useTimezone, convertTime, TIMEZONES } from "../hooks/useTimezone";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatDate(iso, { weekday = true } = {}) {
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  const core = `${d} ${MONTHS[mo - 1]}`;
  return weekday ? `${DAYS[date.getDay()]} ${core}` : core;
}

export const todayISO = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

const TEXT_SIZE_PX = {
  "text-xs": 12, "text-sm": 14, "text-base": 16, "text-lg": 18,
  "text-xl": 20, "text-2xl": 24, "text-3xl": 30, "text-4xl": 36,
};

export function Flag({ code, size, className = "" }) {
  const t = TEAMS[code];
  const px = size ?? Object.entries(TEXT_SIZE_PX).find(([cls]) => className.includes(cls))?.[1] ?? 22;
  const extraClass = className.replace(/\btext-\w+\b/g, "").trim();
  if (!t?.iso2) return <span role="img" aria-label={code}>🏳️</span>;
  const h = Math.round(px * 0.67);
  return (
    <img
      src={`${import.meta.env.BASE_URL}images/flags/${t.iso2}.png`}
      alt={t.name}
      style={{ width: px, height: h, objectFit: "cover", flexShrink: 0 }}
      className={`inline-block rounded-sm select-none ${extraClass}`}
    />
  );
}

export function TimeChip({ date, time, className = "" }) {
  const tz = useTimezone();
  const tzInfo = TIMEZONES.find((t) => t.tz === tz) ?? TIMEZONES[0];
  const display = date ? convertTime(date, time, tz) : time;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-panel-2 border border-line px-2 py-0.5 font-cond font-semibold text-grass tabular-nums tracking-wide ${className}`}
      title={`Hora ${tzInfo.label} (${tzInfo.offset})`}
    >
      <span className="text-[0.85em]">{tzInfo.flag}</span>
      {display}
    </span>
  );
}

export function ScoreInput({ value, onChange, label, disabled = false }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      max="20"
      aria-label={label}
      disabled={disabled}
      className="score w-10 h-10 rounded-md bg-night border border-line text-center font-cond font-bold text-xl text-chalk tabular-nums transition-colors duration-200 hover:border-mist focus:outline-none focus:ring-2 focus:ring-grass focus:ring-offset-2 focus:ring-offset-panel cursor-pointer disabled:cursor-not-allowed disabled:border-dashed disabled:text-mist/50 disabled:hover:border-line"
      value={value ?? ""}
      onChange={(e) => {
        if (disabled) return;
        const n = parseInt(e.target.value, 10);
        onChange(Number.isNaN(n) ? null : Math.max(0, Math.min(20, n)));
      }}
    />
  );
}
