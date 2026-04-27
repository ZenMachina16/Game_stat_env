const PlayerStats = require("../models/PlayerStats");
const escapeRegex = require("../utils/escapeRegex");

const getPlayerStats = async (req, res, next) => {
  try {
    const playerName = escapeRegex(req.params.playerName);
    const season = req.query.season;

    const query = {
      playerName: { $regex: `^${playerName}$`, $options: "i" }
    };

    if (season) {
      query.season = season;
    }

    const stats = await PlayerStats.find(query).sort({ season: 1 }).lean();

    if (!stats.length) {
      return res.status(404).json({ message: "Player stats not found" });
    }

    if (season) {
      return res.json(stats[0]);
    }

    const grouped = stats.reduce((accumulator, item) => {
      accumulator[item.season] = item;
      return accumulator;
    }, {});

    res.json(grouped);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlayerStats
};
