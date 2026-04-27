import MatchCard from "@/components/MatchCard";
import { api } from "@/lib/api";

export default async function MatchesPage() {
  const matches = await api.getMatches().catch(() => []);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-copper">Fixtures & Results</p>
        <h1 className="mt-3 font-display text-4xl font-black text-brand-night dark:text-white">Matches</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Browse every fixture, score summary, and result with direct access to full innings breakdowns.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match._id} match={match} />
        ))}
      </section>
    </div>
  );
}
