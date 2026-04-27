const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    season: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "tournaments"
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
