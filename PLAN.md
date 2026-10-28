# Ankle Recovery & Prevention App: Implementation Plan v2 (Routine Tool First)

Tech Exploration Lab · Oct 28, 2026 · Juan José Valverde Ayte
Replaces: Implementation Plan v1 (same day). Builds on the revised product spec and the Oct 28 research update for Madison and Lima.

## What changed from v1

The app starts as a **routine tool**, not a telehealth service. Patients schedule and log their ankle exercises, and **they can choose to share** their log with their physio, coach or anyone else. Nobody monitors them remotely through the app.

| | v1 | v2 |
| --- | --- | --- |
| What the app is | Guided recovery with triage, check-ins and escalation | Exercise routine scheduler and log, with optional sharing |
| Who reads the data | Clinic colleague reviewing daily check-ins by WhatsApp | Only the patient, unless they choose to share |
| Plan changes | Could happen remotely | Only at an in-person visit |
| Safety | Personalized warning-sign screen and three-track routing | Fixed safety checklist, the same for everyone |
| Lima pilot | WhatsApp concierge (possible telemonitoring) | Patients use the routine and bring their log to visits |
| Telehealth | Needed a registered facility from the start | Not used; added later through a registered clinic partner, if ever |

**Why:** a label doesn't decide whether something is telehealth; what the physio does with the data does. Keeping all clinical decisions at in-person visits keeps the app on the safe side in both countries, and lets the pilots start sooner.

**What we give up for now:** personalized triage (the hardest part to copy) and fast remote adjustment. The edge becomes the ankle programs you write, Peruvian Spanish and English, price, easy sharing, and coach/team mode.

## Guiding rules

1. **The patient owns the data.** It stays on their phone by default.
2. **Sharing is optional, one way, and started by the patient.** They choose what to share, with whom, and can stop sharing at any time.
3. **No messaging inside the app.** The person who receives a shared log can view it, not reply or edit it.
4. **Routine changes happen at visits.** The physio sets or updates the routine in person, by scanning or giving a code.
5. **Safety information is fixed.** The same checklist for everyone; the app never alerts a clinician automatically.
6. **Lead with a person.** Clinic and coach/team use come first, because people stick with programs when someone expects them to.
7. **Test for 3 weeks and charge early.** Track completion week by week; test pricing on the web with Yape/Plin and card.

## The product

### Three ways to start

| Mode | Who sets the routine | Example |
| --- | --- | --- |
| **Prescribed routine** | The patient's physio, at a visit | Physio picks exercises, sets, frequency and stage, then shows a QR code; the patient scans it |
| **General program** | The app (programs you wrote, with published progression criteria) | Prevention program for someone with a "weak" ankle; general program after a mild sprain once a professional has said it's fine |
| **Team program** | A coach or athletic trainer | Ankle prevention warm-up 2–3 times a week for a whole team |

### Core features

| Feature | What it does | Works offline? |
| --- | --- | --- |
| Onboarding | Language (EN/ES), country, consent, "not a diagnosis or treatment" notice | Yes |
| Safety checklist | Fixed list shown before starting and in the log: if any apply, contact your physio or go to urgent care; emergency numbers (911; SAMU 106 and 116) | Yes |
| Routine | Exercises with videos, sets, reps and days; loaded from a physio's code, a general program or a team | Yes, videos downloaded once |
| Reminders | Local notifications on the chosen days and times | Yes |
| Log | Mark sessions done; optional pain 0–10 and a note | Yes |
| Progress | Calendar of completed sessions and pain trend | Yes |
| Share | Patient sends a summary (PDF now, view-only link later) through the phone's share menu to whoever they choose | Create offline, send online |
| Team view | Coach sees how many athletes completed each session, never individual health answers | Needs internet |

### What sharing looks like

- **Off by default.** The patient taps "Share", sees exactly what will be sent (dates, sessions done, pain scores, notes), and can remove items.
- **Clear expectation on the share screen:** "This is a record for your next visit. No one is monitoring it. If your ankle gets worse, contact your physio or go to urgent care."
- **PDF first.** The patient sends it themselves by WhatsApp, email or print. Nothing passes through your servers.
- **View-only link later.** Only when a backend exists; links expire and the patient can revoke them.
- **Team sharing** is a separate opt-in: the athlete agrees to share "session done" only.

