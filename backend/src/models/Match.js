const mongoose = require("mongoose");

const battingSchema = new mongoose.Schema(
  {
    playerName: String,
    runs: Number,
    balls: Number,
    fours: Number,
    sixes: Number,
    strikeRate: Number,
    dismissal: String,
    isOut: Boolean
  },
  { _id: false }
);

const bowlingSchema = new mongoose.Schema(
  {
    playerName: String,
    overs: Number,
    maidens: Number,
    runs: Number,
    wickets: Number,
    economy: Number,
    wides: Number,
    noBalls: Number
  },
  { _id: false }
);

const fallOfWicketsSchema = new mongoose.Schema(
  {
    score: String,
    over: String,
    playerName: String
  },
  { _id: false }
);

const inningsSchema = new mongoose.Schema(
  {
    teamName: String,
    runs: Number,
    wickets: Number,
    overs: Number,
    runRate: Number,
    extras: {
      wides: Number,
      noBalls: Number,
      byes: Number,
      legByes: Number,
      total: Number
    },
    batting: [battingSchema],
    bowling: [bowlingSchema],
    fallOfWickets: [fallOfWicketsSchema]
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      name: String,
      season: String
    },
    teams: {
      team1: String,
      team2: String
    },
    matchInfo: {
      matchTitle: String,
      date: String,
      venue: String,
      toss: String,
      result: String,
      oversLimit: Number,
      format: String,
      playerOfMatch: String,
      scorer: String,
      matchIdExternal: String
    },
    summary: {
      team1Score: String,
      team2Score: String
    },
    innings: [inningsSchema]
  },
  {
    timestamps: true,
    collection: "matches"
  }
);

module.exports = mongoose.model("Match", matchSchema);
