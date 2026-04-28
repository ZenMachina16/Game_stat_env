const express = require("express");
const {
  getStatus,
  startAuction,
  resetAuction,
  selectCaptain,
  selectPlayer,
  placeBid,
  closeBid,
  getResults,
  getUnsoldPlayers,
  getTeamPurses,
  getAdminTeams,
  verifyCaptainPin
} = require("../controllers/auctionController");

const router = express.Router();

router.get("/status", getStatus);
router.get("/results", getResults);
router.get("/unsold", getUnsoldPlayers);
router.get("/purses", getTeamPurses);
router.get("/admin-teams", getAdminTeams);

router.post("/verify-captain", verifyCaptainPin);
router.post("/start", startAuction);
router.post("/reset", resetAuction);
router.post("/captain", selectCaptain);
router.post("/player", selectPlayer);
router.post("/bid", placeBid);
router.post("/close", closeBid);

module.exports = router;
