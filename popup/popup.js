// DirectDrop Pro v4.0 Productivity & Dev Suite - Popup Controller
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabBtnShields = document.getElementById('tabBtnShields');
  const tabBtnTools = document.getElementById('tabBtnTools');
  const tabBtnDev = document.getElementById('tabBtnDev');

  const tabContentShields = document.getElementById('tabContentShields');
  const tabContentTools = document.getElementById('tabContentTools');
  const tabContentDev = document.getElementById('tabContentDev');

  function switchTab(activeBtn, activeContent) {
    [tabBtnShields, tabBtnTools, tabBtnDev].forEach(b => b.classList.remove('active'));
    [tabContentShields, tabContentTools, tabContentDev].forEach(c => c.style.display = 'none');
    activeBtn.classList.add('active');
    activeContent.style.display = 'block';
  }

  tabBtnShields.addEventListener('click', () => switchTab(tabBtnShields, tabContentShields));
  tabBtnTools.addEventListener('click', () => switchTab(tabBtnTools, tabContentTools));
  tabBtnDev.addEventListener('click', () => switchTab(tabBtnDev, tabContentDev));

  // Elements
  const masterToggle = document.getElementById('masterToggle');
  const toggleSilentMode = document.getElementById('toggleSilentMode');
  const toggleYtAdblock = document.getElementById('toggleYtAdblock');
  const toggleYtHideShorts = document.getElementById('toggleYtHideShorts');
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

  const webhookUrlInput = document.getElementById('webhookUrlInput');
  const btnOpenSwissKnife = document.getElementById('btnOpenSwissKnife');
  const btnQuickMockFill = document.getElementById('btnQuickMockFill');
  const btnQuickSummarize = document.getElementById('btnQuickSummarize');
  const btnSniffAssets = document.getElementById('btnSniffAssets');
  const toggleGithubActions = document.getElementById('toggleGithubActions');
  const toggleHeadlessExport = document.getElementById('toggleHeadlessExport');

  const statTraps = document.getElementById('statTraps');
  const statPopups = document.getElementById('statPopups');
  const statYtAds = document.getElementById('statYtAds');

  const btnTestPlayground = document.getElementById('btnTestPlayground');
  const btnResetStats = document.getElementById('btnResetStats');

  // Load Settings & Stats
  chrome.storage.local.get(['settings', 'stats'], (data) => {
    const settings = data.settings || {};
    const stats = data.stats || {};

    masterToggle.checked = settings.enabled !== false;
    toggleSilentMode.checked = settings.silentMode !== false;
    toggleYtAdblock.checked = settings.youtubeAdblock !== false;
    toggleYtHideShorts.checked = settings.youtubeHideShorts === true;
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

    webhookUrlInput.value = settings.webhookUrl || '';
    toggleGithubActions.checked = settings.githubActions !== false;
    toggleHeadlessExport.checked = settings.headlessExport !== false;

    // Apply stats
    statTraps.innerText = stats.trapsNeutralized || 0;
    statPopups.innerText = (stats.popupsBlocked || 0) + (stats.tabsTerminated || 0);
    statYtAds.innerText = stats.youtubeAdsSkipped || 0;
  });

  // Save Settings Helper
  function saveSettings() {
    const settings = {
      enabled: masterToggle.checked,
      silentMode: toggleSilentMode.checked,
      youtubeAdblock: toggleYtAdblock.checked,
      youtubeHideShorts: toggleYtHideShorts.checked,
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
      webhookUrl: webhookUrlInput.value.trim(),
      githubActions: toggleGithubActions.checked,
      headlessExport: toggleHeadlessExport.checked,
      streamSniffer: true,
      unwrapRedirects: true
    };
    chrome.storage.local.set({ settings });
  }

  // Event Listeners for toggles
  [masterToggle, toggleSilentMode, toggleYtAdblock, toggleYtHideShorts,
   toggleTraps, toggleTimers, toggleHighlight, toggleTerminator, toggleAntiAdblock,
   toggleQualityFilter, toggleSubtitle, toggleCloudUnlocker, toggleBatch,
   toggleGithubActions, toggleHeadlessExport].forEach((el) => {
    if (el) el.addEventListener('change', saveSettings);
  });

  if (rpcUrlInput) rpcUrlInput.addEventListener('input', saveSettings);
  if (webhookUrlInput) webhookUrlInput.addEventListener('input', saveSettings);

  // Send message to active tab helper
  function sendToActiveTab(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action }).catch(() => {});
        window.close();
      }
    });
  }

  // Dev Quick Actions
  if (btnOpenSwissKnife) {
    btnOpenSwissKnife.addEventListener('click', () => sendToActiveTab('trigger_swiss_knife'));
  }

  if (btnQuickMockFill) {
    btnQuickMockFill.addEventListener('click', () => sendToActiveTab('trigger_mock_fill'));
  }

  if (btnQuickSummarize) {
    btnQuickSummarize.addEventListener('click', () => sendToActiveTab('trigger_summarizer'));
  }

  if (btnSniffAssets) {
    btnSniffAssets.addEventListener('click', () => sendToActiveTab('trigger_asset_sniffer'));
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
        statYtAds.innerText = '0';
      }
    });
  });
});
