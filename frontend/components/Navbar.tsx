import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/matches", label: "Matches" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/auction", label: "Auction" }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-copper/15 bg-white/80 backdrop-blur-xl dark:bg-brand-ink/75">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mesh text-lg font-black text-white shadow-panel">
            F5
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-wide text-brand-night dark:text-white">
              F5 League
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-brand-copper">Badlapur 2026</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-1 rounded-full border border-brand-copper/15 bg-white/70 p-1 text-sm font-medium shadow-panel md:flex dark:bg-white/5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-brand-night transition hover:bg-brand-copper/10 dark:text-white/85 dark:hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
