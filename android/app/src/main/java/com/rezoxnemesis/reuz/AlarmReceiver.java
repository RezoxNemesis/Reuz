package com.rezoxnemesis.reuz;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;

/** Fires when an alarm or timer is due: shows the ring screen, re-arms repeats, handles snooze. */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String id = intent.getStringExtra("id");
        JSONObject item;
        try {
            item = new JSONObject(intent.getStringExtra("item"));
        } catch (JSONException | NullPointerException e) {
            return;
        }
        if (id == null) return;

        if (ReuzBridge.ACTION_SNOOZE.equals(action)) {
            context.getSystemService(NotificationManager.class).cancel(id.hashCode());
            ReuzBridge.snooze(context, item);
            return;
        }
        if (!ReuzBridge.ACTION_FIRE.equals(action)) return;

        boolean early = intent.getBooleanExtra("early", false);
        boolean daily = item.has("hour");
        boolean isTimer = id.startsWith("timer-");
        String challenge = item.optString("challenge", "off");
        String title = item.optString("title", context.getString(R.string.app_name));
        String body = item.optString("body", "");

        ReuzBridge.ensureChannel(context);
        Notification.Builder builder = new Notification.Builder(context, ReuzBridge.CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setCategory(Notification.CATEGORY_ALARM)
                .setAutoCancel(true);

        if (isTimer) {
            builder.setContentIntent(PendingIntent.getActivity(context, 0,
                    new Intent(context, MainActivity.class), PendingIntent.FLAG_IMMUTABLE));
        } else {
            Intent ring = new Intent(context, RingActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    .putExtra("id", id).putExtra("item", item.toString());
            PendingIntent ringPi = PendingIntent.getActivity(context, id.hashCode(), ring,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            builder.setContentIntent(ringPi).setFullScreenIntent(ringPi, true);
            if ("off".equals(challenge)) {
                Intent snooze = new Intent(context, AlarmReceiver.class)
                        .setAction(ReuzBridge.ACTION_SNOOZE)
                        .setData(Uri.parse("reuz://snooze/" + Uri.encode(id)))
                        .putExtra("id", id).putExtra("item", item.toString());
                builder.addAction(new Notification.Action.Builder(null,
                        context.getString(R.string.snooze),
                        PendingIntent.getBroadcast(context, id.hashCode() ^ 0x5A5A, snooze,
                                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)).build());
            } else {
                builder.setOngoing(true).setAutoCancel(false); // a challenge must be solved, not swiped away
            }
        }
        Notification n = builder.build();
        if (!isTimer) n.flags |= Notification.FLAG_INSISTENT;
        context.getSystemService(NotificationManager.class).notify(id.hashCode(), n);

        long now = System.currentTimeMillis();
        if (daily) {
            long after = early
                    ? ReuzBridge.nextDaily(item.optInt("hour"), item.optInt("minute"), item.optInt("days", 0), now)
                    : now + 30_000L;
            ReuzBridge.schedule(context, item, after);
        } else {
            ReuzBridge.forget(context, id);
        }
    }
}
