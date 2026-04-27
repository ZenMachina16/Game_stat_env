import Image from "next/image";
import Link from "next/link";
import { Team } from "@/lib/api";

type Props = {
  team: Team;
};

export default function TeamCard({ team }: Props) {
  return (
    <Link
      href={`/teams/${encodeURIComponent(team.name)}`}
      className="group rounded-[28px] border border-brand-copper/15 bg-white/80 p-6 shadow-panel transition hover:-translate-y-1 dark:bg-white/5"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-brand-mesh shadow-panel">
        {team.logo ? (
          <Image src={team.logo} alt={team.name} width={80} height={80} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-2xl font-black text-white">
            {team.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
      </div>
      <h3 className="font-display text-2xl font-bold text-brand-night dark:text-white">{team.name}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Squad and match overview</p>
    </Link>
  );
}
