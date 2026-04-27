const Team = require("../models/Team");
const Match = require("../models/Match");
const escapeRegex = require("../utils/escapeRegex");

const getTeams = async (req, res, next) => {
  try {
    const [teams, matchTeams] = await Promise.all([
      Team.find({}).sort({ name: 1 }).lean(),
      Match.aggregate([
        {
          $project: {
            teamNames: ["$teams.team1", "$teams.team2"]
          }
        },
        { $unwind: "$teamNames" },
        { $group: { _id: "$teamNames" } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const teamMap = new Map(teams.map((team) => [team.name.toLowerCase(), team]));

    for (const entry of matchTeams) {
      const teamName = entry._id;
      if (!teamName) {
        continue;
      }
      const key = teamName.toLowerCase();
      if (!teamMap.has(key)) {
        teamMap.set(key, {
          name: teamName,
          logo: ""
        });
      }
    }

    res.json([...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    next(error);
  }
};

const getTeamByName = async (req, res, next) => {
  try {
    const safeName = escapeRegex(req.params.name);
    const team = await Team.findOne({
      name: { $regex: `^${safeName}$`, $options: "i" }
    }).lean();

    if (!team) {
      const hasMatches = await Match.exists({
        $or: [
          { "teams.team1": { $regex: `^${safeName}$`, $options: "i" } },
          { "teams.team2": { $regex: `^${safeName}$`, $options: "i" } }
        ]
      });

      if (!hasMatches) {
        return res.status(404).json({ message: "Team not found" });
      }

      return res.json({
        name: req.params.name,
        logo: ""
      });
    }

    res.json(team);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeams,
  getTeamByName
};
