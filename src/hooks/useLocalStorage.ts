import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = window.localStorage.getItem(key);
    if (!saved) return initialValue;

    try {
      return JSON.parse(saved) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(key);
    if (!saved) {
      setValue(initialValue);
      return;
    }

    try {
      setValue(JSON.parse(saved) as T);
    } catch {
      setValue(initialValue);
    }
  }, [initialValue, key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
