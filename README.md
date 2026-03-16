# ReplyIQ — AI Email Replies for Gmail

A Chrome extension that adds an **AI Reply** button to Gmail's compose toolbar. Reads the last 3 emails in the thread, generates a context-aware reply using Google Gemini, and injects it directly into the compose box.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **One-click AI replies** — Button injected directly into Gmail's compose toolbar
- **3 tone options** — Professional, Casual, or Direct
- **Thread-aware** — Reads the last 3 emails for full context
- **Language matching** — Replies in the same language as the thread
- **Freemium model** — 10 free replies/month, then $9/month via ExtensionPay
- **Privacy-first** — Your emails are sent only to Google's Gemini API; nothing is stored on our servers

## Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key (free tier available)
3. Copy the key

### 2. Install the Extension

**From source (development):**

1. Clone this repo: `git clone https://github.com/dgiannico24/replyiq.git`
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `replyiq` folder
5. Click the ReplyIQ icon in the toolbar → paste your Gemini API key → Save

**From Chrome Web Store:**

Coming soon.

### 3. ExtensionPay Setup (for monetization)

1. Register at [extensionpay.com](https://extensionpay.com)
2. Create an extension entry and get your extension ID
3. Update `EXTENSION_ID` in `background.js`
4. Replace `lib/ExtPay.js` with the [real ExtPay library](https://github.com/Glench/ExtPay/blob/master/dist/ExtPay.js)
5. Set up a $9/month subscription plan in the ExtensionPay dashboard

## Usage

1. Open Gmail and start replying to or composing within a thread
2. Click the **AI Reply** button in the compose toolbar
3. Choose your tone: 💼 Professional, 😊 Casual, or ⚡ Direct
4. The AI-generated reply appears in the compose body
5. Review, edit if needed, and send

## Architecture

```
replyiq/
├── manifest.json          # Manifest V3 config
├── background.js          # Service worker: Gemini API, usage tracking, ExtensionPay
├── content.js             # Gmail DOM injection, thread extraction, UI
├── content.css            # Toolbar button & dropdown styles
├── popup.html             # Settings popup (API key, subscription)
├── popup.js               # Popup logic
├── lib/
│   └── ExtPay.js          # ExtensionPay library (stub — replace before publishing)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### How it Works

1. **Content script** (`content.js`) observes Gmail's DOM via MutationObserver + polling
2. When a compose window is detected, the AI Reply button is injected into the toolbar
3. On click, the script extracts the last 3 emails from the thread DOM
4. Thread data is sent to the **background service worker** via `chrome.runtime.sendMessage`
5. The service worker checks usage limits, calls the Gemini API, and returns the reply
6. The content script injects the reply into the contenteditable compose body

## Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Gemini API Key | Popup → Settings | — (required) |
| Free monthly limit | `background.js` → `FREE_MONTHLY_LIMIT` | 10 |
| Gemini model | `background.js` → `GEMINI_MODEL` | `gemini-2.0-flash` |
| ExtensionPay ID | `background.js` → `EXTENSION_ID` | `replyiq` |

## Privacy Policy

- **No data collection**: ReplyIQ does not collect, store, or transmit your email data to any server other than Google's Gemini API.
- **API key storage**: Your Gemini API key is stored locally in Chrome's `sync` storage.
- **Usage tracking**: Reply count is stored locally in Chrome's `local` storage.
- **ExtensionPay**: Handles subscription payments via Stripe. Only collects email for payment purposes.

## License

MIT — see [LICENSE](LICENSE).
