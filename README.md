# Ankle Routine

Exercise routine scheduler and log for ankle recovery and prevention, with patient-controlled sharing. It's a routine tool, not telehealth. See [PLAN.md](PLAN.md) (implementation plan v2, with progress checked off).

## What's here

| Path | What | Plan step |
| --- | --- | --- |
| `content/` | Versioned clinical content (JSON, EN/ES): exercise library, routine templates, general programs, team warm-up, safety checklist, intended-use sentences. **v0.1 draft, pending clinician review.** | B |
| `docs/compliance/` | Intended-use wording, consent drafts (Lima ES, Madison EN), UW self-cert answers + Law Clinic request | A |
| `docs/pilots/` | Rec Well email, clinic colleague briefing, usability test guide, weekly tracking CSVs | D, E |
| `docs/share-out/` | Oct 28 share-out notes | Timeline |
| `print/` | Printable PDFs: routine card + 3-week log (ES/EN), team warm-up card (EN/ES), Madison one-pager, clinician reviewer packet. Sources in `print/src/`. | C Step 1 |
| `prototype/` | Clickable prototype for usability tests (open `prototype/index.html`) | C Step 1 |
| `app/` | Expo (React Native) IUP: local-only, offline, no accounts | C Step 2 |
| `fakedoor/` | Lima pricing fake-door page (no charge is made) | F |
| `demo/` | Demo routine QR code for Demo Night | Timeline |
| `scripts/` | Content validation, wording lint, print build, prototype build, content sync, pilot report | — |

## Commands

From the repo root:

```bash
npm install
```

```bash
npm run check          # validate content + lint wording (forbidden words from plan section A)
```

```bash
VIDEO_URL=https://… npm run print   # rebuild printables; without VIDEO_URL the QR box says "link pending"
```

```bash
node scripts/build-prototype.mjs    # refresh prototype content after editing content/
```

```bash
node scripts/sync-content.mjs       # copy content/ into the app after editing it
```

```bash
node scripts/pilot-report.mjs       # Monday report from docs/pilots/tracking/*.csv
```

From `app/`:

```bash
npm install
```

```bash
npm test && npm run typecheck
```

```bash
npx expo start          # needs a development build (camera, notifications); see app/AGENTS.md
```

```bash
npx tsx scripts/make-routine-qr.mts ../demo/demo-routine.json ../demo/demo-routine   # make a routine QR
```

## The app (IUP)

- **Onboarding:** language (ES/EN), country (PE/US), consent with the "not a diagnosis or treatment" notice, fixed safety checklist.
- **Three ways to start:** scan a physio's QR code (the code itself holds the routine: `ANK1.` + base64url JSON, validated against the bundled exercise library), pick a general program (the mild-sprain program requires confirming a professional has seen the ankle), or the team warm-up / a coach's code.
- **Today:** routine with exercise instructions and common mistakes; general programs show published "move on when" criteria and the *user* chooses to advance.
- **Log:** mark a session done with optional pain 0–10 and a note. The safety checklist is on the log screen.
- **Progress:** calendar, week-by-week completion, pain trend, history (long-press to delete).
- **Share:** choose the period, include/exclude pain and notes, remove individual sessions, then create a PDF and send it through the phone's share menu. The share notice ("No one is monitoring it") is on the screen and on the PDF.
- **Reminders:** local weekly notifications on routine days.
- **Add to calendar (MVP):** from Today or Settings, choose time and length (3/6/12 weeks), then add weekly repeating events to the phone's calendar (iOS write-only access; Android primary calendar; removable later) or get an `.ics` file for any calendar app. Events contain only a generic title and, optionally, the exercise list — never pain or notes.
- **Data:** SQLite on the phone only. No server, no analytics SDKs. "Delete all my data" in Settings.

**Verified here:** unit tests (QR codec, schedule math, PDF content, content sync, wording), TypeScript, Android JS bundle, and a full click-through of the web build (onboarding → paste code → log → progress → share → language switch → reload persistence).
**Not yet verified:** a run on a physical phone (camera scanning, notifications, the PDF share sheet and writing to the phone calendar are native-only). Build a development build with EAS and test on one Android and one iPhone before Nov 19.

## Open items that need a person

- Exercise videos aren't recorded yet (`video: null` in `content/exercises.json`; the app shows "Video coming soon").
- Content v0.1 needs clinician review (`print/reviewer-packet-v0.1.pdf`).
- Consent forms need legal review; placeholders `[…]` need filling.
- Fake door needs hosting and a `TRACK_URL` endpoint (see the top of the script in `fakedoor/index.html`).
