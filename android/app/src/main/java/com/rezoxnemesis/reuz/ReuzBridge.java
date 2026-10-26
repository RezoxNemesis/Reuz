package com.rezoxnemesis.reuz;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Bridge between the Reuz page and the phone. The page sees it as window.ReuzNative.
 * Alarms and timers are handed to AlarmManager, so they ring even when the app is closed.
 * BootReceiver re-arms them after a restart, because AlarmManager forgets them then.
 *
 * A schedule item is a JSON object: {id,title,body} plus either a repeating alarm
 * ({hour,minute,days,challenge,window,gentle}) or a one-off timer ({at}, epoch ms).
 */
public final class ReuzBridge {
    static final String PREFS = "reuz";
    static final String KEY_SCHEDULE = "schedule";
    static final String KEY_TZ = "tz";
    static final String KEY_FORMAT = "format";
    static final String CHANNEL_ID = "reuz_alarms_v2";
    static final String ACTION_FIRE = "com.rezoxnemesis.reuz.FIRE";
    static final String ACTION_SNOOZE = "com.rezoxnemesis.reuz.SNOOZE";
    static final long SNOOZE_MS = 10 * 60_000L;
    static final int MAX_ITEMS = 64;
    private static final int PERMISSION_REQUEST = 7;

    private final Activity activity;
    private final ProStore store;

    public ReuzBridge(Activity activity, ProStore store) {
        this.activity = activity;
        this.store = store;
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void ensureChannel(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, c.getString(R.string.channel_name), NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription(c.getString(R.string.channel_description));
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[] { 0, 400, 200, 400, 200, 600 });
        ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
        nm.createNotificationChannel(ch);
        nm.deleteNotificationChannel("reuz_alarms");
    }

    // ---- JavaScript interface -------------------------------------------------------------

