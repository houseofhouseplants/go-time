# Implementation Plan — Family Morning Timer
## claude-flow Multi-Agent Execution Guide
**Version:** 1.0  
**Date:** March 1, 2026  
**Status:** Ready for execution  
**Target:** Local build → Vercel deployment

---

## How to Use This Document

This plan is structured for execution by claude-flow using specialist subagents. Each phase defines:
- Which agent is responsible
- Exactly which files that agent owns (no two agents touch the same files)
- The **contract** the agent must produce before the next wave begins
- Acceptance criteria to validate completion

Run phases sequentially. Within a phase, tasks marked **PARALLEL** can run concurrently.

---

## Project Bootstrap (Run Once, Before Any Agent)

Before spawning any agent, run these commands in your terminal to initialize the project:

```bash
# 1. Create project
npm create vite@latest gotime -- --template react-ts
cd gotime

# 2. Install all dependencies upfront
npm install
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p

# 3. Initialize git
git init
git add .
git commit -m "chore: initial vite scaffold"

# 4. Create the .claude directory structure
mkdir -p .claude/agents

# 5. Create folder structure
mkdir -p src/components src/hooks src/utils public
```

Then open Claude Code in this directory and execute each phase below.

---

## CLAUDE.md

Place this file at the project root before running any agent. It is loaded automatically by every agent.

```markdown
# GoTime — Family Morning Timer

## Stack
- React 18 + TypeScript + Vite 5
- Tailwind CSS (utility classes only, no custom CSS files)
- vite-plugin-pwa for PWA/service worker
- No backend. No database. No routing library.
- Single-page app. One screen at a time.

## Core Rules
- NEVER use localStorage directly — always go through `src/hooks/useSettings.ts`
- NEVER use setInterval for time calculation — use Date-based arithmetic only
- NEVER create separate CSS files — Tailwind classes inline only
- NEVER add dependencies not listed in this file without flagging to the user
- All components must be in `src/components/`, all hooks in `src/hooks/`, all utils in `src/utils/`
- TypeScript strict mode is on. No `any` types.
- Departure time is stored as "HH:MM" string (24h format internally, display in 12h)

## Key Types (defined in src/types.ts — do not redefine)
- `TimerStatus`: "idle" | "running" | "paused" | "finished"
- `PersistedSettings`: { departureTime: string; audioEnabled: boolean; audioAlertMinutes: number[] }
- `RuntimeState`: { status: TimerStatus; secondsRemaining: number; wakeLockActive: boolean; wakeLockSupported: boolean }

## Dev Commands
- `npm run dev` — local dev server at localhost:5173
- `npm run build` — production build to /dist
- `npm run preview` — preview production build locally
```

---

## Phase 1 — Foundation
**Goal:** Shared types, settings persistence, and project config locked in. All agents depend on these contracts.

### Agent: `scaffold-agent`

**Spawn prompt:**
```
You are the scaffold-agent. Set up the project foundation for GoTime, a React+TypeScript+Vite family morning timer app. Read CLAUDE.md before starting.

YOUR FILES (only touch these):
- src/types.ts
- src/hooks/useSettings.ts
- tailwind.config.ts
- vite.config.ts
- index.html
- src/main.tsx
- src/index.css

YOUR TASKS:
1. Write src/types.ts with these exact exports:
   - TimerStatus type: "idle" | "running" | "paused" | "finished"
   - PersistedSettings interface: { departureTime: string; audioEnabled: boolean; audioAlertMinutes: number[] }
   - RuntimeState interface: { status: TimerStatus; secondsRemaining: number; wakeLockActive: boolean; wakeLockSupported: boolean }

2. Write src/hooks/useSettings.ts
   - Reads/writes to localStorage key "gotime:settings"
   - Returns { settings, updateSettings } 
   - Default departure time: "08:30"
   - Default audioEnabled: false
   - Default audioAlertMinutes: [5, 1]
   - Must handle missing/corrupt localStorage gracefully (try/catch, fall back to defaults)

3. Configure tailwind.config.ts to scan src/**/*.{ts,tsx}

4. Configure vite.config.ts with:
   - @vitejs/plugin-react
   - vite-plugin-pwa with manifest: name "GoTime", display "standalone", orientation "landscape", background_color "#16a34a", theme_color "#16a34a"
   - PWA icons placeholder (reference public/pwa-192x192.png and public/pwa-512x512.png — files don't need to exist yet)

5. Set index.html title to "GoTime"

6. Set src/index.css to only: @tailwind base; @tailwind components; @tailwind utilities;

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "PHASE 1 CONTRACT":
{
  "types_exported": ["TimerStatus", "PersistedSettings", "RuntimeState"],
  "settings_key": "gotime:settings",
  "settings_defaults": { "departureTime": "08:30", "audioEnabled": false, "audioAlertMinutes": [5, 1] },
  "pwa_manifest_name": "GoTime"
}
```

