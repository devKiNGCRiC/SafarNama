# Deploying SafarNama

Recommended free-tier setup:

| Part | Where | Why |
|---|---|---|
| Database | **MongoDB Atlas** (you already use it) | Managed MongoDB |
| API + chat (`Server/`) | **Render** (Web Service) — or Railway | Chat uses WebSockets, so the server must be a **long-running** process. Serverless hosts (Vercel/Netlify functions) will not work for it |
| Website (`client/`) | **Vercel** (or Netlify) | Static React build |
| Photos & videos | **Cloudinary** | Hosts keep no permanent disk, so uploads must not be stored on the server |

## 0. Before you deploy: secrets

Never commit `.env`. If a secret has ever been in git history (even in a deleted file), treat it as
public and **rotate it**: Cloudinary API secret, the Gmail app password, `JWT_SECRET_KEY`, and the
MongoDB user password. Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 1. MongoDB Atlas
1. Create a database user with a strong password (not the same one you used while developing).
2. *Network Access* → allow `0.0.0.0/0` (Render's outgoing IPs change). The password is the protection, so keep it strong.
3. Copy the connection string for `MONGO_DB`.

## 2. API on Render
1. *New → Web Service* → connect the GitHub repo.
2. **Root Directory:** `Server` · **Build Command:** `npm install` · **Start Command:** `npm start`
3. **Health Check Path:** `/health`
4. **Environment variables:**

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_DB` | your Atlas connection string |
| `JWT_SECRET_KEY` | the 128-character secret you generated |
| `CLIENT_URL` | your website URL, e.g. `https://safarnama.vercel.app` (no trailing slash) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Cloudinary |
| `EMAIL_USERNAME`, `EMAIL_PASSWORD` | Gmail address + **app password** (for password-reset emails) |
| `ENABLE_BOOKING` | `false` |

The server refuses to start (and prints why) if `MONGO_DB`, `JWT_SECRET_KEY` or, in production, `CLIENT_URL` is missing.
`PORT` is provided by Render. On the free plan the server sleeps when idle, so the first request after a pause is slow and chat connections drop; a paid instance avoids that.

## 3. Website on Vercel
1. *Add New → Project* → import the repo, **Root Directory:** `client`.
2. Framework preset **Vite** (build `npm run build`, output `dist`). `client/vercel.json` already makes page refreshes and deep links work.
3. **Environment variables:**

| Variable | Value |
|---|---|
| `VITE_API_URL` | your Render URL, e.g. `https://safarnama-api.onrender.com` (no trailing slash) |
| `VITE_ENABLE_BOOKING` | `false` |
| `VITE_ENABLE_EVENTS`, `VITE_ENABLE_ECO_GUIDES`, `VITE_ENABLE_GALLERY`, `VITE_ENABLE_FORUM` | `true` (all finished; set `false` to hide one) |
| `VITE_GOOGLE_CLIENT_ID` / `VITE_FACEBOOK_APP_ID` | only if you use social login |

(Netlify works too: `client/Public/_redirects` provides the same page-refresh fix.)

## 4. After the first deploy — check
- `https://<render-url>/health` returns `{"status":"ok","db":"up",...}`
- Register, log in, upload a profile picture (it should get a `res.cloudinary.com` URL).
- SafarGram: post a photo, like, comment; Chat: open two browsers and message each other.
- Booking, payment and the *Book Now* buttons are hidden while `ENABLE_BOOKING` is `false`.

## Turning booking on later
Set `ENABLE_BOOKING=true` on Render and `VITE_ENABLE_BOOKING=true` on Vercel, then redeploy both.
Note that payments are currently **simulated** — connect a real gateway (Razorpay is already installed) before enabling this for real customers.

## Limits to know about
- Chat presence ("online" dots) lives in the server's memory, so run **one** server instance.
- Free Cloudinary/Atlas plans have storage and bandwidth limits; watch usage, especially video.
