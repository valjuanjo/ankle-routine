# Usability test guide (Nov 5–8) · Gate 2

5 people in Madison (English) + 5 in Lima (Peruvian Spanish). 15 minutes each. Use `prototype/index.html` on a phone (open the file, or host the `prototype/` folder anywhere static).

**Gate 2 question:** Do people understand the safety checklist and complete the routine setup without help?
**We're wrong if (assumption 4):** more than 1 of 5 makes an error in either language.

## Script

Say: "I'm testing the app, not you. Think out loud. I can't help during the tasks."

| # | Task (read aloud) | Success = | Error = |
| --- | --- | --- | --- |
| 1 | "Set the app up in your language and start." | Reaches the start screen without help | Asks for help, or gives up |
| 2 | "Your physio just showed you a QR code. Load your routine." | Taps "My physio gave me a code" → Simulate scan | Picks general program or team |
| 3 | "Imagine your foot is numb and cold today. What would you do?" | Says don't exercise, contact physio / urgent care (finds the Safety tab or checklist) | Says they'd do the exercises, or expects the app to alert someone |
| 4 | "Log today's session. Your pain is 3." | Saves with pain 3 | Can't find it |
| 5 | "Send your log to your physio, but without your notes." | Unticks Notes, taps Create PDF | Leaves notes in, or can't find Share |
| 6 | "After you send it, who will read it, and when?" | "My physio, at my next visit" / "nobody is watching" | "My physio will check it and reply" |

## Record per participant

| ID | City | Lang | T1 | T2 | T3 | T4 | T5 | T6 | Errors | Quotes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M1 | Madison | EN | | | | | | | | |
| L1 | Lima | ES | | | | | | | | |

Gate 2 passes if, in **each** language, at most 1 of 5 participants has an error on T3 or T6 and at most 1 of 5 fails setup (T1–T2). If it fails: simplify the checklist and setup before building more (see plan).
