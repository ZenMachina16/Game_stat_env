"use client";

import { useMemo, useState } from "react";
import StatsTable from "@/components/StatsTable";
import { PlayerStatsBySeason } from "@/lib/api";

type Props = {
  stats: PlayerStatsBySeason;
};

const seasons = ["S1", "S2", "overall"] as const;

export default function SeasonTabs({ stats }: Props) {
  const availableSeason = useMemo(
    () => seasons.find((season) => stats[season]) || "overall",
    [stats]
  );
  const [selectedSeason, setSelectedSeason] = useState<typeof seasons[number]>(availableSeason);

  const selectedStats = stats[selectedSeason];

  if (!selectedStats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-brand-copper/15 bg-white/80 p-1 shadow-panel dark:bg-white/5">
        {seasons.map((season) => (
          <button
            key={season}
            type="button"
            onClick={() => setSelectedSeason(season)}
            disabled={!stats[season]}
            className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] transition ${
              selectedSeason === season
                ? "bg-brand-night text-white dark:bg-brand-gold dark:text-brand-ink"
                : "text-brand-night disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/80"
            }`}
          >
            {season === "overall" ? "Overall" : season}
          </button>
        ))}
      </div>

      <StatsTable
        title="Batting"
        headers={["Matches", "Innings", "Runs", "Avg", "SR", "4s", "6s", "HS"]}
        rows={[
          [
            selectedStats.batting?.matches ?? 0,
            selectedStats.batting?.innings ?? 0,
            selectedStats.batting?.runs ?? 0,
            selectedStats.batting?.average ?? 0,
            selectedStats.batting?.strikeRate ?? 0,
            selectedStats.batting?.fours ?? 0,
            selectedStats.batting?.sixes ?? 0,
            selectedStats.batting?.highestScore ?? "-"
          ]
        ]}
      />

      <StatsTable
        title="Bowling"
        headers={["Wickets", "Avg", "Economy", "SR", "Best", "Matches"]}
        rows={[
          [
            selectedStats.bowling?.wickets ?? 0,
            selectedStats.bowling?.average ?? 0,
            selectedStats.bowling?.economy ?? 0,
            selectedStats.bowling?.strikeRate ?? 0,
            selectedStats.bowling?.bestBowling ?? "-",
            selectedStats.bowling?.matches ?? 0
          ]
        ]}
      />

      <StatsTable
        title="Fielding"
        headers={["Catches", "Runouts"]}
        rows={[[selectedStats.fielding?.catches ?? 0, selectedStats.fielding?.runouts ?? 0]]}
      />
    </div>
  );
}
