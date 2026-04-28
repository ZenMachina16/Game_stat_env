🧠 0. Goal

Add a live cricket auction system where:

Admin controls auction flow
Captains bid in real-time
Players are sold based on highest bid
Uses existing player stats for base price
🏗️ 1. Update Your Existing Architecture

You already have:

Frontend (React/Next)
Backend (Node/Express)
Database (MongoDB)

👉 Add:

+ Socket.IO (real-time layer)
+ Auction module (new feature)
📦 2. Install Required Packages
npm install socket.io
🧩 3. Create New MongoDB Collections
🧑 Player (UPDATE EXISTING)

Add fields:

{
  name: String,
  role: String,

  stats: {...}, // already exists

  basePrice: Number,
  isSold: { type: Boolean, default: false }
}
👥 Team (NEW)
{
  name: String,
  purseTotal: Number,
  purseRemaining: Number
}
💸 Bid (NEW)
{
  playerId: ObjectId,
  teamId: ObjectId,
  amount: Number,
  timestamp: Date
}
🏆 AuctionResult (NEW)
{
  playerId: ObjectId,
  teamId: ObjectId,
  soldPrice: Number
}
⚡ AuctionSession (NEW — IMPORTANT)
{
  status: "IDLE" | "ONGOING" | "BIDDING",
  currentPlayer: ObjectId,
  currentBid: Number,
  currentTeam: ObjectId
}

👉 Only ONE document needed

⚙️ 4. Base Price Calculation (RUN BEFORE AUCTION)

Create a script:
function calculateBasePrice(player) {
  const matches = player.stats.matches || 1;

  const avgRuns = player.stats.runs / matches;
  const strikeRate = player.stats.strikeRate || 0;

  const wicketsPerMatch = player.stats.wickets / matches;
  const economy = player.stats.economy || 10;

  let score = 0;

  if (player.role === "batsman") {
    score = avgRuns * 5 + strikeRate * 1.2;
  } 
  else if (player.role === "bowler") {
    score = wicketsPerMatch * 25 + (10 - economy) * 10;
  } 
  else {
    const battingScore = avgRuns * 5 + strikeRate * 1.2;
    const bowlingScore = wicketsPerMatch * 25 + (10 - economy) * 10;

    score = battingScore * 0.6 + bowlingScore * 0.4;
  }

  return Math.max(100, Math.round(score * 10));
}

Run once:

players.forEach(p => {
  p.basePrice = calculateBasePrice(p);
  p.save();
});
🔌 5. Setup Socket.IO
server.js
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

module.exports.io = io;
🧠 6. Auction Service (CORE LOGIC)

Create:

/services/auctionService.js
🔥 auctionService.js
const AuctionSession = require("../models/AuctionSession");
const Bid = require("../models/Bid");
const Team = require("../models/Team");
const { io } = require("../server");

async function selectPlayer(player) {
  const session = await AuctionSession.findOne();

  session.currentPlayer = player._id;
  session.currentBid = player.basePrice;
  session.currentTeam = null;
  session.status = "BIDDING";

  await session.save();

  io.emit("player_update", session);
}
💸 placeBid()
async function placeBid(teamId, amount) {
  const session = await AuctionSession.findOne();
  const team = await Team.findById(teamId);

  if (amount <= session.currentBid) {
    throw new Error("Bid too low");
  }

  if (team.purseRemaining < amount) {
    throw new Error("Not enough balance");
  }

  session.currentBid = amount;
  session.currentTeam = teamId;

  await session.save();

  await Bid.create({
    playerId: session.currentPlayer,
    teamId,
    amount,
    timestamp: new Date()
  });

  io.emit("new_bid", session);
}
🏁 closeBid()
async function closeBid() {
  const session = await AuctionSession.findOne();

  if (!session.currentTeam) {
    session.status = "UNSOLD";
  } else {
    const team = await Team.findById(session.currentTeam);

    team.purseRemaining -= session.currentBid;
    await team.save();

    await AuctionResult.create({
      playerId: session.currentPlayer,
      teamId: session.currentTeam,
      soldPrice: session.currentBid
    });

    await Player.findByIdAndUpdate(session.currentPlayer, {
      isSold: true
    });

    session.status = "SOLD";
  }

  await session.save();

  io.emit("auction_result", session);
}
🌐 7. API Routes
/routes/auction.js
router.post("/start", startAuction);
router.post("/player", selectPlayer);
router.post("/bid", placeBid);
router.post("/close", closeBid);
⚡ 8. Frontend Integration
Connect socket
import io from "socket.io-client";

const socket = io("http://localhost:3000");
Listen events
socket.on("player_update", (data) => {
  setPlayer(data.currentPlayer);
});

socket.on("new_bid", (data) => {
  setCurrentBid(data.currentBid);
});

socket.on("auction_result", (data) => {
  showWinner(data);
});
Send bid
socket.emit("place_bid", {
  teamId,
  amount
});
⏱️ 9. Add Timer (IMPORTANT)

Inside backend:

function startBiddingTimer() {
  setTimeout(() => {
    closeBid();
  }, 10000); // 10 sec
}

Call this after selecting player.

🔐 10. Roles
Role	Access
Admin	Full control
Captain	Can bid
Viewer	Read-only

👉 Only captains need login

⚠️ 11. Rules You MUST Enforce
Bid must be > current bid
Team must have enough purse
One player at a time
Backend controls state (not frontend)
🚀 12. MVP Flow
Admin clicks “Start Auction”
Selects player
Bidding starts
Captains bid
Timer ends → player sold
Repeat
🧠 Final Insight

You already built:
✔ Stats system

Now you're adding:
✔ Real-time event system

👉 This turns your project from CRUD app → interactive system