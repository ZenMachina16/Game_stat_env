import Image from "next/image";
import Link from "next/link";
import { Player } from "@/lib/api";

type Props = {
  player: Player;
};

export default function PlayerCard({ player }: Props) {
  return (
    <Link
      href={`/players/${encodeURIComponent(player.name)}`}
      className="group overflow-hidden rounded-[28px] border border-brand-copper/15 bg-white/80 shadow-panel transition hover:-translate-y-1 dark:bg-white/5"
    >
      <div className="relative h-64 overflow-hidden bg-brand-mesh">
        {player.profileImage ? (
          <Image
            src={player.profileImage}
            alt={player.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-6xl font-black text-white/90">
            {player.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-brand-night dark:text-white">{player.name}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">View season-by-season profile</p>
      </div>
    </Link>
  );
}
