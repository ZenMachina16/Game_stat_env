"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
  /\/api$/,
  ""
);
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ADMIN_PIN = "f5admin";
const BID_STEP = 50;
const CAPTAINS_NEEDED = 2;

type Role = "viewer" | "admin" | "captain";

type PlayerInfo = {
  _id: string;
  name: string;
  role?: string;
  basePrice?: number;
  isSold?: boolean;
  isCaptain?: boolean;
  profileImage?: string;
};

type TeamInfo = {
  _id: string;
  name: string;
  logo?: string;
  purseTotal?: number;
  purseRemaining?: number;
  captainId?: { _id: string; name: string } | null;
  captainPin?: string; // only present in admin-side responses
};

type SessionState = {
  status: "IDLE" | "SELECTING_CAPTAINS" | "ONGOING" | "BIDDING" | "SOLD" | "UNSOLD";
  currentPlayer: PlayerInfo | null;
  currentBid: number;
  currentTeam: TeamInfo | null;
  captains: PlayerInfo[];
  timerEndsAt: string | null;
  outcome?: "SOLD" | "UNSOLD";
};

type AuctionResult = {
  _id: string;
  playerId: PlayerInfo;
  teamId: TeamInfo;
  soldPrice: number;
};

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}/auction${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ message: r.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return r.json() as Promise<T>;
}

