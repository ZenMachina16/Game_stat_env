# F5 League Badlapur 2026 

A comprehensive, production-ready cricket tournament management system featuring a real-time live auction platform, player statistics tracking, match scorecards, and team management.

##  Key Features

- ** Real-Time Live Auction:**
  - Powered by **Socket.IO** for instant bid updates, timers, and player transitions.
  - **Admin Panel:** Full control over the auction flow (Start, Select Captains, Select Players, Close Bids, Reset).
  - **Captain Dashboard:** Secure PIN-based login for team captains to place live bids.
  - **Dynamic Team Purses:** Auto-tracking of remaining budgets for each franchise (starts at ₹15,000).
- ** Player Profiles & Stats:**
  - Season-wise batting, bowling, and fielding breakdown.
  - Profile photo uploads (handled via Multer).
  - **Dynamic Base Pricing:** A custom Percentile-Ranked Normalized Scoring algorithm calculates a player's base price based on their performance relative to the league average.
- ** Match Scorecards:**
  - Detailed innings breakdown, fall of wickets, and match summaries.
- **Admin Management:**
  - Add, edit, and delete players.
  - Include or exclude specific players from the auction pool.
  - Assign roles (Batsman, Bowler, Allrounder).

##  Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, `next-themes` (Dark/Light mode), `socket.io-client`.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.IO, Multer (File Uploads).

---

##  Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB cluster (Atlas or local)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
ADMIN_PIN=f5admin
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend server:
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔨 The Auction Flow

1. **Start:** Admin logs in with `ADMIN_PIN` (`f5admin`) and clicks "Start Auction".
2. **Captains Selection:** Admin selects 2 players to be captains. The system automatically creates their teams (e.g., "Binayak's XI") and generates a secure 4-digit PIN for each captain.
3. **Captain Login:** Captains go to the Auction page, enter their PIN, and gain bidding access with a ₹15,000 purse.
4. **Bidding:** Admin selects a player from the unsold pool. A 30-second timer starts. Captains place bids.
5. **Sold/Unsold:** When the timer runs out (or Admin forces close), the player is sold to the highest bidder, and the purse is deducted.

---

## Base Price Algorithm

The base price for each player is dynamically calculated using a **Percentile-Ranked Normalized Scoring** algorithm. Instead of using raw numbers, this algorithm measures each player's performance *relative to the maximums achieved in the current player pool*.

- **Batting Score:** Rewards high averages, fast scoring, boundary hitting, and consistency (not getting out).
- **Bowling Score:** Rewards wicket-taking ability, tight economy rates, low bowling averages, and fielding contributions.
- **Role Weighting:** 
  - Batsman: 85% Batting + 15% Bowling
  - Bowler: 15% Batting + 85% Bowling
  - Allrounder: 60% Batting + 40% Bowling
- **Price Range:** Scaled between ₹300 (Floor) and ₹3,000 (Ceiling).

To recalculate base prices based on the latest stats in the database:
```bash
cd backend
node scripts/calculateBasePrices.js
```

---

##  API Endpoints

**Public Data:**
- `GET /api/matches` & `/api/matches/:id`
- `GET /api/players` & `/api/players/:name`
- `GET /api/player-stats/:playerName`
- `GET /api/teams` & `/api/teams/:name`
- `GET /api/tournaments`

**Auction & Admin:**
- `GET /api/auction/status` - Current live auction state
- `GET /api/auction/results` - Sold players
- `GET /api/auction/unsold` - Available players
- `GET /api/auction/purses` - Team budgets
- `POST /api/players` - Add new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `POST /api/players/:id/upload-photo` - Upload profile picture
