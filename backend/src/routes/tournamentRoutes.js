const express = require("express");
const { getTournaments } = require("../controllers/tournamentController");

const router = express.Router();

router.get("/", getTournaments);

module.exports = router;
