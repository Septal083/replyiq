/*  ReplyIQ — Gmail Content Script
 *  Observes the DOM for compose windows, injects the AI Reply button
 *  into the compose toolbar, and handles the reply generation flow.
 */

(() => {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────
  const BUTTON_ID_PREFIX = 'replyiq-btn-';
  const POLL_INTERVAL = 1500; // ms between DOM scans
  let buttonCounter = 0;

  // ── Tone options ───────────────────────────────────────────────
  const TONES = [
    { id: 'professional', label: '💼 Professional', desc: 'Polished & formal' },
    { id: 'casual', label: '😊 Casual', desc: 'Friendly & warm' },
    { id: 'direct', label: '⚡ Direct', desc: 'Concise & to the point' }
  ];

  // ── DOM Helpers ────────────────────────────────────────────────

  function createReplyIQButton(composeEl) {
    const id = BUTTON_ID_PREFIX + (++buttonCounter);

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'replyiq-wrapper';

    // Main button
    const btn = document.createElement('button');
    btn.className = 'replyiq-btn';
    btn.title = 'Generate AI reply with ReplyIQ';
    btn.innerHTML = `
      <svg class="replyiq-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <span class="replyiq-label">AI Reply</span>
    `;

    // Tone dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'replyiq-dropdown';
    dropdown.style.display = 'none';

    TONES.forEach(tone => {
      const option = document.createElement('button');
      option.className = 'replyiq-tone-option';
      option.dataset.tone = tone.id;
      option.innerHTML = `<span class="replyiq-tone-label">${tone.label}</span><span class="replyiq-tone-desc">${tone.desc}</span>`;
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = 'none';
        handleGenerate(composeEl, tone.id, btn);
      });
      dropdown.appendChild(option);
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  }

  // ── Thread Extraction ──────────────────────────────────────────

  function extractThreadEmails() {
    const emails = [];

    // Gmail renders each message in the thread as a container with role or class patterns.
    // Strategy: look for expanded message containers
    const messageContainers = document.querySelectorAll(
      'div[data-message-id], div.adn.ads, div[class*="gs"]'
    );

    // Fallback: grab all visible message bodies
    const messageBodies = document.querySelectorAll('div.a3s.aiL, div.a3s');

    if (messageBodies.length > 0) {
      // Try to get sender + date from sibling/parent elements
      messageBodies.forEach((body, idx) => {
        const messageRoot = body.closest('div[data-message-id]') || body.closest('.gs') || body.parentElement;

        // Extract sender
        let from = 'Unknown';
        const senderEl = messageRoot?.querySelector('span.gD, span[email], h3.iw span[email]');
        if (senderEl) {
          from = senderEl.getAttribute('email') || senderEl.getAttribute('name') || senderEl.textContent?.trim() || 'Unknown';
        }

        // Extract date
        let date = '';
        const dateEl = messageRoot?.querySelector('span.g3, span[title]');
        if (dateEl) {
          date = dateEl.getAttribute('title') || dateEl.textContent?.trim() || '';
        }

        // Extract body text
        const bodyText = body.innerText?.trim() || '';
        if (bodyText.length > 0) {
          emails.push({ from, date, body: bodyText.substring(0, 3000) }); // Cap per email
        }
      });
    }

    // Return last 3 emails (most recent context)
    return emails.slice(-3);
  }

  // ── Reply Generation ───────────────────────────────────────────

  async function handleGenerate(composeEl, tone, btn) {
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="replyiq-spinner"></span><span class="replyiq-label">Generating…</span>`;

    try {
      // Extract thread
      const threadEmails = extractThreadEmails();
      if (threadEmails.length === 0) {
        showNotification(composeEl, 'Could not find any emails in this thread. Try opening the conversation first.', 'error');
        return;
      }

      // Send to background
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_REPLY',
        threadEmails,
        tone
      });

      if (response.error === 'limit_reached') {
        showUpgradePrompt(composeEl);
        return;
      }
      if (response.error === 'no_api_key') {
        showNotification(composeEl, 'Please set your Gemini API key — click the ReplyIQ icon in the toolbar.', 'warning');
        return;
      }
      if (response.error) {
        showNotification(composeEl, `Error: ${response.message}`, 'error');
        return;
      }

      // Inject reply into compose body
      injectReply(composeEl, response.reply);

      // Show remaining
      if (!response.isPaid && response.remaining !== Infinity) {
        showNotification(composeEl, `Reply generated! ${response.remaining} free replies left this month.`, 'success');
      }

    } catch (e) {
      console.error('ReplyIQ error:', e);
      showNotification(composeEl, 'Something went wrong. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }

  function injectReply(composeEl, replyText) {
    // Gmail compose body is a contenteditable div with role="textbox" or class "Am"
    const composeBody = composeEl.querySelector(
      'div[role="textbox"][aria-label*="Body"], div[role="textbox"][g_editable="true"], div.Am.Al.editable, div[contenteditable="true"].editable, div[aria-label*="Message Body"]'
    );

    if (!composeBody) {
      // Broader fallback
      const fallback = composeEl.querySelector('div[contenteditable="true"]');
      if (fallback) {
        insertTextIntoEditable(fallback, replyText);
        return;
      }
      showNotification(composeEl, 'Could not find the compose area. Please paste manually.', 'warning');
      navigator.clipboard.writeText(replyText).catch(() => {});
      return;
    }

    insertTextIntoEditable(composeBody, replyText);
  }

  function insertTextIntoEditable(el, text) {
    // Convert plain text to HTML (preserve line breaks)
    const html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    // Insert at the beginning of the compose body (before quoted text)
    const existingContent = el.innerHTML;
    const quoteMarker = existingContent.indexOf('<div class="gmail_quote');
    if (quoteMarker > -1) {
      el.innerHTML = `<div>${html}</div><br>` + existingContent.substring(quoteMarker);
    } else {
      el.innerHTML = `<div>${html}</div><br>` + existingContent;
    }

    // Trigger input event so Gmail registers the change
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── Notifications ──────────────────────────────────────────────

  function showNotification(composeEl, message, type = 'info') {
    // Remove any existing notification
    const existing = composeEl.querySelector('.replyiq-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `replyiq-notification replyiq-notification--${type}`;
    notif.textContent = message;

    const toolbar = composeEl.querySelector('.btC, .bAK, .aDh') || composeEl;
    toolbar.parentElement?.insertBefore(notif, toolbar.nextSibling);

    setTimeout(() => notif.remove(), 6000);
  }

  function showUpgradePrompt(composeEl) {
    const existing = composeEl.querySelector('.replyiq-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'replyiq-notification replyiq-notification--upgrade';
    notif.innerHTML = `
      <span>You've used all 10 free replies this month.</span>
      <button class="replyiq-upgrade-btn" id="replyiq-upgrade-cta">Upgrade to Pro — $9/mo</button>
    `;

    const toolbar = composeEl.querySelector('.btC, .bAK, .aDh') || composeEl;
    toolbar.parentElement?.insertBefore(notif, toolbar.nextSibling);

    notif.querySelector('#replyiq-upgrade-cta').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
    });

    setTimeout(() => notif.remove(), 15000);
  }

  // ── Compose Window Observer ────────────────────────────────────

  function injectButtons() {
    // Gmail compose toolbars: the send button area has class "btC" or the toolbar row "aDh"
    // We look for compose windows that don't already have our button
    const composeWindows = document.querySelectorAll(
      'div.M9, div.AD, div[role="dialog"] .a3s, div.nH .iN, div.nH .AD, table.IZ'
    );

    // More reliable: find all Send button containers
    const sendBtns = document.querySelectorAll('div[role="button"][data-tooltip*="Send"], div.T-I.J-J5-Ji[data-tooltip*="Send"]');

    sendBtns.forEach(sendBtn => {
      const composeEl = sendBtn.closest('div.M9, div.AD, div[role="dialog"], div.nH .iN, table.iS') ||
                        sendBtn.closest('tr')?.closest('div[class]') ||
                        sendBtn.closest('div');

      if (!composeEl) return;
      if (composeEl.querySelector('.replyiq-wrapper')) return; // Already injected

      // Find the toolbar row (parent of send button)
      const toolbar = sendBtn.closest('.btC') || sendBtn.closest('tr') || sendBtn.parentElement;
      if (!toolbar) return;

      const button = createReplyIQButton(composeEl);

      // Insert after the send button area
      toolbar.style.display = 'flex';
      toolbar.style.alignItems = 'center';
      toolbar.appendChild(button);
    });
  }

  // ── Initialize ─────────────────────────────────────────────────

  // Poll for new compose windows (Gmail is a SPA with dynamic DOM)
  setInterval(injectButtons, POLL_INTERVAL);

  // Also observe DOM mutations for faster detection
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    if (shouldCheck) {
      // Small debounce
      clearTimeout(observer._debounce);
      observer._debounce = setTimeout(injectButtons, 300);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan
  setTimeout(injectButtons, 2000);

  console.log('ReplyIQ content script loaded.');
})();
