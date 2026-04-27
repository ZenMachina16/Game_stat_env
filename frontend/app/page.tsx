import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import PlayerCard from "@/components/PlayerCard";
import TeamCard from "@/components/TeamCard";
import { api } from "@/lib/api";

export default async function HomePage() {
  const [matches, players, teams, tournaments] = await Promise.all([
    api.getMatches().catch(() => []),
    api.getPlayers().catch(() => []),
    api.getTeams().catch(() => []),
    api.getTournaments().catch(() => [])
  ]);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[36px] bg-brand-mesh p-8 text-white shadow-panel sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-gold">Official Tournament Hub</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-tight sm:text-5xl">
              F5 League Badlapur 2026, built for scorecards that feel match-day ready.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
              Live off your prepared MongoDB records with clean read-only APIs, responsive tables, and player profiles
              styled in the league&apos;s navy-and-copper identity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/matches"
                className="rounded-full bg-brand-gold px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-brand-ink transition hover:bg-[#ebb27a]"
              >
                Explore Matches
              </Link>
              <Link
                href="/players"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              >
                Player Profiles
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[28px] bg-white/10 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Matches</p>
              <p className="mt-3 text-4xl font-black">{matches.length}</p>
            </div>
            <div className="rounded-[28px] bg-white/10 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Players</p>
              <p className="mt-3 text-4xl font-black">{players.length}</p>
            </div>
            <div className="rounded-[28px] bg-white/10 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Seasons</p>
              <p className="mt-3 text-4xl font-black">{tournaments.length || 2}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Latest Fixtures</p>
            <h2 className="mt-2 font-display text-3xl font-black text-brand-night dark:text-white">Recent Matches</h2>
          </div>
          <Link href="/matches" className="text-sm font-semibold text-brand-copper">
            View all
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {matches.slice(0, 4).map((match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Squads</p>
              <h2 className="mt-2 font-display text-3xl font-black text-brand-night dark:text-white">Featured Players</h2>
            </div>
            <Link href="/players" className="text-sm font-semibold text-brand-copper">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {players.slice(0, 4).map((player) => (
              <PlayerCard key={player.name} player={player} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Franchises</p>
              <h2 className="mt-2 font-display text-3xl font-black text-brand-night dark:text-white">Teams</h2>
            </div>
            <Link href="/teams" className="text-sm font-semibold text-brand-copper">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {teams.slice(0, 4).map((team) => (
              <TeamCard key={team.name} team={team} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
