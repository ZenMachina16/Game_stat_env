"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const modes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" }
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-11 w-[146px] rounded-full border border-white/10 bg-white/5" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-brand-copper/25 bg-white/70 p-1 shadow-panel backdrop-blur dark:bg-white/5">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
            theme === value
              ? "bg-brand-night text-white dark:bg-brand-gold dark:text-brand-ink"
              : "text-brand-night/75 hover:bg-brand-copper/10 dark:text-white/80 dark:hover:bg-white/10"
          }`}
          aria-label={`Switch to ${label.toLowerCase()} mode`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
