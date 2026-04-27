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
    }
  },
  {
    timestamps: true,
    collection: "players"
  }
);

module.exports = mongoose.model("Player", playerSchema);
