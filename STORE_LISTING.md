# Chrome Web Store Listing — ReplyIQ

---

## Extension Name
ReplyIQ — AI Email Replies for Gmail

## Short Description (132 chars max)
Generate smart AI email replies in Gmail with one click. Choose Professional, Casual, or Direct tone. Powered by Google Gemini.

---

## Detailed Description

**Stop staring at blank reply boxes.** ReplyIQ adds a smart AI Reply button directly into Gmail's compose toolbar. One click, pick your tone, and get a context-aware reply draft in seconds.

### How it Works
1. Open any email thread in Gmail and hit Reply
2. Click the **AI Reply** button in the compose toolbar
3. Choose your tone — Professional, Casual, or Direct
4. Review the generated reply, tweak if needed, and send

### Why ReplyIQ?

**🧠 Thread-Aware Intelligence**
ReplyIQ reads the last 3 emails in the conversation, not just the latest message. It understands the full context — who said what, what questions were asked, and what needs to be addressed.

**🎯 3 Tone Options**
- **💼 Professional** — Polished and formal. Perfect for clients, executives, and external communications.
- **😊 Casual** — Warm and friendly. Great for teammates and people you know well.
- **⚡ Direct** — Concise and straight to the point. No fluff, just substance.

**🌍 Multilingual**
Replies match the language of your thread automatically. Italian thread? Italian reply. German thread? German reply.

**🔒 Privacy-First**
Your emails are sent directly from your browser to Google's Gemini API — they never touch our servers. Your API key stays in Chrome's encrypted local storage. We don't collect, log, or store anything.

**⚡ Built on Gemini 2.0 Flash**
Lightning-fast replies powered by Google's latest AI model. Bring your own API key from Google AI Studio (free tier available).

### Pricing

✅ **Free Plan** — 10 AI replies per month. No credit card required.
🚀 **Pro Plan** — $9/month for unlimited replies. Cancel anytime.

### Getting Started
1. Install ReplyIQ
2. Click the extension icon → enter your free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
3. Open Gmail and start replying with AI

---

## Category
Productivity

## Language
English

## Tags / Keywords
gmail, ai reply, email assistant, gemini, ai email, smart reply, email productivity, compose, tone, professional email

---

## Screenshots Descriptions

**Screenshot 1: AI Reply Button in Gmail Toolbar**
Caption: "The AI Reply button sits right in Gmail's compose toolbar — one click away."

**Screenshot 2: Tone Selection Dropdown**
Caption: "Choose Professional, Casual, or Direct tone for every reply."

**Screenshot 3: Generated Reply in Compose Box**
Caption: "Context-aware AI reply injected directly into your email. Review, edit, and send."

**Screenshot 4: Settings Popup**
Caption: "Simple setup — just paste your free Gemini API key and you're ready."

**Screenshot 5: Upgrade Prompt**
Caption: "10 free replies per month. Upgrade to Pro for unlimited."

---

## Permissions Justification (for Chrome Web Store review)

| Permission | Justification |
|------------|---------------|
| `storage` | Store the user's Gemini API key and monthly usage counter locally |
| `activeTab` | Access the active Gmail tab to inject the AI Reply button |
| `host_permissions: mail.google.com` | Required to run the content script that adds the toolbar button and reads thread emails from the Gmail DOM |
| `host_permissions: generativelanguage.googleapis.com` | Required for the background service worker to call the Google Gemini API |

---

## Support & Links

- **Support email:** dgiannico24@gmail.com
- **GitHub:** https://github.com/dgiannico24/replyiq
- **Privacy Policy:** https://github.com/dgiannico24/replyiq/blob/main/PRIVACY_POLICY.md
