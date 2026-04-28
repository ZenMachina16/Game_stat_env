import { notFound } from "next/navigation";
import SeasonTabs from "./SeasonTabs";
import PhotoUpload from "./PhotoUpload";
import { api } from "@/lib/api";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function PlayerProfilePage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const [player, stats] = await Promise.all([
    api.getPlayer(decodedName).catch(() => null),
    api.getPlayerStats(decodedName).catch(() => null)
  ]);

  // Need at least a name to show the page
  if (!player) notFound();

  const hasStats = stats && Object.keys(stats).length > 0;

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <section className="overflow-hidden rounded-[36px] bg-brand-mesh shadow-panel">
        <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-end sm:p-10">
          {/* Photo */}
          <PhotoUpload
            playerId={(player as { _id?: string })._id ?? null}
            playerName={player.name}
            currentImage={player.profileImage ?? null}
          />

          {/* Info */}
          <div className="flex-1 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
              Player Profile
            </p>
            <h1 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl">
              {player.name}
            </h1>
            {(player as { role?: string }).role && (
              <p className="mt-2 text-sm capitalize text-white/60">
                {(player as { role?: string }).role}
              </p>
            )}
            {(player as { basePrice?: number }).basePrice && (
              <p className="mt-1 text-sm text-brand-gold">
                Base Price: ₹{(player as { basePrice?: number }).basePrice?.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {hasStats ? (
        <SeasonTabs stats={stats!} />
      ) : (
        <div className="rounded-[28px] border border-brand-copper/15 bg-white p-10 text-center shadow-panel dark:bg-white/5">
          <p className="font-display text-lg font-bold text-brand-night dark:text-white">
            No stats recorded yet
          </p>
          <p className="mt-2 text-sm text-brand-copper">
            Stats will appear here once match data is entered for this player.
          </p>
        </div>
      )}
    </div>
  );
}
