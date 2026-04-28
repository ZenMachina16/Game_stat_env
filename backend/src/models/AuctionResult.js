const mongoose = require("mongoose");

const auctionResultSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    soldPrice: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "auctionresults"
  }
);

module.exports = mongoose.model("AuctionResult", auctionResultSchema);
