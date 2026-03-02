# Software Architecture Plan
## Family Morning Timer
**Version:** 1.0  
**Date:** March 1, 2026  
**Status:** Draft — Pending decisions marked ⚠️

---

## 1. Architecture Overview

This is a **fully static, client-side single-page application (SPA)**. There is no backend, no database, no authentication, and no server-side logic. All state lives in the browser. The app is deployed as a static bundle to Vercel and optionally installable as a Progressive Web App (PWA) on the iPad home screen.

```
┌─────────────────────────────────────────────┐
│                  iPad Safari                │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         React SPA (Vite)            │    │
│  │                                     │    │
│  │  ┌──────────┐   ┌────────────────┐  │    │
│  │  │  Timer   │   │  Settings UI   │  │    │
│  │  │  Engine  │   │  (Time Picker) │  │    │
│  │  └──────────┘   └────────────────┘  │    │
│  │                                     │    │
│  │  ┌──────────┐   ┌────────────────┐  │    │
│  │  │ Wake Lock│   │  localStorage  │  │    │
│  │  │ Manager  │   │  (persistence) │  │    │
│  │  └──────────┘   └────────────────┘  │    │
│  │                                     │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │  Service Worker (offline)    │   │    │
│  │  └──────────────────────────────┘   │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                      │
              Deployed on Vercel
              (Static CDN, HTTPS)
```

---

## 2. Technology Stack

### 2.1 Framework: React + Vite

**Recommendation: Vite + React (not Next.js)**

This app has no SEO requirements, no server-side rendering needs, no API routes, and no multi-page routing. It is a single-screen, client-only tool — the textbook case for a Vite SPA. Next.js would add unnecessary complexity and build overhead for zero benefit here.

| Concern | Decision |
|---------|----------|
| Framework | React 18 |
| Build tool | Vite 5 |
| Language | TypeScript |
| Styling | Tailwind CSS (utility-first; no separate CSS files needed) |

### 2.2 PWA

**Recommendation: `vite-plugin-pwa`**

This is the de facto standard for Vite PWA integration. It wraps Google's Workbox library and handles service worker generation, web app manifest, and asset precaching with minimal configuration. It has first-class Vercel support with a documented `vercel.json` configuration pattern.

```
vite-plugin-pwa  →  generates service worker + manifest
                 →  enables "Add to Home Screen" on iPad
                 →  enables offline-first operation
```

### 2.3 Deployment: Vercel

Vercel auto-detects Vite projects and requires no special build configuration beyond a `vercel.json` for cache-control headers (required for PWA service worker correctness). HTTPS is provided automatically — required for both the Wake Lock API and PWA installation.

### 2.4 Audio

**Recommendation: Web Audio API (no library)**

For the simple departure alert chimes, the native Web Audio API is sufficient. No external audio library (e.g. Howler.js) is needed, which keeps the bundle lean. A short synthesized tone can be generated entirely in code — no audio file assets required.

⚠️ **Decision required:** Do you want a synthesized tone (no assets, always works offline) or a specific recorded sound (requires an audio file asset)? A synthesized tone is recommended for simplicity.

---

## 3. Dependencies

### 3.1 Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.x | UI framework |
| `react-dom` | ^18.x | DOM rendering |

That's it. No UI component library, no state management library, no date library is needed for MVP. The timer logic uses native `Date` objects. The time picker is a custom component (large, tappable — not a native `<input type="time">` which is too small for iPad touch).

### 3.2 Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.x | Build tool & dev server |
| `@vitejs/plugin-react` | ^4.x | React JSX transform for Vite |
| `vite-plugin-pwa` | ^0.21.x | PWA: service worker + manifest |
| `typescript` | ^5.x | Type safety |
| `tailwindcss` | ^3.x | Utility-first CSS |
| `autoprefixer` | ^10.x | CSS vendor prefixes (required by Tailwind) |
| `postcss` | ^8.x | CSS processing (required by Tailwind) |

