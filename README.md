# ⚡ DirectDrop Pro v3.0 - Ultimate OLED Edition

> **A powerful, ultra-fast browser extension (Manifest V3) designed for pitch-black OLED aesthetics, bypassing download traps, unlocking direct server links, filtering quality resolutions, and integrating with Motrix & Aria2.**

![Version](https://img.shields.io/badge/version-3.0.0-emerald?style=for-the-badge)
![Theme](https://img.shields.io/badge/theme-OLED%20Pitch%20Black-black?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Opera%20|%20Chrome%20|%20Edge%20|%20Brave-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

## 🖤 What's New in v3.0 OLED Edition

- **🖤 Pure OLED Pitch-Black UI/UX:**
  True pitch-black (`#000000`) theme with neon emerald & electric cyan accents, frosted glass backdrop blur, and micro-animations.

- **🎛️ Smart Quality Filter Tabs in Batch Grabber:**
  Instantly categorize series episodes and movies into dedicated resolution tabs:
  - `[All (N)]`
  - `[4K UHD]`
  - `[1080p FHD]`
  - `[720p HD]`
  - `[480p SD]`
  Plus real-time episode search and automatic filename cleanup (removes `www.hdhub4u...` noise).

- **🚀 1-Click Send to Motrix / Aria2 (Zero-Copy Downloads):**
  Direct JSON-RPC bridge (`http://localhost:6800/jsonrpc`). Click "🚀 Send to Motrix/Aria2" and your desktop download manager immediately starts the queue.

- **💬 Auto Subtitle (.SRT) Finder:**
  One click searches and grabs matching English & Hindi `.srt` subtitles for the active movie or series.

- **☁️ GDrive Quota & TeraBox Bypasser:**
  Auto-detects Google Drive "Download quota exceeded" errors and provides instant mirror download bypasses.

- **🛡️ Whitelisted Server Engine (Zero False Positives):**
  Guaranteed smooth downloading on HubCloud, GamerX, FSL Server, PixelServer, BuzzServer, MediaFire, Mega, GDrive, and 1fichier.

- **🛡️ Anti-Anti-AdBlocker:**
  Automatically destroys "Please disable AdBlocker" popups and unfreezes blurred pages.

---

## 📂 Repository Structure

```
download-bypasser-extension/
├── manifest.json              # Chrome Manifest V3 configuration (v3.0.0)
├── background.js              # Service worker (tab terminator, context menus, stats)
├── content/
│   ├── page-script.js         # Main world script (safe timer & window.open filter)
│   ├── content.js             # Batch grabber, quality sorter, Aria2 RPC & unshortener
│   └── content.css            # OLED pitch-black modal, quality pills & verified badges
├── popup/
│   ├── popup.html             # OLED tabbed dashboard (Shields & Downloader tools)
│   ├── popup.css              # Custom pitch-black styles
│   └── popup.js               # Settings & live statistics controller
├── icons/                     # Extension icons (16px, 48px, 128px)
└── test-suite/
    └── test-page.html         # Interactive test playground
```

---

## 🛠️ Installation & Updating (Opera / Chrome / Edge)

1. Open `opera://extensions` (or `chrome://extensions`).
2. Make sure **Developer mode** is **ON**.
3. If already installed: Click the **Reload (🔄)** button on the DirectDrop card!
4. If fresh install: Click **Load unpacked** and select this folder.

---

## 📄 License
MIT License. Free to use, modify, and distribute.
