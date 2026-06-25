# Temporal Perception Logger — Claude Code Build Spec

## What this is

A multi-user web app for logging how fast or slow time feels — daily, weekly, and monthly — as part of a long-term research project into whether time perception fluctuates in a synchronized way across unrelated people.

The researcher behind this project has been observing this phenomenon since September 2019. The core hypothesis: there may be a non-physical variable that causes human time perception to speed up or slow down, and this fluctuation may propagate across unrelated people with a ~1–1.5 day offset.

This app serves two roles:
- **Participants** log their own experience privately. They see only their own data.
- **The researcher** (one specific Google account) sees everyone's data overlaid, to look for synchronized patterns and offset correlations.

It must be reliable, simple to use daily, and never lose data.

---

## Tech Stack

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Database / Auth**: Firebase (Firestore + Firebase Auth with Google Sign-In)
- **Charts**: Recharts
- **Deployment**: Firebase Hosting (include config)
- **No other dependencies** unless absolutely necessary

---

## Firebase Setup

Create a `firebase.js` config file that reads from environment variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ADMIN_UID
```

`VITE_ADMIN_UID` is the researcher's Google UID. Any user whose Firebase Auth UID matches this value gets the Researcher tab. Everyone else does not see it at all.

Include a `.env.example` file listing all required variables with empty values and a comment explaining each.

The app should show a clear "configure Firebase" message if env vars are missing, rather than crashing silently.

Enable:
- **Firestore** for storing all log entries
- **Google Auth** (Sign in with Google) — one-click, no email/password form needed

---

## Firestore Data Structure

```
users/
  {uid}/
    profile/
      displayName: string        ← from Google account
      email: string
      photoURL: string
      joinedAt: timestamp
      participantLabel: string   ← assigned by researcher, e.g. "P1", "P2" (default: "")
    daily/
      {YYYY-MM-DD}/              ← document ID is the date string
        date: string
        speed: number            ← -2 to +2
        confidence: boolean      ← did it feel clear or uncertain
        note: string             ← optional, max 280 chars
        createdAt: timestamp
        updatedAt: timestamp
    weekly/
      {YYYY-WNN}/                ← e.g. 2025-W23
        weekKey: string
        weekLabel: string        ← e.g. "Jun 2 – Jun 8, 2025"
        speed: number            ← -2 to +2
        consistency: string      ← "consistent" | "mixed" | "shifted"
        note: string
        createdAt: timestamp
        updatedAt: timestamp
    monthly/
      {YYYY-MM}/                 ← e.g. 2025-06
        monthKey: string
        monthLabel: string       ← e.g. "June 2025"
        speed: number            ← -2 to +2
        trend: string            ← "accelerating" | "decelerating" | "flat" | "irregular"
        comparedToLast: string   ← "faster" | "slower" | "similar"
        note: string
        createdAt: timestamp
        updatedAt: timestamp
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Each user can read/write only their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Researcher can read any user's data (write still restricted to own data)
    match /users/{userId}/{document=**} {
      allow read: if request.auth != null && request.auth.token.uid == request.resource.data.adminUid;
    }
  }
}
```

**Note**: The researcher read access is enforced client-side by checking `VITE_ADMIN_UID`. Firestore rules allow the researcher UID to read all user subcollections. Implement this carefully — the researcher query reads from `users/{anyUid}/daily/`, `users/{anyUid}/weekly/`, `users/{anyUid}/monthly/`.

A cleaner approach: use a Firestore collection group query. The researcher reads `collectionGroup('daily')`, `collectionGroup('weekly')`, `collectionGroup('monthly')` — Firestore returns documents from all users. Security rule for collection group:

```
match /{path=**}/daily/{date} {
  allow read: if request.auth != null && request.auth.uid == '<ADMIN_UID_HARDCODED_IN_RULES>';
}
match /{path=**}/weekly/{week} {
  allow read: if request.auth != null && request.auth.uid == '<ADMIN_UID_HARDCODED_IN_RULES>';
}
match /{path=**}/monthly/{month} {
  allow read: if request.auth != null && request.auth.uid == '<ADMIN_UID_HARDCODED_IN_RULES>';
}
```

The admin UID should also be hardcoded in `firestore.rules` (not just env var) for actual security enforcement.

---

## App Structure

Single page app with a **bottom navigation bar** (mobile-first).

**For regular participants — 4 tabs:**
1. Log
2. History
3. Insights
4. Settings

**For researcher (admin UID) — 5 tabs:**
1. Log
2. History
3. Insights
4. Research ← extra tab, only visible to admin
5. Settings

---

## Detailed Screen Specs

---

### 1. Log Tab

This is the primary screen. The user opens it every day.

**Header**: Shows today's date, e.g. "Thursday, 12 June 2025"

**Three sections stacked vertically, separated by dividers:**

#### Section A — Today's Entry

Label: "How did today feel?"

A speed selector with 5 options as a horizontal row of buttons:

```
[−−]  [−]  [·]  [+]  [++]
```

Labels beneath each button:
- −− = Much slower
- −  = Slightly slower
- ·  = Normal
- +  = Slightly faster
- ++ = Much faster

Maps to values: -2, -1, 0, +1, +2

Selected state: filled with accent color. Unselected: outlined, muted.

Below the selector:

**Confidence toggle**: "Did this feel clear to you?"
Two pill options: `Yes, clear` / `Not sure`

**Note field**: Textarea, placeholder: "Anything worth noting? (optional)"
Max 280 characters. Show live character count below field.

**Save button**: "Save today's entry"
If entry already exists for today → "Update today's entry"
After saving → small inline "Saved" confirmation with checkmark, fades after 2 seconds. No alert boxes.

---

#### Section B — This Week's Entry

Label: "How has this week felt overall?"
Sub-label: current week range, e.g. "Jun 9 – Jun 15"

Same speed selector (-2 to +2).

**Consistency selector** — three pill buttons:
- `Consistent` — same feeling throughout the week
- `Mixed` — some fast days, some slow
- `Shifted midweek` — changed noticeably partway through

Note field (same as above).

Save button: "Save this week's entry"

---

#### Section C — This Month's Entry

Label: "How has [Month] felt overall?" (use actual current month name)

Same speed selector.

**Trend selector** — four pill buttons:
- `Accelerating` — got faster as month went on
- `Decelerating` — got slower as month went on
- `Flat` — consistent throughout
- `Irregular` — no clear pattern

**Compared to last month** — three pill buttons:
- `Faster than last month`
- `Slower than last month`
- `Similar to last month`

Note field.

Save button: "Save this month's entry"

---

**Rules**:
- Each section saves independently. Three separate save buttons.
- On load, pre-fill any section where an entry already exists for the current period.
- Never clear a field unless the user explicitly changes it.

---

### 2. History Tab

Sub-tabs at top: `Daily` | `Weekly` | `Monthly`

#### Daily history

Line chart (Recharts) — speed over last 90 days.
- X axis: dates (show every 2 weeks as label)
- Y axis: fixed -2 to +2. Label the tick marks: Much slower / Slower / Normal / Faster / Much faster
- Area above zero line: shaded light amber
- Area below zero line: shaded light blue
- Single line connecting all logged days. Gap where no entry exists.
- Dot on each logged day.
- Tooltip on hover: date, speed label, note if any.

Below chart: scrollable list of daily entries, most recent first.

Each entry card:
- Date (JetBrains Mono font)
- Speed badge: colored pill with label (−−, −, ·, +, ++)
- Confidence tag: "clear" or "uncertain" in muted text
- Note if any (2-line truncation with expand)
- Edit button → opens the same form inline, pre-filled, with Update and Cancel buttons

#### Weekly history

Bar chart — weekly speed ratings, last 26 weeks.
Bar colors by speed value:
- −2: #1E3A5F (deep blue)
- −1: #93B4D4 (light blue)
-  0: #9E9E8E (neutral gray)
- +1: #E8C87A (light amber)
- +2: #B5620A (deep amber)

Below: list of weekly entries, most recent first.
Each card: week label, speed badge, consistency tag, note, edit button.

#### Monthly history

Bar chart — all months with data. Same color scheme.

Below: list of monthly entries. Each card: month label, speed badge, trend tag, compared-to-last tag, note, edit button.

---

### 3. Insights Tab

Simple math analysis. No AI. Only show cards where enough data exists.

Show a note at top if data is insufficient: "Log at least 14 days to see insights."

**Cards:**

**Logging streak** — consecutive days logged up to today. "X days in a row."

**This month's average** — mean speed for current month's daily entries. Show number + label.

**Most common feeling** — most frequent speed value across all daily entries. Show label + count.

**Longest fast period** — longest run of consecutive days at +1 or +2. Show dates and length.

**Longest slow period** — longest run of consecutive days at -1 or -2. Show dates and length.

**Week vs day alignment** — compare each weekly rating to the average of that week's daily entries. Show: "Your weekly ratings tend to match / diverge from your daily entries."

**Monthly sparkline** — small inline line chart (Recharts) showing all monthly speed values over time.

**Research reminder** — static text block, always shown:

> "You are building a dataset to test whether time perception fluctuates in shared patterns across unrelated people. The key signal to look for: do your slow or fast periods align with others', possibly with a 1–2 day offset? Export your data from Settings and compare timelines once you have at least 30 days logged."

---

### 4. Research Tab (Researcher only — admin UID)

This tab is completely invisible to non-admin users. Do not render it, do not show it in the nav, do not route to it.

**Purpose**: Let the researcher see all participants' daily data overlaid on one chart, look for synchronized patterns, and test the offset hypothesis.

---

#### Section A — Participant Overview

A simple table:
- Columns: Label | Name | Email | Joined | Days logged | Last entry
- Label is the `participantLabel` field from their profile (editable inline by researcher)
- Default label is their display name if participantLabel is empty
- Researcher can click a label cell and type a new one (e.g. "P1", "P2") — saves to that user's profile document

---

#### Section B — Overlay Chart

A line chart (Recharts) showing all participants' daily speed ratings on the same timeline.

- X axis: date range (default: last 90 days, adjustable)
- Y axis: -2 to +2
- Each participant = one line, differentiated by color (cycle through: indigo, teal, coral, amber, slate — enough for 5–8 participants)
- Each participant labeled in a legend using their label (P1, P2, etc.) — never their real name in the chart
- Dots on logged days, gaps where no entry
- Tooltip: date, each participant's value for that day

**Date range selector**: two inputs (from / to date) above the chart. Defaults to last 90 days.

---

#### Section C — Offset Analysis

This is the core research feature.

A two-panel selector:
- Left dropdown: "Reference participant" (select one)
- Right dropdown: "Compare with" (select another)

An offset slider:
- Range: -3 to +3 days
- Label: "Shift [Compare participant] by X days"
- 0 = no shift. +1 = shift their timeline forward 1 day (i.e. their Monday appears on Tuesday's column). -1 = shift backward.

When offset is applied, redraw a two-line chart:
- Reference participant: normal timeline
- Compared participant: shifted by the offset value

Below the chart, show a simple **Pearson correlation coefficient** calculated between the two series (for the overlapping date range after offset is applied). Label it: "Correlation: X.XX"

Interpretation guide below correlation number:
- 0.7 to 1.0: Strong alignment
- 0.4 to 0.7: Moderate alignment
- 0.1 to 0.4: Weak alignment
- Below 0.1: No clear alignment

This is the tool the researcher uses to test whether Person A's slow days correlate with Person B's slow days shifted by 1–2 days.

---

#### Section D — Export All Data

Three buttons:
- `Export all daily as CSV` — all participants, all dates
- `Export all weekly as CSV`
- `Export all monthly as CSV`

CSV format for combined daily export:
```
participant,date,speed,speed_label,confidence,note
P1,2025-06-12,1,Slightly faster,true,"Felt like Friday came early"
P2,2025-06-12,0,Normal,true,""
P3,2025-06-13,-1,Slightly slower,false,"Odd week"
```

Participant column uses the label (P1, P2) not real name or UID.

---

### 5. Settings Tab

**Account section**:
- Google profile photo (circular, 48px)
- Display name
- Email
- Sign out button

**Export section** (own data only):
Label: "Export your data"

- `Export daily as CSV`
- `Export weekly as CSV`
- `Export monthly as CSV`

Daily CSV format:
```
date,speed,speed_label,confidence,note
2025-06-12,1,Slightly faster,true,"Felt like Friday came early"
```

Weekly CSV format:
```
week,week_label,speed,speed_label,consistency,note
2025-W24,"Jun 9 – Jun 15",1,Slightly faster,consistent,""
```

Monthly CSV format:
```
month,month_label,speed,speed_label,trend,compared_to_last,note
2025-06,June 2025,0,Normal,flat,similar,""
```

**Stats section**:
- X days logged
- Y weeks logged
- Z months logged
- First entry: [date]

**About section**:
Static text:

> "This app is part of a personal investigation into whether time perception fluctuates in patterns that are shared across unrelated people. Each person's data is private to them. The researcher sees anonymized patterns across participants."

---

## Design Direction

**Aesthetic**: Minimal, calm, slightly scientific. A well-designed research lab notebook — not a wellness app, not a mood tracker.

**Color palette**:
- Background: #FAFAF9 (near-white, warm)
- Text: #1A1A18 (near-black)
- Accent / interactive: #3D3A8C (deep indigo)
- Accent hover: #2E2B6B
- Dividers / borders: #E8E6DF
- Speed diverging scale:
  - −2: #1E3A5F (deep blue)
  - −1: #93B4D4 (light blue)
  -  0: #9E9E8E (neutral gray)
  - +1: #E8C87A (light amber)
  - +2: #B5620A (deep amber)
- No gradients. No shadows. Flat surfaces only.

**Typography** (load from Google Fonts):
- `DM Serif Display` — page headings, tab titles, date display on Log page
- `Inter` — all body text, labels, buttons, form fields
- `JetBrains Mono` — date strings, week keys, data values in charts, CSV previews

**Layout**:
- Mobile-first. Max content width: 480px, centered on desktop with auto margins.
- Bottom tab bar, fixed, height 56px
- Page content has 20px horizontal padding minimum
- Sections separated by 1px dividers (#E8E6DF), not nested card-in-card layouts
- Top of each page: 16px padding below status bar

**Components**:
- Speed selector buttons: min 44px height, full row width split equally, 8px gap
- Selected speed button: background #3D3A8C, text white
- Unselected: border 1px #E8E6DF, text #1A1A18, background white
- Pill selectors (consistency, trend, etc.): same selected/unselected treatment, smaller (36px height)
- Save button: full width, background #3D3A8C, text white, 44px height, no border radius above 8px
- Save confirmation: small inline row with checkmark icon + "Saved" text in #2D7A4F (green), fades out after 2 seconds
- Skeleton loaders on initial data fetch (not spinners)
- Empty states: short text only, no illustrations

**Do not**:
- Use emoji anywhere in the UI
- Use bright saturated colors
- Add animations beyond opacity fade transitions
- Make it feel like a consumer wellness app
- Add features not listed in this spec

---

## File Structure

```
/
├── .env.example
├── .gitignore
├── firebase.json
├── firestore.rules
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── firebase.js                  ← Firebase init + env var config
    ├── hooks/
    │   ├── useAuth.js               ← Google sign-in, user state, isAdmin check
    │   ├── useDaily.js              ← Firestore CRUD for daily entries
    │   ├── useWeekly.js             ← Firestore CRUD for weekly entries
    │   ├── useMonthly.js            ← Firestore CRUD for monthly entries
    │   └── useAllParticipants.js    ← Admin only: reads all users' data via collectionGroup
    ├── utils/
    │   ├── dateUtils.js             ← getWeekKey(), getMonthKey(), formatWeekLabel(), getTodayKey(), etc.
    │   ├── speedLabels.js           ← Maps -2..+2 to labels, colors, short symbols
    │   ├── exportUtils.js           ← CSV generation for own data
    │   ├── adminExportUtils.js      ← CSV generation for all participants combined
    │   └── correlationUtils.js      ← Pearson correlation calculation with day offset
    ├── components/
    │   ├── SpeedSelector.jsx        ← Reusable -2 to +2 picker
    │   ├── PillSelector.jsx         ← Reusable pill button group (single select)
    │   ├── SaveButton.jsx           ← Button with saved/saving/error states
    │   ├── BottomNav.jsx            ← Tab bar, conditionally shows Research tab
    │   ├── EntryCard.jsx            ← Card for history list items with inline edit
    │   └── SkeletonCard.jsx         ← Loading placeholder
    └── pages/
        ├── LogPage.jsx              ← Daily + Weekly + Monthly forms
        ├── HistoryPage.jsx          ← Charts + entry lists with sub-tabs
        ├── InsightsPage.jsx         ← Pattern analysis cards
        ├── ResearchPage.jsx         ← Admin only: overlay chart, offset tool, participant table
        └── SettingsPage.jsx         ← Export + account info + stats
