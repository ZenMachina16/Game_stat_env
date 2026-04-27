const express = require("express");
const { getPlayerStats } = require("../controllers/playerStatsController");

const router = express.Router();

router.get("/:playerName", getPlayerStats);

module.exports = router;
