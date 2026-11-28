import { useState } from 'react';

export type Theme = 'light' | 'dark';

const current = (): Theme => {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** The theme in use and a way to flip it: it follows the system until changed, then lasts for this page session (no web storage). */
export function useTheme() {
  const [theme, setTheme] = useState(current);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return { theme, toggle };
}
