const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const matchRoutes = require("./routes/matchRoutes");
const playerRoutes = require("./routes/playerRoutes");
const playerStatsRoutes = require("./routes/playerStatsRoutes");
const teamRoutes = require("./routes/teamRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const auctionRoutes = require("./routes/auctionRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*"
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/matches", matchRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/player-stats", playerStatsRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/auction", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
}, auctionRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource identifier" });
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
