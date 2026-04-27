import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import { api } from "@/lib/api";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function TeamDetailPage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const [team, matches] = await Promise.all([
    api.getTeam(decodedName).catch(() => null),
    api.getMatches().catch(() => [])
  ]);

  if (!team) {
    notFound();
  }

  const filteredMatches = matches.filter(
    (match) =>
      match.teams.team1.toLowerCase() === decodedName.toLowerCase() ||
      match.teams.team2.toLowerCase() === decodedName.toLowerCase()
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[36px] bg-brand-mesh p-8 text-white shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Team Profile</p>
        <h1 className="mt-3 font-display text-4xl font-black">{team.name}</h1>
        <p className="mt-3 max-w-2xl text-white/75">
          Review this team&apos;s tournament footprint and jump into every completed scorecard.
        </p>
        <div className="mt-6">
          <Link href="/teams" className="text-sm font-semibold text-brand-gold">
            Back to teams
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Fixtures</p>
          <h2 className="mt-2 font-display text-3xl font-black text-brand-night dark:text-white">Match History</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredMatches.map((match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