    /** True when the page may show notifications: permission granted and not blocked in settings. */
    @JavascriptInterface
    public boolean canNotify() {
        if (Build.VERSION.SDK_INT >= 33
                && activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        return activity.getSystemService(NotificationManager.class).areNotificationsEnabled();
    }

    @JavascriptInterface
    public void requestNotifications() {
        if (Build.VERSION.SDK_INT < 33) return;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.requestPermissions(
                        new String[] { Manifest.permission.POST_NOTIFICATIONS }, PERMISSION_REQUEST);
            }
        });
    }

    /** Short clock-tick feel for the dials: "tick" is light, "heavy" marks hour or dial stops. */
    @JavascriptInterface
    public void haptic(String kind) {
        Vibrator v = activity.getSystemService(Vibrator.class);
        if (v == null || !v.hasVibrator()) return;
        boolean heavy = "heavy".equals(kind);
        if (Build.VERSION.SDK_INT >= 29) {
            v.vibrate(VibrationEffect.createPredefined(
                    heavy ? VibrationEffect.EFFECT_HEAVY_CLICK : VibrationEffect.EFFECT_TICK));
        } else {
            v.vibrate(VibrationEffect.createOneShot(heavy ? 18 : 6, heavy ? 200 : 90));
        }
    }

    /** Replaces the full schedule with the list the page sends. */
    @JavascriptInterface
    public void sync(String json) {
        Context c = activity.getApplicationContext();
        JSONArray incoming;
        try {
            incoming = new JSONArray(json);
        } catch (JSONException e) {
            return;
        }
        JSONArray previous = load(c);
        long now = System.currentTimeMillis();
        JSONArray kept = new JSONArray();
        // A pending snooze belongs to the phone, not the page, so it survives a sync.
        for (int i = 0; i < previous.length(); i++) {
            JSONObject old = previous.optJSONObject(i);
            if (old == null) continue;
            if (old.optString("id").startsWith("snooze-") && old.optLong("at", 0) > now) {
                kept.put(old);
            } else {
                cancel(c, old.optString("id"));
            }
        }
        for (int i = 0; i < incoming.length() && kept.length() < MAX_ITEMS; i++) {
            JSONObject e = incoming.optJSONObject(i);
            if (e == null || e.optString("id", "").isEmpty()) continue;
            if (!e.has("hour") && e.optLong("at", 0) <= now) continue; // already rang
            kept.put(e);
            schedule(c, e, now);
        }
        prefs(c).edit().putString(KEY_SCHEDULE, kept.toString()).apply();
    }

    @JavascriptInterface
    public void setHome(String tz, String format) {
        if (tz == null || tz.isEmpty() || tz.length() > 64) return;
        String f = "12h".equals(format) ? "12h" : "24h";
        prefs(activity).edit().putString(KEY_TZ, tz).putString(KEY_FORMAT, f).apply();
        ReuzWidget.updateAll(activity);
    }

    /** The saved home zone as {"timezone","format"}, or "" when none was chosen yet. */
    @JavascriptInterface
    public String getHome() {
        SharedPreferences p = prefs(activity);
        if (!p.contains(KEY_TZ)) return "";
        try {
            return new JSONObject().put("timezone", p.getString(KEY_TZ, "UTC"))
                    .put("format", p.getString(KEY_FORMAT, "24h")).toString();
        } catch (JSONException e) {
            return "";
        }
    }

    @JavascriptInterface
    public boolean isPro() {
        return store.isPro();
    }

    @JavascriptInterface
    public String products() {
        return store.productsJson();
    }

    @JavascriptInterface
    public void buy(final String sku) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                store.buy(activity, sku);
            }
        });
    }

    @JavascriptInterface
    public void restore() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                store.refresh(true);
            }
        });
    }

    @JavascriptInterface
    public void manageSubscriptions() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.startActivity(new Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://play.google.com/store/account/subscriptions")));
            }
        });
    }

    // ---- Scheduling -----------------------------------------------------------------------

    static void schedule(Context c, JSONObject e, long after) {
        String id = e.optString("id");
        boolean daily = e.has("hour");
        long now = System.currentTimeMillis();
        long trigger = daily
                ? nextDaily(e.optInt("hour"), e.optInt("minute"), e.optInt("days", 0), after)
                : Math.max(e.optLong("at"), now + 1000);
        Intent intent = fireIntent(c, id).putExtra("id", id).putExtra("item", e.toString());
        PendingIntent op = PendingIntent.getBroadcast(c, requestCode(id), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent show = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager am = c.getSystemService(AlarmManager.class);
        am.setAlarmClock(new AlarmManager.AlarmClockInfo(trigger, show), op);

        int window = daily ? e.optInt("window", 0) : 0;
        if (window >= 5) scheduleSmartWake(c, am, id, e, trigger, window, now);
    }

    private static void scheduleSmartWake(Context c, AlarmManager am, String id, JSONObject e,
                                          long trigger, int windowMin, long now) {
        long start = trigger - windowMin * 60_000L;
        Intent svc = new Intent(c, SmartWakeService.class)
                .setAction(SmartWakeService.ACTION_START)
                .setData(Uri.parse("reuz://smart/" + Uri.encode(id)))
                .putExtra("id", id).putExtra("item", e.toString()).putExtra("deadline", trigger);
        if (start <= now) { // already inside the window, for example after the app was reopened
            try {
                c.startForegroundService(svc);
            } catch (RuntimeException ignored) {
                // Starting a foreground service from the background can be refused. The normal alarm still rings.
            }
            return;
        }
        PendingIntent pi = PendingIntent.getForegroundService(c, requestCode(id) ^ 0x3F3F, svc,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, start, pi);
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, start, pi);
        }
    }

    static void cancel(Context c, String id) {
        if (id == null || id.isEmpty()) return;
        AlarmManager am = c.getSystemService(AlarmManager.class);
        PendingIntent op = PendingIntent.getBroadcast(c, requestCode(id), fireIntent(c, id),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (op != null) {
            am.cancel(op);
            op.cancel();
        }
        Intent svc = new Intent(c, SmartWakeService.class)
                .setAction(SmartWakeService.ACTION_START)
                .setData(Uri.parse("reuz://smart/" + Uri.encode(id)));
        PendingIntent sp = PendingIntent.getForegroundService(c, requestCode(id) ^ 0x3F3F, svc,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (sp != null) {
            am.cancel(sp);
            sp.cancel();
        }
        SmartWakeService.stop(c, id);
    }

    /** Re-arms the saved schedule, used after a reboot or an app update. */
    static void restore(Context c) {
        JSONArray all = load(c);
        long now = System.currentTimeMillis();
        for (int i = 0; i < all.length(); i++) {
            JSONObject e = all.optJSONObject(i);
            if (e == null) continue;
            if (!e.has("hour") && e.optLong("at", 0) <= now) continue;
            schedule(c, e, now);
        }
    }

    /** Removes a one-off item once it has rung. */
    static void forget(Context c, String id) {
        JSONArray all = load(c);
        JSONArray kept = new JSONArray();
        for (int i = 0; i < all.length(); i++) {
            JSONObject e = all.optJSONObject(i);
            if (e != null && !id.equals(e.optString("id"))) kept.put(e);
        }
        prefs(c).edit().putString(KEY_SCHEDULE, kept.toString()).apply();
    }

    /** Rings the same alarm again in ten minutes. The snooze is a one-off that the phone owns. */
    static void snooze(Context c, JSONObject item) {
        try {
            JSONObject s = new JSONObject();
            String id = item.optString("id");
            s.put("id", id.startsWith("snooze-") ? id : "snooze-" + id);
            s.put("title", item.optString("title", "Reuz"));
            s.put("body", item.optString("body", ""));
            s.put("challenge", item.optString("challenge", "off"));
            s.put("gentle", item.optBoolean("gentle", true));
            s.put("at", System.currentTimeMillis() + SNOOZE_MS);
            JSONArray all = load(c);
            JSONArray kept = new JSONArray();
            for (int i = 0; i < all.length(); i++) {
                JSONObject e = all.optJSONObject(i);
                if (e != null && !s.optString("id").equals(e.optString("id"))) kept.put(e);
            }
            kept.put(s);
            prefs(c).edit().putString(KEY_SCHEDULE, kept.toString()).apply();
            schedule(c, s, System.currentTimeMillis());
        } catch (JSONException ignored) {
            // Building a small JSON object cannot realistically fail.
        }
    }

    static JSONArray load(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY_SCHEDULE, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    /**
     * First time hour:minute falls on an allowed weekday after afterMs. days is a bitmask with
     * Sunday = bit 0, the same as the page; 0 or 127 means every day.
     */
    static long nextDaily(int hour, int minute, int days, long afterMs) {
        boolean every = days == 0 || (days & 127) == 127;
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(afterMs);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        for (int i = 0; i < 9; i++) {
            boolean allowed = every || (days & (1 << (cal.get(Calendar.DAY_OF_WEEK) - 1))) != 0;
            if (allowed && cal.getTimeInMillis() > afterMs) break;
            cal.add(Calendar.DAY_OF_MONTH, 1);
        }
        return cal.getTimeInMillis();
    }

    static Intent fireIntent(Context c, String id) {
        return new Intent(c, AlarmReceiver.class)
                .setAction(ACTION_FIRE)
                .setData(Uri.parse("reuz://item/" + Uri.encode(id)));
    }

    static int requestCode(String id) {
        return id.hashCode();
    }
}
