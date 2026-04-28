const Player = require("../models/Player");
const PlayerStats = require("../models/PlayerStats");
const escapeRegex = require("../utils/escapeRegex");

const getPlayers = async (req, res, next) => {
  try {
    const [players, statsNames] = await Promise.all([
      Player.find({}).sort({ name: 1 }).lean(),
      PlayerStats.distinct("playerName")
    ]);

    const playerMap = new Map(players.map((player) => [player.name.toLowerCase(), player]));

    for (const playerName of statsNames) {
      const key = playerName.toLowerCase();
      if (!playerMap.has(key)) {
        playerMap.set(key, { name: playerName, profileImage: "" });
      }
    }

    res.json([...playerMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    next(error);
  }
};

const getPlayerByName = async (req, res, next) => {
  try {
    const safeName = escapeRegex(req.params.name);
    const player = await Player.findOne({
      name: { $regex: `^${safeName}$`, $options: "i" }
    }).lean();

    if (player) return res.json(player);

    const statsEntry = await PlayerStats.findOne({
      playerName: { $regex: `^${safeName}$`, $options: "i" }
    }).lean();

    if (!statsEntry) return res.status(404).json({ message: "Player not found" });

    res.json({ name: statsEntry.playerName, profileImage: "" });
  } catch (error) {
    next(error);
  }
};

const createPlayer = async (req, res, next) => {
  try {
    const { name, role, profileImage } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const existing = await Player.findOne({ name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" } });
    if (existing) {
      return res.status(409).json({ message: "Player with this name already exists" });
    }

    // New player with no stats gets the lowest base price in the pool
    const lowestPlayer = await Player.findOne({ basePrice: { $gt: 0 } }).sort({ basePrice: 1 }).lean();
    const basePrice = lowestPlayer ? lowestPlayer.basePrice : 300;

    const player = await Player.create({
      name: name.trim(),
      role: role || "allrounder",
      profileImage: profileImage || "",
      basePrice
    });

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
};

const updatePlayer = async (req, res, next) => {
  try {
    const { name, role, profileImage, excludedFromAuction } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (role !== undefined) update.role = role;
    if (profileImage !== undefined) update.profileImage = profileImage;
    if (excludedFromAuction !== undefined) update.excludedFromAuction = excludedFromAuction;

    const player = await Player.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  } catch (error) {
    next(error);
  }
};

const deletePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    // Also delete their stats
    await PlayerStats.deleteMany({ playerName: player.name });
    res.json({ message: "Player deleted", player });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlayers,
  getPlayerByName,
  createPlayer,
  updatePlayer,
  deletePlayer
};