⚠️ **Decision required:** Do you want Tailwind CSS, or do you prefer plain CSS / CSS modules? Tailwind is recommended for this project because the styling is simple and benefits from utility classes (e.g. full-screen layouts, responsive font sizes). However, it adds ~3 packages to devDependencies.

### 3.3 Intentionally Excluded

| Package | Reason excluded |
|---------|-----------------|
| React Router | Single-screen app; no routing needed |
| Redux / Zustand | State is trivial; React `useState` + `localStorage` is sufficient |
| Axios / React Query | No API calls |
| date-fns / dayjs | Native `Date` is sufficient for this use case |
| Howler.js | Web Audio API is sufficient for simple alert tones |
| Next.js | No SSR/SEO/API needs; adds complexity for zero benefit |

---

## 4. Application State

All state is client-side only. No backend. No accounts.

### 4.1 Persisted State (localStorage)

```typescript
interface PersistedSettings {
  departureTime: string;      // "08:30" — HH:MM format
  audioEnabled: boolean;      // default: false
  audioAlertMinutes: number[]; // default: [5, 1] — alert at 5min and 1min remaining
}
```

Stored under a single localStorage key: `"gotime:settings"`.

### 4.2 Runtime State (React state, not persisted)

```typescript
type TimerStatus = "idle" | "running" | "paused" | "finished";

interface RuntimeState {
  status: TimerStatus;
  secondsRemaining: number;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
}
```

---

## 5. Component Architecture

```
App
├── TimerScreen          — full-screen gradient display (shown when running)
│   ├── CountdownDisplay — large time remaining (HH:MM:SS)
│   ├── DepartureLabel   — "Out the door by 8:30 AM"
│   ├── GradientOverlay  — CSS background, color driven by % remaining
│   └── TimerControls    — Pause / Edit buttons (de-emphasized)
│
├── SetupScreen          — shown on first load or when editing
│   ├── TimePicker       — large, custom tappable time input
│   └── StartButton      — primary CTA
│
├── CelebrationScreen    — shown for 5s after reaching 0:00
│
└── WakeLockIndicator    — subtle status icon (shared across screens)
```

---

## 6. Timer Engine

The timer uses `Date`-based calculation rather than `setInterval` tick-counting to prevent drift over a 30–60 minute countdown.

```typescript
// On start: record the target departure datetime
const target = new Date();
target.setHours(departureHour, departureMinutes, 0, 0);

// On each tick (setInterval at 1000ms):
const secondsRemaining = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
```

This means the displayed time is always accurate relative to the wall clock, even if the browser throttles the interval (e.g. when the tab is briefly backgrounded).

