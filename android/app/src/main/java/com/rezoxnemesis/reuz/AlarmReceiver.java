package com.rezoxnemesis.reuz;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Fires when an alarm or timer is due: posts the notification, re-arms repeats, handles snooze. */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String id = intent.getStringExtra("id");
        if (id == null) return;
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        if (ReuzBridge.ACTION_SNOOZE.equals(action)) {
            context.getSystemService(NotificationManager.class).cancel(id.hashCode());
            ReuzBridge.addOneOff(context, "snooze-" + id, title != null ? title : "Reuz", body,
                    System.currentTimeMillis() + ReuzBridge.SNOOZE_MS);
            return;
        }
        if (!ReuzBridge.ACTION_FIRE.equals(action)) return;

        int hour = intent.getIntExtra("hour", -1);
        int minute = intent.getIntExtra("minute", -1);
        int days = intent.getIntExtra("days", 0);
        boolean daily = hour >= 0;
        boolean timer = id.startsWith("timer-");

        ReuzBridge.ensureChannel(context);
        Notification.Builder builder = new Notification.Builder(context, ReuzBridge.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title != null ? title : context.getString(R.string.app_name))
                .setContentText(body)
                .setCategory(Notification.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(PendingIntent.getActivity(context, 0,
                        new Intent(context, MainActivity.class), PendingIntent.FLAG_IMMUTABLE));
        if (!timer) {
            Intent snooze = new Intent(context, AlarmReceiver.class)
                    .setAction(ReuzBridge.ACTION_SNOOZE)
                    .setData(android.net.Uri.parse("reuz://snooze/" + android.net.Uri.encode(id)))
                    .putExtra("id", id).putExtra("title", title).putExtra("body", body);
            builder.addAction(new Notification.Action.Builder(null,
                    context.getString(R.string.snooze),
                    PendingIntent.getBroadcast(context, id.hashCode() ^ 0x5A5A, snooze,
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)).build());
        }
        context.getSystemService(NotificationManager.class).notify(id.hashCode(), builder.build());

        if (daily) {
            ReuzBridge.schedule(context, id, title, body, true, hour, minute, days, 0);
        } else {
            ReuzBridge.forget(context, id);
        }
    }
}
