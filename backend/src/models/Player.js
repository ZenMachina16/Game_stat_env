const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    profileImage: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["batsman", "bowler", "allrounder"],
      default: "allrounder"
    },
    basePrice: {
      type: Number,
      default: 100
    },
    isSold: {
      type: Boolean,
      default: false
    },
    isCaptain: {
      type: Boolean,
      default: false
    },
    excludedFromAuction: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: "players"
  }
);

module.exports = mongoose.model("Player", playerSchema);