function PlayerPill({ player, onClick, label }: { player: PlayerInfo; onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex items-center gap-3 rounded-2xl border border-brand-copper/10 px-4 py-3 text-left transition hover:border-brand-copper/40 hover:bg-brand-copper/5 disabled:cursor-default dark:border-white/10"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-mesh text-sm font-black text-white shadow-panel">
        {player.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-night dark:text-white">{player.name}</p>
        <p className="text-xs capitalize text-brand-copper">
          {player.role ?? "allrounder"} · ₹{player.basePrice?.toLocaleString()}
        </p>
      </div>
      {label && (
        <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
          {label}
        </span>
      )}
    </button>
  );
}

export default function AuctionClient() {
  const [role, setRole] = useState<Role>("viewer");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [teamId, setTeamId] = useState("");
  const [captainPinInput, setCaptainPinInput] = useState("");
  const [captainPinError, setCaptainPinError] = useState("");
  const [adminTeamsWithPins, setAdminTeamsWithPins] = useState<TeamInfo[]>([]);

  const [session, setSession] = useState<SessionState | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState<PlayerInfo[]>([]);
  const [results, setResults] = useState<AuctionResult[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      const [s, unsold, r, t] = await Promise.all([
        apiFetch<SessionState>("/status"),
        apiFetch<PlayerInfo[]>("/unsold"),
        apiFetch<AuctionResult[]>("/results"),
        apiFetch<TeamInfo[]>("/purses")
      ]);
      // Fetch all players for captain selection
      const allRes = await fetch(`${API_URL}/players`);
      const all: PlayerInfo[] = allRes.ok ? await allRes.json() : [];

      setSession(s);
      setUnsoldPlayers(unsold);
      setAllPlayers(all);
      setResults(r);
      setTeams(t);
      if (s.currentBid) setBidAmount(s.currentBid + BID_STEP);
    } catch {
      /* server may be offline */
    }
  }, []);

  const refreshResults = useCallback(() => {
    apiFetch<AuctionResult[]>("/results").then(setResults).catch(() => {});
    apiFetch<TeamInfo[]>("/purses").then(setTeams).catch(() => {});
    apiFetch<PlayerInfo[]>("/unsold").then(setUnsoldPlayers).catch(() => {});
  }, []);

  useEffect(() => {
    loadInitial();

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    const updateSession = (data: SessionState) => {
      setSession(data);
      if (data.currentBid) setBidAmount(data.currentBid + BID_STEP);
    };

    socket.on("auction_started", updateSession);
    socket.on("auction_reset", () => {
      loadInitial();
      setAdminTeamsWithPins([]);
      setTeamId("");
      setCaptainPinInput("");
      setCaptainPinError("");
    });
    socket.on("captain_selected", ({ state }: { state: SessionState }) => {
      updateSession(state);
      apiFetch<TeamInfo[]>("/purses").then(setTeams).catch(() => {});
      apiFetch<PlayerInfo[]>("/unsold").then(setUnsoldPlayers).catch(() => {});
      // Refresh PINs for whoever is currently admin
      fetch(`${API_URL}/auction/admin-teams?pin=${ADMIN_PIN}`)
        .then((r) => r.ok ? r.json() : []).then(setAdminTeamsWithPins).catch(() => {});
    });
    socket.on("player_update", (data: SessionState) => {
      updateSession(data);
      if (data.currentBid) setBidAmount(data.currentBid + BID_STEP);
    });
    socket.on("new_bid", updateSession);
    socket.on("auction_result", (data: SessionState) => {
      updateSession(data);
      refreshResults();
    });

    return () => { socket.disconnect(); };
  }, [loadInitial, refreshResults]);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (session?.status === "BIDDING" && session.timerEndsAt) {
      const tick = () => {
        const ms = new Date(session.timerEndsAt!).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.ceil(ms / 1000)));
      };
      tick();
      timerRef.current = setInterval(tick, 500);
    } else {
      setTimeLeft(0);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.status, session?.timerEndsAt]);

  const fetchAdminTeams = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/auction/admin-teams?pin=${ADMIN_PIN}`);
      if (r.ok) setAdminTeamsWithPins(await r.json());
    } catch { /* ignore */ }
  }, []);

  const handleAdminLogin = () => {
    if (pinInput === ADMIN_PIN) {
      setRole("admin");
      setPinError("");
      fetchAdminTeams();
    } else {
      setPinError("Wrong PIN");
    }
  };

  const handleCaptainLogin = async () => {
    if (!captainPinInput) return;
    try {
      const team = await apiFetch<TeamInfo>("/verify-captain", {
        method: "POST",
        body: JSON.stringify({ pin: captainPinInput })
      });
      setTeamId(team._id);
      setRole("captain");
      setCaptainPinError("");
    } catch {
      setCaptainPinError("Invalid PIN — ask the admin for your 4-digit code");
    }
  };

  const adminAction = async (path: string, body?: object) => {
    try {
      await apiFetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error", "err");
    }
  };

  const handleBid = async () => {
    if (!teamId) return showToast("Select your team first", "err");
    try {
      await apiFetch("/bid", { method: "POST", body: JSON.stringify({ teamId, amount: bidAmount }) });
      showToast(`Bid of ₹${bidAmount} placed!`, "ok");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Bid failed", "err");
    }
  };

  const myTeam = teams.find((t) => t._id === teamId);
  const captainsSelected = session?.captains?.length ?? 0;
  const selectablePlayers = allPlayers.filter(
    (p) => !p.isCaptain && !p.isSold
  );

  const statusColor: Record<string, string> = {
    IDLE: "text-gray-400",
    SELECTING_CAPTAINS: "text-yellow-400",
    ONGOING: "text-green-400",
    BIDDING: "text-brand-gold",
    SOLD: "text-emerald-400",
    UNSOLD: "text-red-400"
  };

  const statusLabel: Record<string, string> = {
    IDLE: "Not Started",
    SELECTING_CAPTAINS: `Selecting Captains (${captainsSelected}/${CAPTAINS_NEEDED})`,
    ONGOING: "Ongoing",
    BIDDING: "Bidding",
    SOLD: "Sold",
    UNSOLD: "Unsold"
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-20 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-panel ${toast.type === "ok" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="overflow-hidden rounded-[32px] bg-brand-mesh p-6 text-white shadow-panel sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold">F5 League Badlapur 2026</p>
            <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">Live Auction</h1>
            <p className="mt-1 text-sm text-white/60">
              Socket: <span className={connected ? "text-emerald-400" : "text-red-400"}>{connected ? "Connected" : "Disconnected"}</span>
              &nbsp;·&nbsp;
              Status: <span className={statusColor[session?.status ?? "IDLE"]}>{statusLabel[session?.status ?? "IDLE"]}</span>
            </p>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap gap-2">
            {/* Viewer */}
            <button onClick={() => { setRole("viewer"); setTeamId(""); }}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${role === "viewer" ? "bg-brand-gold text-brand-ink" : "border border-white/20 text-white/70 hover:bg-white/10"}`}>
              Viewer
            </button>

            {/* Captain login */}
            {role === "captain" && teamId ? (
              <button onClick={() => { setRole("viewer"); setTeamId(""); setCaptainPinInput(""); }}
                className="rounded-full bg-brand-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-ink">
                {myTeam?.name ?? "Captain"} ✓
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="password" placeholder="Captain PIN" value={captainPinInput}
                  onChange={(e) => setCaptainPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCaptainLogin()}
                  className="w-32 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <button onClick={handleCaptainLogin}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10">
                  Captain
                </button>
              </div>
            )}

            {/* Admin login */}
            {role !== "admin" ? (
              <div className="flex items-center gap-2">
                <input
                  type="password" placeholder="Admin PIN" value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  className="w-28 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <button onClick={handleAdminLogin}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10">
                  Admin
                </button>
              </div>
            ) : (
              <button onClick={() => setRole("viewer")}
                className="rounded-full bg-brand-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-ink">
                Admin ✓
              </button>
            )}
          </div>
        </div>

        {/* Error messages */}
        {(pinError || captainPinError) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            {captainPinError && <p className="text-xs text-red-400">{captainPinError}</p>}
          </div>
        )}

        {/* Logged-in captain info */}
        {role === "captain" && myTeam && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-white/60">Bidding as:</span>
            <span className="rounded-full bg-brand-gold/20 px-4 py-1.5 text-sm font-bold text-brand-gold">
              {myTeam.name}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
              Purse: ₹{myTeam.purseRemaining?.toLocaleString()} / ₹{myTeam.purseTotal?.toLocaleString()}
            </span>
          </div>
        )}

        {/* Captain selection progress bar */}
        {session?.status === "SELECTING_CAPTAINS" && (
          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Captain Selection</p>
              <p className="text-xs text-brand-gold">{captainsSelected} / {CAPTAINS_NEEDED} chosen</p>
            </div>
            <div className="mt-3 flex gap-4">
              {Array.from({ length: CAPTAINS_NEEDED }).map((_, i) => {
                const cap = session.captains?.[i];
                return (
                  <div key={i} className={`flex flex-1 items-center gap-3 rounded-xl p-3 ${cap ? "bg-brand-gold/20" : "border border-dashed border-white/20"}`}>
                    {cap ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold text-sm font-black text-brand-ink">{cap.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-white">{cap.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-brand-gold">Captain {i + 1}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-white/40">Pending…</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">

          {/* ── CAPTAIN SELECTION PANEL (admin only) ─────────────────── */}
          {role === "admin" && session?.status === "SELECTING_CAPTAINS" && (
            <div className="rounded-[28px] border-2 border-brand-gold/40 bg-white p-6 shadow-panel dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gold text-base font-black text-brand-ink">C</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">Captain Selection</p>
                  <p className="text-sm font-bold text-brand-night dark:text-white">
                    Pick {CAPTAINS_NEEDED - captainsSelected} more captain{CAPTAINS_NEEDED - captainsSelected !== 1 ? "s" : ""} from the player pool
                  </p>
                </div>
              </div>

              {/* Show PINs for already-selected captains */}
              {adminTeamsWithPins.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-copper">Share these PINs with captains</p>
                  {adminTeamsWithPins.map((t) => (
                    <div key={t._id} className="flex items-center justify-between rounded-2xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-brand-night dark:text-white">{t.name}</p>
                        <p className="text-xs text-brand-copper">Captain: {t.captainId?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-2xl font-black tracking-[0.2em] text-brand-gold">{t.captainPin}</span>
                        <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-gold">PIN</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {selectablePlayers.map((p) => (
                  <PlayerPill
                    key={p._id}
                    player={p}
                    onClick={() => adminAction("/captain", { playerId: p._id })}
                    label="Make Captain"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── BIDDING STAGE ──────────────────────────────────────────── */}
          {session?.status !== "SELECTING_CAPTAINS" && (
            <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">On the Block</p>
              {session?.currentPlayer ? (
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-mesh text-2xl font-black text-white shadow-panel">
                    {session.currentPlayer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-black text-brand-night dark:text-white">{session.currentPlayer.name}</h2>
                    <p className="text-sm capitalize text-brand-copper">
                      {session.currentPlayer.role ?? "allrounder"} · Base ₹{session.currentPlayer.basePrice?.toLocaleString()}
                    </p>
                  </div>
                  {session.status === "BIDDING" && (
                    <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl font-display font-black shadow-panel ${timeLeft <= 5 ? "bg-red-500 text-white" : "bg-brand-mesh text-brand-gold"}`}>
                      <span className="text-2xl">{timeLeft}</span>
                      <span className="text-[10px] uppercase tracking-widest text-white/60">sec</span>
                    </div>
                  )}
                  {(session.status === "SOLD" || session.status === "UNSOLD") && (
                    <div className={`rounded-2xl px-4 py-2 text-sm font-bold ${session.status === "SOLD" ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                      {session.status}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-brand-night/40 dark:text-white/30">
                  {session?.status === "IDLE" ? "Auction not started yet." : "Waiting for admin to select a player…"}
                </p>
              )}

              {session?.status === "BIDDING" && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] bg-brand-mesh p-4 text-white shadow-panel">
                    <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">Current Bid</p>
                    <p className="mt-2 font-display text-3xl font-black">₹{session.currentBid.toLocaleString()}</p>
                  </div>
                  <div className="rounded-[20px] border border-brand-copper/15 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.25em] text-brand-copper">Leading Team</p>
                    <p className="mt-2 font-display text-xl font-black text-brand-night dark:text-white">
                      {session.currentTeam?.name ?? "No bids yet"}
                    </p>
                  </div>
                </div>
              )}

              {role === "captain" && session?.status === "BIDDING" && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button onClick={() => setBidAmount((a) => Math.max((session.currentBid ?? 0) + BID_STEP, a - BID_STEP))}
                    className="h-10 w-10 rounded-full border border-brand-copper/20 text-lg font-bold text-brand-copper transition hover:bg-brand-copper/10">−</button>
                  <input type="number" value={bidAmount} min={(session.currentBid ?? 0) + 1} step={BID_STEP}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-32 rounded-full border border-brand-copper/20 bg-transparent px-4 py-2 text-center font-bold text-brand-night focus:outline-none focus:ring-2 focus:ring-brand-gold dark:text-white"
                  />
                  <button onClick={() => setBidAmount((a) => a + BID_STEP)}
                    className="h-10 w-10 rounded-full border border-brand-copper/20 text-lg font-bold text-brand-copper transition hover:bg-brand-copper/10">+</button>
                  <button onClick={handleBid} disabled={!teamId}
                    className="rounded-full bg-brand-gold px-6 py-2 text-sm font-bold uppercase tracking-widest text-brand-ink shadow-panel transition hover:bg-[#ebb27a] disabled:opacity-40">
                    Place Bid ₹{bidAmount.toLocaleString()}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ADMIN CONTROLS ────────────────────────────────────────── */}
          {role === "admin" && session?.status !== "SELECTING_CAPTAINS" && (
            <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Admin Controls</p>

              {/* Captain PINs reminder */}
              {adminTeamsWithPins.length > 0 && (
                <div className="mt-3 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-gold">Captain PINs</p>
                  <div className="flex flex-wrap gap-3">
                    {adminTeamsWithPins.map((t) => (
                      <div key={t._id} className="text-center">
                        <p className="text-xs text-brand-copper">{t.name}</p>
                        <p className="font-display text-xl font-black tracking-widest text-brand-gold">{t.captainPin}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {session?.status === "IDLE" && (
                  <button onClick={() => adminAction("/start")}
                    className="rounded-full bg-brand-mesh px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-panel transition hover:opacity-90">
                    Start Auction
                  </button>
                )}
                {session?.status === "BIDDING" && (
                  <button onClick={() => adminAction("/close")}
                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-panel transition hover:bg-emerald-700">
                    Close Bid Now
                  </button>
                )}
                <button onClick={() => { if (confirm("Reset entire auction? All results and teams will be cleared.")) adminAction("/reset"); }}
                  className="rounded-full border border-red-400/30 px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                  Reset Auction
                </button>
              </div>

              {(session?.status === "ONGOING" || session?.status === "SOLD" || session?.status === "UNSOLD") && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-semibold text-brand-night dark:text-white">
                    Select Next Player ({unsoldPlayers.length} remaining)
                  </p>
                  <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {unsoldPlayers.map((p) => (
                      <PlayerPill key={p._id} player={p} onClick={() => adminAction("/player", { playerId: p._id })} />
                    ))}
                    {unsoldPlayers.length === 0 && (
                      <p className="col-span-2 py-4 text-center text-sm text-brand-night/40 dark:text-white/30">
                        All players have been auctioned.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── AUCTION RESULTS ───────────────────────────────────────── */}
          <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Auction Results</p>
            {results.length === 0 ? (
              <p className="mt-4 text-sm text-brand-night/40 dark:text-white/30">No sales yet.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {results.map((r) => (
                  <div key={r._id} className="flex items-center justify-between rounded-2xl border border-brand-copper/10 px-4 py-3 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-mesh text-sm font-black text-white">
                        {r.playerId?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-night dark:text-white">{r.playerId?.name}</p>
                        <p className="text-xs capitalize text-brand-copper">{r.playerId?.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-night dark:text-white">{r.teamId?.name}</p>
                      <p className="text-xs text-brand-gold">₹{r.soldPrice.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Team Purses */}
          <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Teams & Purses</p>
            {teams.length === 0 ? (
              <p className="mt-4 text-sm text-brand-night/40 dark:text-white/30">
                Teams will appear after captains are selected.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {teams.map((t) => {
                  const pct = t.purseTotal ? Math.round(((t.purseRemaining ?? 0) / t.purseTotal) * 100) : 100;
                  const isMyTeam = t._id === teamId;
                  return (
                    <div key={t._id} className={`rounded-2xl p-4 ${isMyTeam ? "border-2 border-brand-gold bg-brand-gold/10" : "border border-brand-copper/10 dark:border-white/10"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-bold ${isMyTeam ? "text-brand-gold" : "text-brand-night dark:text-white"}`}>
                            {t.name} {isMyTeam && "(You)"}
                          </p>
                          {t.captainId && (
                            <p className="text-[10px] uppercase tracking-wider text-brand-copper">
                              Captain: {t.captainId.name}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-brand-copper">₹{t.purseRemaining?.toLocaleString()}</p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-copper/10">
                        <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-right text-[10px] text-brand-copper/60">{pct}% left</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Summary</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-brand-mesh p-4 text-white shadow-panel">
                <p className="text-xs uppercase tracking-wider text-brand-gold">Sold</p>
                <p className="mt-2 font-display text-2xl font-black">{results.length}</p>
              </div>
              <div className="rounded-2xl border border-brand-copper/10 p-4 dark:border-white/10">
                <p className="text-xs uppercase tracking-wider text-brand-copper">Remaining</p>
                <p className="mt-2 font-display text-2xl font-black text-brand-night dark:text-white">{unsoldPlayers.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
