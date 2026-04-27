export type Match = {
  _id: string;
  tournament?: {
    name?: string;
    season?: string;
  };
  teams: {
    team1: string;
    team2: string;
  };
  matchInfo: {
    matchTitle?: string;
    date?: string;
    venue?: string;
    toss?: string;
    result?: string;
    oversLimit?: number;
    format?: string;
    playerOfMatch?: string;
    scorer?: string;
    matchIdExternal?: string;
  };
  summary?: {
    team1Score?: string;
    team2Score?: string;
  };
  innings: Innings[];
};

export type Innings = {
  teamName: string;
  runs?: number;
  wickets?: number;
  overs?: number;
  runRate?: number;
  extras?: {
    wides?: number;
    noBalls?: number;
    byes?: number;
    legByes?: number;
    total?: number;
  };
  batting?: BattingEntry[];
  bowling?: BowlingEntry[];
  fallOfWickets?: FallOfWicket[];
};

export type BattingEntry = {
  playerName: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  dismissal?: string;
  isOut?: boolean;
};

export type BowlingEntry = {
  playerName: string;
  overs?: number;
  maidens?: number;
  runs?: number;
  wickets?: number;
  economy?: number;
  wides?: number;
  noBalls?: number;
};

export type FallOfWicket = {
  score?: string;
  over?: string;
  playerName?: string;
};

export type Player = {
  _id?: string;
  name: string;
  profileImage?: string;
};

export type PlayerStats = {
  _id?: string;
  playerName: string;
  season: "S1" | "S2" | "overall";
  batting?: {
    matches?: number;
    innings?: number;
    runs?: number;
    notOuts?: number;
    average?: number;
    strikeRate?: number;
    fours?: number;
    sixes?: number;
    highestScore?: string;
  };
  bowling?: {
    matches?: number;
    wickets?: number;
    average?: number;
    strikeRate?: number;
    economy?: number;
    bestBowling?: string;
  };
  fielding?: {
    catches?: number;
    runouts?: number;
  };
};

export type PlayerStatsBySeason = Partial<Record<"S1" | "S2" | "overall", PlayerStats>>;

export type Team = {
  _id?: string;
  name: string;
  logo?: string;
};

export type Tournament = {
  _id?: string;
  name: string;
  season: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetcher<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getMatches: () => fetcher<Match[]>("/matches"),
  getMatch: (id: string) => fetcher<Match>(`/matches/${id}`),
  getPlayers: () => fetcher<Player[]>("/players"),
  getPlayer: (name: string) => fetcher<Player>(`/players/${encodeURIComponent(name)}`),
  getPlayerStats: (name: string) =>
    fetcher<PlayerStatsBySeason>(`/player-stats/${encodeURIComponent(name)}`),
  getTeams: () => fetcher<Team[]>("/teams"),
  getTeam: (name: string) => fetcher<Team>(`/teams/${encodeURIComponent(name)}`),
  getTournaments: () => fetcher<Tournament[]>("/tournaments")
};