### Out of scope for now

Telehealth, in-app messaging, automatic alerts to clinicians, personalized triage or unlock rules decided by the app, other body regions, wearables, camera checks, AI chat, in-app purchases.

## Workstreams

| # | Workstream | Owner | Depends on |
| --- | --- | --- | --- |
| A | Compliance and wording | You + UW Law & Entrepreneurship Clinic + a Peru data-protection lawyer | — |
| B | Clinical content (programs, safety checklist) | You + a reviewing clinician | A (wording) |
| C | Product build | You | B |
| D | Lima clinic pilot | You + clinic colleague | A |
| E | Madison team pilot | You + Rec Well athletic trainers | A |
| F | Pricing and payments | You | A (wording) |
| G | Funding, team and partners | You | Results from D, E, F |

### A. Compliance and wording

The routine-tool model removes most of the v1 problems. What's left:

**Intended use (one sentence per mode, used everywhere: app, App Store, landing page, slides, social posts)**
- Prescribed routine: "Helps you schedule and keep track of the exercises your physio prescribed."
- General program: "A general ankle exercise and prevention program. Tells you when to see a professional."
- Team program: "A warm-up and prevention routine for your team."
- Never use: "treatment", "rehab protocol", "diagnosis", "clinically proven", "medical grade", "ready to return to sport", or recovery-time promises. In Spanish: "diagnóstico", "tratamiento", "cura".

**Peru**
- No telehealth registration needed, as long as the app is a diary used between in-person visits and the clinic doesn't review logs or advise remotely through it.
- Data protection (Ley 29733, DS 016-2024-JUS) still applies to anything you store. Keep data on the device; if you add a backend, get express consent for storage abroad and name the country.
- The clinic records what it sees in the shared log in its own clinical record at the visit.
- Register a database with the ANPD only when you start storing personal data yourself.
- Check the Colegio de Fisioterapeutas bills' status before finalizing professional titles in terms and consent.

**United States**
- An app that helps patients follow exercises their physio prescribed matches FDA's low-risk examples. Keep the general program's progression criteria generic and published.
- You don't advise individual Madison patients; their PT or athletic trainer does. Your role is author of general programs.
- UW pilot: run the QI / program-evaluation self-certification and call it a pilot, not research.
- Coaches and employers see aggregate completion only.
- No ad or analytics SDKs that share health data (FTC Health Breach Notification Rule).

**Before public launch:** UW Law & Entrepreneurship Clinic opinion (FDA, FTC, terms) and a Peruvian data-protection lawyer's review of consent and storage.

### B. Clinical content