**Acceptance criteria:**
- `npm run dev` launches without errors
- `useSettings` hook returns correct defaults on fresh load
- TypeScript compiles with zero errors (`npx tsc --noEmit`)

---

## Phase 2 — Core Logic
**Goal:** Timer engine and Wake Lock manager built and tested in isolation. These are the two most critical pieces of business logic.

**Depends on:** Phase 1 contract  
**Can run:** PARALLEL (timer-agent and wakelock-agent simultaneously)

---

### Agent: `timer-agent` (PARALLEL)

**Spawn prompt:**
```
You are the timer-agent. Build the core timer engine hook for GoTime. Read CLAUDE.md before starting.

UPSTREAM CONTRACT (Phase 1):
- src/types.ts exports: TimerStatus, PersistedSettings, RuntimeState
- src/hooks/useSettings.ts exports: useSettings()

YOUR FILES (only touch these):
- src/hooks/useTimer.ts

YOUR TASKS:
Write src/hooks/useTimer.ts that exports useTimer(departureTime: string):

Interface:
{
  status: TimerStatus,
  secondsRemaining: number,
  formattedTimeRemaining: string,   // "HH:MM:SS" or "MM:SS" when < 1hr
  percentRemaining: number,          // 0-100, used for gradient
  start: () => void,
  pause: () => void,
  reset: () => void,
  targetTime: Date | null
}

Rules:
- Use Date-based countdown (not setInterval tick counting): 
    const secondsRemaining = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
- setInterval at 500ms for smooth UI updates
- If departure time has already passed today, automatically roll over to tomorrow's date
- If secondsRemaining reaches 0, set status to "finished" and clear interval
- percentRemaining: calculate based on total seconds from start to target (not hardcoded duration)
- Store totalSeconds at start time to compute percent: (secondsRemaining / totalSeconds) * 100
- Cleanup interval on unmount

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "TIMER CONTRACT":
{
  "hook_name": "useTimer",
  "exports": ["status", "secondsRemaining", "formattedTimeRemaining", "percentRemaining", "start", "pause", "reset", "targetTime"],
  "rollover_supported": true,
  "drift_safe": true
}
```

**Acceptance criteria:**
- Hook compiles with zero TypeScript errors
- Rollover logic tested manually: set departure time to a time 1 minute in the past, verify it counts to ~23h59m not negative
- `percentRemaining` decreases from 100 toward 0

---

### Agent: `wakelock-agent` (PARALLEL)

**Spawn prompt:**
```
You are the wakelock-agent. Build the Wake Lock manager hook for GoTime. Read CLAUDE.md before starting.

UPSTREAM CONTRACT (Phase 1):
- src/types.ts exports RuntimeState (contains wakeLockActive, wakeLockSupported)

YOUR FILES (only touch these):
- src/hooks/useWakeLock.ts

YOUR TASKS:
Write src/hooks/useWakeLock.ts that exports useWakeLock():

Interface:
{
  wakeLockActive: boolean,
  wakeLockSupported: boolean,
  requestWakeLock: () => Promise<void>,
  releaseWakeLock: () => Promise<void>
}

Rules:
- Check for support: wakeLockSupported = "wakeLock" in navigator
- requestWakeLock: call navigator.wakeLock.request("screen"), store sentinel, catch errors silently (set wakeLockActive false on failure)
- releaseWakeLock: call sentinel.release() if sentinel exists
- Listen for visibilitychange: re-acquire lock automatically when document becomes visible again AND wakeLockActive was true
- Cleanup sentinel on unmount
- Never throw — all errors caught internally, surface via wakeLockActive boolean only

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "WAKELOCK CONTRACT":
{
  "hook_name": "useWakeLock",
  "exports": ["wakeLockActive", "wakeLockSupported", "requestWakeLock", "releaseWakeLock"],
  "auto_reacquire": true,
  "silent_fail": true
}
```

