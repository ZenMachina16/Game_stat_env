const Tournament = require("../models/Tournament");
const Match = require("../models/Match");

const getTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find({}).sort({ season: 1, name: 1 }).lean();

    if (tournaments.length) {
      return res.json(tournaments);
    }

    const matchTournaments = await Match.aggregate([
      {
        $group: {
          _id: {
            name: "$tournament.name",
            season: "$tournament.season"
          }
        }
      },
      { $sort: { "_id.season": 1, "_id.name": 1 } }
    ]);

    res.json(
      matchTournaments
        .filter((item) => item._id.name && item._id.season)
        .map((item) => ({
          name: item._id.name,
          season: item._id.season
        }))
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTournaments
};
