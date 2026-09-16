// DirectDrop v2.0 Content Script (runs in ISOLATED world)
(function () {
  'use strict';

  // Config & State
  let config = {
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

  let stats = {
    trapsNeutralized: 0,
    popupsBlocked: 0,
    linksBypassed: 0,
    tabsTerminated: 0
  };

  // 1. Load settings from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['settings', 'stats'], (res) => {
      if (res.settings) config = { ...config, ...res.settings };
      if (res.stats) stats = { ...stats, ...res.stats };
    });
  }

  // 2. Ensure page-script is injected into DOM (fallback for MAIN world)
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('content/page-script.js');
    s.onload = function () { this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  } catch (err) {}

  // 3. Listen for events from MAIN world page-script
  window.addEventListener('__directdrop_msg__', (e) => {
    if (!config.enabled) return;
    const detail = e.detail || {};

    if (detail.action === 'popup_blocked') {
      stats.popupsBlocked++;
      updateStats('popupsBlocked');
      showToast('🛡️ Blocked popup ad tab!', 'shield');
    } else if (detail.action === 'timer_accelerated') {
      stats.linksBypassed++;
      updateStats('linksBypassed');
      showToast('⏩ Fast-forwarded countdown timer!', 'bolt');
    }
  });

  // 4. Listen for runtime messages from background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copy_to_clipboard' && request.text) {
      copyToClipboard(request.text);
      showToast(request.msg || '⚡ Copied to clipboard!', 'bolt');
    } else if (request.action === 'trigger_batch_grabber') {
      openBatchGrabberModal();
    }
  });

  // 5. Update stats in chrome storage
  function updateStats(key) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'increment_stat', stat: key });
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  }

  // 6. Toast Notification
  let toastContainer = null;
  let lastToastTime = 0;

  function showToast(message, type = 'check') {
    const now = Date.now();
    if (now - lastToastTime < 1000) return;
    lastToastTime = now;

    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'directdrop-toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'directdrop-toast';
    toast.innerHTML = `
      <div class="directdrop-toast-icon">${type === 'shield' ? '🛡️' : '⚡'}</div>
      <div><strong>DirectDrop:</strong> ${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px) scale(0.9)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // 7. Trap Neutralizer: Detect & Remove Invisible Click Overlays
  function neutralizeTraps() {
    if (!config.enabled || !config.killTraps) return;

    const elements = document.querySelectorAll('div, a, span, iframe, section');
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    elements.forEach((el) => {
      if (el.id?.startsWith('directdrop') || el.className?.toString().includes('directdrop')) return;

      const style = window.getComputedStyle(el);
      const isFixedOrAbsolute = style.position === 'fixed' || style.position === 'absolute';
      const zIndex = parseInt(style.zIndex, 10) || 0;

      if (isFixedOrAbsolute && zIndex >= 90) {
        const rect = el.getBoundingClientRect();
        const coversScreen = rect.width >= viewWidth * 0.75 && rect.height >= viewHeight * 0.75;
        const isTransparent = style.opacity === '0' || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)';

        if (coversScreen && isTransparent) {
          const hasLittleText = (el.innerText || '').trim().length < 25;
          if (hasLittleText) {
            console.log('[DirectDrop] 🎯 Neutralized invisible click-trap:', el);
            el.remove();
            stats.trapsNeutralized++;
            updateStats('trapsNeutralized');
            showToast('🛡️ Neutralized invisible click-trap!', 'shield');
          }
        }
      }

      if (el.tagName === 'A' && el.getAttribute('target') === '_blank') {
        const rect = el.getBoundingClientRect();
        if (rect.width >= viewWidth * 0.8 && rect.height >= viewHeight * 0.8) {
          console.log('[DirectDrop] 🎯 Removed full-screen ad link overlay:', el);
          el.remove();
          stats.trapsNeutralized++;
          updateStats('trapsNeutralized');
          showToast('🛡️ Removed full-screen ad link overlay!', 'shield');
        }
      }
    });
  }

  // 8. Unshortener & Direct Link Extractor
  const REDIRECT_PARAMS = [
    'url', 'dest', 'target', 'link', 'to', 'u', 'redirect', 'redirect_url', 
    'destination', 'dl', 'download_url', 'out', 'r'
  ];

  function unwrapUrl(href) {
    try {
      const urlObj = new URL(href, window.location.href);

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
    return null;
  }

  function processRedirectLinks() {
    if (!config.enabled || !config.unwrapRedirects) return;

    const links = document.querySelectorAll('a[href]:not([data-directdrop-checked])');
    links.forEach((a) => {
      a.setAttribute('data-directdrop-checked', 'true');
      const href = a.getAttribute('href');
      if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

      const unwrapped = unwrapUrl(href);
      if (unwrapped) {
        a.href = unwrapped;
        stats.linksBypassed++;
        updateStats('linksBypassed');
      }
    });
  }

  // 9. Real Download Link Detector & Highlighter
  const FILE_EXTENSIONS = [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.xz', '.bz2', '.iso',
    '.exe', '.msi', '.apk', '.dmg', '.pkg', '.deb', '.rpm', '.appx',
    '.pdf', '.epub', '.mp4', '.mkv', '.mp3', '.torrent'
  ];

  const TRUSTED_FILE_HOSTS = [
    'mediafire.com', 'drive.google.com', 'mega.nz', 'dropbox.com',
    '1fichier.com', 'pixeldrain.com', 'gofile.io', 'krakenfiles.com',
    'qiwi.gg', 'github.com', 'sourceforge.net', 'wetransfer.com',
    'sendgb.com', 'upload.ee'
  ];

  const AD_DOMAINS = [
    'adsterra', 'propellerads', 'clickadu', 'doubleclick', 'onclick',
    'yllix', 'popads', 'popcash', 'exoclick', 'trafficjunky', 'bet', 'casino'
  ];

  function highlightRealDownloadLinks() {
    if (!config.enabled || !config.highlightLinks) return;

    const links = document.querySelectorAll('a[href]');
    links.forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const text = (a.innerText || '').trim();

      const isFileExtension = FILE_EXTENSIONS.some((ext) => href.includes(ext));
      const isTrustedHost = TRUSTED_FILE_HOSTS.some((host) => href.includes(host));

      if (isFileExtension || isTrustedHost) {
        if (!a.classList.contains('directdrop-real-download-target')) {
          a.classList.add('directdrop-real-download-target');
          
          if (!a.querySelector('.directdrop-real-download-badge')) {
            const badge = document.createElement('span');
            badge.className = 'directdrop-real-download-badge';
            badge.innerHTML = '⚡ Verified File';
            a.appendChild(badge);
          }
        }
      }

      const isDeceptiveText = /^(download|start download|download now|direct download|install)$/i.test(text);
      const isAdDomain = AD_DOMAINS.some((d) => href.includes(d));

      if (isDeceptiveText && (isAdDomain || (!isFileExtension && !isTrustedHost && href.includes('javascript')))) {
        if (!a.classList.contains('directdrop-fake-ad-dimmed')) {
          a.classList.add('directdrop-fake-ad-dimmed');
          if (!a.querySelector('.directdrop-fake-ad-badge')) {
            const fakeBadge = document.createElement('span');
            fakeBadge.className = 'directdrop-fake-ad-badge';
            fakeBadge.innerText = '⚠️ Ad';
            a.appendChild(fakeBadge);
          }
        }
      }
    });
  }

  // 10. Unlock Hidden Download Buttons & Timers
  function unlockHiddenButtons() {
    if (!config.enabled || !config.skipTimers) return;

    const downloadSelectors = [
      'button[disabled]', 'a[disabled]', 
      '.download-btn[disabled]', '#download[disabled]',
      '[id*="download"][style*="display: none"]',
      '[class*="download"][style*="display: none"]'
    ];

    document.querySelectorAll(downloadSelectors.join(',')).forEach((btn) => {
      if (btn.hasAttribute('disabled')) {
        btn.removeAttribute('disabled');
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
      }
      if (btn.style.display === 'none') {
        btn.style.display = 'inline-block';
      }
    });
  }

  // 11. 📦 Feature 1: Batch Episode & Multi-Link Grabber
  let grabbedLinks = [];

  function scanDownloadableLinks() {
    const validLinks = [];
    const seenUrls = new Set();

    document.querySelectorAll('a[href]').forEach((a) => {
      let href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      // Unwrap if needed
      const unwrapped = unwrapUrl(href) || href;
      const lower = unwrapped.toLowerCase();

      const isFile = FILE_EXTENSIONS.some((ext) => lower.includes(ext));
      const isHost = TRUSTED_FILE_HOSTS.some((host) => lower.includes(host));

      if ((isFile || isHost) && !seenUrls.has(unwrapped)) {
        seenUrls.add(unwrapped);
        const linkName = (a.innerText || a.getAttribute('title') || unwrapped.split('/').pop().split('?')[0]).trim();
        validLinks.push({ name: linkName || 'Direct File', url: unwrapped });
      }
    });

    grabbedLinks = validLinks;
    updateFloatingGrabberBtn();
  }

  function updateFloatingGrabberBtn() {
    if (!config.enabled || !config.batchGrabber || grabbedLinks.length < 2) {
      const existingBtn = document.getElementById('directdrop-floating-grabber-btn');
      if (existingBtn) existingBtn.remove();
      return;
    }

    let btn = document.getElementById('directdrop-floating-grabber-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'directdrop-floating-grabber-btn';
      btn.onclick = openBatchGrabberModal;
      document.body.appendChild(btn);
    }
    btn.innerHTML = `📦 Grab All Links (${grabbedLinks.length})`;
  }

  function openBatchGrabberModal() {
    let modal = document.getElementById('directdrop-grabber-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'directdrop-grabber-modal';

    let linksHtml = grabbedLinks.map((item, index) => `
      <div class="directdrop-link-row">
        <span class="directdrop-link-name">#${index + 1} ${escapeHtml(item.name)}</span>
        <a href="${item.url}" target="_blank" class="directdrop-btn" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">⬇ Open</a>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="directdrop-modal-header">
        <div class="directdrop-modal-title">📦 Batch Links Grabber (${grabbedLinks.length} Files Found)</div>
        <button class="directdrop-modal-close" id="btnDirectDropCloseModal">&times;</button>
      </div>
      <div class="directdrop-links-list">
        ${linksHtml || '<div style="color: #94a3b8; text-align: center; padding: 20px;">No downloadable file links detected on this page.</div>'}
      </div>
      <div class="directdrop-modal-actions">
        <button class="directdrop-btn directdrop-btn-secondary" id="btnDirectDropExportTxt">📄 Export .txt</button>
        <button class="directdrop-btn" id="btnDirectDropCopyAll">📋 Copy All for IDM</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('btnDirectDropCloseModal').onclick = () => modal.remove();

    document.getElementById('btnDirectDropCopyAll').onclick = () => {
      const text = grabbedLinks.map(l => l.url).join('\n');
      copyToClipboard(text);
      showToast(`⚡ Copied ${grabbedLinks.length} links for IDM / JDownloader!`, 'bolt');
    };

    document.getElementById('btnDirectDropExportTxt').onclick = () => {
      const text = grabbedLinks.map(l => l.url).join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'download_links.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    };
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // 12. 🤖 Feature 2: Auto Multi-Step Clicker
  let lastAutoClickedEl = null;

  function autoStepClicker() {
    if (!config.enabled || !config.autoStepClicker) return;

    const stepPatterns = [
      /click here to continue/i,
      /proceed to download/i,
      /get link/i,
      /generate link/i,
      /verify to continue/i,
      /continue to download/i,
      /step \d\/\d/i,
      /create download link/i
    ];

    const candidates = document.querySelectorAll('button, a, input[type="submit"], input[type="button"], .btn, .btn-primary');
    for (const el of candidates) {
      // Ignore disabled or already processed buttons
      if (el.hasAttribute('disabled') || el.style.display === 'none' || el === lastAutoClickedEl) continue;
      if (el.closest('#directdrop-grabber-modal') || el.id?.startsWith('directdrop')) continue;

      const text = (el.innerText || el.value || '').trim();
      const idClass = (el.id + ' ' + el.className).toLowerCase();

      const matchesPattern = stepPatterns.some(p => p.test(text)) || idClass.includes('getlink') || idClass.includes('btn-step');

      if (matchesPattern && el.offsetParent !== null) {
        lastAutoClickedEl = el;
        el.classList.add('directdrop-auto-click-target');
        console.log('[DirectDrop] 🤖 Auto-step detected:', text, el);

        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            el.click();
            showToast(`🤖 Auto-proceeded: "${text.substring(0, 20)}..."`, 'bolt');
          }, 600);
        }, 800);

        break;
      }
    }
  }

  // 13. 🎬 Feature 4: Video Stream Sniffer
  function sniffVideoStreams() {
    if (!config.enabled || !config.streamSniffer) return;

    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      let src = video.currentSrc || video.getAttribute('src');
      if (!src) {
        const source = video.querySelector('source');
        if (source) src = source.getAttribute('src');
      }

      if (src && (src.includes('.mp4') || src.includes('.m3u8') || src.includes('.webm') || src.startsWith('blob:') || src.startsWith('http'))) {
        const parent = video.parentElement || video;
        if (window.getComputedStyle(parent).position === 'static') {
          parent.style.position = 'relative';
        }

        if (!parent.querySelector('.directdrop-video-sniff-btn')) {
          const btn = document.createElement('button');
          btn.className = 'directdrop-video-sniff-btn';
          btn.innerHTML = '🎬 Download Video Stream';
          btn.onclick = (e) => {
            e.stopPropagation();
            window.open(src, '_blank');
          };
          parent.appendChild(btn);
        }
      }
    });
  }

  // 14. Master Runner
  function runProtectionCycle() {
    neutralizeTraps();
    processRedirectLinks();
    highlightRealDownloadLinks();
    unlockHiddenButtons();
    scanDownloadableLinks();
    autoStepClicker();
    sniffVideoStreams();
  }

  // Run on start and ready
  runProtectionCycle();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runProtectionCycle);
  }
  window.addEventListener('load', runProtectionCycle);

  // Periodic check
  setInterval(runProtectionCycle, 1500);

  const observer = new MutationObserver(() => {
    runProtectionCycle();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log('[DirectDrop v2.0] 🛡️ All Superpowers Active (Batch Grabber, Auto-Step, Video Sniffer, Traps)');
})();
