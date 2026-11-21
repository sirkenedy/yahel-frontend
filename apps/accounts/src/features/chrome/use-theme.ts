import { useState } from 'react';

export type Theme = 'light' | 'dark';

const current = (): Theme => {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * The theme in use and a way to flip it. The choice follows the system until the person changes it, and
 * then lasts for this page session: remembering it longer would need web storage, which belongs to @yahel/auth.
 */
export function useTheme() {
  const [theme, setTheme] = useState(current);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return { theme, toggle };
}
