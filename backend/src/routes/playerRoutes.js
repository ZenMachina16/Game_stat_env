const express = require("express");
const {
  getPlayers,
  getPlayerByName,
  createPlayer,
  updatePlayer,
  deletePlayer,
  uploadPhoto
} = require("../controllers/playerController");

const router = express.Router();

router.get("/", getPlayers);
router.post("/", createPlayer);
router.put("/:id", updatePlayer);
router.delete("/:id", deletePlayer);
router.post("/:id/upload-photo", uploadPhoto);
router.get("/:name", getPlayerByName);

module.exports = router;