**Acceptance criteria:**
- Hook compiles with zero TypeScript errors
- No unhandled promise rejections in browser console
- `wakeLockSupported` is `false` on unsupported environments (not an error)

---

### Agent: `audio-agent` (PARALLEL)

**Spawn prompt:**
```
You are the audio-agent. Build the audio alert utility for GoTime. Read CLAUDE.md before starting.

YOUR FILES (only touch these):
- src/utils/audio.ts

YOUR TASKS:
Write src/utils/audio.ts that exports:

1. playAlertTone(type: "warning" | "final"): void
   - Use Web Audio API only (no audio files, no external libraries)
   - "warning" tone: gentle two-note ascending chime (~0.3s), played at 5-minute mark
   - "final" tone: slightly more urgent three-note sequence (~0.5s), played at 1-minute mark
   - Both tones: soft volume (gain 0.3), sine wave oscillator, fade out (exponential ramp)
   - Must handle AudioContext creation lazily (create on first call, reuse after)
   - Must handle browsers that block AudioContext before user gesture: catch and ignore silently

2. isAudioSupported(): boolean
   - Returns true if window.AudioContext or window.webkitAudioContext exists

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "AUDIO CONTRACT":
{
  "exports": ["playAlertTone", "isAudioSupported"],
  "no_assets_required": true,
  "silent_fail": true
}
```

**Acceptance criteria:**
- Compiles with zero TypeScript errors
- `playAlertTone("warning")` produces a sound in browser without errors
- No audio files added to `/public`

---

## Phase 3 — UI Components
**Goal:** All visual components built. Each owns specific files with no overlap.

**Depends on:** Phase 2 contracts (timer, wakelock, audio)  
**Can run:** PARALLEL (gradient-agent and screens-agent simultaneously)

---

### Agent: `gradient-agent` (PARALLEL)

**Spawn prompt:**
```
You are the gradient-agent. Build the full-screen gradient display component for GoTime. Read CLAUDE.md before starting.

UPSTREAM CONTRACTS:
- useTimer() exports: percentRemaining (0-100), formattedTimeRemaining, status
- Tailwind CSS is available

YOUR FILES (only touch these):
- src/components/GradientBackground.tsx
- src/components/CountdownDisplay.tsx
- src/components/WakeLockIndicator.tsx

YOUR TASKS:

1. GradientBackground.tsx
   Props: { percentRemaining: number; children: React.ReactNode }
   - Full screen div (w-screen h-screen) with smooth background color transition
   - Color mapping (use inline style for dynamic values, not Tailwind for the color itself):
       100–60%: hsl(142, 76%, 36%)   → green  (#16a34a)
       60–30%:  interpolate green → hsl(45, 93%, 47%)  → yellow (#eab308)
       30–10%:  interpolate yellow → hsl(25, 95%, 53%) → orange (#f97316)
       10–0%:   interpolate orange → hsl(0, 84%, 60%)  → red    (#ef4444)
   - Color transition must be CSS smooth: use `transition: background-color 1s ease`
   - Interpolate the HSL values mathematically based on percentRemaining
   - Children rendered centered in the screen

2. CountdownDisplay.tsx
   Props: { formattedTime: string; departureLabel: string; status: TimerStatus }
   - Large centered time display: white text, font size responsive (use Tailwind: text-8xl md:text-9xl)
   - Below it: departureLabel in smaller white text (text-xl opacity-80)
   - When status === "finished": show "Time to go! 🎉" instead of time
   - Font weight: bold. Letter spacing: wide. Drop shadow for legibility.

3. WakeLockIndicator.tsx
   Props: { active: boolean; supported: boolean }
   - Small, subtle indicator in the bottom-right corner
   - If supported + active: show a small green/white lock icon (use a unicode symbol: 🔒) with "Screen on" label
   - If supported + NOT active: show 🔓 with "Screen may sleep" in muted text
   - If not supported: render nothing
   - Tailwind: absolute bottom-4 right-4, text-xs, text-white/60

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "GRADIENT CONTRACT":
{
  "components": ["GradientBackground", "CountdownDisplay", "WakeLockIndicator"],
  "props_interfaces_exported": true,
  "no_custom_css_files": true
}
```

---

### Agent: `screens-agent` (PARALLEL)

