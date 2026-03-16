/*  ExtPay.js — Stub/loader for ExtensionPay
 *
 *  IMPORTANT: Replace this file with the real ExtPay library before publishing.
 *  Download from: https://github.com/Glench/ExtPay/blob/master/dist/ExtPay.js
 *
 *  This stub provides the same API surface so the extension loads without errors
 *  during development, but it does NOT process real payments.
 */

(function(root) {
  'use strict';

  function ExtPay(extensionId) {
    console.log(`[ExtPay stub] Initialized for "${extensionId}". Replace with real ExtPay.js before publishing.`);

    const listeners = { paid: [], trial: [] };

    return {
      startBackground() {
        console.log('[ExtPay stub] startBackground() called');
      },

      async getUser() {
        // In development, always return unpaid user
        return {
          paid: false,
          paidAt: null,
          email: null,
          installedAt: new Date(),
          trialStartedAt: null,
          plan: null,
          subscriptionStatus: null,
          subscriptionCancelAt: null
        };
      },

      async getPlans() {
        return [
          { unitAmountCents: 900, currency: 'usd', nickname: 'monthly', interval: 'month', intervalCount: 1 }
        ];
      },

      openPaymentPage(planNickname) {
        console.log(`[ExtPay stub] openPaymentPage("${planNickname || ''}")`);
        chrome.tabs.create({ url: 'https://extensionpay.com' });
      },

      openTrialPage(displayText) {
        console.log(`[ExtPay stub] openTrialPage("${displayText || ''}")`);
        chrome.tabs.create({ url: 'https://extensionpay.com' });
      },

      openLoginPage() {
        console.log('[ExtPay stub] openLoginPage()');
        chrome.tabs.create({ url: 'https://extensionpay.com' });
      },

      onPaid: {
        addListener(cb) { listeners.paid.push(cb); }
      },

      onTrialStarted: {
        addListener(cb) { listeners.trial.push(cb); }
      }
    };
  }

  // Make available globally (for importScripts in service workers)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtPay;
  } else {
    root.ExtPay = ExtPay;
  }

})(typeof self !== 'undefined' ? self : this);
