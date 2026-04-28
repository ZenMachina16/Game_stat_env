const mongoose = require("mongoose");

const auctionSessionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["IDLE", "SELECTING_CAPTAINS", "ONGOING", "BIDDING", "SOLD", "UNSOLD"],
      default: "IDLE"
    },
    captains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
      }
    ],
    currentPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null
    },
    currentBid: {
      type: Number,
      default: 0
    },
    currentTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },
    timerEndsAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "auctionsessions"
  }
);

module.exports = mongoose.model("AuctionSession", auctionSessionSchema);
