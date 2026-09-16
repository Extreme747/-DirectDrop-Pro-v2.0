// DirectDrop v2.0 Popup Controller
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const masterToggle = document.getElementById('masterToggle');
  const toggleTraps = document.getElementById('toggleTraps');
  const toggleTimers = document.getElementById('toggleTimers');
  const toggleHighlight = document.getElementById('toggleHighlight');
  const toggleUnwrap = document.getElementById('toggleUnwrap');
  const toggleTerminator = document.getElementById('toggleTerminator');
  const toggleBatch = document.getElementById('toggleBatch');
  const toggleStepClicker = document.getElementById('toggleStepClicker');
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

    // Apply settings
    masterToggle.checked = settings.enabled !== false;
    toggleTraps.checked = settings.killTraps !== false;
    toggleTimers.checked = settings.skipTimers !== false;
    toggleHighlight.checked = settings.highlightLinks !== false;
    toggleUnwrap.checked = settings.unwrapRedirects !== false;
    toggleTerminator.checked = settings.tabTerminator !== false;
    toggleBatch.checked = settings.batchGrabber !== false;
    toggleStepClicker.checked = settings.autoStepClicker !== false;
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
      unwrapRedirects: toggleUnwrap.checked,
      tabTerminator: toggleTerminator.checked,
      batchGrabber: toggleBatch.checked,
      autoStepClicker: toggleStepClicker.checked,
      streamSniffer: toggleSniffer.checked
    };
    chrome.storage.local.set({ settings });
  }

  // Toggle Event Listeners
  [masterToggle, toggleTraps, toggleTimers, toggleHighlight, toggleUnwrap,
   toggleTerminator, toggleBatch, toggleStepClicker, toggleSniffer].forEach(el => {
    if (el) el.addEventListener('change', saveSettings);
  });

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
