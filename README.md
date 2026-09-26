# SafarNama 🇮🇳

An eco-tourism platform for exploring Incredible India — with **SafarGram**, an Instagram-style community feed for travellers, and built-in **chat**.

## Features

- **Destinations, maps and tours** — browse eco-friendly places with details, categories and a map.
- **Blogs** — write and read travel stories with cover images.
- **SafarGram** — photo and video posts (with hashtags, categories and destination tags), a Discover / Following feed, likes, comments, a private **Bucket List**, profile grids, hashtag and destination pages, **Explore** (search people, hashtags, places and posts; popular posts; suggested travellers) and trending panels.
- **Chat** — one-to-one and group messages with photos, real-time delivery, typing and online indicators, unread badges, message requests from strangers, and blocking.
- **Accounts** — registration and login with hashed passwords, password reset by email, profiles with followers.
- **Booking & payment** — under construction and switched off (see `DEPLOYMENT.md`).

## Tech stack

- **Client:** React 18, Vite, React Router, Redux Toolkit, SCSS, Leaflet, socket.io-client
- **Server:** Node.js (ESM), Express, MongoDB + Mongoose, socket.io, JWT auth, Helmet and rate limiting
- **Services:** MongoDB Atlas, Cloudinary (photos and videos), Nodemailer (email)
- **Tests:** `node:test`, Supertest and an in-memory MongoDB (the tests never touch a real database)

## Project structure

```
Server/            Express API, sockets, models, tests
  Routes/ Controllers/ Models/ services/ Middleware/ utils/ tests/
client/            React app
  src/features/safargram/   SafarGram (feed, explore, posts)
  src/features/chat/        Chat
```

## Run it locally

Requirements: Node.js 20+, a MongoDB database (Atlas free tier is fine) and a Cloudinary account.

```bash
# 1. install everything
npm run install-all

# 2. configure (copy the examples and fill them in — never commit the real .env files)
cp Server/.env.example Server/.env
cp client/.env.example client/.env

# 3. start API (port 5000) and website (port 5173) together
npm run dev
```

Create an admin account (optional):

```bash
cd Server
ADMIN_PASSWORD='<a strong password>' npm run create-admin
```

## Tests and checks

```bash
cd Server && npm test        # server tests (in-memory database)
cd client && npm test        # client helper tests
cd client && npm run lint    # lint
cd client && npm run build   # production build
```

## Deploying

See [DEPLOYMENT.md](DEPLOYMENT.md) (Render + Vercel + Atlas + Cloudinary).

## Status

Actively developed. Planned next: notifications and stories.