```

---

## Edge Cases to Handle

- **Not logged in**: Show a centered sign-in screen with Google button and a one-line description of the app. No other content.
- **First time user**: After sign-in, write a profile document to Firestore with their Google display name, email, photoURL, joinedAt. Show welcome message: "Welcome. Start by logging how today feels."
- **Already logged today/this week/this month**: Pre-fill the relevant section with existing data. Save button says "Update".
- **Partial week**: If it's Monday, the week form is still available. Show note: "Covers Mon [date] onwards."
- **Timezone**: Use the user's local timezone for all date calculations. Never UTC for day boundaries. Use `new Date().toLocaleDateString('en-CA')` to get YYYY-MM-DD in local time.
- **Offline**: Show a subtle top banner "You're offline — changes will sync when reconnected." Use Firestore's offline persistence (enable it). Don't block the UI.
- **Admin viewing own data**: Admin is also a participant and logs their own entries like everyone else. The Research tab is additional, not a replacement.
- **No participants yet**: Research tab shows "No participants have logged data yet." gracefully.
- **Correlation with missing data**: When calculating Pearson correlation with an offset, only use date pairs where both participants have an entry. If fewer than 7 overlapping pairs exist, show "Not enough overlapping data to calculate correlation" instead of a number.
- **participantLabel empty**: Fall back to first name from displayName. Never show UID or email in the Research tab UI.

---

## correlationUtils.js — Implementation Note

```javascript
// Calculate Pearson correlation between two participants' daily speed arrays
// offsetDays: positive = shift participant B forward (their data appears later)
// Returns: { r: number, pairsUsed: number } or null if insufficient data