**Edge case:** If the departure time has already passed when the user taps Start (e.g. they set 8:30 but it's already 8:35), the timer shows 0:00 immediately. A warning message should prompt them to set a future time.

⚠️ **Decision required:** Should the timer support next-day rollover? For example, if it's 11 PM and a parent sets 7:30 AM, should it count down to tomorrow's 7:30 AM automatically? This is a quality-of-life feature but requires slightly more date logic. **Recommendation: yes, support this**, as the tablet is always-on and a parent might configure it the night before.

---

## 7. Wake Lock Implementation

```typescript
let wakeLock: WakeLockSentinel | null = null;

const requestWakeLock = async () => {
  if (!("wakeLock" in navigator)) return; // unsupported, fail silently
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch (err) {
    // Denied (e.g. Low Power Mode) — fail silently, show subtle UI notice
  }
};

// Re-acquire when tab regains visibility
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && timerIsRunning) {
    requestWakeLock();
  }
});
```

### Important: PWA vs Browser Wake Lock Behavior

| Context | Wake Lock Behavior |
|---------|-------------------|
| Safari browser tab | ✅ Works on iPadOS 16.4+ |
| Installed PWA (Home Screen) | ✅ Works on iPadOS **18.4+** (fixed March 2025) |
| Installed PWA on iPadOS < 18.4 | ❌ Broken — wake lock silently fails |

⚠️ **Decision required:** The app will prompt users to install it as a PWA (Add to Home Screen) for the best full-screen experience. However, wake lock in installed PWAs only works reliably on **iPadOS 18.4 and later**. Should we:

- **Option A:** Encourage PWA installation, note the iPadOS 18.4 requirement in onboarding
- **Option B:** Recommend running in Safari browser tab instead of installing as PWA (wake lock works on 16.4+, but browser chrome is visible)
- **Option C:** Support both, detect context, and show appropriate guidance

**Recommendation: Option A** — iPadOS 18.4 was released March 2025 and is likely on most current iPads. If this is a concern, confirm the target iPad's OS version before launch.

---

## 8. PWA Configuration

The app will be installable as a PWA for a full-screen, no-browser-chrome experience on the iPad home screen.

```typescript
// vite.config.ts (relevant excerpt)
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png"],
  manifest: {
    name: "GoTime",              // ⚠️ placeholder — update with final app name
    short_name: "GoTime",
    display: "standalone",       // hides browser chrome when installed
    background_color: "#22c55e", // green — matches initial timer state
    theme_color: "#22c55e",
    orientation: "landscape",    // ⚠️ decision: landscape-primary or 'any'?
    icons: [
      { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
  }
})
```

⚠️ **Decision required:** Should the PWA orientation be locked to `landscape` (recommended for a mounted kitchen tablet) or `any` (allows portrait use)? Locking to landscape ensures the design is always as intended but prevents portrait use on a phone or non-mounted tablet.

---

## 9. Vercel Deployment Configuration

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*).html",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

This configuration ensures:
- HTML and the service worker are never cached (so updates are picked up immediately)
- Hashed JS/CSS assets are cached aggressively (performance)
- HTTPS is provided by Vercel automatically (required for Wake Lock API and PWA)

Deployment is triggered by a `git push` to the connected GitHub repository. No additional build configuration is needed — Vercel auto-detects Vite.

---

## 10. File Structure

```
gotime/
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── main.tsx                  — app entry point
│   ├── App.tsx                   — root component, screen routing
│   ├── components/
│   │   ├── TimerScreen.tsx
│   │   ├── CountdownDisplay.tsx
│   │   ├── GradientOverlay.tsx
│   │   ├── SetupScreen.tsx
│   │   ├── TimePicker.tsx
│   │   ├── CelebrationScreen.tsx
│   │   └── WakeLockIndicator.tsx
│   ├── hooks/
│   │   ├── useTimer.ts           — timer engine logic
│   │   ├── useWakeLock.ts        — wake lock management
│   │   └── useSettings.ts        — localStorage persistence
│   ├── utils/
│   │   └── audio.ts              — Web Audio API alert tones
│   └── types.ts                  — shared TypeScript types
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
├── tsconfig.json
├── vercel.json
└── package.json
```

---

## 11. Open Decisions Summary

The following decisions require your input before build begins:

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Alert sound type | Synthesized tone vs. recorded audio file | Synthesized tone (simpler, no assets) |
| 2 | CSS approach | Tailwind CSS vs. plain CSS | Tailwind CSS |
| 3 | Next-day rollover | Count down to tomorrow if time has passed | Yes — support it |
| 4 | PWA wake lock approach | Option A (install + note iOS req) / B (browser tab) / C (detect + guide) | Option A |
| 5 | PWA orientation lock | `landscape` only vs. `any` | Landscape (mounted tablet use case) |

---

## 12. What Is Explicitly Out of Scope

To keep the architecture lean and the build focused, the following are **not** part of this architecture:

- Backend / API server of any kind
- User accounts or authentication
- Database
- Push notifications
- Analytics or error tracking (can be added later with e.g. Vercel Analytics)
- Multi-device sync
- Per-person task checklists

---

*Document owner: Engineering  
Last updated: March 1, 2026*
