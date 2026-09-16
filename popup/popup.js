// DirectDrop Pro v3.0 Popup Controller
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabBtnShields = document.getElementById('tabBtnShields');
  const tabBtnTools = document.getElementById('tabBtnTools');
  const tabContentShields = document.getElementById('tabContentShields');
  const tabContentTools = document.getElementById('tabContentTools');

  tabBtnShields.addEventListener('click', () => {
    tabBtnShields.classList.add('active');
    tabBtnTools.classList.remove('active');
    tabContentShields.style.display = 'block';
    tabContentTools.style.display = 'none';
  });

  tabBtnTools.addEventListener('click', () => {
    tabBtnTools.classList.add('active');
    tabBtnShields.classList.remove('active');
    tabContentTools.style.display = 'block';
    tabContentShields.style.display = 'none';
  });

  // Elements
  const masterToggle = document.getElementById('masterToggle');
  const toggleTraps = document.getElementById('toggleTraps');
  const toggleTimers = document.getElementById('toggleTimers');
  const toggleHighlight = document.getElementById('toggleHighlight');
  const toggleTerminator = document.getElementById('toggleTerminator');
  const toggleAntiAdblock = document.getElementById('toggleAntiAdblock');

  const rpcUrlInput = document.getElementById('rpcUrlInput');
  const toggleQualityFilter = document.getElementById('toggleQualityFilter');
  const toggleSubtitle = document.getElementById('toggleSubtitle');
  const toggleCloudUnlocker = document.getElementById('toggleCloudUnlocker');
  const toggleBatch = document.getElementById('toggleBatch');
  const toggleSniffer = document.getElementById('toggleSniffer');

  const statTraps = document.getElementById('statTraps');
  const statPopups = document.getElementById('statPopups');
  const statLinks = document.getElementById('statLinks');

  const btnTestPlayground = document.getElementById('btnTestPlayground');
  const btnResetStats = document.getElementById('btnResetStats');

  // Load Settings & Stats
  chrome.storage.local.get(['settings', 'stats'], (data) => {
    const settings = data.settings || {};
    const stats = data.stats || {};

    // Apply toggles
    masterToggle.checked = settings.enabled !== false;
    toggleTraps.checked = settings.killTraps !== false;
    toggleTimers.checked = settings.skipTimers !== false;
    toggleHighlight.checked = settings.highlightLinks !== false;
    toggleTerminator.checked = settings.tabTerminator !== false;
    toggleAntiAdblock.checked = settings.antiAdblock !== false;

    rpcUrlInput.value = settings.rpcUrl || 'http://localhost:6800/jsonrpc';
    toggleQualityFilter.checked = settings.qualityFilter !== false;
    toggleSubtitle.checked = settings.subtitleFinder !== false;
    toggleCloudUnlocker.checked = settings.cloudUnlocker !== false;
    toggleBatch.checked = settings.batchGrabber !== false;
    toggleSniffer.checked = settings.streamSniffer !== false;

    // Apply stats
    statTraps.innerText = stats.trapsNeutralized || 0;
    statPopups.innerText = (stats.popupsBlocked || 0) + (stats.tabsTerminated || 0);
    statLinks.innerText = stats.linksBypassed || 0;
  });

  // Save Settings Helper
  function saveSettings() {
    const settings = {
      enabled: masterToggle.checked,
      killTraps: toggleTraps.checked,
      skipTimers: toggleTimers.checked,
      highlightLinks: toggleHighlight.checked,
      tabTerminator: toggleTerminator.checked,
      antiAdblock: toggleAntiAdblock.checked,
      rpcUrl: rpcUrlInput.value.trim() || 'http://localhost:6800/jsonrpc',
      qualityFilter: toggleQualityFilter.checked,
      subtitleFinder: toggleSubtitle.checked,
      cloudUnlocker: toggleCloudUnlocker.checked,
      batchGrabber: toggleBatch.checked,
      streamSniffer: toggleSniffer.checked,
      unwrapRedirects: true
    };
    chrome.storage.local.set({ settings });
  }

  // Toggle & Input Event Listeners
  [masterToggle, toggleTraps, toggleTimers, toggleHighlight, toggleTerminator,
   toggleAntiAdblock, toggleQualityFilter, toggleSubtitle, toggleCloudUnlocker,
   toggleBatch, toggleSniffer].forEach((el) => {
    if (el) el.addEventListener('change', saveSettings);
  });

  if (rpcUrlInput) {
    rpcUrlInput.addEventListener('input', saveSettings);
  }

  // Open Test Playground
  btnTestPlayground.addEventListener('click', () => {
    const testPageUrl = chrome.runtime.getURL('test-suite/test-page.html');
    chrome.tabs.create({ url: testPageUrl });
  });

  // Reset Stats
  btnResetStats.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'reset_stats' }, (response) => {
      if (response && response.stats) {
        statTraps.innerText = '0';
        statPopups.innerText = '0';
        statLinks.innerText = '0';
      }
    });
  });
});
