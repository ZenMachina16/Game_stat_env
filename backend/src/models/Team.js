const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String,
      default: ""
    },
    purseTotal: {
      type: Number,
      default: 5000
    },
    purseRemaining: {
      type: Number,
      default: 5000
    },
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null
    },
    isAuctionTeam: {
      type: Boolean,
      default: false
    },
    captainPin: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "teams"
  }
);

module.exports = mongoose.model("Team", teamSchema);
