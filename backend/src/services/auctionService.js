const AuctionSession = require("../models/AuctionSession");
const AuctionResult = require("../models/AuctionResult");
const Bid = require("../models/Bid");
const Team = require("../models/Team");
const Player = require("../models/Player");

const CAPTAINS_NEEDED = 2;
const PURSE_PER_TEAM = 15000;
const BID_DURATION_MS = 30000;

let bidTimer = null;

function getIO() {
  return require("../server").io;
}

async function getOrCreateSession() {
  let session = await AuctionSession.findOne();
  if (!session) {
    session = await AuctionSession.create({ status: "IDLE", captains: [] });
  }
  return session;
}

async function getSessionState() {
  const session = await getOrCreateSession();
  return AuctionSession.findById(session._id)
    .populate("currentPlayer", "name role basePrice isSold isCaptain profileImage")
    .populate("currentTeam", "name logo purseRemaining purseTotal")
    .populate("captains", "name role profileImage")
    .lean();
}

// ── Start ────────────────────────────────────────────────────────────────────

async function startAuction() {
  const session = await getOrCreateSession();
  if (session.status !== "IDLE") throw new Error("Auction already started");

  session.status = "SELECTING_CAPTAINS";
  session.captains = [];
  session.currentPlayer = null;
  session.currentBid = 0;
  session.currentTeam = null;
  await session.save();

  const state = await getSessionState();
  getIO().emit("auction_started", state);
  return state;
}

// ── Select Captain ───────────────────────────────────────────────────────────

async function selectCaptain(playerId) {
  const session = await getOrCreateSession();
  if (session.status !== "SELECTING_CAPTAINS") {
    throw new Error("Not in captain selection phase");
  }
  if (session.captains.length >= CAPTAINS_NEEDED) {
    throw new Error("Both captains already selected");
  }

  const player = await Player.findById(playerId);
  if (!player) throw new Error("Player not found");
  if (player.isCaptain) throw new Error("Player is already a captain");
  if (player.isSold) throw new Error("Player is already sold");

  // Mark player as captain and sold (off the auction block)
  player.isCaptain = true;
  player.isSold = true;
  await player.save();

  // Create a dedicated team for this captain with a random 4-digit PIN
  const firstName = player.name.split(" ")[0];
  const captainPin = String(Math.floor(1000 + Math.random() * 9000));
  const team = await Team.create({
    name: `${firstName}'s XI`,
    captainId: player._id,
    isAuctionTeam: true,
    purseTotal: PURSE_PER_TEAM,
    purseRemaining: PURSE_PER_TEAM,
    captainPin
  });

  session.captains.push(player._id);

  // If both captains selected, move to bidding phase
  if (session.captains.length === CAPTAINS_NEEDED) {
    session.status = "ONGOING";
  }

  await session.save();

  const state = await getSessionState();
  getIO().emit("captain_selected", { state, team });
  return state;
}

// ── Select Player for Bidding ─────────────────────────────────────────────────

async function selectPlayer(playerId) {
  const session = await getOrCreateSession();
  if (session.status !== "ONGOING" && session.status !== "SOLD" && session.status !== "UNSOLD") {
    throw new Error("Auction is not in a state to select a player");
  }

  const player = await Player.findById(playerId);
  if (!player) throw new Error("Player not found");
  if (player.isSold) throw new Error("Player already sold or is a captain");

  clearBidTimer();

  const timerEndsAt = new Date(Date.now() + BID_DURATION_MS);
  session.currentPlayer = player._id;
  session.currentBid = player.basePrice;
  session.currentTeam = null;
  session.status = "BIDDING";
  session.timerEndsAt = timerEndsAt;
  await session.save();

  const state = await getSessionState();
  getIO().emit("player_update", state);
  startBidTimer();
  return state;
}

// ── Place Bid ─────────────────────────────────────────────────────────────────

async function placeBid(teamId, amount) {
  const session = await getOrCreateSession();
  if (session.status !== "BIDDING") throw new Error("No active bidding right now");
  if (amount <= session.currentBid) {
    throw new Error(`Bid must be greater than current bid of ${session.currentBid}`);
  }

  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");
  if (!team.isAuctionTeam) throw new Error("Only auction teams can bid");
  if (team.purseRemaining < amount) {
    throw new Error(`Not enough purse. Remaining: ${team.purseRemaining}`);
  }

  session.currentBid = amount;
  session.currentTeam = teamId;
  session.timerEndsAt = new Date(Date.now() + BID_DURATION_MS);
  await session.save();

  await Bid.create({ playerId: session.currentPlayer, teamId, amount, timestamp: new Date() });

  resetBidTimer();

  const state = await getSessionState();
  getIO().emit("new_bid", state);
  return state;
}

// ── Close Bid ─────────────────────────────────────────────────────────────────

async function closeBid() {
  clearBidTimer();
  const session = await getOrCreateSession();
  if (session.status !== "BIDDING") throw new Error("No active bidding to close");

  if (!session.currentTeam) {
    session.status = "UNSOLD";
    session.timerEndsAt = null;
    await session.save();
    const state = await getSessionState();
    getIO().emit("auction_result", { ...state, outcome: "UNSOLD" });
    return state;
  }

  const team = await Team.findById(session.currentTeam);
  team.purseRemaining -= session.currentBid;
  await team.save();

  await AuctionResult.create({
    playerId: session.currentPlayer,
    teamId: session.currentTeam,
    soldPrice: session.currentBid
  });

  await Player.findByIdAndUpdate(session.currentPlayer, { isSold: true });

  session.status = "SOLD";
  session.timerEndsAt = null;
  await session.save();

  const state = await getSessionState();
  getIO().emit("auction_result", { ...state, outcome: "SOLD" });
  return state;
}

// ── Reset ─────────────────────────────────────────────────────────────────────

async function resetAuction() {
  clearBidTimer();

  // Delete all dynamically created auction teams
  await Team.deleteMany({ isAuctionTeam: true });

  // Reset all players
  await Player.updateMany({}, { isSold: false, isCaptain: false });

  // Reset session
  const session = await getOrCreateSession();
  session.status = "IDLE";
  session.captains = [];
  session.currentPlayer = null;
  session.currentBid = 0;
  session.currentTeam = null;
  session.timerEndsAt = null;
  await session.save();

  // Clear bid history and results
  await Bid.deleteMany({});
  await AuctionResult.deleteMany({});

  const state = await getSessionState();
  getIO().emit("auction_reset", state);
  return state;
}

// ── Timer helpers ─────────────────────────────────────────────────────────────

function startBidTimer() {
  clearBidTimer();
  bidTimer = setTimeout(async () => {
    try {
      await closeBid();
    } catch (err) {
      console.error("Auto-close bid error:", err.message);
    }
  }, BID_DURATION_MS);
}

function resetBidTimer() {
  clearBidTimer();
  startBidTimer();
}

function clearBidTimer() {
  if (bidTimer) {
    clearTimeout(bidTimer);
    bidTimer = null;
  }
}

module.exports = {
  getSessionState,
  startAuction,
  selectCaptain,
  selectPlayer,
  placeBid,
  closeBid,
  resetAuction
};
