# Relay

> A modern, installable, real-time messaging PWA powered by [Tinode](https://github.com/tinode/chat) and a custom React frontend — with end-to-end push notifications and voice/video calling via Firebase.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)
![Tinode](https://img.shields.io/badge/Backend-Tinode-2C3E50)
![Firebase](https://img.shields.io/badge/Firebase-FCM%20%2B%20Calling-FFCA28?logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green)

Relay is a self-hostable chat application that pairs the battle-tested **Tinode** messaging server with a purpose-built **React** single-page app. It installs like a native app, works offline for cached conversations, delivers push notifications even when the tab is closed, and supports 1:1 and group **voice/video calls** using WebRTC with Firebase handling signaling and push wake-ups.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Tinode Configuration](#tinode-configuration)
- [Running Locally](#running-locally)
- [Building & Deploying](#building--deploying)
- [How Push Notifications Work](#how-push-notifications-work)
- [How Calling Works](#how-calling-works)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 💬 **Real-time messaging** — 1:1 and group chats, powered by Tinode's websocket protocol
- 📎 **Rich media** — image, file, and audio attachments with inline previews
- ✅ **Delivery & read receipts**, typing indicators, and presence
- 🔍 **Contact & topic discovery** — search users, create groups, manage members
- 📲 **Installable PWA** — add to home screen on desktop and mobile; offline shell and cached conversations
- 🔔 **Push notifications** — Web Push via Firebase Cloud Messaging (FCM), including background/closed-tab delivery
- 📞 **Voice & video calling** — WebRTC 1:1 and small group calls, with Firebase for signaling and call invites
- 🎨 **Responsive UI** — custom React component library, dark/light themes, mobile-first layout
- 🔐 **Auth** — Tinode username/password login plus optional token-based session persistence
- 🌐 **Self-hostable** — no vendor lock-in for message storage; you own the Tinode server

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| State / Data | Zustand + TanStack Query |
| Styling | Tailwind CSS + custom design tokens |
| PWA | `vite-plugin-pwa` (Workbox service worker) |
| Messaging backend | [Tinode](https://github.com/tinode/chat) (gRPC / WebSocket) |
| Push notifications | Firebase Cloud Messaging (Web Push) + Tinode push relay |
| Calling | WebRTC + Firebase Realtime Database / Firestore for signaling |
| Media | Tinode file server / S3-compatible storage (optional) |

---

## Architecture

```
┌──────────────────────────┐        WebSocket (wss)        ┌─────────────────────┐
│   Relay React PWA        │ ────────────────────────────► │   Tinode Server     │
│  ┌────────────────────┐  │                               │   (chat, topics,    │
│  │ UI / Chat Store    │  │                               │    messages, auth)  │
│  └─────────┬──────────┘  │                               └──────────┬──────────┘
│            │             │                                          │
│  ┌─────────▼──────────┐  │        FCM push (data msg)               │ push relay
│  │ Service Worker     │◄─┼──────────────────────────────────────────┤
│  │ (Workbox + FCM)    │  │                                          ▼
│  └─────────┬──────────┘  │                               ┌─────────────────────┐
│            │             │                               │  Firebase Cloud     │
│  ┌─────────▼──────────┐  │   WebRTC signaling (RTDB)     │  Messaging (FCM)    │
│  │ WebRTC Call Engine │◄─┼──────────────────────────────►│  + Realtime DB      │
│  └────────────────────┘  │                               └─────────────────────┘
└──────────────────────────┘
```

- **Messages** travel over Tinode's websocket protocol; the React app never talks to the database directly.
- **Push** is delivered by FCM. Tinode's push relay sends a data-only message when a user is offline; the service worker renders the notification.
- **Calls** are peer-to-peer WebRTC. Firebase Realtime Database (or Firestore) carries SDP offers/answers and ICE candidates, and FCM wakes the callee.

---

## Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9 (or pnpm/yarn)
- A running **Tinode** server — see the [Tinode installation guide](https://github.com/tinode/chat/blob/master/INSTALL.md). Docker Compose is the fastest route.
- A **Firebase project** with a Web App registered (for FCM + Realtime Database)
- **HTTPS** in any non-local environment — required for service workers, push, and WebRTC (`getUserMedia`)

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/relay.git
cd relay

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env.local

# 4. Fill in the values (see Environment Variables + Firebase Setup)
#    then start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Create `.env.local` in the project root. All client-side variables must be prefixed with `VITE_`.

```dotenv
# ── Tinode backend ─────────────────────────────────────────────
VITE_TINODE_WS_URL=wss://your-tinode-host.example.com/v0/channels
VITE_TINODE_API_KEY=AQEAAAABAAD_rAp4DJh05a1HAwFT3A6K
VITE_TINODE_APP_NAME=Relay

# ── Firebase (client SDK) ──────────────────────────────────────
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=relay-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=relay-app
VITE_FIREBASE_STORAGE_BUCKET=relay-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_DATABASE_URL=https://relay-app-default-rtdb.firebaseio.com

# ── Web Push ───────────────────────────────────────────────────
# Public VAPID key from Firebase Console → Project Settings → Cloud Messaging
VITE_FIREBASE_VAPID_KEY=BN...

# ── Calling ────────────────────────────────────────────────────
VITE_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=relay
VITE_TURN_CREDENTIAL=super-secret
```

> ⚠️ **Never commit `.env.local`.** Only the Firebase *web* config and the public VAPID key belong in the client bundle. Server-side credentials (FCM service account, Tinode API keys) live in the Tinode/push-relay config, not here.

---

## Firebase Setup

### 1. Create the project

1. Go to the [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Add a **Web App** (`</>` icon) and copy the config values into your `.env.local`.

### 2. Enable Cloud Messaging

1. In **Project Settings → Cloud Messaging**, ensure the **Web Push certificates** section has a VAPID key pair. If not, generate one and copy the public key into `VITE_FIREBASE_VAPID_KEY`.
2. The service worker in `public/firebase-messaging-sw.js` consumes this config at build time (see `scripts/generate-sw-env.mjs`).

### 3. Enable Realtime Database (for call signaling)

1. **Build → Realtime Database → Create database**.
2. Apply security rules so only authenticated Tinode users can read/write their own call nodes:

```json
{
  "rules": {
    "calls": {
      "$callId": {
        ".read": "auth != null && (auth.uid == data.child('caller').val() || auth.uid == data.child('callee').val())",
        ".write": "auth != null"
      }
    }
  }
}
```

> Relay uses a signed Firebase custom token minted by your auth bridge (or anonymous auth) so `auth.uid` maps to the Tinode user ID. See `src/lib/firebase/auth.ts`.

### 4. Register the service worker

Copy your Firebase web config into the environment file read by `public/firebase-messaging-sw.js`, then verify it's bundled by running `npm run build` and checking `dist/firebase-messaging-sw.js`.

---

## Tinode Configuration

Relay connects to Tinode as a standard web client. Two server-side pieces are needed for push:

### 1. Provide the web app

Serve the built `dist/` directory from Tinode's `static/` folder, or point your reverse proxy at it. Tinode must serve `firebase-messaging-sw.js` at the **scope root** so the service worker controls the whole origin.

### 2. Enable the FCM push relay

Install and configure [`tinode/push`](https://github.com/tinode/push) alongside the server, then add to `tinode.conf`:

```json
{
  "push": {
    "enabled": true,
    "push_relay": [
      {
        "name": "fcm",
        "enabled": true,
        "server_key": "YOUR_FCM_SERVER_KEY_OR_SERVICE_ACCOUNT"
      }
    ]
  }
}
```

The relay needs the **Firebase service account credentials** (not the web config) to send data messages. Relay registers each device's FCM token with Tinode via `{set: {desc: {push: [...]}}}` on login and removes it on logout.

> 📘 See Tinode's [push notifications docs](https://github.com/tinode/chat/blob/master/docs/API.md#push-notifications) for the full contract.

---

## Running Locally

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run dev -- --host # expose on the LAN (useful for testing on a phone)
```

**Testing push locally:** FCM requires HTTPS. Use a tunnel (e.g. `ngrok http 5173`) and set `VITE_TINODE_WS_URL` to your Tinode instance, or run everything behind a local TLS reverse proxy (Caddy is a one-liner).

---

## Building & Deploying

```bash
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build locally
```

Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, S3+CloudFront, or Tinode's `static/` directory). Requirements:

- **HTTPS** enabled
- Service worker files served with `Cache-Control: no-cache`
- SPA fallback rewrite to `index.html`
- `firebase-messaging-sw.js` served at the origin root

Example Netlify `_redirects`:

```
/*    /index.html   200
```

---

## How Push Notifications Work

1. On login, the app requests notification permission and calls `getToken({ vapidKey })`.
2. The FCM token is registered with Tinode for the current session.
3. When a message arrives for an **offline** user, Tinode's push relay sends a **data-only** FCM message.
4. The service worker (`firebase-messaging-sw.js`) receives it in the background, renders a notification, and opens the correct conversation on click.
5. When the app is foregrounded, `onMessage` handles the event in-app and the service worker suppresses the duplicate notification.

Relevant files:

- `src/lib/push/register.ts` — permission + token registration
- `src/lib/push/handlers.ts` — foreground message handling
- `public/firebase-messaging-sw.js` — background handler

---

## How Calling Works

Relay implements calling with WebRTC; Firebase provides the signaling channel.

1. Caller creates a `callId` and writes an **offer** to Realtime Database at `calls/{callId}`.
2. The caller also sends an FCM **call invite** to the callee's device token so the callee wakes even with the app closed.
3. Callee accepts → writes an **answer** and their **ICE candidates**.
4. Both peers exchange ICE candidates until the peer connection is established (`STUN`/`TURN` from your env).
5. On hang-up, the call node is deleted and both peers tear down the `RTCPeerConnection`.

Relevant files:

- `src/lib/webrtc/CallEngine.ts` — peer connection lifecycle
- `src/lib/webrtc/signaling.ts` — Firebase RTDB signaling
- `src/features/call/` — incoming/outgoing call UI

> A TURN server is strongly recommended for production; STUN alone will fail on symmetric NATs and some mobile networks.

---

## Project Structure

```
relay/
├── public/
│   ├── icons/                    # PWA icons (192, 512, maskable)
│   └── firebase-messaging-sw.js  # FCM background handler
├── src/
│   ├── app/                      # routing, providers, shell
│   ├── components/               # reusable UI primitives
│   ├── features/
│   │   ├── auth/                 # login, session, Tinode client init
│   │   ├── chat/                 # conversation list, message thread
│   │   ├── contacts/             # user search, contact management
│   │   ├── call/                 # call UI, ringer, incoming call modal
│   │   └── settings/             # profile, notifications, theme
│   ├── lib/
│   │   ├── tinode/               # Tinode client wrapper + types
│   │   ├── firebase/             # app init, auth bridge, RTDB helpers
│   │   ├── push/                 # FCM registration + handlers
│   │   └── webrtc/               # CallEngine + signaling
│   ├── stores/                   # Zustand stores
│   ├── styles/                   # Tailwind config, design tokens
│   └── main.tsx
├── scripts/
│   └── generate-sw-env.mjs       # injects Firebase config into the SW
├── .env.example
├── vite.config.ts                # includes vite-plugin-pwa config
└── README.md
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build production bundle |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run generate:sw` | Inject env config into the service worker |

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Notifications never arrive | VAPID key mismatch, service worker not at scope root, or push relay not configured on Tinode |
| `Registration failed - push service error` | FCM project missing Web Push certificate; regenerate VAPID key |
| Calls connect but no audio/video | Missing `getUserMedia` permission, or mixed content — ensure HTTPS and correct `STUN`/`TURN` URLs |
| WebSocket fails to connect | `VITE_TINODE_WS_URL` must be `wss://` in production; check reverse proxy upgrade headers |
| PWA not installable | Manifest icons missing `purpose: "maskable"`, or site not served over HTTPS |
| Service worker stale after deploy | Ensure SW files are served with `Cache-Control: no-cache`; bump `skipWaiting` in Workbox config |

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Follow the existing code style (ESLint + Prettier are enforced).
3. Add tests for new logic where practical.
4. Open a pull request describing the change and any config implications.

Please report security issues privately rather than in public issues.

---

## License

MIT © 2026 MmaxonXoXo. See [LICENSE](./LICENSE) for details.

Tinode is licensed under [AGPL-3.0](https://github.com/tinode/chat/blob/master/LICENSE) — review its terms if you plan to distribute modified server builds.
