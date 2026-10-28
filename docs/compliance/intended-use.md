# Intended use (EN / ES)

v0.1 · Oct 30, 2026 · Use these exact sentences everywhere: app, App Store, landing page, slides, social posts. Machine-readable copy: `content/intended-use.json` (the app reads it from there).

| Mode | English | Español (Perú) |
| --- | --- | --- |
| Prescribed routine | Helps you schedule and keep track of the exercises your physio prescribed. | Te ayuda a programar y llevar el registro de los ejercicios que te indicó tu fisioterapeuta. |
| General program | A general ankle exercise and prevention program. Tells you when to see a professional. | Un programa general de ejercicios y prevención para el tobillo. Te dice cuándo ver a un profesional. |
| Team program | A warm-up and prevention routine for your team. | Una rutina de calentamiento y prevención para tu equipo. |

## Standard notice

- **EN:** This app is not a diagnosis or treatment, and no one monitors what you log. If your ankle gets worse, contact your physio or go to urgent care.
- **ES:** Esta app no es un diagnóstico ni un tratamiento, y nadie supervisa lo que registras. Si tu tobillo empeora, contacta a tu fisioterapeuta o acude a emergencias.

> Note: the standard notice itself names the forbidden words to deny them. That is the only allowed use; the wording lint (`scripts/lint-wording.mjs`) allows the words only inside the exact phrase "not a diagnosis or treatment" / "no es un diagnóstico ni un tratamiento". Internal docs (like this one) aren't linted.

## Never use

- **EN:** treatment, rehab protocol, diagnosis, clinically proven, medical grade, ready to return to sport, recovery-time promises ("back in 2 weeks").
- **ES:** diagnóstico, tratamiento, cura (also avoid: "protocolo de rehabilitación", "clínicamente probado", "grado médico", "listo para volver al deporte", plazos de recuperación).

## Preferred words

| Instead of | Say |
| --- | --- |
| rehab protocol / protocolo | routine, program / rutina, programa |
| treatment / tratamiento | exercises your physio prescribed / ejercicios que te indicó tu fisioterapeuta |
| recovery in X weeks | a 6-week program / un programa de 6 semanas |
| monitored by your physio | a record for your next visit / un registro para tu próxima cita |
