const Match = require("../models/Match");

const getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({})
      .sort({ "matchInfo.date": -1, createdAt: -1 })
      .lean();

    res.json(matches);
  } catch (error) {
    next(error);
  }
};

const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).lean();

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatchById
};
