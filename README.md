# F5 League Badlapur 2026

Production-ready read-only cricket tournament app with:

- `backend/`: Node.js + Express + MongoDB MVC APIs
- `frontend/`: Next.js App Router + Tailwind CSS + `next-themes`

## Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Set your MongoDB connection string
3. Install dependencies with `npm install`
4. Run with `npm run dev`

Available endpoints:

- `GET /api/matches`
- `GET /api/matches/:id`
- `GET /api/players`
- `GET /api/players/:name`
- `GET /api/player-stats/:playerName`
- `GET /api/teams`
- `GET /api/teams/:name`
- `GET /api/tournaments`

## Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`
2. Set `NEXT_PUBLIC_API_URL`
3. Install dependencies with `npm install`
4. Run with `npm run dev`
