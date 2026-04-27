import { BattingEntry, BowlingEntry, FallOfWicket, Innings } from "@/lib/api";
import StatsTable from "./StatsTable";

type Props = {
  innings: Innings;
};

function getTopScorer(entries: BattingEntry[] = []) {
  return [...entries].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
}

function getBestBowler(entries: BowlingEntry[] = []) {
  return [...entries].sort((a, b) => {
    const wicketDiff = (b.wickets || 0) - (a.wickets || 0);
    if (wicketDiff !== 0) {
      return wicketDiff;
    }

    return (a.economy || 0) - (b.economy || 0);
  })[0];
}

function buildFallOfWicketsRows(fow: FallOfWicket[] = []) {
  return fow.map((item) => [item.score || "-", item.playerName || "-", item.over || "-"]);
}

export default function Scorecard({ innings }: Props) {
  const topScorer = getTopScorer(innings.batting);
  const bestBowler = getBestBowler(innings.bowling);

  return (
    <section className="space-y-6 rounded-[32px] border border-brand-copper/15 bg-white/70 p-5 shadow-panel dark:bg-white/[0.04]">
      <div className="flex flex-col gap-4 rounded-[28px] bg-brand-mesh p-6 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Innings</p>
            <h2 className="mt-2 font-display text-3xl font-black">{innings.teamName}</h2>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black">
              {innings.runs ?? 0}/{innings.wickets ?? 0}
            </p>
              <p className="text-sm text-white/70">{innings.overs ?? 0} overs | RR {innings.runRate ?? 0}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">Top Scorer</p>
            <p className="mt-2 text-xl font-bold">{topScorer?.playerName || "N/A"}</p>
            <p className="text-sm text-white/75">
              {topScorer ? `${topScorer.runs || 0} (${topScorer.balls || 0})` : "No batting card"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">Best Bowler</p>
            <p className="mt-2 text-xl font-bold">{bestBowler?.playerName || "N/A"}</p>
            <p className="text-sm text-white/75">
              {bestBowler
                ? `${bestBowler.wickets || 0}/${bestBowler.runs || 0} in ${bestBowler.overs || 0}`
                : "No bowling card"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">Extras</p>
            <p className="mt-2 text-xl font-bold">{innings.extras?.total ?? 0}</p>
            <p className="text-sm text-white/75">
              Wd {innings.extras?.wides ?? 0} | Nb {innings.extras?.noBalls ?? 0} | B {innings.extras?.byes ?? 0} | Lb{" "}
              {innings.extras?.legByes ?? 0}
            </p>
          </div>
        </div>
      </div>

      <StatsTable
        title="Batting"
        headers={["Batter", "R", "B", "4s", "6s", "SR", "Dismissal"]}
        rows={(innings.batting || []).map((entry) => [
          entry.playerName,
          entry.runs ?? 0,
          entry.balls ?? 0,
          entry.fours ?? 0,
          entry.sixes ?? 0,
          entry.strikeRate ?? 0,
          entry.isOut ? entry.dismissal || "Out" : "Not out"
        ])}
      />

      <StatsTable
        title="Bowling"
        headers={["Bowler", "O", "M", "R", "W", "Eco", "Wd", "Nb"]}
        rows={(innings.bowling || []).map((entry) => [
          entry.playerName,
          entry.overs ?? 0,
          entry.maidens ?? 0,
          entry.runs ?? 0,
          entry.wickets ?? 0,
          entry.economy ?? 0,
          entry.wides ?? 0,
          entry.noBalls ?? 0
        ])}
      />

      <StatsTable
        title="Fall Of Wickets"
        headers={["Score", "Player", "Over"]}
        rows={buildFallOfWicketsRows(innings.fallOfWickets)}
      />
    </section>
  );
}
