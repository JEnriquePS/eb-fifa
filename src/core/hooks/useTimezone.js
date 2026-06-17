import { createContext, useContext, useState } from "react";

export const TIMEZONES = [
  { tz: "America/Lima",                    label: "Perú",      flag: "🇵🇪", offset: "UTC-5"   },
  { tz: "America/Bogota",                  label: "Colombia",  flag: "🇨🇴", offset: "UTC-5"   },
  { tz: "America/Guayaquil",               label: "Ecuador",   flag: "🇪🇨", offset: "UTC-5"   },
  { tz: "America/Caracas",                 label: "Venezuela", flag: "🇻🇪", offset: "UTC-4"   },
  { tz: "America/La_Paz",                  label: "Bolivia",   flag: "🇧🇴", offset: "UTC-4"   },
  { tz: "America/Guyana",                  label: "Guyana",    flag: "🇬🇾", offset: "UTC-4"   },
  { tz: "America/Santiago",                label: "Chile",     flag: "🇨🇱", offset: "UTC-3/4" },
  { tz: "America/Sao_Paulo",               label: "Brasil",    flag: "🇧🇷", offset: "UTC-3"   },
  { tz: "America/Argentina/Buenos_Aires",  label: "Argentina", flag: "🇦🇷", offset: "UTC-3"   },
  { tz: "America/Montevideo",              label: "Uruguay",   flag: "🇺🇾", offset: "UTC-3"   },
  { tz: "America/Asuncion",                label: "Paraguay",  flag: "🇵🇾", offset: "UTC-3/4" },
  { tz: "America/Paramaribo",              label: "Surinam",   flag: "🇸🇷", offset: "UTC-3"   },
];

const SUPPORTED = TIMEZONES.map((t) => t.tz);

function detectTimezone() {
  const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return SUPPORTED.includes(browser) ? browser : "America/Lima";
}

const LS_KEY = "eb_timezone";

export function useTimezoneState() {
  const [tz, setTzRaw] = useState(() => localStorage.getItem(LS_KEY) ?? detectTimezone());

  function setTz(value) {
    localStorage.setItem(LS_KEY, value);
    setTzRaw(value);
  }

  return { tz, setTz };
}

export const TimezoneContext = createContext("America/Lima");

export function useTimezone() {
  return useContext(TimezoneContext);
}

export function convertTime(date, time, tz) {
  const dt = new Date(`${date}T${time}:00-05:00`);
  return dt.toLocaleTimeString("es-PE", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
