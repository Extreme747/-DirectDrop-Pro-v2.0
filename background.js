// DirectDrop v2.0 Background Service Worker
const DEFAULT_SETTINGS = {
  enabled: true,
  killTraps: true,
  skipTimers: true,
  highlightLinks: true,
  unwrapRedirects: true,
  tabTerminator: true,
  batchGrabber: true,
  autoStepClicker: true,
  streamSniffer: true
};

const DEFAULT_STATS = {
  trapsNeutralized: 0,
  popupsBlocked: 0,
  linksBypassed: 0,
  tabsTerminated: 0
};

// 1. Initialize settings, stats & context menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['settings', 'stats'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    } else {
      // Merge new settings
      chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS, ...result.settings } });
    }
    if (!result.stats) {
      chrome.storage.local.set({ stats: DEFAULT_STATS });
    } else {
      chrome.storage.local.set({ stats: { ...DEFAULT_STATS, ...result.stats } });
    }
  });

  // Setup Context Menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'directdrop-copy-link',
      title: '⚡ DirectDrop: Copy Clean Link',
      contexts: ['link']
    });

    chrome.contextMenus.create({
      id: 'directdrop-grab-page-links',
      title: '📦 DirectDrop: Grab All Links on Page',
      contexts: ['page']
    });
  });

  console.log('[DirectDrop v2.0] Service Worker installed with Context Menus & Tab Terminator.');
});

// Update badge count
function updateBadge(stats) {
  const total = (stats.trapsNeutralized || 0) + (stats.popupsBlocked || 0) + (stats.linksBypassed || 0) + (stats.tabsTerminated || 0);
  if (total > 0) {
    chrome.action.setBadgeText({ text: total > 999 ? '999+' : String(total) });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// 2. Unwrapping helper for context menu
const REDIRECT_PARAMS = [
  'url', 'dest', 'target', 'link', 'to', 'u', 'redirect', 'redirect_url', 
  'destination', 'dl', 'download_url', 'out', 'r'
];

function cleanRedirectUrl(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    for (const param of REDIRECT_PARAMS) {
      const val = urlObj.searchParams.get(param);
      if (!val) continue;

      if (val.startsWith('http://') || val.startsWith('https://')) {
        return decodeURIComponent(val);
      }

      if (val.length > 15 && /^[A-Za-z0-9+/=]+$/.test(val)) {
        try {
          const decoded = atob(val);
          if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
            return decoded;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  return rawUrl;
}

// 3. Context Menu Click Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'directdrop-copy-link' && info.linkUrl && tab?.id) {
    const cleanUrl = cleanRedirectUrl(info.linkUrl);
    chrome.tabs.sendMessage(tab.id, {
      action: 'copy_to_clipboard',
      text: cleanUrl,
      msg: '⚡ Cleaned link copied to clipboard!'
    }).catch(() => {});
  } else if (info.menuItemId === 'directdrop-grab-page-links' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'trigger_batch_grabber'
    }).catch(() => {});
  }
});

// 4. Instant Tab Terminator (Auto-kill deceptive ad / betting / popup tabs)
const AD_URL_PATTERNS = [
  'adsterra', 'propellerads', 'clickadu', 'doubleclick', 'onclick',
  'yllix', 'popads', 'popcash', 'exoclick', 'trafficjunky', 'ad-maven',
  'hilltopads', 'richpush', 'juicyads', 'monetag', '1xbet', 'bet365',
  'parimatch', 'melbet', 'mostbet', 'stake.com', 'casino', 'lucky-wheel',
  'cleaner-update', 'system-infected', 'congratulations-winner', 'tracking'
];

function checkAndKillTab(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('opera://') || url.startsWith('edge://')) return;

  chrome.storage.local.get(['settings', 'stats'], (data) => {
    const settings = data.settings || DEFAULT_SETTINGS;
    if (settings.enabled === false || settings.tabTerminator === false) return;

    const lower = url.toLowerCase();
    const isSpam = AD_URL_PATTERNS.some(pat => lower.includes(pat));

    if (isSpam) {
      console.warn('[DirectDrop] 🔫 Terminating spam tab:', url);
      chrome.tabs.remove(tabId, () => {
        if (!chrome.runtime.lastError) {
          const stats = data.stats || { ...DEFAULT_STATS };
          stats.tabsTerminated = (stats.tabsTerminated || 0) + 1;
          chrome.storage.local.set({ stats }, () => {
            updateBadge(stats);
          });
        }
      });
    }
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) {
    checkAndKillTab(tab.id, tab.url);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    checkAndKillTab(tabId, changeInfo.url);
  }
});

// 5. Handle runtime messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'increment_stat') {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || { ...DEFAULT_STATS };
      if (message.stat in stats) {
        stats[message.stat]++;
      }
      chrome.storage.local.set({ stats }, () => {
        updateBadge(stats);
        sendResponse({ success: true, stats });
      });
    });
    return true;
  }

  if (message.action === 'reset_stats') {
    chrome.storage.local.set({ stats: DEFAULT_STATS }, () => {
      updateBadge(DEFAULT_STATS);
      sendResponse({ success: true, stats: DEFAULT_STATS });
    });
    return true;
  }
});
