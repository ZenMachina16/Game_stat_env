import Link from "next/link";
import { Match } from "@/lib/api";

type Props = {
  match: Match;
};

export default function MatchCard({ match }: Props) {
  return (
    <Link
      href={`/matches/${match._id}`}
      className="group rounded-[28px] border border-brand-copper/15 bg-white/80 p-6 shadow-panel transition hover:-translate-y-1 hover:border-brand-copper/35 dark:bg-white/5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">
            {match.tournament?.name || "Tournament"} {match.tournament?.season || ""}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-brand-night dark:text-white">
            {match.teams.team1} vs {match.teams.team2}
          </h3>
        </div>
        <span className="rounded-full bg-brand-night px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white dark:bg-brand-gold dark:text-brand-ink">
          {match.matchInfo?.format || "Match"}
        </span>
      </div>

      <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center justify-between rounded-2xl bg-brand-sand/55 px-4 py-3 dark:bg-white/5">
          <span>{match.teams.team1}</span>
          <strong className="text-brand-night dark:text-white">{match.summary?.team1Score || "-"}</strong>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-brand-sand/55 px-4 py-3 dark:bg-white/5">
          <span>{match.teams.team2}</span>
          <strong className="text-brand-night dark:text-white">{match.summary?.team2Score || "-"}</strong>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold text-brand-night dark:text-white">{match.matchInfo?.result || "Result pending"}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {match.matchInfo?.date || "Date TBD"} | {match.matchInfo?.venue || "Venue TBD"}
        </p>
      </div>
    </Link>
  );
}
