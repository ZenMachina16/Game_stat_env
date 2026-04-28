"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ADMIN_PIN = "f5admin";

type Player = {
  _id: string;
  name: string;
  role: string;
  basePrice: number;
  isSold: boolean;
  isCaptain: boolean;
  excludedFromAuction: boolean;
  profileImage?: string;
};

const ROLES = ["allrounder", "batsman", "bowler"];

export default function PlayerManager() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Add player form
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("allrounder");
  const [adding, setAdding] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auction/all-players?pin=${ADMIN_PIN}`, { cache: "no-store" });
      if (r.ok) setPlayers(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadPlayers();
  }, [authed, loadPlayers]);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) { setAuthed(true); setPinError(""); }
    else setPinError("Wrong PIN");
  };

  const handleAdd = async () => {
    if (!addName.trim()) return showToast("Enter a name", "err");
    setAdding(true);
    try {
      const r = await fetch(`${API_URL}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), role: addRole })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      showToast(`${data.name} added with base price ₹${data.basePrice}`);
      setAddName("");
      loadPlayers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed", "err");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (p: Player) => {
    if (!confirm(`Delete ${p.name}? This will also remove their stats.`)) return;
    try {
      const r = await fetch(`${API_URL}/players/${p._id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      showToast(`${p.name} removed`);
      loadPlayers();
    } catch {
      showToast("Delete failed", "err");
    }
  };

  const handleTogglePool = async (p: Player) => {
    try {
      const r = await fetch(`${API_URL}/auction/pool/${p._id}`, {
        method: "PATCH",
        cache: "no-store"
      });
      if (!r.ok) throw new Error("Toggle failed");
      const updated: Player = await r.json();
      setPlayers((prev) => prev.map((pl) => pl._id === updated._id ? updated : pl));
      showToast(
        updated.excludedFromAuction
          ? `${updated.name} removed from auction pool`
          : `${updated.name} added to auction pool`
      );
    } catch {
      showToast("Failed to update", "err");
    }
  };

  const handleRoleChange = async (p: Player, role: string) => {
    try {
      const r = await fetch(`${API_URL}/players/${p._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (!r.ok) throw new Error("Update failed");
      const updated: Player = await r.json();
      setPlayers((prev) => prev.map((pl) => pl._id === updated._id ? { ...pl, role: updated.role } : pl));
      showToast(`${p.name}'s role updated to ${role}`);
    } catch {
      showToast("Update failed", "err");
    }
  };

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const inPool = filtered.filter((p) => !p.excludedFromAuction);
  const excluded = filtered.filter((p) => p.excludedFromAuction);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-[28px] border border-brand-copper/15 bg-white p-8 shadow-panel dark:bg-white/5">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-mesh text-lg font-black text-white shadow-panel">
            F5
          </div>
          <h1 className="font-display text-2xl font-black text-brand-night dark:text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-brand-copper">Enter your PIN to manage players</p>
          <div className="mt-6 space-y-3">
            <input
              type="password"
              placeholder="Admin PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-2xl border border-brand-copper/20 bg-transparent px-4 py-3 text-brand-night focus:outline-none focus:ring-2 focus:ring-brand-gold dark:text-white"
            />
            {pinError && <p className="text-xs text-red-500">{pinError}</p>}
            <button
              onClick={handleLogin}
              className="w-full rounded-2xl bg-brand-mesh py-3 text-sm font-bold uppercase tracking-widest text-white shadow-panel transition hover:opacity-90"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold">Admin Panel</p>
        <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">Manage Players</h1>
        <p className="mt-1 text-sm text-white/60">
          {players.length} total · {inPool.length} in auction pool · {excluded.length} excluded
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">

          {/* Search */}
          <input
            type="text"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-brand-copper/20 bg-white px-5 py-3 text-sm text-brand-night shadow-panel focus:outline-none focus:ring-2 focus:ring-brand-gold dark:bg-white/5 dark:text-white"
          />

          {/* In Pool */}
          <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">
                In Auction Pool ({inPool.length})
              </p>
            </div>
            {loading ? (
              <p className="text-sm text-brand-night/40 dark:text-white/30">Loading…</p>
            ) : inPool.length === 0 ? (
              <p className="text-sm text-brand-night/40 dark:text-white/30">No players in pool.</p>
            ) : (
              <div className="space-y-2">
                {inPool.map((p) => (
                  <PlayerRow
                    key={p._id}
                    player={p}
                    onTogglePool={() => handleTogglePool(p)}
                    onDelete={() => handleDelete(p)}
                    onRoleChange={(role) => handleRoleChange(p, role)}
                    inPool
                  />
                ))}
              </div>
            )}
          </div>

          {/* Excluded */}
          {excluded.length > 0 && (
            <div className="rounded-[28px] border border-red-200/40 bg-white p-6 shadow-panel dark:bg-white/5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-red-400">
                Excluded from Auction ({excluded.length})
              </p>
              <div className="space-y-2">
                {excluded.map((p) => (
                  <PlayerRow
                    key={p._id}
                    player={p}
                    onTogglePool={() => handleTogglePool(p)}
                    onDelete={() => handleDelete(p)}
                    onRoleChange={(role) => handleRoleChange(p, role)}
                    inPool={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Player sidebar */}
        <div className="space-y-5">
          <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Add New Player</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-brand-copper">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full rounded-2xl border border-brand-copper/20 bg-transparent px-4 py-2.5 text-sm text-brand-night focus:outline-none focus:ring-2 focus:ring-brand-gold dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-brand-copper">Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full rounded-2xl border border-brand-copper/20 bg-transparent px-4 py-2.5 text-sm text-brand-night focus:outline-none focus:ring-2 focus:ring-brand-gold dark:bg-white/5 dark:text-white"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <p className="rounded-xl bg-brand-sand px-3 py-2 text-xs text-brand-copper dark:bg-white/5">
                Base price will be set to the lowest in the pool (₹{players.length > 0 ? Math.min(...players.map((p) => p.basePrice).filter(Boolean)) : 300}).
              </p>
              <button
                onClick={handleAdd}
                disabled={adding || !addName.trim()}
                className="w-full rounded-2xl bg-brand-mesh py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-panel transition hover:opacity-90 disabled:opacity-40"
              >
                {adding ? "Adding…" : "Add Player"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-copper/15 bg-white p-6 shadow-panel dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-copper">Legend</p>
            <div className="mt-3 space-y-2 text-xs text-brand-night/70 dark:text-white/50">
              <p><span className="font-bold text-emerald-500">● In pool</span> — will appear in auction bidding</p>
              <p><span className="font-bold text-red-400">● Excluded</span> — hidden from auction, still on site</p>
              <p><span className="font-bold text-brand-copper">Role</span> — affects base price recalculation</p>
              <p><span className="font-bold text-red-600">Delete</span> — permanently removes player and stats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  onTogglePool,
  onDelete,
  onRoleChange,
  inPool
}: {
  player: Player;
  onTogglePool: () => void;
  onDelete: () => void;
  onRoleChange: (role: string) => void;
  inPool: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition ${inPool ? "border-brand-copper/10 dark:border-white/10" : "border-red-200/30 bg-red-50/30 dark:bg-red-500/5"}`}>
      {/* Avatar */}
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-panel ${inPool ? "bg-brand-mesh" : "bg-red-400"}`}>
        {player.name.charAt(0)}
      </div>

      {/* Name + price */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-night dark:text-white">
          {player.name}
          {player.isCaptain && <span className="ml-2 rounded-full bg-brand-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-gold">Captain</span>}
          {player.isSold && !player.isCaptain && <span className="ml-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">Sold</span>}
        </p>
        <p className="text-xs text-brand-copper">₹{player.basePrice?.toLocaleString()}</p>
      </div>

      {/* Role selector */}
      <select
        value={player.role || "allrounder"}
        onChange={(e) => onRoleChange(e.target.value)}
        className="rounded-xl border border-brand-copper/15 bg-transparent px-2 py-1 text-xs text-brand-night focus:outline-none focus:ring-1 focus:ring-brand-gold dark:bg-white/5 dark:text-white"
      >
        {["allrounder", "batsman", "bowler"].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {/* Toggle pool */}
      <button
        onClick={onTogglePool}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${inPool ? "border border-red-300/40 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" : "border border-emerald-400/40 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"}`}
      >
        {inPool ? "Exclude" : "Include"}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="rounded-xl px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"
        title="Delete player"
      >
        ✕
      </button>
    </div>
  );
}
