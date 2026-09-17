// DirectDrop Pro - Core Fast-Forward & Anti-Popup Engine (MAIN world)
(function () {
  'use strict';

  let lastUserClickTime = 0;
  let lastClickedElement = null;

  document.addEventListener('click', (e) => {
    lastUserClickTime = Date.now();
    lastClickedElement = e.target;
  }, true);

  // Whitelisted genuine download & file hosting servers
  const DOWNLOAD_WHITELIST_REGEX = /(hubcloud|gamerxyt|drive\.google|mediafire|mega\.nz|pixeldrain|gofile|1fichier|dropbox|fsl|pixel|buzz|telegram|fastdl|racaty|streamwish|filepress|\.mkv|\.mp4|\.zip|\.rar|\.7z|\.exe|\.apk|\.iso|\/download|\/drive\/|\/file\/)/i;

  // Known ad/spam networks
  const AD_NETWORK_REGEX = /(adsterra|propellerads|clickadu|popads|popcash|exoclick|trafficjunky|ad-maven|hilltopads|richpush|juicyads|monetag|1xbet|bet365|parimatch|melbet|mostbet|stake\.com|casino|lucky-wheel|cleaner-update|system-infected|onclick|track|syndication)/i;

  // 1. AGGRESSIVE POPUP KILLER
  const originalWindowOpen = window.open;
  window.open = function (url, target, features) {
    const urlStr = String(url || '').toLowerCase();
    const timeSinceClick = Date.now() - lastUserClickTime;

    // Check if clicked element was a genuine download button
    const clickedText = (lastClickedElement?.innerText || lastClickedElement?.value || '').toLowerCase();
    const clickedClass = (lastClickedElement?.className || '').toString().toLowerCase();
    const isDownloadButtonClick = /download|server|fsl|pixel|buzz|cloud|stream|episode|get link|continue/i.test(clickedText + ' ' + clickedClass);

    // 1. If it's a verified download host or media file -> ALWAYS ALLOW
    if (DOWNLOAD_WHITELIST_REGEX.test(urlStr)) {
      console.log('[DirectDrop] ✅ Allowed genuine download popup:', url);
      return originalWindowOpen.apply(this, arguments);
    }

    // 2. If it's an explicit ad network or opened without clicking a download button -> BLOCK
    const isExplicitAd = AD_NETWORK_REGEX.test(urlStr);
    const isDirectUserIntent = timeSinceClick < 1500 && isDownloadButtonClick;

    if (isExplicitAd || !isDirectUserIntent || !urlStr || urlStr === 'about:blank') {
      console.warn('[DirectDrop] 🛡️ Neutralized useless popup ad:', url);
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'popup_blocked', url: url || 'about:blank' }
      }));
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

  // 2. Prevent beforeunload traps
  window.addEventListener('beforeunload', (e) => {
    delete e.returnValue;
  }, true);

  // 3. FAST-FORWARD WAIT TIMERS (20x Acceleration & 40ms interval ticks)
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;

  window.setTimeout = function (callback, delay, ...args) {
    let speedDelay = delay;
    // Accelerate any 1s - 60s countdown timer by 20x
    if (typeof delay === 'number' && delay >= 800 && delay <= 60000) {
      speedDelay = Math.max(30, Math.floor(delay / 20));
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'timer_accelerated', originalDelay: delay, newDelay: speedDelay }
      }));
    }
    return originalSetTimeout(callback, speedDelay, ...args);
  };

  window.setInterval = function (callback, delay, ...args) {
    let speedDelay = delay;
    // Shrink standard 1-second countdown intervals down to 40ms!
    if (typeof delay === 'number' && delay >= 700 && delay <= 2000) {
      speedDelay = 40;
      window.dispatchEvent(new CustomEvent('__directdrop_msg__', {
        detail: { action: 'timer_accelerated', originalDelay: delay, newDelay: speedDelay }
      }));
    }
    return originalSetInterval(callback, speedDelay, ...args);
  };

  console.log('[DirectDrop] ⚡ Core bypass active (Fast-forward timers & popup blocker restored)');
})();
