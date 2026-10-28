# Testing the app on a phone

Two ways. Start with **A** today (15 minutes, free). Do **B** before Demo Night, because "Add to my calendar" only works in B.

| | A. Expo Go | B. Installable build (EAS) |
| --- | --- | --- |
| What it is | Expo's test app runs your code from your laptop | A real app file installed on the phone |
| Cost | Free | Free Expo account. Android: free. iPhone: needs an Apple Developer account (US$99/year) |
| Works | Everything **except** "Add to my calendar" (the `.ics` file option works) | Everything |
| Needs the laptop running | Yes, same Wi-Fi | No |

## A. Expo Go (quick check)

1. On the phone, install **Expo Go** from the App Store or Google Play.
2. On your laptop (Node 20+ installed), download the code and start it:

```bash
git clone https://github.com/valjuanjo/ankle-routine
```

```bash
cd ankle-routine/app && npm install
```

```bash
npx expo start --go
```

3. A QR code appears in the terminal. Android: scan it from Expo Go. iPhone: scan it with the Camera app.
4. If the phone can't connect (different networks, university Wi-Fi), stop it and run `npx expo start --go --tunnel`.

## B. Installable build (full test, including the calendar)

One-time setup on your laptop:

```bash
npm install -g eas-cli
```

```bash
eas login
```

(Create a free account at expo.dev if you don't have one.) Then, from `ankle-routine/app`:

**Android** (free, gives you an APK you can send to testers by WhatsApp):

```bash
eas build --platform android --profile preview
```

When it finishes (about 10–20 minutes), open the link it prints on the Android phone, download and install the APK (allow "install unknown apps" when asked).

**iPhone** (needs the Apple Developer account):

```bash
eas device:create
```

Open the link on the iPhone to register it, then:

```bash
eas build --platform ios --profile preview
```

Open the link it prints on the iPhone and install. On iOS 16+ turn on Settings → Privacy & Security → Developer Mode if asked.

## Test checklist

Do it once in Spanish (Peru) and once in English (US). Tick each item. For anything that fails, write down the phone model, the step and a screenshot.

**Setup**
- [ ] Onboarding: language, country, 3 consent boxes, safety checklist; "Siguiente"/"Acepto" stay disabled until everything is ticked
- [ ] Emergency number buttons (SAMU 106 / 911) open the phone dialer

**Loading a routine**
- [ ] Scan `demo/demo-routine.png` (open it on your laptop screen) with "Mi fisioterapeuta me dio un código": the camera asks for permission, then shows the routine preview
- [ ] Scan any other QR (a website): shows the "isn't a routine" error
- [ ] General program → mild sprain: can't start until the confirmation box is ticked
- [ ] Team warm-up loads

**Daily use**
- [ ] Reminders: in Ajustes set the time 2 minutes ahead on a routine day; the notification arrives with the app closed
- [ ] Log a session with pain and a note; it appears in Progreso (calendar, week bar, pain chart, history)
- [ ] Long-press a history item → delete works
- [ ] Close the app completely and reopen: routine and log are still there

**Sharing**
- [ ] Compartir: untick notes, remove one session, create the PDF; WhatsApp/email opens; the PDF has no notes and not the removed session, and has the red "nadie lo está supervisando" box

**Calendar (MVP)**
- [ ] Hoy → "Agregar al calendario": time, weeks, exercise list toggle
- [ ] (Build B only) "Agregar a mi calendario": permission prompt (iPhone says the app can add events, not read them); events appear in Google/Apple Calendar on the right days and time, repeating for the chosen weeks, with a 15-minute alert
- [ ] (Build B only) Add again: no duplicates on Android; on iPhone note whether old events stay
- [ ] (Build B only) "Quitar de mi calendario" removes them on Android; on iPhone a message says to delete them in the calendar app
- [ ] Deny calendar permission: a clear message appears, and the .ics option still works
- [ ] "Obtener archivo de calendario (.ics)": open the file in Google Calendar / Apple Calendar / Outlook; events land on the right days

**Settings**
- [ ] Switch language: all screens change, including program names
- [ ] "Borrar todos mis datos" returns to onboarding with nothing left
