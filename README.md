# ⚡ DirectDrop Pro - Popup & Download Bypasser

> **A powerful, lightweight browser extension (Manifest V3) that automates and bypasses deceptive download traps, popups, countdown timers, and extracts real direct file links.**

![Version](https://img.shields.io/badge/version-2.0.0-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Chrome%20|%20Opera%20|%20Edge%20|%20Brave-blue?style=for-the-badge)
![Manifest](https://img.shields.io/badge/manifest-v3-orange?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

## 🚀 Key Features

- **🚫 Anti-Click Trap (Invisible Overlay Neutralizer):**
  Detects and removes full-screen transparent overlays placed over download buttons, ensuring your click doesn't trigger unwanted popup ad tabs.
  
- **⏩ 20x Timer Fast-Forwarder:**
  Accelerates annoying 10–30 second "Please wait before downloading" countdowns and reveals disabled download buttons instantly.

- **🎯 Real File Glow & Ad Dimmer:**
  Scans links on the page, highlights genuine files (`.zip`, `.rar`, `.exe`, `.apk`, `.pdf`, Google Drive, Mediafire, Mega) with a glowing green border & `⚡ Verified File` badge, while dimming deceptive "START DOWNLOAD NOW" ad banners.

- **🔗 Redirect & Base64 URL Unshortener:**
  Automatically extracts the real target from wrapper redirect links (e.g., `?url=`, `?dest=`, `?target=`, Base64 strings).

- **📦 Batch Episode & Link Grabber:**
  Browsing a web series or multi-file page? DirectDrop automatically shows a floating **"📦 Grab All Links"** button to copy all clean links formatted for **IDM, Aria2, or JDownloader** in 1 click.

- **🤖 Auto Multi-Step Clicker:**
  Finds intermediate "Click here to continue", "Proceed to download", and "Get Link" buttons and automatically clicks them.

- **🎬 Video Stream Sniffer:**
  Detects HTML5 video streams (`.mp4`, `.m3u8`, `.webm`) and injects a direct **"🎬 Download Video Stream"** button.

- **🔫 Instant Tab Terminator:**
  Automatically terminates deceptive background tabs (betting, malware alerts, popunder ad networks) within 100ms.

- **🖱️ Right-Click Context Menu:**
  Right click any link ➔ **"DirectDrop: Copy Clean Link"** to strip tracking wrappers on demand.

---

## 📂 Project Structure

```
download-bypasser-extension/
├── manifest.json              # Chrome Manifest V3 configuration & permissions
├── background.js              # Service worker (tab terminator, context menus, stats)
├── content/
│   ├── page-script.js         # Main world script (window.open & timer accelerator)
│   ├── content.js             # Content script (traps, grabber, auto-clicker, sniffer)
│   └── content.css            # Dark theme styles, glowing badges & modal drawer
├── popup/
│   ├── popup.html             # Glassmorphic dark UI dashboard
│   ├── popup.css              # Custom dark theme styles
│   └── popup.js               # Settings persistence & live statistics
├── icons/                     # Extension icons (16px, 48px, 128px)
└── test-suite/
    └── test-page.html         # Interactive test playground for local testing
```

---

## 🛠️ Installation Instructions

### For Opera / Opera GX:
1. Open Opera and go to `opera://extensions`.
2. Toggle **Developer mode** in the top-right corner to **ON**.
3. Click **Load unpacked** (top-left).
4. Select this repository's folder.
5. Pin **DirectDrop** from the Extensions menu.

### For Google Chrome / Brave / Edge:
1. Navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this directory.

---

## 🧪 Testing

Open the built-in interactive playground directly from the extension popup (`🧪 Open Test Playground`) or by opening `test-suite/test-page.html` in your browser.

---

## 📄 License

MIT License. Free to use, modify, and distribute.
