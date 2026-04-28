const auctionService = require("../services/auctionService");
const AuctionResult = require("../models/AuctionResult");
const Player = require("../models/Player");
const Team = require("../models/Team");

const selectCaptain = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ message: "playerId required" });
    const state = await auctionService.selectCaptain(playerId);
    res.json(state);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getStatus = async (req, res, next) => {
  try {
    const state = await auctionService.getSessionState();
    res.json(state);
  } catch (err) {
    next(err);
  }
};

const startAuction = async (req, res, next) => {
  try {
    const state = await auctionService.startAuction();
    res.json(state);
  } catch (err) {
    next(err);
  }
};

const resetAuction = async (req, res, next) => {
  try {
    const state = await auctionService.resetAuction();
    res.json(state);
  } catch (err) {
    next(err);
  }
};

const selectPlayer = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ message: "playerId required" });
    const state = await auctionService.selectPlayer(playerId);
    res.json(state);
  } catch (err) {
    next(err);
  }
};

const placeBid = async (req, res, next) => {
  try {
    const { teamId, amount } = req.body;
    if (!teamId || !amount) return res.status(400).json({ message: "teamId and amount required" });
    const state = await auctionService.placeBid(teamId, Number(amount));
    res.json(state);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const closeBid = async (req, res, next) => {
  try {
    const state = await auctionService.closeBid();
    res.json(state);
  } catch (err) {
    next(err);
  }
};

const getResults = async (req, res, next) => {
  try {
    const results = await AuctionResult.find()
      .populate("playerId", "name role profileImage")
      .populate("teamId", "name logo")
      .lean();
    res.json(results);
  } catch (err) {
    next(err);
  }
};

const getUnsoldPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ isSold: false, excludedFromAuction: { $ne: true } })
      .sort({ basePrice: -1 })
      .lean();
    res.json(players);
  } catch (err) {
    next(err);
  }
};

const toggleAuctionPool = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    player.excludedFromAuction = !player.excludedFromAuction;
    await player.save();
    res.json(player);
  } catch (err) {
    next(err);
  }
};

const getAllPlayersAdmin = async (req, res, next) => {
  try {
    const players = await Player.find({}).sort({ basePrice: -1 }).lean();
    res.json(players);
  } catch (err) {
    next(err);
  }
};

const getAdminTeams = async (req, res, next) => {
  try {
    const { pin } = req.query;
    if (pin !== process.env.ADMIN_PIN) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const teams = await Team.find({ isAuctionTeam: true })
      .populate("captainId", "name")
      .lean();
    res.json(teams); // includes captainPin
  } catch (err) {
    next(err);
  }
};

const verifyCaptainPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: "pin required" });
    const team = await Team.findOne({ isAuctionTeam: true, captainPin: String(pin) })
      .populate("captainId", "name")
      .lean();
    if (!team) return res.status(401).json({ message: "Invalid PIN" });
    // Never send the pin back to the client
    const { captainPin: _pin, ...safeTeam } = team;
    res.json(safeTeam);
  } catch (err) {
    next(err);
  }
};

const getTeamPurses = async (req, res, next) => {
  try {
    const teams = await Team.find({ isAuctionTeam: true })
      .populate("captainId", "name")
      .lean();
    // Strip PINs from public response
    res.json(teams.map(({ captainPin: _pin, ...t }) => t));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStatus,
  startAuction,
  resetAuction,
  selectCaptain,
  selectPlayer,
  placeBid,
  closeBid,
  getResults,
  getUnsoldPlayers,
  toggleAuctionPool,
  getAllPlayersAdmin,
  getTeamPurses,
  getAdminTeams,
  verifyCaptainPin
};
