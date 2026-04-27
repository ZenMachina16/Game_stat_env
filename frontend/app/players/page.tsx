import PlayerCard from "@/components/PlayerCard";
import { api } from "@/lib/api";

export default async function PlayersPage() {
  const players = await api.getPlayers().catch(() => []);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-copper">Profiles</p>
        <h1 className="mt-3 font-display text-4xl font-black text-brand-night dark:text-white">Players</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Explore player cards and drill into season-wise batting, bowling, and fielding numbers.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {players.map((player) => (
          <PlayerCard key={player.name} player={player} />
        ))}
      </section>
    </div>
  );
}