All content lives in versioned JSON files.
1. **Exercise library:** ankle mobility, strength, balance and hop exercises, each with a short video, EN/ES instructions and common mistakes.
2. **Routine templates** a physio can start from and adjust (acute, mobility, strength, balance, return to activity).
3. **General programs:** 6-week prevention program; general program after a mild sprain, with published progression criteria ("move on when you can balance 30 seconds on one leg without pain").
4. **Team warm-up:** about 15 minutes, ankle-focused, FIFA 11+ style.
5. **Safety checklist:** fixed list (can't put weight on it, deformity, numbness or cold foot, a "pop" at the back of the heel, calf pain and swelling, worsening pain or swelling). Written separately in English and Peruvian Spanish.
6. **Review:** one other clinician reviews the checklist and programs before the pilots.

### C. Product build

**Step 1, Phase 0 (no code):**
- Lima: printed routine card with QR code to exercise videos, plus a paper or PDF log. Patients set phone reminders.
- Madison: printed or QR team warm-up card; trainer tallies sessions done per week.
- Clickable prototype of onboarding, routine and share screens for usability tests.

**Step 2, Phase 1 (IUP for Demo Night, Nov 19):** Expo (React Native) app, local-only, no accounts or server.
- Onboarding, consent, safety checklist.
- Load a routine from a QR code (the code itself contains the routine, so no server is needed) or choose a general program.
- Local reminders, session log with optional pain score, progress calendar.
- Share as PDF through the phone's share menu.
- SQLite on the device; works fully offline.

**Step 3, Phase 2 (MVP):**

> **Scope change (Oct 28):** the MVP shows one new feature, **add to calendar**. The items below it are deferred until after the Dec 5 decision gates.

- [x] **Add to calendar** → `app/src/app/calendar.tsx`, `app/src/lib/calendar.ts`, `app/src/lib/calendarPlan.ts`. From Today or Settings: pick time and length (3, 6 or 12 weeks), then either
  - add one weekly repeating event per routine day to the phone's own calendar (iOS asks for write-only access, so the app never reads the calendar; Android uses the primary writable calendar), with a 15-minute alert and a "Remove from my calendar" button, or
  - get an `.ics` file for Google Calendar, Apple Calendar or Outlook (also works on the web).
  - The event has only a generic title ("Ejercicios de tobillo") and, if the patient keeps it on, the exercise list, plus the "if it gets worse" line. It never includes pain scores or notes, because calendars sync to Google/iCloud/Outlook.
  - Tested: unit tests, `.ics` parsed and expanded by an independent iCalendar library (6 weeks × 3 days = 18 sessions), web click-through with download. **Not yet tested on a phone** (native calendar write).
- Deferred: Simple web page for physios to build a routine and generate the QR code (stand-in for now: `app/scripts/make-routine-qr.mts`).
- Deferred: Team mode with a backend (Supabase): coach creates a team, athletes join with a code, coach sees aggregate completion.
- Deferred: Optional view-only share links with expiry and revoke.
- Deferred: Opt-in, privacy-friendly analytics for completion and sharing rates.

### D. Lima clinic pilot

| Item | Plan |
| --- | --- |
| Who | 5–8 recent ankle patients at your clinic who consent |
| Length | 3 weeks per patient |
| How | The physio sets the routine at the visit; the patient follows it at home (paper card first, IUP later) and brings or shares the log at the next visit |
| Not allowed | Reviewing logs or changing the plan by WhatsApp between visits |
| Measure | Sessions done per week (week 1, 2, 3 separately); how many patients choose to share; whether the physio found the log useful at the visit |
| Data to you | Only anonymized counts from the clinic, with patient consent |
| Pass | At least half do 4 of 7 planned sessions in week 3, and the physio says the log changed or sped up the visit |
| Start | Target Nov 4 |

Pre-start checklist:
- [x] Consent form: what's recorded, that sharing is optional, that no one monitors the log, and that anonymized counts go to you → `docs/compliance/consent-lima-es.md` (draft v0.1; fill placeholders, legal review)
- [ ] Routine cards and video QR codes printed in Spanish → PDFs ready: `print/routine-card-es.pdf`, `print/log-3wk-es.pdf`; rebuild with `VIDEO_URL` once videos are hosted, then print
- [ ] Colleague briefed: no remote review or advice; safety checklist and emergency numbers on every card → script ready: `docs/pilots/lima-colleague-briefing.md` (safety checklist + numbers are on every card ✓)
- [ ] Shared logs noted in the clinic's own record at visits (in briefing and consent; clinic does this at visits)

### E. Madison team pilot

| Item | Plan |
| --- | --- |
| Who | 1–2 UW sport clubs through Rec Well's athletic trainers; backup: an intramural league or a running or climbing club |
| Offer | Ready-made ankle warm-up plus a simple weekly completion count, as a tool for the trainer |
| Length | 3 weeks |
| Measure | Sessions done per team per week; trainer's verdict in their own words |
| Pass | At least 2 sessions a week in week 3, and the trainer wants to continue |
| Start | Contact trainers Oct 29; first session by Nov 9 |

Steps:
1. Email Rec Well sport-club athletic training with a one-page description and the warm-up card.
2. Meet the trainer and adjust the warm-up to their sport and season.
3. Complete UW's self-certification before the first session.
4. Collect aggregate completion only.

### F. Pricing and payments

| Market | Test | Payment | Pass |
| --- | --- | --- | --- |
| Lima, individuals | Landing page for the general prevention program at S/15–40 | Yape/Plin link and card, on the web | ≥ 5% of visitors try to pay |
| Lima, clinics | Offer the physio routine builder to 3–5 clinics at a flat monthly fee | Invoice | ≥ 2 name a price |
| Lima, employers | 3 conversations pitching the prevention program within the company's Ley 29783 safety system | Invoice | ≥ 1 asks for a proposal |
| Madison, groups | Ask trainers and club leaders what they'd pay per team per season | Card (later) | ≥ 2 of 5 name a price |

Run the fake door on the web, say on the page whether payments are refunded or treated as pre-orders, and count visitors per source.

### G. Funding, team and partners

- **Clinical reviewer:** one physio in Lima; ideally one athletic trainer in Madison.
- **Co-builder:** look after Demo Night through the Lab, D2P, gener8tor or StartingBlock.
- **Peru funding:** prepare a StartUp Perú application for the next call (watch ProInnóvate from December); check Concytec grants.
- **Model to follow:** clinic home-exercise tools such as Limber (now Net Health) and Physitrack, sold to providers.

## Timeline

Legend: `[x]` done · `[ ]` + "→ ready" means the materials are done and the remaining step needs you (send, meet, print, run).

### Phase 0: Oct 28 – Nov 3
- [ ] Oct 28: Share-out (what broke: self-triage and remote monitoring; what changed: routine tool with patient-controlled sharing) → ready: `docs/share-out/2026-10-28-share-out.md`
- [ ] Oct 29: Email Rec Well athletic trainers; brief the clinic colleague → ready: `docs/pilots/madison-recwell-email.md` (+ `print/madison-one-pager.pdf`, `print/team-warmup-card-en.pdf`), `docs/pilots/lima-colleague-briefing.md`
- [x] Oct 30: Intended-use sentences in EN/ES → `docs/compliance/intended-use.md`, `content/intended-use.json`; enforced by `scripts/lint-wording.mjs`
- [x] Oct 31: Consent forms for Lima and Madison → `docs/compliance/consent-lima-es.md`, `consent-madison-en.md` (drafts v0.1, pending legal review)
- [x] Nov 1–2: Exercise library, routine templates and safety checklist v0.1 → `content/` (17 exercises, 5 templates, 2 general programs, team warm-up, safety checklist EN/ES; validated by `scripts/validate-content.mjs`)
- [ ] Nov 1–2: Send to reviewer → ready: `print/reviewer-packet-v0.1.pdf`
- [x] Nov 2: Clickable prototype → `prototype/index.html`
- [ ] Nov 2: Print routine and warm-up cards → ready: `print/*.pdf` (video QR shows "link pending" until videos are hosted)
- [ ] Nov 3: UW self-certification; request Law Clinic appointment → ready: answers + request email in `docs/compliance/uw-self-cert-and-law-clinic.md`

### Phase 1: Nov 4 – Nov 19
- [ ] Nov 4: Lima pilot starts (tracking sheet ready: `docs/pilots/tracking/lima-weekly.csv`)
- [ ] Nov 5–8: Usability test of prototype and safety checklist with 5 people in Madison and 5 in Lima → ready: `docs/pilots/usability-test-guide.md`
- [ ] Nov 9: Madison team pilot starts (tracking sheet ready: `docs/pilots/tracking/madison-weekly.csv`)
- [x] Nov 9–18: Build the IUP (Step 2) → `app/` (onboarding, consent, safety checklist, QR routine loading, general programs, team warm-up, reminders, log with pain/note, progress, PDF share, SQLite, offline). Tested: unit tests, typecheck, Android bundle, web click-through. **Still to do: test on a physical phone (camera, notifications, share sheet).**
- [ ] Nov 9–18: Launch the Lima fake door page → ready: `fakedoor/index.html` (host it and set `TRACK_URL`)
- [ ] Mondays: record week-by-week completion and sharing for both pilots → fill the CSVs, run `node scripts/pilot-report.mjs`
- [ ] Nov 19: Demo Night: working IUP with QR routine loading and PDF sharing, plus pilot data → app + demo QR ready (`demo/demo-routine.png`); pilot data comes from the pilots

### Phase 2: Nov 20 – Dec 31
- [ ] Nov 25: Lima pilot completes 3 weeks; Nov 30: Madison pilot completes
- [ ] Dec 1–5: Decision gates
- [x] December: Build the MVP (Step 3), scoped to add-to-calendar (built early, Oct 28; see Step 3)
- [ ] Test the app (incl. add-to-calendar) on one Android phone and one iPhone → steps and checklist: `docs/phone-test.md`
- [ ] By Dec 31: Law Clinic opinion; Peru data-protection review; content v1.0 reviewed

### Phase 3: Jan – Mar 2027
- [ ] First paid pilot: a clinic, team or employer
- [ ] StartUp Perú application
- [ ] Decide whether to add telehealth through a registered clinic partner

## Decision gates

| Gate | Date | Question | If yes | If no |
| --- | --- | --- | --- | --- |
| 1 | Nov 3 | Consent forms and briefings done? | Start that pilot | Delay that pilot; run the other |
| 2 | Nov 8 | Do people understand the safety checklist and complete the routine setup without help? | Keep the design | Simplify the checklist and setup before building |
| 3 | Dec 5 | Which channel held completion in week 3: clinic or team? | Build the MVP around that mode first | Test another delivery person (employer safety lead, running coach) before more code |
| 4 | Dec 5 | Do patients choose to share, and do physios use the log? | Build the physio routine builder and share links | Keep sharing as PDF only; focus on team mode |
| 5 | Dec 5 | Did anyone try to pay? | Set the first price; plan a paid pilot | Make the patient app free; sell to clinics, teams or employers |
| 6 | Mar 2027 | Is there a reason to add telehealth (physios asking for remote follow-up)? | Partner with a clinic registered for telehealth in RENIPRESS | Stay a routine tool |

## Assumptions to track

| # | Assumption | E / G now | Test | We're wrong if |
| --- | --- | --- | --- | --- |
| 1 (lead) | A coach, trainer or physio will use the program with their people | G (research supports it) | Madison team pilot; Lima clinic pilot | Fewer than 2 sessions a week in week 3 |
| 2 | People follow a multi-week routine | G | 3-week pilots, week-by-week | < half do 4 of 7 sessions in week 3 |
| 3 (new) | Patients choose to share their log, and physios find it useful | G | Count shares; ask the physio after each visit | < 1 in 3 patients share, or physios don't look at it |
| 4 | People understand the safety checklist and setup | G | Usability test, EN and Peruvian Spanish | > 1 of 5 errors in either language |
| 5 | People or groups will pay | G | Fake door; clinic and trainer price questions | < 5% try to pay and no group or clinic names a price |
| 6 | People struggle after a sprain and want a guided program | Partly E | Keep asking in every pilot conversation | Few describe a struggle |

## Risks to watch

| Risk | Early sign | Response |
| --- | --- | --- |
| Drift into telehealth | Physio replying to shared logs or adjusting routines by WhatsApp | Re-brief; changes only at visits; add telehealth only through a registered partner |
| Patients expect someone is watching | Patients send symptoms with their shared log | Clear share-screen message; safety checklist on every log screen |
| Missed serious injury | Someone with a warning sign kept exercising | Review the checklist wording; make it more prominent |
| Too similar to existing home-exercise apps | Physios say "we already use Physitrack" | Compete on ankle programs, Peruvian Spanish, price and simple QR setup |
| Adherence drops after week 1 | Week-2 completion under 50% | Lean on the coach or physio; shorten sessions |
| Too much to do alone | Phase 0 tasks slip past Nov 3 | Drop the fake door first; keep both pilots |

Not legal advice. Confirm the routine-tool framing with the UW Law & Entrepreneurship Clinic and a Peruvian data-protection lawyer before public launch.
