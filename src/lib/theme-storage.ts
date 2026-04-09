/** Persists light/dark preference for the `class="dark"` strategy on `<html>`. */
export const THEME_STORAGE_KEY = "tacit-theme";

export type ThemePreference = "light" | "dark";

export function getStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Reads storage (default dark), applies to `<html>`, and persists default on first visit.
 */
export function initTheme(): ThemePreference {
  let theme = getStoredTheme();
  if (theme === null) {
    theme = "dark";
    setStoredTheme(theme);
  }
  applyTheme(theme);
  return theme;
}

export function toggleStoredTheme(): boolean {
  const next: ThemePreference = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
  setStoredTheme(next);
  return next === "dark";
}
