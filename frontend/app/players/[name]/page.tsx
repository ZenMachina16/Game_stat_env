import { notFound } from "next/navigation";
import SeasonTabs from "./SeasonTabs";
import { api } from "@/lib/api";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function PlayerProfilePage({ params }: Props) {
  const { name } = await params;

  const [player, stats] = await Promise.all([
    api.getPlayer(decodeURIComponent(name)).catch(() => null),
    api.getPlayerStats(decodeURIComponent(name)).catch(() => null)
  ]);

  if (!player || !stats) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[36px] bg-brand-mesh p-8 text-white shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Player Profile</p>
        <h1 className="mt-3 font-display text-4xl font-black">{player.name}</h1>
        <p className="mt-3 max-w-2xl text-white/75">
          Season-wise batting, bowling, and fielding breakdown pulled directly from the prepared statistics
          collection.
        </p>
      </section>

      <SeasonTabs stats={stats} />
    </div>
  );
}
