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
    }
  },
  {
    timestamps: true,
    collection: "teams"
  }
);

module.exports = mongoose.model("Team", teamSchema);
