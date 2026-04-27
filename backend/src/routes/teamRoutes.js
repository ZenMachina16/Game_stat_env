const express = require("express");
const { getTeams, getTeamByName } = require("../controllers/teamController");

const router = express.Router();

router.get("/", getTeams);
router.get("/:name", getTeamByName);

module.exports = router;
