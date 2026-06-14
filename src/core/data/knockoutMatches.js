// 32 partidos de fase eliminatoria — bracket oficial FIFA 2026.
// time = hora de Perú (UTC-5, Lima).
// Slots: "1A" ganador de grupo, "2A" segundo, "3ABCDF" tercero proveniente de
// uno de esos grupos, "W73" ganador del partido 73, "L101" perdedor del 101.

export const KO_MATCHES = [
  { m: 73, round: "R32", hs: "2A", as: "2B", date: "2026-06-28", time: "14:00", stadium: "SoFi Stadium", city: "Los Ángeles" },
  { m: 74, round: "R32", hs: "1E", as: "3ABCDF", date: "2026-06-29", time: "15:30", stadium: "Gillette Stadium", city: "Boston" },
  { m: 75, round: "R32", hs: "1F", as: "2C", date: "2026-06-29", time: "20:00", stadium: "Estadio BBVA", city: "Monterrey" },
  { m: 76, round: "R32", hs: "1C", as: "2F", date: "2026-06-29", time: "12:00", stadium: "NRG Stadium", city: "Houston" },
  { m: 77, round: "R32", hs: "1I", as: "3CDFGH", date: "2026-06-30", time: "16:00", stadium: "MetLife Stadium", city: "Nueva York/NJ" },
  { m: 78, round: "R32", hs: "2E", as: "2I", date: "2026-06-30", time: "12:00", stadium: "AT&T Stadium", city: "Dallas" },
  { m: 79, round: "R32", hs: "1A", as: "3CEFHI", date: "2026-06-30", time: "20:00", stadium: "Estadio Azteca", city: "Ciudad de México" },
  { m: 80, round: "R32", hs: "1L", as: "3EHIJK", date: "2026-07-01", time: "11:00", stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  { m: 81, round: "R32", hs: "1D", as: "3BEFIJ", date: "2026-07-01", time: "19:00", stadium: "Levi's Stadium", city: "San Francisco" },
  { m: 82, round: "R32", hs: "1G", as: "3AEHIJ", date: "2026-07-01", time: "15:00", stadium: "Lumen Field", city: "Seattle" },
  { m: 83, round: "R32", hs: "2K", as: "2L", date: "2026-07-02", time: "18:00", stadium: "BMO Field", city: "Toronto" },
  { m: 84, round: "R32", hs: "1H", as: "2J", date: "2026-07-02", time: "14:00", stadium: "SoFi Stadium", city: "Los Ángeles" },
  { m: 85, round: "R32", hs: "1B", as: "3EFGIJ", date: "2026-07-02", time: "22:00", stadium: "BC Place", city: "Vancouver" },
  { m: 86, round: "R32", hs: "1J", as: "2H", date: "2026-07-03", time: "17:00", stadium: "Hard Rock Stadium", city: "Miami" },
  { m: 87, round: "R32", hs: "1K", as: "3DEIJL", date: "2026-07-03", time: "20:30", stadium: "Arrowhead Stadium", city: "Kansas City" },
  { m: 88, round: "R32", hs: "2D", as: "2G", date: "2026-07-03", time: "13:00", stadium: "AT&T Stadium", city: "Dallas" },
  { m: 89, round: "R16", hs: "W74", as: "W77", date: "2026-07-04", time: "16:00", stadium: "Lincoln Financial Field", city: "Filadelfia" },
  { m: 90, round: "R16", hs: "W73", as: "W75", date: "2026-07-04", time: "12:00", stadium: "NRG Stadium", city: "Houston" },
  { m: 91, round: "R16", hs: "W76", as: "W78", date: "2026-07-05", time: "15:00", stadium: "MetLife Stadium", city: "Nueva York/NJ" },
  { m: 92, round: "R16", hs: "W79", as: "W80", date: "2026-07-05", time: "19:00", stadium: "Estadio Azteca", city: "Ciudad de México" },
  { m: 93, round: "R16", hs: "W83", as: "W84", date: "2026-07-06", time: "14:00", stadium: "AT&T Stadium", city: "Dallas" },
  { m: 94, round: "R16", hs: "W81", as: "W82", date: "2026-07-06", time: "19:00", stadium: "Lumen Field", city: "Seattle" },
  { m: 95, round: "R16", hs: "W86", as: "W88", date: "2026-07-07", time: "11:00", stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  { m: 96, round: "R16", hs: "W85", as: "W87", date: "2026-07-07", time: "15:00", stadium: "BC Place", city: "Vancouver" },
  { m: 97, round: "QF", hs: "W89", as: "W90", date: "2026-07-09", time: "15:00", stadium: "Gillette Stadium", city: "Boston" },
  { m: 98, round: "QF", hs: "W93", as: "W94", date: "2026-07-10", time: "14:00", stadium: "SoFi Stadium", city: "Los Ángeles" },
  { m: 99, round: "QF", hs: "W91", as: "W92", date: "2026-07-11", time: "16:00", stadium: "Hard Rock Stadium", city: "Miami" },
  { m: 100, round: "QF", hs: "W95", as: "W96", date: "2026-07-11", time: "20:00", stadium: "Arrowhead Stadium", city: "Kansas City" },
  { m: 101, round: "SF", hs: "W97", as: "W98", date: "2026-07-14", time: "14:00", stadium: "AT&T Stadium", city: "Dallas" },
  { m: 102, round: "SF", hs: "W99", as: "W100", date: "2026-07-15", time: "14:00", stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  { m: 103, round: "3P", hs: "L101", as: "L102", date: "2026-07-18", time: "16:00", stadium: "Hard Rock Stadium", city: "Miami" },
  { m: 104, round: "F", hs: "W101", as: "W102", date: "2026-07-19", time: "14:00", stadium: "MetLife Stadium", city: "Nueva York/NJ" },
];

export const ROUND_LABELS = {
  R32: "Dieciseisavos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semifinal",
  "3P": "Tercer Puesto",
  F: "Final",
};

export const KO_BY_ID = Object.fromEntries(KO_MATCHES.map((k) => [k.m, k]));