**Spawn prompt:**
```
You are the screens-agent. Build the Setup, Controls, and Celebration screens for GoTime. Read CLAUDE.md before starting.

UPSTREAM CONTRACTS:
- useSettings() exports: settings (PersistedSettings), updateSettings
- useTimer() exports: start, pause, reset, status, targetTime
- Tailwind CSS available
- GradientBackground, CountdownDisplay, WakeLockIndicator exist in src/components/ (do not modify)

YOUR FILES (only touch these):
- src/components/TimePicker.tsx
- src/components/SetupScreen.tsx
- src/components/TimerControls.tsx
- src/components/CelebrationScreen.tsx

YOUR TASKS:

1. TimePicker.tsx
   Props: { value: string; onChange: (time: string) => void }
   - value and onChange use "HH:MM" 24h format internally
   - Display in 12h format with AM/PM
   - Large, finger-friendly tappable UI — NO native <input type="time"> (too small for iPad)
   - Show hours and minutes as large tappable number columns
   - Tap up/down arrows to increment/decrement hours and minutes
   - Hours: 1–12, Minutes: 00, 05, 10...55 (5-minute increments)
   - AM/PM toggle button

2. SetupScreen.tsx
   Props: { onStart: () => void }
   - Full-screen centered layout on a dark green background (#15803d)
   - App name "GoTime" at top, large and white
   - Tagline: "What time do you leave?" in white/80
   - TimePicker component in the center
   - Large "Start Morning" primary button (white bg, green text, large rounded, full-width-ish)
   - Small text below button: "We'll remember this time tomorrow"

3. TimerControls.tsx
   Props: { status: TimerStatus; onPause: () => void; onReset: () => void; onEdit: () => void }
   - Rendered as a subtle overlay at the BOTTOM of the timer screen
   - De-emphasized: small, low opacity (opacity-60, hover:opacity-100)
   - Three small buttons: "Pause" / "Resume", "Reset", "Edit Time"
   - When status === "running": show Pause; when "paused": show Resume
   - Do NOT make these visually prominent — they should not distract from the countdown

4. CelebrationScreen.tsx
   Props: { onReset: () => void }
   - Full screen, bright green background
   - Large centered text: "You made it! 🎉"
   - Subtext: "Great morning, team."
   - Auto-dismisses after 5 seconds (useEffect + setTimeout → onReset)
   - Progress bar showing the 5-second countdown to auto-dismiss
   - Small "Start over" button for manual dismiss

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "SCREENS CONTRACT":
{
  "components": ["TimePicker", "SetupScreen", "TimerControls", "CelebrationScreen"],
  "no_native_time_input": true,
  "auto_dismiss_seconds": 5
}
```

---

## Phase 4 — Assembly
**Goal:** Wire all components and hooks together in App.tsx. One agent, no parallelism needed.

**Depends on:** All Phase 3 contracts

### Agent: `assembly-agent`

**Spawn prompt:**
```
You are the assembly-agent. Wire together all components and hooks into the final App.tsx for GoTime. Read CLAUDE.md before starting.

UPSTREAM CONTRACTS — all of these exist and compile:
- src/types.ts: TimerStatus, PersistedSettings, RuntimeState
- src/hooks/useSettings.ts: useSettings()
- src/hooks/useTimer.ts: useTimer(departureTime)
- src/hooks/useWakeLock.ts: useWakeLock()
- src/utils/audio.ts: playAlertTone(), isAudioSupported()
- src/components/GradientBackground.tsx
- src/components/CountdownDisplay.tsx
- src/components/WakeLockIndicator.tsx
- src/components/SetupScreen.tsx
- src/components/TimePicker.tsx
- src/components/TimerControls.tsx
- src/components/CelebrationScreen.tsx

YOUR FILES (only touch these):
- src/App.tsx

YOUR TASKS:
Write src/App.tsx that:

1. STATE MANAGEMENT
   - useSettings() for persisted departure time + audio prefs
   - useTimer(settings.departureTime) for countdown engine
   - useWakeLock() for screen management
   - Local state: showSetup (boolean) — true if status === "idle", false once running

2. SCREEN ROUTING (no router library — just conditional rendering)
   - showSetup === true → render SetupScreen
   - status === "running" || status === "paused" → render timer view
   - status === "finished" → render CelebrationScreen
   - Timer view = GradientBackground wrapping CountdownDisplay + TimerControls + WakeLockIndicator

3. START FLOW
   - SetupScreen onStart: call timer.start(), call requestWakeLock(), set showSetup false

4. EDIT FLOW
   - TimerControls onEdit: call timer.reset(), set showSetup true (takes user back to setup)

5. RESET FLOW (after celebration)
   - CelebrationScreen onReset: call timer.reset(), call releaseWakeLock(), set showSetup true

6. AUDIO ALERTS
   - useEffect watching secondsRemaining
   - When secondsRemaining hits 300 (5 min) AND settings.audioEnabled: playAlertTone("warning")
   - When secondsRemaining hits 60 (1 min) AND settings.audioEnabled: playAlertTone("final")
   - Use a ref to track which alerts have already fired (reset on timer.reset())

7. DEPARTURE LABEL
   - Compute from settings.departureTime: "Out the door by 8:30 AM"
   - Pass to CountdownDisplay as departureLabel

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "ASSEMBLY CONTRACT":
{
  "screens": ["setup", "timer", "celebration"],
  "hooks_used": ["useSettings", "useTimer", "useWakeLock"],
  "audio_integrated": true,
  "no_router_library": true
}
```

