# Product Requirements Document
## Family Morning Timer
**Version:** 1.0  
**Date:** March 1, 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary
Family Morning Timer is a full-screen, always-on web application designed to be displayed on a mounted kitchen iPad. It counts down to a user-defined departure time using a bold color gradient (green → yellow → red) so every family member — including young children — can instantly understand how much time remains before they need to leave the house.

### 1.2 Problem Statement
Morning routines in households with children are high-stress. Parents repeat themselves, kids lose track of time, and the result is a rushed, anxious departure. Existing timers are either too small, too complicated, or require reading numbers — creating a cognitive barrier, especially for young children.

### 1.3 Vision
Replace the parental "stress voice" with a calm, neutral, visual system that the whole family internalizes within a few days. The app should feel less like software and more like a household appliance — always on, always readable, one tap to start.

---

## 2. Target Users

| User | Description |
|------|-------------|
| **Primary:** Either parent | Sets the departure time, taps Start each morning |
| **Secondary:** Children (ages 4–12) | Read the color passively; no interaction required |

**Household profile:** 2 adults + 1–2 kids, iPad mounted in a common area (kitchen, mudroom).

---

## 3. Goals & Success Metrics

### 3.1 Product Goals
- Reduce morning stress by replacing verbal time reminders with a passive visual system
- Achieve first meaningful use in under 60 seconds from first launch
- Become a daily habit within 1 week of first use

### 3.2 Success Metrics
| Metric | Target |
|--------|--------|
| Time to first successful countdown | < 60 seconds |
| Day 2 session start time (one-tap re-use) | < 5 seconds |
| 7-day retention rate | > 70% |
| User-reported morning stress reduction | Positive in qualitative feedback |

---

## 4. Scope

### 4.1 In Scope (MVP)
- Full-screen countdown display with green → yellow → red gradient
- User-defined departure time (persisted across sessions)
- One-tap Start for repeat use
- Wake Lock API integration to prevent iPad screen sleep
- Optional audio alert in the final countdown minutes
- Celebration screen on successful departure

### 4.2 Out of Scope (Future Versions)
- Per-person task checklists
- Multiple profiles or schedules (e.g. weekdays vs. weekends)
- Push notifications
- Multi-device sync
- School calendar integration

---

## 5. User Stories

### Setup (First Time)
- **As a parent**, I want to set my departure time in under 30 seconds so I can start using the app before my morning gets chaotic.
- **As a parent**, I want the app to remember my departure time so I don't have to re-enter it each morning.

### Daily Use
- **As a parent**, I want to start the timer with a single tap so the morning routine begins without friction.
- **As a child**, I want to understand how much time is left without reading numbers so I can self-regulate.
- **As either parent**, I want to be able to adjust the departure time on the fly so I can handle schedule changes.

### Display & Awareness
- **As a family**, we want the timer to be readable from 8–10 feet away so everyone in the kitchen can see it.
- **As a parent**, I want the iPad screen to stay on while the timer is running so the display is always visible.
- **As a parent**, I want an audio cue in the final minutes so we're alerted even if we're not looking at the screen.

---

## 6. Functional Requirements

### 6.1 Countdown Display
- The countdown fills the full screen at all times
- Remaining time is displayed in large, bold typography (minimum 200px font size)
- A sub-label shows the target departure time (e.g. "Out the door by 8:30 AM")
- The background gradient transitions smoothly:
  - **Green** — more than 50% of time remaining
  - **Yellow** — 25–50% of time remaining
  - **Orange** — 10–25% of time remaining
  - **Red** — less than 10% of time remaining
- Color transitions are gradual, not sudden, to avoid startling young children

### 6.2 Timer Controls
- A single "Start" button initiates the countdown
- A "Pause" option is available but de-emphasized (not primary UI)
- An "Edit Time" affordance is visible but small — does not compete with the countdown display
- Timer automatically stops at 0:00

### 6.3 Departure Time Configuration
- Large, tappable time input (not a fiddly scroll wheel)
- Default pre-filled to the most recently used departure time
- Changes are saved automatically and persist across sessions
- Supports times in 5-minute increments

### 6.4 Wake Lock
- The app requests `navigator.wakeLock` when the timer starts
- Wake lock is re-acquired automatically if the tab regains focus after being backgrounded
- A subtle, non-intrusive indicator shows when wake lock is active (e.g. a small icon)
- If wake lock is unavailable (e.g. Low Power Mode), a one-time dismissible notice informs the parent

### 6.5 Audio Alert
- Optional gentle chime at configurable thresholds (default: 5 minutes and 1 minute remaining)
- Audio is off by default; enabled in settings
- Alert is distinct but not alarming — calming tone

### 6.6 End State
- At 0:00, the timer shows a brief celebration screen ("You made it! 🎉")
- After 5 seconds, reverts to a neutral "Ready for tomorrow" state with the same departure time pre-loaded

---

## 7. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| **Performance** | Timer must be accurate to ±1 second |
| **Accessibility** | Color is supplemented by large, readable time display (not color alone) |
| **Responsiveness** | Optimized for iPad (768px–1024px); landscape and portrait both supported |
| **Offline** | Fully functional with no internet connection after initial load |
| **Browser support** | Safari on iPadOS 15+ (primary); Chrome on Android tablet (secondary) |
| **Screen** | Designed for 8–10 foot viewing distance; no small UI elements in primary view |

---

## 8. UX & Design Principles

1. **Zero learning curve** — The product works before anyone reads anything. Color = time remaining.
2. **Appliance mindset** — This is not an app you "open." It lives on the screen, always ready.
3. **One-tap morning** — After first-time setup, every subsequent morning is a single tap.
4. **Distance-first design** — Every element must be readable from across a kitchen.
5. **Neutral authority** — The timer replaces parental nagging with a calm, non-judgmental signal. No scary sounds, no red flashing.

---

## 9. Technical Considerations

### 9.1 Wake Lock API
- Use `navigator.wakeLock.request('screen')` on timer start
- Handle `visibilitychange` events to re-acquire lock when tab regains focus
- Gracefully degrade if API is unsupported; surface a user-friendly message
- Document known limitation: wake lock releases in Low Power Mode on iOS

### 9.2 Time Persistence
- Store departure time in `localStorage` for zero-friction repeat use
- No account or login required for MVP

### 9.3 Timer Accuracy
- Use `Date`-based countdowns (not `setInterval` tick counting) to prevent drift

### 9.4 Deployment
- Hosted as a static web app (no backend required for MVP)
- PWA-ready: installable to iPad home screen for full-screen, no-chrome experience
- HTTPS required for Wake Lock API

---

## 10. Open Questions

| Question | Owner | Priority |
|----------|-------|----------|
| Should the timer support multiple departure times for different days (e.g. early school vs. late start)? | Product | Medium |
| What is the ideal audio alert tone? | Design | Low |
| Should we support a "no school today" mode that disables the timer? | Product | Medium |
| Do we want to track streaks or on-time departure history? | Product | Low |
| Should the celebration screen be customizable (family name, emoji)? | Design | Low |

---

## 11. Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| MVP Build | Core countdown, gradient, wake lock, departure time persistence | Week 2 |
| Internal Testing | Dogfood on real iPad in kitchen context | Week 3 |
| User Testing | 3–5 families, qualitative feedback | Week 4–5 |
| v1.0 Launch | Public release as hosted web app | Week 6 |

---

*Document owner: Product  
Last updated: March 1, 2026*
