"use client";

import { useEffect, useState } from "react";

/** Reads/writes the persisted theme, shared by both toggle variants below. */
function useThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Read the value the inline bootstrap script (in the root layout) already
    // applied to <html> before hydration, so the toggle reflects the persisted
    // preference instead of always showing the SSR default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.getAttribute("data-theme") !== "light");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("repline-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("repline-theme", "light");
    }
  }

  return { dark, toggle };
}

/** Compact icon-button variant for a header/toolbar (e.g. the desktop homepage). */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { dark, toggle } = useThemeToggle();
  return (
    <button
      onClick={toggle}
      aria-label="Sötét téma váltása"
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-[8px] border border-border-strong text-text-secondary"
      }
    >
      {dark ? "☾" : "☀"}
    </button>
  );
}

export function ThemeToggle() {
  const { dark, toggle } = useThemeToggle();

  return (
    <button
      onClick={toggle}
      aria-label="Sötét téma váltása"
      className="flex w-full items-center justify-between rounded-[10px] border border-border px-4 py-3.5"
    >
      <span className="text-[13px] text-text">Sötét téma</span>
      <span
        className="flex h-[22px] w-[38px] items-center rounded-full p-0.5 transition-colors"
        style={{
          background: dark ? "var(--color-text)" : "var(--color-border-strong)",
          justifyContent: dark ? "flex-end" : "flex-start",
        }}
      >
        <span className="h-[18px] w-[18px] rounded-full" style={{ background: "var(--color-bg)" }} />
      </span>
    </button>
  );
}
