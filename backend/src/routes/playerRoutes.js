const express = require("express");
const { getPlayers, getPlayerByName } = require("../controllers/playerController");

const router = express.Router();

router.get("/", getPlayers);
router.get("/:name", getPlayerByName);

module.exports = router;
