/*  ReplyIQ — Gmail Content Script
 *  Observes the DOM for compose windows, injects the AI Reply button
 *  into the compose toolbar, and handles the reply generation flow.
 */

(() => {
  'use strict';

  const POLL_INTERVAL = 1500;
  let buttonCounter = 0;

  // ── Tone options ───────────────────────────────────────────────
  const TONES = [
    { id: 'professional', label: '\u{1F4BC} Professional', desc: 'Polished & formal' },
    { id: 'casual', label: '\u{1F60A} Casual', desc: 'Friendly & warm' },
    { id: 'direct', label: '\u26A1 Direct', desc: 'Concise & to the point' }
  ];

  // ── DOM Helpers ────────────────────────────────────────────────

  function createReplyIQButton(composeEl) {
    const id = 'replyiq-btn-' + (++buttonCounter);

    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'replyiq-wrapper';

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

    // Gmail message bodies use class "a3s" (with optional "aiL")
    const messageBodies = document.querySelectorAll('div.a3s.aiL, div.a3s');

    if (messageBodies.length > 0) {
      messageBodies.forEach((body) => {
        const messageRoot = body.closest('[data-message-id]') || body.closest('.gs') || body.parentElement?.parentElement?.parentElement;

        let from = 'Unknown';
        const senderEl = messageRoot?.querySelector('span[email], span.gD');
        if (senderEl) {
          from = senderEl.getAttribute('email') || senderEl.textContent?.trim() || 'Unknown';
        }

        let date = '';
        const dateEl = messageRoot?.querySelector('span[title]');
        if (dateEl) {
          date = dateEl.getAttribute('title') || dateEl.textContent?.trim() || '';
        }

        const bodyText = body.innerText?.trim() || '';
        if (bodyText.length > 0) {
          emails.push({ from, date, body: bodyText.substring(0, 3000) });
        }
      });
    }

    return emails.slice(-3);
  }

  // ── Reply Generation ───────────────────────────────────────────

  async function handleGenerate(composeEl, tone, btn) {
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="replyiq-spinner"></span><span class="replyiq-label">Generating\u2026</span>`;

    try {
      const threadEmails = extractThreadEmails();
      if (threadEmails.length === 0) {
        showNotification(composeEl, 'Could not find any emails in this thread. Try opening the conversation first.', 'error');
        return;
      }

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
        showNotification(composeEl, 'Please set your Gemini API key \u2014 click the ReplyIQ icon in the toolbar.', 'warning');
        return;
      }
      if (response.error) {
        showNotification(composeEl, 'Error: ' + response.message, 'error');
        return;
      }

      injectReply(composeEl, response.reply);

      if (!response.isPaid && response.remaining !== Infinity) {
        showNotification(composeEl, 'Reply generated! ' + response.remaining + ' free replies left this month.', 'success');
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
    // Primary: aria-label based (most stable across Gmail updates)
    let composeBody = composeEl.querySelector('div[aria-label="Message Body"][contenteditable="true"]');

    // Fallback 1: g_editable attribute
    if (!composeBody) {
      composeBody = composeEl.querySelector('div[g_editable="true"]');
    }
    // Fallback 2: class-based
    if (!composeBody) {
      composeBody = composeEl.querySelector('div.Am.Al.editable');
    }
    // Fallback 3: role + contenteditable
    if (!composeBody) {
      composeBody = composeEl.querySelector('div[role="textbox"][contenteditable="true"]');
    }

    if (!composeBody) {
      showNotification(composeEl, 'Could not find the compose area. Reply copied to clipboard.', 'warning');
      navigator.clipboard.writeText(replyText).catch(() => {});
      return;
    }

    insertTextIntoEditable(composeBody, replyText);
  }

  function insertTextIntoEditable(el, text) {
    const html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    const existingContent = el.innerHTML;
    const quoteMarker = existingContent.indexOf('<div class="gmail_quote');
    if (quoteMarker > -1) {
      el.innerHTML = '<div>' + html + '</div><br>' + existingContent.substring(quoteMarker);
    } else {
      el.innerHTML = '<div>' + html + '</div><br>' + existingContent;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── Notifications ──────────────────────────────────────────────

  function showNotification(composeEl, message, type) {
    type = type || 'info';
    const existing = composeEl.querySelector('.replyiq-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'replyiq-notification replyiq-notification--' + type;
    notif.textContent = message;

    // Insert notification near the toolbar
    const toolbar = composeEl.querySelector('.btC') || composeEl.querySelector('[aria-label*="Send"]')?.parentElement || composeEl;
    if (toolbar.parentElement) {
      toolbar.parentElement.insertBefore(notif, toolbar.nextSibling);
    } else {
      composeEl.appendChild(notif);
    }

    setTimeout(function() { notif.remove(); }, 6000);
  }

  function showUpgradePrompt(composeEl) {
    const existing = composeEl.querySelector('.replyiq-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'replyiq-notification replyiq-notification--upgrade';
    notif.innerHTML = '<span>You\'ve used all 10 free replies this month.</span><button class="replyiq-upgrade-btn" id="replyiq-upgrade-cta">Upgrade to Pro \u2014 $9/mo</button>';

    const toolbar = composeEl.querySelector('.btC') || composeEl.querySelector('[aria-label*="Send"]')?.parentElement || composeEl;
    if (toolbar.parentElement) {
      toolbar.parentElement.insertBefore(notif, toolbar.nextSibling);
    } else {
      composeEl.appendChild(notif);
    }

    notif.querySelector('#replyiq-upgrade-cta').addEventListener('click', function() {
      chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
    });

    setTimeout(function() { notif.remove(); }, 15000);
  }

  // ── Compose Window Detection & Button Injection ────────────────

  function findSendButtons() {
    // Strategy 1: aria-label contains "Send" (most reliable)
    const byAria = document.querySelectorAll('div[role="button"][aria-label*="Send"]');
    const results = [];

    byAria.forEach(function(el) {
      const label = el.getAttribute('aria-label') || '';
      // Match "Send (Ctrl-Enter)" but not "Send + Schedule" or "More send options"
      if (label.match(/^Send\s/i) || label === 'Send') {
        results.push(el);
      }
    });

    // Strategy 2: data-tooltip contains "Send"
    if (results.length === 0) {
      const byTooltip = document.querySelectorAll('div[role="button"][data-tooltip*="Send"]');
      byTooltip.forEach(function(el) {
        const tip = el.getAttribute('data-tooltip') || '';
        if (tip.match(/^Send\s/i) || tip === 'Send') {
          results.push(el);
        }
      });
    }

    // Strategy 3: class-based (aoO is Gmail's Send button class)
    if (results.length === 0) {
      document.querySelectorAll('div.T-I.J-J5-Ji.aoO').forEach(function(el) {
        results.push(el);
      });
    }

    return results;
  }

  function getComposeContainer(sendBtn) {
    // Walk up to find the compose window container
    // Try known compose container classes first
    let container = sendBtn.closest('.M9')        // compose modal shell
                 || sendBtn.closest('.AD')         // compose form
                 || sendBtn.closest('.dw')         // outermost compose container
                 || sendBtn.closest('.nH.Hd')      // compose window frame
                 || sendBtn.closest('div[role="dialog"]');

    // Fallback: walk up to find a container that has a contenteditable area
    if (!container) {
      let el = sendBtn.parentElement;
      for (let i = 0; i < 15 && el; i++) {
        if (el.querySelector('div[aria-label="Message Body"], div[g_editable="true"], div.Am.Al.editable')) {
          container = el;
          break;
        }
        el = el.parentElement;
      }
    }

    return container;
  }

  function injectButtons() {
    const sendBtns = findSendButtons();

    sendBtns.forEach(function(sendBtn) {
      const composeEl = getComposeContainer(sendBtn);
      if (!composeEl) return;
      if (composeEl.querySelector('.replyiq-wrapper')) return; // Already injected

      // Find the toolbar row: parent with class "btC" or direct parent of Send button
      const toolbar = sendBtn.closest('.btC') || sendBtn.parentElement;
      if (!toolbar) return;

      const button = createReplyIQButton(composeEl);

      // Make sure toolbar is flex so our button sits inline
      const computedDisplay = window.getComputedStyle(toolbar).display;
      if (computedDisplay !== 'flex' && computedDisplay !== 'inline-flex') {
        toolbar.style.display = 'flex';
        toolbar.style.alignItems = 'center';
      }

      toolbar.appendChild(button);

      console.log('ReplyIQ: button injected into compose window');
    });
  }

  // ── Initialize ─────────────────────────────────────────────────

  // Poll for new compose windows
  setInterval(injectButtons, POLL_INTERVAL);

  // MutationObserver for faster detection
  let debounceTimer = null;
  const observer = new MutationObserver(function(mutations) {
    let shouldCheck = false;
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    if (shouldCheck) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(injectButtons, 300);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan after Gmail finishes loading
  setTimeout(injectButtons, 2000);
  setTimeout(injectButtons, 4000); // Second pass in case Gmail was slow

  console.log('ReplyIQ content script loaded.');
})();
