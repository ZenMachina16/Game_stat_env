import TeamCard from "@/components/TeamCard";
import { api } from "@/lib/api";

export default async function TeamsPage() {
  const teams = await api.getTeams().catch(() => []);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-copper">Franchises</p>
        <h1 className="mt-3 font-display text-4xl font-black text-brand-night dark:text-white">Teams</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Browse the competing teams with clean cards and direct links to team-specific match history.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <TeamCard key={team.name} team={team} />
        ))}
      </section>
    </div>
  );
}
