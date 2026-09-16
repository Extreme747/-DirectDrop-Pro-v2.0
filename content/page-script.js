// DirectDrop Page Context Script (runs in MAIN world)
(function () {
  'use strict';

  // State to track user interaction
  let lastUserClickTime = 0;
  let lastClickedElement = null;

  document.addEventListener('click', (e) => {
    lastUserClickTime = Date.now();
    lastClickedElement = e.target;
  }, true);

  // 1. Hook window.open to intercept aggressive popups and ad-tabs
  const originalWindowOpen = window.open;
  window.open = function (url, target, features) {
    const timeSinceClick = Date.now() - lastUserClickTime;
    const isDirectUserAction = timeSinceClick < 350;

    // Check if the URL looks like an ad or tracking link
    const adKeywords = [
      'ad', 'pop', 'track', 'banner', 'click', 'traffic', 'revenue', 'affiliate', 
      'syndication', 'doubleclick', 'bet', 'casino', 'cleaner', 'vpn', 'dating'
    ];

    let urlStr = String(url || '').toLowerCase();
    let isSuspiciousAdUrl = !urlStr || urlStr === 'about:blank' || adKeywords.some(kw => urlStr.includes(kw));

    // If opened without a click or clicked element was NOT an explicit link pointing to this URL
    if (!isDirectUserAction || isSuspiciousAdUrl) {
      console.warn('[DirectDrop] 🛡️ Blocked suspicious popup:', url);
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'popup_blocked', url: url || 'about:blank' }
      }));
      // Return a dummy window proxy to prevent errors in caller scripts
      return {
        closed: false,
        close: function () {},
        focus: function () {},
        blur: function () {},
        location: { href: '' }
      };
    }

    return originalWindowOpen.apply(this, arguments);
  };

  // 2. Prevent beforeunload traps ("Are you sure you want to leave?")
  window.addEventListener('beforeunload', (e) => {
    // Suppress spam alert dialogs
    delete e.returnValue;
  }, true);

  // 3. Fast-Forward Countdown Timers
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;

  // Track active countdown timers
  window.setTimeout = function (callback, delay, ...args) {
    let speedDelay = delay;
    // If the delay is between 800ms and 60000ms (typical 1s - 60s countdowns)
    if (typeof delay === 'number' && delay >= 800 && delay <= 60000) {
      // Accelerate timer by 20x for quick countdown bypass
      speedDelay = Math.max(10, Math.floor(delay / 20));
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'timer_accelerated', originalDelay: delay, newDelay: speedDelay }
      }));
    }
    return originalSetTimeout(callback, speedDelay, ...args);
  };

  window.setInterval = function (callback, delay, ...args) {
    let speedDelay = delay;
    // Typical 1-second countdown intervals
    if (typeof delay === 'number' && delay >= 800 && delay <= 2000) {
      // Shrink 1s tick down to 50ms so a 10s wait finishes in 0.5s!
      speedDelay = 50;
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'timer_accelerated', originalDelay: delay, newDelay: speedDelay }
      }));
    }
    return originalSetInterval(callback, speedDelay, ...args);
  };

  console.log('[DirectDrop] 🚀 Main-world protections active (Popup Interceptor & Timer Accelerator ready)');
})();
