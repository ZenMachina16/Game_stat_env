import { notFound } from "next/navigation";
import Scorecard from "@/components/Scorecard";
import { api } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;

  const match = await api.getMatch(id).catch(() => null);

  if (!match) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[36px] bg-brand-mesh p-8 text-white shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">
          {match.tournament?.name} {match.tournament?.season}
        </p>
        <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">
          {match.teams.team1} vs {match.teams.team2}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-white/80">{match.matchInfo?.result}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Toss</p>
            <p className="mt-2 text-sm font-semibold">{match.matchInfo?.toss || "N/A"}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Date</p>
            <p className="mt-2 text-sm font-semibold">{match.matchInfo?.date || "N/A"}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Venue</p>
            <p className="mt-2 text-sm font-semibold">{match.matchInfo?.venue || "N/A"}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Player Of Match</p>
            <p className="mt-2 text-sm font-semibold">{match.matchInfo?.playerOfMatch || "N/A"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        {match.innings.map((innings, index) => (
          <Scorecard key={`${innings.teamName}-${index}`} innings={innings} />
        ))}
      </section>
    </div>
  );
}
