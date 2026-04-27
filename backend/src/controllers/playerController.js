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
        playerMap.set(key, {
          name: playerName,
          profileImage: ""
        });
      }
    }

    res.json(
      [...playerMap.values()].sort((a, b) => a.name.localeCompare(b.name))
    );
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

    if (player) {
      return res.json(player);
    }

    const statsEntry = await PlayerStats.findOne({
      playerName: { $regex: `^${safeName}$`, $options: "i" }
    }).lean();

    if (!statsEntry) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({
      name: statsEntry.playerName,
      profileImage: ""
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlayers,
  getPlayerByName
};
