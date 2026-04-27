const mongoose = require("mongoose");

const playerStatsSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true
    },
    season: {
      type: String,
      required: true,
      enum: ["S1", "S2", "overall"]
    },
    batting: {
      matches: Number,
      innings: Number,
      runs: Number,
      notOuts: Number,
      average: Number,
      strikeRate: Number,
      fours: Number,
      sixes: Number,
      highestScore: String
    },
    bowling: {
      matches: Number,
      wickets: Number,
      average: Number,
      strikeRate: Number,
      economy: Number,
      bestBowling: String
    },
    fielding: {
      catches: Number,
      runouts: Number
    }
  },
  {
    timestamps: true,
    collection: "playerstats"
  }
);

playerStatsSchema.index({ playerName: 1, season: 1 }, { unique: true });

module.exports = mongoose.model("PlayerStats", playerStatsSchema);