export function pearsonWithOffset(seriesA, seriesB, offsetDays) {
  // seriesA and seriesB are arrays of { date: 'YYYY-MM-DD', speed: number }
  // Build a map from date to speed for each
  // Apply offset to seriesB dates
  // Find overlapping dates
  // Calculate Pearson r on overlapping pairs
  // Return { r, pairsUsed }
}
```

Implement this fully. The offset slider in the UI calls this function and displays the result live as the slider moves.

---

## What Claude Code Should Do

1. Scaffold the full Vite + React + Tailwind project
2. Install and configure Firebase (Firestore with offline persistence + Google Auth)
3. Build all pages and components exactly as described — no placeholders
4. Apply the full design direction: Google Fonts, color palette, spacing, typography
5. Implement the Research tab fully including overlay chart, offset slider, Pearson correlation, participant table with editable labels, and combined CSV export
6. Implement Firestore collection group queries for admin data access
7. Write the complete `firestore.rules` file with per-user privacy and admin read access
8. Include `.env.example` with comments explaining every variable including `VITE_ADMIN_UID`
9. Make it fully functional end-to-end: auth → log → Firestore → history → research view

The user fills in `.env` with their Firebase credentials and their own Google UID as `VITE_ADMIN_UID`. After `npm install` + `npm run dev` it should work immediately.

---

## Final Note

This is a serious long-term research tool. The person will open it every day, possibly for years. Other people will use it without knowing what it's for — they just log how time feels. The researcher uses the data to look for a specific pattern: synchronized fluctuations in time perception across unrelated people, possibly offset by 1–2 days.

Build it to last. Reliability over cleverness. Simplicity over features. Get every listed detail right.
