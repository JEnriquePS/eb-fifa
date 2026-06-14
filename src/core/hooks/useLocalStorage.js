import { useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const fallback = () => (typeof initial === "function" ? initial() : initial);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback();
    } catch {
      return fallback();
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
