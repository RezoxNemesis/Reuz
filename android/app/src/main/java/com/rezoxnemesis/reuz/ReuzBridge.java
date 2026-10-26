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
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Bridge between the Reuz web page and the phone. The page sees it as window.ReuzNative.
 * Alarms and timers are handed to AlarmManager, so they ring even when the app is closed.
 * BootReceiver re-arms them after a restart, because AlarmManager forgets them then.
 */
public final class ReuzBridge {
    static final String PREFS = "reuz";
    static final String KEY_SCHEDULE = "schedule";
    static final String KEY_TZ = "tz";
    static final String KEY_FORMAT = "format";
    static final String CHANNEL_ID = "reuz_alarms";
    static final String ACTION_FIRE = "com.rezoxnemesis.reuz.FIRE";
    static final int MAX_ITEMS = 64;
    private static final int PERMISSION_REQUEST = 7;

    private final Activity activity;

    public ReuzBridge(Activity activity) {
        this.activity = activity;
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
        nm.createNotificationChannel(ch);
    }

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

    /**
     * Replaces the full schedule with the list the page sends. Each item is either a daily alarm
     * ({id,title,body,hour,minute}) or a one-off timer ({id,title,body,at}, epoch ms).
     */
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
        for (int i = 0; i < previous.length(); i++) {
            JSONObject old = previous.optJSONObject(i);
            if (old != null) cancel(c, old.optString("id"));
        }

        long now = System.currentTimeMillis();
        JSONArray kept = new JSONArray();
        for (int i = 0; i < incoming.length() && kept.length() < MAX_ITEMS; i++) {
            JSONObject e = incoming.optJSONObject(i);
            if (e == null) continue;
            String id = e.optString("id", "");
            if (id.isEmpty()) continue;
            boolean daily = e.has("hour");
            long at = e.optLong("at", 0);
            if (!daily && at <= now) continue; // already rang, nothing to arm
            kept.put(e);
            schedule(c, id, e.optString("title", "Reuz"), e.optString("body", ""),
                    daily, e.optInt("hour", 0), e.optInt("minute", 0), at);
        }
        prefs(c).edit().putString(KEY_SCHEDULE, kept.toString()).apply();
    }

    @JavascriptInterface
    public void setHome(String tz, String format) {
        if (tz == null || tz.isEmpty() || tz.length() > 64) return;
        String f = "12h".equals(format) ? "12h" : "24h";
        prefs(activity).edit().putString(KEY_TZ, tz).putString(KEY_FORMAT, f).apply();
        ClockWidget.updateAll(activity);
    }

    static void schedule(Context c, String id, String title, String body,
                         boolean daily, int hour, int minute, long at) {
        long trigger = daily ? nextDaily(hour, minute) : Math.max(at, System.currentTimeMillis() + 1000);
        Intent intent = fireIntent(c, id)
                .putExtra("id", id)
                .putExtra("title", title)
                .putExtra("body", body)
                .putExtra("hour", daily ? hour : -1)
                .putExtra("minute", daily ? minute : -1);
        PendingIntent op = PendingIntent.getBroadcast(c, requestCode(id), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent show = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        c.getSystemService(AlarmManager.class)
                .setAlarmClock(new AlarmManager.AlarmClockInfo(trigger, show), op);
    }

    static void cancel(Context c, String id) {
        if (id == null || id.isEmpty()) return;
        PendingIntent op = PendingIntent.getBroadcast(c, requestCode(id), fireIntent(c, id),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (op != null) {
            c.getSystemService(AlarmManager.class).cancel(op);
            op.cancel();
        }
    }

    /** Re-arms the saved schedule, used after a reboot or an app update. */
    static void restore(Context c) {
        JSONArray all = load(c);
        long now = System.currentTimeMillis();
        for (int i = 0; i < all.length(); i++) {
            JSONObject e = all.optJSONObject(i);
            if (e == null) continue;
            boolean daily = e.has("hour");
            long at = e.optLong("at", 0);
            if (!daily && at <= now) continue;
            schedule(c, e.optString("id"), e.optString("title", "Reuz"), e.optString("body", ""),
                    daily, e.optInt("hour", 0), e.optInt("minute", 0), at);
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

    static JSONArray load(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY_SCHEDULE, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    static long nextDaily(int hour, int minute) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) cal.add(Calendar.DAY_OF_MONTH, 1);
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