**Acceptance criteria:**
- `npm run dev` — app loads, full flow works: setup → timer → celebration → back to setup
- No TypeScript errors
- Wake lock requested on start, released on reset
- Departure time persists after page refresh

---

## Phase 5 — Polish & PWA
**Goal:** Icons, meta tags, Vercel config, and PWA manifest finalized.

**Depends on:** Phase 4 (working app)  
**Can run:** PARALLEL

---

### Agent: `pwa-agent` (PARALLEL)

**Spawn prompt:**
```
You are the pwa-agent. Finalize PWA configuration and Vercel deployment setup for GoTime. Read CLAUDE.md before starting.

YOUR FILES (only touch these):
- vite.config.ts (PWA section only — do not touch plugin-react config)
- vercel.json
- public/favicon.svg (create a simple green clock SVG)

YOUR TASKS:

1. Finalize vite-plugin-pwa config in vite.config.ts:
   - name: "GoTime"
   - short_name: "GoTime"  
   - description: "Family morning countdown timer"
   - display: "standalone"
   - orientation: "landscape"
   - background_color: "#16a34a"
   - theme_color: "#16a34a"
   - start_url: "/"
   - scope: "/"
   - icons: reference pwa-192x192.png and pwa-512x512.png (maskable)
   - workbox globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
   - registerType: "autoUpdate"

2. Create vercel.json:
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

3. Create public/favicon.svg — a simple green circle with a white clock face (use basic SVG shapes, no external assets)

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "PWA CONTRACT":
{
  "manifest_complete": true,
  "vercel_json_created": true,
  "service_worker_strategy": "autoUpdate"
}
```

---

### Agent: `a11y-agent` (PARALLEL)

**Spawn prompt:**
```
You are the a11y-agent. Add accessibility and iPad-specific polish to GoTime. Read CLAUDE.md before starting.

Do NOT modify component logic — only add aria attributes, meta tags, and viewport settings.

YOUR FILES (only touch these):
- index.html
- src/components/CountdownDisplay.tsx (aria attributes only)
- src/components/TimerControls.tsx (aria attributes only)

YOUR TASKS:

1. index.html — add to <head>:
   - <meta name="apple-mobile-web-app-capable" content="yes">
   - <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   - <meta name="apple-mobile-web-app-title" content="GoTime">
   - <link rel="apple-touch-icon" href="/pwa-192x192.png">
   - viewport: width=device-width, initial-scale=1.0, user-scalable=no (prevent pinch zoom on tablet)

2. CountdownDisplay.tsx — add:
   - role="timer" on the countdown element
   - aria-live="polite" so screen readers announce time changes
   - aria-label that reads the full time (e.g., "32 minutes and 15 seconds remaining")

3. TimerControls.tsx — add:
   - aria-label on each button ("Pause timer", "Reset timer", "Edit departure time")
   - aria-pressed on pause/resume button

CONTRACT YOU MUST PRODUCE:
After completing, output a JSON block labeled "A11Y CONTRACT":
{
  "apple_pwa_meta_tags": true,
  "timer_aria_live": true,
  "pinch_zoom_disabled": true
}
```

---

## Phase 6 — Validation
**Goal:** Final build passes, local preview confirmed, ready for Vercel.

**Depends on:** All Phase 5 contracts  
**Single agent, no parallelism**

