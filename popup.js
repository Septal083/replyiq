/*  ReplyIQ — Popup Script
 *  Manages API key storage, usage display, and subscription status.
 */

const $ = (sel) => document.querySelector(sel);

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Load saved settings ───────────────────────────────────────────
async function loadSettings() {
  const { gemini_api_key } = await chrome.storage.sync.get('gemini_api_key');
  if (gemini_api_key) {
    $('#apiKey').value = gemini_api_key;
  }
}

// ── Save API key ──────────────────────────────────────────────────
$('#saveBtn').addEventListener('click', async () => {
  const key = $('#apiKey').value.trim();
  if (!key) {
    showToast('Please enter an API key');
    return;
  }
  if (!key.startsWith('AIza')) {
    showToast('That doesn\'t look like a valid Gemini key');
    return;
  }
  await chrome.storage.sync.set({ gemini_api_key: key });
  showToast('Settings saved ✓');
});

// ── Load usage & subscription info ────────────────────────────────
async function loadStatus() {
  try {
    // Check paid status
    const paidStatus = await chrome.runtime.sendMessage({ type: 'GET_PAID_STATUS' });
    const usage = await chrome.runtime.sendMessage({ type: 'CHECK_USAGE' });

    if (paidStatus?.paid) {
      $('#planName').textContent = 'Pro Plan';
      $('#planDetail').textContent = 'Unlimited AI replies';
      $('#planBadge').textContent = 'PRO';
      $('#planBadge').className = 'badge badge-pro';
      $('#upgradeBtn').textContent = 'Manage Subscription';
    } else {
      $('#planName').textContent = 'Free Plan';
      const remaining = usage?.remaining ?? '…';
      $('#planDetail').textContent = `${remaining} replies remaining this month`;
      $('#planBadge').textContent = 'FREE';
      $('#planBadge').className = 'badge badge-free';
      $('#upgradeBtn').textContent = 'Upgrade to Pro — $9/mo';
    }
  } catch (e) {
    console.warn('Status check failed:', e);
    $('#planDetail').textContent = 'Could not check status';
  }
}

// ── Upgrade ───────────────────────────────────────────────────────
$('#upgradeBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
});

// ── Init ──────────────────────────────────────────────────────────
loadSettings();
loadStatus();
