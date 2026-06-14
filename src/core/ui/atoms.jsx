import { TEAMS } from "../data/teams";

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

export function Flag({ code, className = "text-2xl" }) {
  const t = TEAMS[code];
  return (
    <span className={`${className} leading-none select-none`} role="img" aria-label={t?.name ?? code}>
      {t?.flag ?? "🏳️"}
    </span>
  );
}

export function TimeChip({ time, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-panel-2 border border-line px-2 py-0.5 font-cond font-semibold text-grass tabular-nums tracking-wide ${className}`}
      title="Hora peruana (Lima, UTC-5)"
    >
      <span role="img" aria-label="Perú" className="text-[0.85em]">🇵🇪</span>
      {time}
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
      className="score w-10 h-10 rounded-md bg-night border border-line text-center font-cond font-bold text-xl text-chalk tabular-nums transition-colors duration-200 hover:border-mist focus:outline-none focus:ring-2 focus:ring-grass focus:ring-offset-2 focus:ring-offset-panel cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line"
      value={value ?? ""}
      onChange={(e) => {
        if (disabled) return;
        const n = parseInt(e.target.value, 10);
        onChange(Number.isNaN(n) ? null : Math.max(0, Math.min(20, n)));
      }}
    />
  );
}
