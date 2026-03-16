# ReplyIQ — Privacy Policy

**Last updated:** March 16, 2026

## Overview

ReplyIQ is a Chrome extension that generates AI-powered email replies in Gmail. This privacy policy explains how ReplyIQ handles your data.

## Data Collection

### What we DO NOT collect
- We do **not** collect, store, or log your email content
- We do **not** track your browsing activity
- We do **not** sell or share any data with third parties
- We do **not** use analytics or tracking scripts

### What we DO process
- **Email thread content** (last 3 emails) is sent to Google's Gemini API to generate a reply. This data is processed by Google according to their [Gemini API Terms of Service](https://ai.google.dev/terms). The data is sent directly from your browser to Google — it never passes through our servers.
- **Gemini API key** is stored locally in your browser's `chrome.storage.sync` (encrypted by Chrome, synced across your Chrome instances).
- **Monthly reply count** is stored locally in `chrome.storage.local` to enforce the free tier limit.

### ExtensionPay (Subscription payments)
- If you upgrade to Pro, [ExtensionPay](https://extensionpay.com) collects your email address and processes payment via [Stripe](https://stripe.com). See ExtensionPay's [privacy policy](https://extensionpay.com/privacy) for details.

## Permissions Explained

| Permission | Why it's needed |
|------------|----------------|
| `storage` | Store your API key and usage count locally |
| `activeTab` | Access Gmail tab to inject the AI Reply button |
| `host_permissions: mail.google.com` | Inject content script into Gmail |
| `host_permissions: generativelanguage.googleapis.com` | Call the Gemini API from the service worker |

## Data Retention

All data is stored locally in your browser. Uninstalling the extension removes all stored data.

## Contact

For privacy questions, open an issue on our [GitHub repository](https://github.com/dgiannico24/replyiq).
