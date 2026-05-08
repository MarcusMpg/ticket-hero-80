import { useEffect, useRef, useState } from "react";

/**
 * useState que persiste o valor em localStorage automaticamente.
 * Útil para preservar dados de formulários quando o usuário navega
 * para outra tela ou minimiza a aplicação.
 *
 * Use `clearPersistentState(key)` para limpar após submit bem-sucedido.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return initialValue;
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function clearPersistentState(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
