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

  // Legitimate download & cloud host whitelist (NEVER BLOCK THESE)
  const DOWNLOAD_WHITELIST_REGEX = /(hubcloud|gamerxyt|drive\.google|mediafire|mega\.nz|pixeldrain|gofile|1fichier|dropbox|fsl|pixel|buzz|telegram|fastdl|racaty|streamwish|filepress|\.mkv|\.mp4|\.zip|\.rar|\.7z|\.exe|\.apk|\.iso|\/download|\/drive\/|\/file\/)/i;

  // Strict ad networks and malware/betting domains only (never use short substrings like 'ad' or 'click')
  const STRICT_AD_PATTERNS = /(adsterra|propellerads|clickadu|popads|popcash|exoclick|trafficjunky|ad-maven|hilltopads|richpush|juicyads|monetag|1xbet|bet365|parimatch|melbet|mostbet|stake\.com|casino|lucky-wheel|cleaner-update|system-infected)/i;

  // 1. Hook window.open with smart intent detection
  const originalWindowOpen = window.open;
  window.open = function (url, target, features) {
    const urlStr = String(url || '').toLowerCase();
    const timeSinceClick = Date.now() - lastUserClickTime;

    // Check if clicked element was a download or server button
    const clickedText = (lastClickedElement?.innerText || lastClickedElement?.value || '').toLowerCase();
    const clickedClass = (lastClickedElement?.className || '').toString().toLowerCase();
    const isDownloadButtonClick = /download|server|fsl|pixel|buzz|cloud|stream|episode|get link/i.test(clickedText + ' ' + clickedClass);

    // 1. If it's a known download host or file, ALWAYS ALLOW
    if (DOWNLOAD_WHITELIST_REGEX.test(urlStr)) {
      console.log('[DirectDrop] ✅ Allowed verified download URL:', url);
      return originalWindowOpen.apply(this, arguments);
    }

    // 2. If user clicked within the last 6 seconds (generous for async AJAX token generation)
    const isUserTriggered = timeSinceClick < 6000 || isDownloadButtonClick;

    // 3. Only block if it is explicitly an ad domain OR opened completely unprompted with suspicious URL
    const isExplicitAd = STRICT_AD_PATTERNS.test(urlStr);
    const isBlankOrFake = (!urlStr || urlStr === 'about:blank') && !isUserTriggered;

    if (isExplicitAd || isBlankOrFake || (!isUserTriggered && urlStr.includes('pop'))) {
      console.warn('[DirectDrop] 🛡️ Blocked deceptive popup:', url);
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'popup_blocked', url: url || 'about:blank' }
      }));
      // Return a dummy window proxy
      return {
        closed: false,
        close: function () {},
        focus: function () {},
        blur: function () {},
        location: { href: '' }
      };
    }

    // Otherwise, allow the user's tab/window to open safely
    return originalWindowOpen.apply(this, arguments);
  };

  // 2. Prevent beforeunload traps ("Are you sure you want to leave?")
  window.addEventListener('beforeunload', (e) => {
    delete e.returnValue;
  }, true);

  // 3. Smart Countdown Fast-Forwarder (Only accelerates VISUAL timers, not backend auth tokens)
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;

  function hasVisualCountdown() {
    return !!document.querySelector('[id*="timer"], [class*="timer"], [id*="countdown"], [class*="countdown"], [id*="count"], .btn-step');
  }

  window.setTimeout = function (callback, delay, ...args) {
    let speedDelay = delay;
    // Only speed up if there is an active visual countdown element and delay is >= 1000ms
    if (typeof delay === 'number' && delay >= 1000 && delay <= 60000 && hasVisualCountdown()) {
      // Safe acceleration (5x faster) so server session/anti-bot checks don't fail
      speedDelay = Math.max(150, Math.floor(delay / 5));
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'timer_accelerated', originalDelay: delay, newDelay: speedDelay }
      }));
    }
    return originalSetTimeout(callback, speedDelay, ...args);
  };

  window.setInterval = function (callback, delay, ...args) {
    let speedDelay = delay;
    // Typical 1-second visual countdown tick
    if (typeof delay === 'number' && delay >= 800 && delay <= 2000 && hasVisualCountdown()) {
      // 200ms tick instead of 1000ms (5x fast forward without choking browser)
      speedDelay = 200;
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'timer_accelerated', originalDelay: delay, newDelay: speedDelay }
      }));
    }
    return originalSetInterval(callback, speedDelay, ...args);
  };

  console.log('[DirectDrop] 🚀 Precision Page Protections Active (Whitelists & Smart Popup Filter Ready)');
})();
