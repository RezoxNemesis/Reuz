# Reuz on Google Play: listing and launch checklist

## Store listing

**App name:** Reuz: Rotary Alarm Clock
**Short description (80 max):** Glass clock with rotary-dial alarms, smart wake and focus timers.

**Full description:**

Reuz is a clock with a personality. Spin a knob or dial a number on an old-style rotary phone to set alarms and timers, with real clockwork ticks and haptics as you turn.

FREE
- Digital and analog clock that flips with a tap
- World clocks with time differences
- Alarms with weekday repeats, snooze and gentle volume
- Timers and a lap stopwatch
- Five home-screen widgets: Glass, Clear, Flip, Analog and Analog Clear
- Works offline, no account, no ads

REUZ PRO
- Dismiss challenges: dial a random code on the rotary or solve a sum to switch an alarm off
- Smart wake window: rest the phone on the bed and Reuz rings early, when it feels you stirring, inside a 10, 20 or 30 minute window
- Focus timers: Pomodoro, Deep and Flow sessions that start their break by themselves

Pro is available monthly, yearly or as a one-time lifetime purchase. Cancel a subscription any time in Google Play.

**Category:** Tools. **Tags:** alarm clock, timer, widgets.
**Contact email:** (fill in; required by Play)
**Privacy policy URL:** https://reuz.prakasharuntandon634.workers.dev/privacy

## Graphics (already generated in this folder)
- icon-512.png (512x512)
- feature-graphic.png (1024x500)
- screenshots/1..7 (1080x1920, phone)

## Play Console steps
1. Create the app (name above, free app, default language English).
2. App signing: use Play App Signing. Upload `Reuz.aab` from the GitHub release. The first upload fixes the upload key, so make sure the CI secrets (REUZ_KEYSTORE_B64, REUZ_KEYSTORE_PASSWORD, REUZ_KEY_ALIAS) are set before building the file you upload.
3. Monetise > Products > Subscriptions: create `reuz_pro_monthly` and `reuz_pro_yearly`, each with one base plan. Monetise > Products > In-app products: create `reuz_pro_lifetime`. Activate all three. The ids must match exactly.
4. Add yourself under Setup > License testing to test purchases without being charged.
5. Fill the declarations below, add the listing text and graphics, then submit to internal testing first.

## Declarations

**Data safety:** no data collected or shared. No data leaves the device. Purchases are handled by Google Play. (Select "No data collected", "Data is not shared", and note the data is not encrypted in transit only because none is sent.)

**Content rating:** answer the IARC questionnaire with no violence, no user-generated content, no sharing; expect "Everyone".

**Target audience:** 18 and over is simplest. Not designed for children.

**Ads:** none.

**Foreground service permission (specialUse):** used by the smart wake window. Explanation to paste: "While the user has turned on a smart wake window for an alarm, a visible ongoing notification is shown and the accelerometer is read so the alarm can ring early when the user stirs. It runs only inside the window the user chose and stops when the alarm rings or the window ends. Nothing is stored or sent."

**Full-screen intent permission:** the app is an alarm clock; the alarm ring screen opens over the lock screen when an alarm goes off.

**Exact alarm permission (USE_EXACT_ALARM):** the core function of the app is alarms and timers set by the user.

**Notification permission:** needed so alarms and timers can ring.

## Before you publish
- The three secrets above must be set so every build uses the same key.
- Test on a real phone: ring screen over the lock screen, both challenges, smart wake, a license-tester purchase, restoring a purchase after reinstall.
- Pro status is checked on the phone with Google Play. There is no server-side receipt check yet, which is fine for launch.
