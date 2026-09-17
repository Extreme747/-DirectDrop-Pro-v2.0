// DirectDrop Pro v3.5 Dev & Founder Edition - Content Script
(function () {
  'use strict';

  // Config & State
  let config = {
    enabled: true,
    silentMode: true, // Default to SILENT (no annoying floating toasts)
    killTraps: true,
    skipTimers: true,
    highlightLinks: true,
    unwrapRedirects: true,
    tabTerminator: true,
    antiAdblock: true,
    batchGrabber: true,
    qualityFilter: true,
    subtitleFinder: true,
    cloudUnlocker: true,
    streamSniffer: true,
    headlessExport: true,
    rpcUrl: 'http://localhost:6800/jsonrpc',
    webhookUrl: ''
  };

  let stats = {
    trapsNeutralized: 0,
    popupsBlocked: 0,
    linksBypassed: 0,
    tabsTerminated: 0
  };

  // 1. Load settings & stats from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['settings', 'stats'], (res) => {
      if (res.settings) config = { ...config, ...res.settings };
      if (res.stats) stats = { ...stats, ...res.stats };
    });
  }

  // 2. Ensure page-script is injected into DOM
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('content/page-script.js');
    s.onload = function () { this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  } catch (err) {}

  // 3. Listen for events from MAIN world page-script (SILENT - NO ANNOYING TOASTS)
  window.addEventListener('__directdrop_msg__', (e) => {
    if (!config.enabled) return;
    const detail = e.detail || {};

    if (detail.action === 'popup_blocked') {
      stats.popupsBlocked++;
      updateStats('popupsBlocked');
      // Quiet background increment, no toast spam
    } else if (detail.action === 'timer_accelerated') {
      stats.linksBypassed++;
      updateStats('linksBypassed');
      // Quiet background fast-forward, no toast spam
    }
  });

  // 4. Runtime message listener
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'copy_to_clipboard' && request.text) {
      copyToClipboard(request.text);
      showToast(request.msg || '⚡ Copied to clipboard!', 'bolt', true);
    } else if (request.action === 'trigger_batch_grabber') {
      openBatchGrabberModal();
    } else if (request.action === 'trigger_asset_sniffer') {
      sniffAndShowPageAssets();
    }
  });

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

  // 5. Toast Notifications (Muted when silentMode is enabled, unless explicitly forced)
  let toastContainer = null;
  let lastToastTime = 0;

  function showToast(message, type = 'check', force = false) {
    // If silentMode is on and not explicitly forced by a user click, DO NOT SHOW
    if (config.silentMode && !force) return;

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
      <div><strong>DirectDrop Pro:</strong> ${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px) scale(0.9)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // 6. Trap Neutralizer (Silent)
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
            el.remove();
            stats.trapsNeutralized++;
            updateStats('trapsNeutralized');
          }
        }
      }

      if (el.tagName === 'A' && el.getAttribute('target') === '_blank') {
        const rect = el.getBoundingClientRect();
        if (rect.width >= viewWidth * 0.8 && rect.height >= viewHeight * 0.8) {
          el.remove();
          stats.trapsNeutralized++;
          updateStats('trapsNeutralized');
        }
      }
    });
  }

  // 7. Anti-Anti-AdBlocker (Unlocks pages)
  function defeatAntiAdblock() {
    if (!config.enabled || !config.antiAdblock) return;

    const adblockModals = document.querySelectorAll(
      '[id*="adblock"], [class*="adblock"], [id*="antiad"], [class*="anti-ad"], .adblock-overlay, .adb-detected, #fba-overlay'
    );
    adblockModals.forEach((m) => {
      if (m.id?.startsWith('directdrop') || m.className?.toString().includes('directdrop')) return;
      m.remove();
    });

    if (document.body) {
      if (document.body.style.filter?.includes('blur')) document.body.style.filter = 'none';
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = 'auto';
    }
  }

  // 8. Redirect Unwrapper
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

  // 9. Real Download & Movie Server Highlighter
  const FILE_EXTENSIONS = [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.xz', '.bz2', '.iso',
    '.exe', '.msi', '.apk', '.dmg', '.pkg', '.deb', '.rpm', '.appx',
    '.pdf', '.epub', '.mp4', '.mkv', '.mp3', '.torrent'
  ];

  const TRUSTED_FILE_HOSTS = [
    'mediafire.com', 'drive.google.com', 'mega.nz', 'dropbox.com',
    '1fichier.com', 'pixeldrain.com', 'gofile.io', 'krakenfiles.com',
    'qiwi.gg', 'github.com', 'sourceforge.net', 'wetransfer.com',
    'sendgb.com', 'upload.ee', 'hubcloud', 'gamerxyt', 'fsl',
    'pixel', 'buzz', 'fastdl', 'racaty', 'streamwish', 'filepress'
  ];

  const AD_DOMAINS = [
    'adsterra', 'propellerads', 'clickadu', 'doubleclick',
    'yllix', 'popads', 'popcash', 'exoclick', 'trafficjunky', '1xbet', 'bet365', 'casino'
  ];

  function highlightRealDownloadLinks() {
    if (!config.enabled || !config.highlightLinks) return;

    const links = document.querySelectorAll('a[href]');
    links.forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const text = (a.innerText || '').trim();

      const isFileExtension = FILE_EXTENSIONS.some((ext) => href.includes(ext));
      const isTrustedHost = TRUSTED_FILE_HOSTS.some((host) => href.includes(host));
      const isServerButton = /server|fsl|pixel|buzz|hubcloud|10gbps/i.test(text + ' ' + href);

      if (isFileExtension || isTrustedHost || isServerButton) {
        if (!a.classList.contains('directdrop-real-download-target')) {
          a.classList.add('directdrop-real-download-target');
          
          if (!a.querySelector('.directdrop-real-download-badge')) {
            const badge = document.createElement('span');
            badge.className = 'directdrop-real-download-badge' + (isServerButton ? ' directdrop-server-badge' : '');
            badge.innerHTML = isServerButton ? '⚡ Verified Server' : '⚡ Verified File';
            a.appendChild(badge);
          }
        }
        return;
      }

      const isDeceptiveText = /^(download|start download|download now|direct download|install)$/i.test(text);
      const isAdDomain = AD_DOMAINS.some((d) => href.includes(d));

      if (isDeceptiveText && isAdDomain) {
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

  // 10. Unlock Hidden Download Buttons
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

  // 11. Filename Cleaner & Quality Classifier
  function cleanFileName(raw) {
    if (!raw) return 'Direct_File';
    return raw
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/www\.[a-z0-9\-]+\.[a-z]{2,}/gi, '')
      .replace(/\[\s*HDHub4u[a-z0-9\.\-]*\s*\]/gi, '')
      .replace(/-HDHub4u\.[a-z0-9]+/gi, '')
      .replace(/\.Ms\./gi, '.')
      .replace(/[\._]+/g, ' ')
      .trim();
  }

  function detectQuality(text) {
    const t = (text || '').toLowerCase();
    if (/2160p|4k|uhd|ds4k/i.test(t)) return '4K';
    if (/1080p|fhd/i.test(t)) return '1080p';
    if (/720p|hd/i.test(t)) return '720p';
    if (/480p|sd|300mb/i.test(t)) return '480p';
    return 'Other';
  }

  // 12. Batch Episode Grabber (with Quality Tabs, Headless Scripts, Webhooks)
  let grabbedLinks = [];
  let currentActiveQuality = 'All';
  let currentSearchQuery = '';

  function scanDownloadableLinks() {
    const validLinks = [];
    const seenUrls = new Set();

    document.querySelectorAll('a[href]').forEach((a) => {
      let href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      const unwrapped = unwrapUrl(href) || href;
      const lower = unwrapped.toLowerCase();

      const isFile = FILE_EXTENSIONS.some((ext) => lower.includes(ext));
      const isHost = TRUSTED_FILE_HOSTS.some((host) => lower.includes(host));
      const isServerBtn = /fsl|pixel|buzz|hubcloud|server/i.test(a.innerText || '');

      if ((isFile || isHost || isServerBtn) && !seenUrls.has(unwrapped)) {
        seenUrls.add(unwrapped);
        const rawName = (a.innerText || a.getAttribute('title') || unwrapped.split('/').pop().split('?')[0]).trim();
        const cleaned = cleanFileName(rawName);
        const quality = detectQuality(rawName + ' ' + (document.title || ''));
        validLinks.push({ name: cleaned, rawName, url: unwrapped, quality });
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
    let backdrop = document.getElementById('directdrop-grabber-backdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'directdrop-grabber-backdrop';
    backdrop.onclick = (e) => {
      if (e.target === backdrop) backdrop.remove();
    };

    const modal = document.createElement('div');
    modal.id = 'directdrop-grabber-modal';
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    renderModalContent();
  }

  function getFilteredLinks() {
    return grabbedLinks.filter((item) => {
      const matchQuality = currentActiveQuality === 'All' || item.quality === currentActiveQuality;
      const matchSearch = !currentSearchQuery || item.name.toLowerCase().includes(currentSearchQuery.toLowerCase());
      return matchQuality && matchSearch;
    });
  }

  function renderModalContent() {
    const modal = document.getElementById('directdrop-grabber-modal');
    if (!modal) return;

    const count4k = grabbedLinks.filter(l => l.quality === '4K').length;
    const count1080p = grabbedLinks.filter(l => l.quality === '1080p').length;
    const count720p = grabbedLinks.filter(l => l.quality === '720p').length;
    const count480p = grabbedLinks.filter(l => l.quality === '480p').length;

    const filtered = getFilteredLinks();

    let linksHtml = filtered.map((item, idx) => `
      <div class="directdrop-link-row">
        <div style="display: flex; align-items: center;">
          <span class="directdrop-quality-tag ${item.quality === '4K' ? 'directdrop-quality-4k' : ''}">${item.quality}</span>
          <span class="directdrop-link-name">#${idx + 1} ${escapeHtml(item.name)}</span>
        </div>
        <a href="${item.url}" target="_blank" class="directdrop-btn" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">⬇ Open</a>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="directdrop-modal-header">
        <div class="directdrop-modal-title">⚡ Batch Episode Grabber (${grabbedLinks.length} Links)</div>
        <button class="directdrop-modal-close" id="btnDirectDropCloseModal">&times;</button>
      </div>

      <div class="directdrop-filter-row">
        <button class="directdrop-pill-btn ${currentActiveQuality === 'All' ? 'active' : ''}" data-q="All">All (${grabbedLinks.length})</button>
        ${count4k ? `<button class="directdrop-pill-btn ${currentActiveQuality === '4K' ? 'active' : ''}" data-q="4K">4K UHD (${count4k})</button>` : ''}
        ${count1080p ? `<button class="directdrop-pill-btn ${currentActiveQuality === '1080p' ? 'active' : ''}" data-q="1080p">1080p FHD (${count1080p})</button>` : ''}
        ${count720p ? `<button class="directdrop-pill-btn ${currentActiveQuality === '720p' ? 'active' : ''}" data-q="720p">720p HD (${count720p})</button>` : ''}
        ${count480p ? `<button class="directdrop-pill-btn ${currentActiveQuality === '480p' ? 'active' : ''}" data-q="480p">480p (${count480p})</button>` : ''}
        <input type="text" class="directdrop-search-input" id="directdropSearchInput" placeholder="Filter episodes..." value="${escapeHtml(currentSearchQuery)}">
      </div>

      <div class="directdrop-links-list">
        ${linksHtml || '<div style="color: #71717a; text-align: center; padding: 24px;">No files matching this filter.</div>'}
      </div>

      <!-- Developer & Downloader Action Bar -->
      <div class="directdrop-modal-actions">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="directdrop-btn directdrop-btn-secondary" id="btnDirectDropExportPython">🐍 Python Script</button>
          <button class="directdrop-btn directdrop-btn-secondary" id="btnDirectDropExportBash">💻 Bash / aria2c</button>
          <button class="directdrop-btn directdrop-btn-secondary" id="btnDirectDropWebhook">📡 Webhook</button>
          <button class="directdrop-btn directdrop-btn-secondary" id="btnDirectDropFindSubs">💬 Subtitles (.SRT)</button>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="directdrop-btn directdrop-btn-rpc" id="btnDirectDropSendRpc">🚀 Send to Motrix</button>
          <button class="directdrop-btn" id="btnDirectDropCopyAll">📋 Copy Selected for IDM</button>
        </div>
      </div>
    `;

    // Event handlers
    document.getElementById('btnDirectDropCloseModal').onclick = () => {
      document.getElementById('directdrop-grabber-backdrop')?.remove();
    };

    modal.querySelectorAll('.directdrop-pill-btn').forEach((btn) => {
      btn.onclick = () => {
        currentActiveQuality = btn.getAttribute('data-q');
        renderModalContent();
      };
    });

    const searchInp = document.getElementById('directdropSearchInput');
    searchInp.oninput = (e) => {
      currentSearchQuery = e.target.value;
      renderModalContent();
      const updatedInp = document.getElementById('directdropSearchInput');
      if (updatedInp) {
        updatedInp.focus();
        updatedInp.setSelectionRange(updatedInp.value.length, updatedInp.value.length);
      }
    };

    // Copy All for IDM
    document.getElementById('btnDirectDropCopyAll').onclick = () => {
      const activeList = getFilteredLinks();
      const text = activeList.map(l => l.url).join('\n');
      copyToClipboard(text);
      showToast(`⚡ Copied ${activeList.length} links for IDM / JDownloader!`, 'bolt', true);
    };

    // Export Python Script (Headless Downloader)
    document.getElementById('btnDirectDropExportPython').onclick = () => {
      const activeList = getFilteredLinks();
      exportPythonDownloader(activeList);
    };

    // Export Bash / aria2c Script
    document.getElementById('btnDirectDropExportBash').onclick = () => {
      const activeList = getFilteredLinks();
      exportBashDownloader(activeList);
    };

    // Trigger Webhook Dispatcher
    document.getElementById('btnDirectDropWebhook').onclick = () => {
      const activeList = getFilteredLinks();
      dispatchWebhook(activeList);
    };

    // Send to Motrix / Aria2 JSON-RPC
    document.getElementById('btnDirectDropSendRpc').onclick = () => {
      const activeList = getFilteredLinks();
      sendToAria2Rpc(activeList.map(l => l.url));
    };

    // Find Subtitles (.SRT)
    document.getElementById('btnDirectDropFindSubs').onclick = () => {
      const movieQuery = cleanFileName(document.title || '').replace(/download|full movie|watch online|hindi|line/gi, '').trim();
      const searchUrl = `https://subsource.net/subtitles?search=${encodeURIComponent(movieQuery)}`;
      window.open(searchUrl, '_blank');
      showToast(`💬 Searching subtitles for: "${movieQuery}"`, 'bolt', true);
    };
  }

  // 13. Python & Bash Headless Script Generators
  function exportPythonDownloader(links) {
    const script = `#!/usr/bin/env python3
# DirectDrop Headless Downloader Script
# Generated for: ${escapeString(document.title)}
import os
import requests
from urllib.parse import urlparse

FILES = ${JSON.stringify(links.map(l => ({ name: l.name.replace(/[^a-zA-Z0-9_\-\. ]/g, '_'), url: l.url })), null, 4)}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_file(item):
    filename = item["name"]
    # Append appropriate extension if missing
    if "." not in filename[-5:]:
        ext = os.path.splitext(urlparse(item["url"]).path)[1]
        filename += ext or ".mkv"

    print(f"[*] Downloading: {filename}")
    try:
        with requests.get(item["url"], headers=HEADERS, stream=True, timeout=30) as r:
            r.raise_for_status()
            total_size = int(r.headers.get("content-length", 0))
            downloaded = 0
            with open(filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024*1024):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\\rProgress: {percent:.1f}% ({downloaded // (1024*1024)} MB / {total_size // (1024*1024)} MB)", end="")
        print(f"\\n[+] Finished: {filename}")
    except Exception as e:
        print(f"\\n[-] Error downloading {filename}: {e}")

if __name__ == "__main__":
    print(f"Starting batch download of {len(FILES)} files...")
    for file in FILES:
        download_file(file)
    print("All tasks completed successfully!")
`;

    downloadAsFile(script, 'download_script.py', 'text/x-python');
    showToast('🐍 Python downloader script downloaded!', 'bolt', true);
  }

  function exportBashDownloader(links) {
    const urls = links.map(l => l.url).join('\n');
    const bashScript = `#!/bin/bash
# DirectDrop Headless Bash Downloader
# Requires aria2: sudo apt install aria2

cat << 'EOF' > download_urls.txt
${urls}
EOF

echo "[*] Launching multi-threaded aria2c download with 4 concurrent connections..."
aria2c -i download_urls.txt -j 4 -s 4 -x 4 --auto-file-renaming=false --continue=true
echo "[+] All downloads finished!"
`;

    downloadAsFile(bashScript, 'download.sh', 'text/x-sh');
    showToast('💻 Bash download script exported!', 'bolt', true);
  }

  function downloadAsFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeString(str) {
    return (str || '').replace(/["'\\]/g, '');
  }

  // 14. Webhook Dispatcher
  function dispatchWebhook(links) {
    const endpoint = config.webhookUrl;
    if (!endpoint) {
      showToast('⚠️ No Webhook URL set! Please configure it in extension popup ➔ Dev Tools tab.', 'shield', true);
      return;
    }

    showToast('📡 Dispatching links to webhook...', 'bolt', true);

    const isDiscord = endpoint.includes('discord.com/api/webhooks');
    let payload;

    if (isDiscord) {
      payload = {
        username: "DirectDrop Pro",
        avatar_url: "https://raw.githubusercontent.com/Extreme747/-DirectDrop-Pro-v2.0/main/icons/icon128.png",
        content: `⚡ **${links.length} Direct Links Extracted from:** \`${document.title}\``,
        embeds: links.slice(0, 10).map((l, i) => ({
          title: `#${i + 1} ${l.name}`,
          description: `[Direct Download Link](${l.url})`,
          color: 0x10b981,
          fields: [{ name: "Quality", value: l.quality, inline: true }]
        }))
      };
    } else {
      payload = {
        event: "directdrop_links_extracted",
        source_title: document.title,
        source_url: window.location.href,
        total_links: links.length,
        links: links,
        timestamp: new Date().toISOString()
      };
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(() => {
      showToast(`✅ Successfully dispatched ${links.length} links to webhook!`, 'bolt', true);
    })
    .catch((err) => {
      showToast(`❌ Failed to send webhook: ${err.message}`, 'shield', true);
    });
  }

  // 15. Motrix / Aria2 JSON-RPC Sender
  function sendToAria2Rpc(urls) {
    if (!urls || !urls.length) return;
    const rpcEndpoint = config.rpcUrl || 'http://localhost:6800/jsonrpc';

    showToast(`🚀 Sending ${urls.length} links to Motrix / Aria2...`, 'bolt', true);

    let successCount = 0;
    let failedCount = 0;

    urls.forEach((url, i) => {
      const payload = {
        jsonrpc: '2.0',
        id: `directdrop_${Date.now()}_${i}`,
        method: 'aria2.addUri',
        params: [[url], {}]
      };

      fetch(rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.result) successCount++;
        else failedCount++;

        if (successCount + failedCount === urls.length) {
          if (successCount > 0) {
            showToast(`✅ ${successCount} downloads queued in Motrix!`, 'bolt', true);
          } else {
            showToast(`⚠️ Could not reach Aria2 on ${rpcEndpoint}.`, 'shield', true);
          }
        }
      })
      .catch(() => {
        failedCount++;
        if (successCount + failedCount === urls.length && successCount === 0) {
          showToast(`⚠️ Motrix/Aria2 not running on ${rpcEndpoint}.`, 'shield', true);
        }
      });
    });
  }

  // 16. Web Asset & API Payload Sniffer (Developer Tool)
  function sniffAndShowPageAssets() {
    // 1. Collect SVGs
    const svgs = [];
    document.querySelectorAll('svg').forEach((svg, idx) => {
      const clone = svg.cloneNode(true);
      if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgs.push({
        id: idx + 1,
        code: clone.outerHTML,
        width: svg.clientWidth || svg.getAttribute('width') || 'auto',
        height: svg.clientHeight || svg.getAttribute('height') || 'auto'
      });
    });

    // 2. Collect Images & Media
    const images = [];
    const seenImg = new Set();
    document.querySelectorAll('img, picture source').forEach((el) => {
      const src = el.currentSrc || el.src || el.getAttribute('data-src');
      if (src && !src.startsWith('data:') && !seenImg.has(src)) {
        seenImg.add(src);
        images.push({ url: src, name: src.split('/').pop().split('?')[0] || 'image' });
      }
    });

    // 3. Collect Hidden State / API Endpoints
    const apiData = [];
    if (window.__NEXT_DATA__) {
      apiData.push({ label: 'Next.js __NEXT_DATA__', data: JSON.stringify(window.__NEXT_DATA__, null, 2) });
    }
    if (window.__NUXT__) {
      apiData.push({ label: 'Nuxt.js __NUXT__', data: JSON.stringify(window.__NUXT__, null, 2) });
    }

    // Render Asset Sniffer Drawer
    let drawer = document.getElementById('directdrop-sniffer-drawer');
    if (drawer) drawer.remove();

    drawer = document.createElement('div');
    drawer.id = 'directdrop-sniffer-drawer';
    drawer.innerHTML = `
      <div id="directdrop-grabber-backdrop">
        <div id="directdrop-grabber-modal" style="max-width: 800px;">
          <div class="directdrop-modal-header">
            <div class="directdrop-modal-title">🕵️ Web Asset & API Sniffer (${svgs.length} SVGs, ${images.length} Images)</div>
            <button class="directdrop-modal-close" id="btnCloseSniffer">&times;</button>
          </div>
          
          <div class="directdrop-filter-row">
            <button class="directdrop-pill-btn active" id="tabSniffSvg">SVGs (${svgs.length})</button>
            <button class="directdrop-pill-btn" id="tabSniffImg">Images (${images.length})</button>
            <button class="directdrop-pill-btn" id="tabSniffApi">Data & APIs (${apiData.length})</button>
          </div>

          <div class="directdrop-links-list" id="snifferContent" style="max-height: 380px;"></div>

          <div class="directdrop-modal-actions">
            <span style="font-size: 11px; color: #71717a;">Dev Mode: Inspect & extract frontend assets</span>
            <button class="directdrop-btn" id="btnDownloadAllSvg">⬇ Download All SVGs</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    const contentBox = document.getElementById('snifferContent');
    const closeBtn = document.getElementById('btnCloseSniffer');
    closeBtn.onclick = () => drawer.remove();

    function showSvgTab() {
      contentBox.innerHTML = svgs.map(s => `
        <div class="directdrop-link-row">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: #18181b; border-radius: 4px;">
              ${s.code}
            </div>
            <span style="font-size: 11px; color: #a1a1aa; font-family: monospace;">SVG #${s.id} (${s.width}x${s.height})</span>
          </div>
          <button class="directdrop-btn directdrop-btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="navigator.clipboard.writeText(${escapeQuotes(s.code)})">Copy Code</button>
        </div>
      `).join('') || '<div style="color: #71717a; text-align: center; padding: 20px;">No SVG icons found.</div>';
    }

    function showImgTab() {
      contentBox.innerHTML = images.map(img => `
        <div class="directdrop-link-row">
          <span style="font-size: 12px; color: #f4f4f5; word-break: break-all;">${escapeHtml(img.name)}</span>
          <a href="${img.url}" target="_blank" class="directdrop-btn" style="padding: 4px 8px; font-size: 10px; text-decoration: none;">View</a>
        </div>
      `).join('') || '<div style="color: #71717a; text-align: center; padding: 20px;">No images found.</div>';
    }

    function showApiTab() {
      contentBox.innerHTML = apiData.map(d => `
        <div style="background: #09090b; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px;">
          <strong style="color: #06b6d4; font-size: 12px;">${escapeHtml(d.label)}</strong>
          <pre style="max-height: 120px; overflow: auto; font-size: 10px; color: #a1a1aa; margin-top: 6px;">${escapeHtml(d.data.substring(0, 1000))}...</pre>
        </div>
      `).join('') || '<div style="color: #71717a; text-align: center; padding: 20px;">No exposed Next.js or Nuxt.js JSON states detected.</div>';
    }

    document.getElementById('tabSniffSvg').onclick = (e) => {
      document.querySelectorAll('.directdrop-pill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      showSvgTab();
    };

    document.getElementById('tabSniffImg').onclick = (e) => {
      document.querySelectorAll('.directdrop-pill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      showImgTab();
    };

    document.getElementById('tabSniffApi').onclick = (e) => {
      document.querySelectorAll('.directdrop-pill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      showApiTab();
    };

    document.getElementById('btnDownloadAllSvg').onclick = () => {
      svgs.forEach((s, idx) => {
        downloadAsFile(s.code, `icon_${idx + 1}.svg`, 'image/svg+xml');
      });
      showToast(`⬇ Downloaded ${svgs.length} SVGs!`, 'bolt', true);
    };

    // Initial show
    showSvgTab();
  }

  function escapeQuotes(str) {
    return JSON.stringify(str);
  }

  // 17. Google Drive Quota & TeraBox Unlocker
  function cloudLockerUnlocker() {
    if (!config.enabled || !config.cloudUnlocker) return;

    if (window.location.hostname.includes('drive.google.com') && document.body?.innerText?.includes('quota exceeded')) {
      const fileId = new URL(window.location.href).searchParams.get('id');
      if (fileId && !document.getElementById('directdrop-gdrive-bypass')) {
        const box = document.createElement('div');
        box.id = 'directdrop-gdrive-bypass';
        box.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:#000;padding:12px 24px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,0.5);cursor:pointer;';
        box.innerHTML = '⚡ DirectDrop: Bypass GDrive Quota (Mirror Download)';
        box.onclick = () => {
          window.open(`https://api.bypass.vip/gdrive?id=${fileId}`, '_blank');
        };
        document.body.appendChild(box);
      }
    }
  }

  // 18. Video Stream Sniffer
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

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // 19. Master Protection Cycle
  function runProtectionCycle() {
    neutralizeTraps();
    defeatAntiAdblock();
    processRedirectLinks();
    highlightRealDownloadLinks();
    unlockHiddenButtons();
    scanDownloadableLinks();
    sniffVideoStreams();
    cloudLockerUnlocker();
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

  console.log('[DirectDrop Pro v3.5 Dev Edition] ⚡ Silent Mode Active (Python Exporter, Webhooks, Asset Sniffer ready)');
})();