### Agent: `validator-agent`

**Spawn prompt:**
```
You are the validator-agent. Validate that GoTime is production-ready. Read CLAUDE.md before starting.

YOUR FILES: Read-only access to all files. Fix only what is broken.

YOUR TASKS — run these in order and report results:

1. TypeScript check:
   npx tsc --noEmit
   → Must exit with 0 errors

2. Production build:
   npm run build
   → Must complete without errors
   → Check dist/ contains: index.html, sw.js, assets/, manifest.webmanifest

3. Preview build:
   npm run preview
   → Open http://localhost:4173 and verify:
     a. App loads on first visit
     b. Setup screen appears with TimePicker
     c. Setting a time and clicking Start shows the gradient countdown
     d. Color shifts as time decreases (test by setting departure time 1 min away)
     e. Page refresh: departure time is remembered, showing setup screen with previous time
     f. Browser console: zero errors

4. PWA check:
   → In preview, open DevTools > Application > Manifest — verify GoTime manifest loaded
   → Service worker registered (Application > Service Workers)

5. Wake Lock check:
   → In preview on iPad or Chrome (desktop): start timer, verify no "screen may sleep" warning appears

6. If ANY check fails: fix the specific file causing the issue, re-run the failed check, report what was fixed.

FINAL REPORT FORMAT:
Produce a markdown table:
| Check | Result | Notes |
|-------|--------|-------|
| TypeScript | ✅ PASS | 0 errors |
| Build | ✅ PASS | dist/ complete |
| App flow | ✅ PASS | All steps verified |
| PWA manifest | ✅ PASS | ... |
| Service worker | ✅ PASS | ... |
```

---

## Phase 7 — Vercel Deployment

Run these commands manually after validator-agent confirms all checks pass:

```bash
# 1. Commit everything
git add .
git commit -m "feat: initial GoTime implementation"

# 2. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/gotime.git
git push -u origin main

# 3. Deploy via Vercel CLI (or connect repo in Vercel dashboard)
npx vercel
# → Framework preset: Vite (auto-detected)
# → Build command: npm run build (auto-detected)
# → Output directory: dist (auto-detected)

# 4. Verify production URL
# → Open on iPad Safari
# → Tap Share → Add to Home Screen
# → Open from home screen icon
# → Verify full-screen standalone mode
# → Verify Wake Lock works (iPadOS 18.4+ required for installed PWA)
```

---

## Agent Summary

| Phase | Agent | Parallel? | Files Owned |
|-------|-------|-----------|-------------|
| 1 | scaffold-agent | No | types.ts, useSettings.ts, vite.config.ts, tailwind.config.ts, index.html, main.tsx, index.css |
| 2a | timer-agent | Yes | useTimer.ts |
| 2b | wakelock-agent | Yes | useWakeLock.ts |
| 2c | audio-agent | Yes | audio.ts |
| 3a | gradient-agent | Yes | GradientBackground.tsx, CountdownDisplay.tsx, WakeLockIndicator.tsx |
| 3b | screens-agent | Yes | TimePicker.tsx, SetupScreen.tsx, TimerControls.tsx, CelebrationScreen.tsx |
| 4 | assembly-agent | No | App.tsx |
| 5a | pwa-agent | Yes | vite.config.ts (PWA section), vercel.json, favicon.svg |
| 5b | a11y-agent | Yes | index.html, CountdownDisplay.tsx (aria only), TimerControls.tsx (aria only) |
| 6 | validator-agent | No | Read-only (fixes only) |

**Total agents: 10**  
**Parallelizable phases: 2, 3, 5**  
**Sequential gates: 1 → 2 → 3 → 4 → 5 → 6 → deploy**

---

## Dependency Graph

```
[Phase 1: scaffold-agent]
         │
         ▼
┌────────────────────┐
│  Phase 2 (parallel)│
│  timer-agent       │
│  wakelock-agent    │
│  audio-agent       │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│  Phase 3 (parallel)│
│  gradient-agent    │
│  screens-agent     │
└────────────────────┘
         │
         ▼
[Phase 4: assembly-agent]
         │
         ▼
┌────────────────────┐
│  Phase 5 (parallel)│
│  pwa-agent         │
│  a11y-agent        │
└────────────────────┘
         │
         ▼
[Phase 6: validator-agent]
         │
         ▼
[Manual: Vercel deploy]
```

---

*Last updated: March 1, 2026*
