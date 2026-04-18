# PSP Assist Web — WhatsApp Web Clone

A pixel-faithful WhatsApp Web UI for a Patient Support Program (PSP) AI chatbot.

## Quick start

```bash
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL to your backend URL

npm install
npm run dev
```

Open http://localhost:5173

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL of the PSP backend API (e.g. `http://localhost:8000`) |

## Features

- Full WhatsApp Web layout, colors, typography, and bubble shapes
- JWT auth (register / login with email + password)
- Session (chat) list with create, rename, delete
- Real-time AI responses via Server-Sent Events streaming
- Markdown rendering inside AI bubbles (react-markdown + remark-gfm)
- Optimistic UI — user message appears instantly, AI bubble streams token by token
- Abort/cancel mid-stream (stop button replaces send while streaming)
- Mobile responsive: sidebar ↔ chat pane toggle

## Streaming architecture

`useStreamChat.js` uses `fetch` + `ReadableStream` (not `EventSource`) so we can:
- Send a `POST` body (`session_id`, `message`)
- Include the `Authorization: Bearer <token>` header
- Parse `data: <json>` SSE lines and accumulate tokens into the AI bubble

## Disclaimer

This is a visual clone of WhatsApp Web, built for the PSP direct-web channel.
Actual WhatsApp delivery (for patients on their phones) is handled separately
via Twilio's WhatsApp Business API. This app is the browser-based interface
for the same AI assistant, styled familiarly to reduce friction.
