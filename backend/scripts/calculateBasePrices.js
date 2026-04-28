require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Player = require("../src/models/Player");
const PlayerStats = require("../src/models/PlayerStats");

const FLOOR = 300;
const CEILING = 3000;

function normalize(val, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  const players = await Player.find({});

  // Load overall stats for all players
  const statsMap = {};
  for (const p of players) {
    const s = await PlayerStats.findOne({ playerName: p.name, season: "overall" }).lean();
    statsMap[p.name] = { player: p, stats: s };
  }

  const allStats = Object.values(statsMap).map((x) => x.stats).filter(Boolean);

  // Compute pool-wide maximums for normalization
  const pool = {
    maxAvg: Math.max(...allStats.map((s) => s.batting?.average || 0)),
    maxSR: Math.max(...allStats.map((s) => s.batting?.strikeRate || 0)),
    maxSixes: Math.max(...allStats.map((s) => s.batting?.sixes || 0)),
    maxWickets: Math.max(...allStats.map((s) => s.bowling?.wickets || 0)),
    bestEco: Math.min(...allStats.map((s) => s.bowling?.economy || 99).filter((e) => e > 0)),
    worstEco: Math.max(...allStats.map((s) => s.bowling?.economy || 0)),
    maxBowlAvg: Math.max(...allStats.map((s) => s.bowling?.average || 0)),
    maxFielding: Math.max(
      1,
      ...allStats.map((s) => (s.fielding?.catches || 0) + (s.fielding?.runouts || 0))
    )
  };

  const results = [];

  for (const { player, stats: s } of Object.values(statsMap)) {
    const innings = s?.batting?.innings || 1;
    const notOuts = s?.batting?.notOuts || 0;

    // Batting score (0–100)
    const batScore =
      normalize(s?.batting?.average || 0, 0, pool.maxAvg) * 35 +
      normalize(s?.batting?.strikeRate || 0, 0, pool.maxSR) * 30 +
      normalize(s?.batting?.sixes || 0, 0, pool.maxSixes) * 20 +
      (notOuts / innings) * 15;

    // Economy: higher score = lower economy (better)
    const ecoScore =
      pool.worstEco === pool.bestEco
        ? 0
        : normalize(pool.worstEco - (s?.bowling?.economy || pool.worstEco), 0, pool.worstEco - pool.bestEco) * 30;

    // Bowling score (0–100)
    const bowlScore =
      normalize(s?.bowling?.wickets || 0, 0, pool.maxWickets) * 35 +
      ecoScore +
      normalize(pool.maxBowlAvg - (s?.bowling?.average || pool.maxBowlAvg), 0, pool.maxBowlAvg) * 20 +
      normalize(
        (s?.fielding?.catches || 0) + (s?.fielding?.runouts || 0),
        0,
        pool.maxFielding
      ) * 15;

    // Weighted final score by role
    const role = player.role || "allrounder";
    let finalScore;
    if (role === "batsman") finalScore = batScore * 0.85 + bowlScore * 0.15;
    else if (role === "bowler") finalScore = batScore * 0.15 + bowlScore * 0.85;
    else finalScore = batScore * 0.6 + bowlScore * 0.4;

    const basePrice = Math.round(FLOOR + (finalScore / 100) * (CEILING - FLOOR));

    results.push({
      player,
      basePrice,
      finalScore,
      batScore,
      bowlScore
    });
  }

  // Sort by price descending and save
  results.sort((a, b) => b.basePrice - a.basePrice);

  console.log("Rank | Player                       | Role        | Bat   | Bowl  | Score | Price");
  console.log("-----+------------------------------+-------------+-------+-------+-------+------");

  for (let i = 0; i < results.length; i++) {
    const { player, basePrice, finalScore, batScore, bowlScore } = results[i];
    const old = player.basePrice;
    player.basePrice = basePrice;
    await player.save();

    const arrow = basePrice > old ? "↑" : basePrice < old ? "↓" : "=";
    console.log(
      `  ${String(i + 1).padStart(2)} | ${player.name.padEnd(28)} | ${(player.role || "allrounder").padEnd(11)} ` +
      `| ${batScore.toFixed(1).padStart(5)} | ${bowlScore.toFixed(1).padStart(5)} ` +
      `| ${finalScore.toFixed(1).padStart(5)} | ₹${basePrice} ${arrow} (was ₹${old})`
    );
  }

  console.log("\nAll base prices updated.");
  await mongoose.disconnect();
}

run().catch(console.error);
