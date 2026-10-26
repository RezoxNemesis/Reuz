package com.rezoxnemesis.reuz;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Fires when an alarm or timer is due: posts the notification and re-arms daily alarms. */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!ReuzBridge.ACTION_FIRE.equals(intent.getAction())) return;
        String id = intent.getStringExtra("id");
        if (id == null) return;
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        int hour = intent.getIntExtra("hour", -1);
        int minute = intent.getIntExtra("minute", -1);
        boolean daily = hour >= 0;

        ReuzBridge.ensureChannel(context);
        Notification.Builder builder = new Notification.Builder(context, ReuzBridge.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title != null ? title : context.getString(R.string.app_name))
                .setContentText(body)
                .setCategory(Notification.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(PendingIntent.getActivity(context, 0,
                        new Intent(context, MainActivity.class), PendingIntent.FLAG_IMMUTABLE));
        context.getSystemService(NotificationManager.class).notify(id.hashCode(), builder.build());

        if (daily) {
            ReuzBridge.schedule(context, id, title, body, true, hour, minute, 0);
        } else {
            ReuzBridge.forget(context, id);
        }
    }
}
