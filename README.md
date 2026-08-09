# Video Chat

1:1 browser video calls with a Google Meet–style UI, powered by WebRTC via PeerJS.

Built by [Marcos Mendes](https://www.instagram.com/mendes.tsx/).

## Features

- 1:1 calls with a shareable link (`/?room=vc-xxxxxxxx`)
- Join with a room code or full URL from the home screen
- Layouts: spotlight (PiP) or side-by-side 50/50
- Controls: mic, camera, remote volume, fullscreen
- Floating video fit toggle (Fill / Fit) on hover
- Camera and microphone selection (persisted in `localStorage`)
- Local camera mirror and optional self-view hide
- Clean disconnect handling when someone leaves (no frozen frames)
- Ngrok-ready for testing across two devices

## Stack

- Vite + TypeScript
- PeerJS (public PeerServer)
- WebRTC / `getUserMedia`

## Requirements

- Node.js 18+
- Chrome, Firefox, or Safari
- [Ngrok](https://ngrok.com/) to test outside localhost

## Setup

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173` with `host: true` and Ngrok hosts allowed in Vite.

## Testing with Ngrok

```bash
npm run dev
# in another terminal
ngrok http 5173
```

1. Open the Ngrok HTTPS URL in **Browser A**
2. Click **New meeting** → allow camera/mic → **Copy link**
3. On **Browser B** (or another device), paste the link or use **Join** with the room code
4. Click **Join now**

> Use two browser profiles or an incognito window to simulate two users on the same machine.  
> HTTPS is required for media access outside `localhost`.

## Scripts

```bash
npm run dev      # development
npm run build    # typecheck + production build
npm run preview  # preview production build
```

## Project structure

```
videochat/
  inspiration-layout/   # original visual reference
  src/
    peer/               # PeerJS, media, call session
    ui/                 # Meet shell, layout, settings
    utils/              # roomId, clipboard
```

## Security

- Room IDs validated with `^vc-[a-z0-9]{8}$`
- `getUserMedia` only after explicit user action
- No secrets in the codebase

## Notes

- Uses the public PeerJS PeerServer (fine for demos; use your own PeerServer in production).
- Layout and device preferences are stored in the browser `localStorage`.
