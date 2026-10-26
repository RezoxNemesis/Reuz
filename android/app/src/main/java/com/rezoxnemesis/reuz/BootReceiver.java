package com.rezoxnemesis.reuz;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restores alarms and timers after a restart or an app update, since AlarmManager clears them. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            ReuzBridge.restore(context);
            ClockWidget.updateAll(context);
        }
    }
}
