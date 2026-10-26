package com.rezoxnemesis.reuz;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/** Home-screen clock. It shows the time in the same timezone and format as the web page. */
public class ClockWidget extends AppWidgetProvider {
    private static final String ACTION_TICK = "com.rezoxnemesis.reuz.WIDGET_TICK";
    private static final long MINUTE = 60_000L;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) render(context, manager, id);
        scheduleTick(context);
    }

    @Override
    public void onEnabled(Context context) {
        scheduleTick(context);
    }

    @Override
    public void onDisabled(Context context) {
        cancelTick(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_TICK.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            updateAll(context);
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, ClockWidget.class));
        for (int id : ids) render(context, manager, id);
    }

    static void render(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences p = ReuzBridge.prefs(context);
        String tzId = p.getString(ReuzBridge.KEY_TZ, "UTC");
        TimeZone zone = TimeZone.getTimeZone(tzId);
        boolean twelve = "12h".equals(p.getString(ReuzBridge.KEY_FORMAT, "24h"));
        Date now = new Date();

        SimpleDateFormat time = new SimpleDateFormat(twelve ? "h:mm" : "HH:mm", Locale.getDefault());
        SimpleDateFormat meridiem = new SimpleDateFormat("a", Locale.getDefault());
        SimpleDateFormat date = new SimpleDateFormat("EEE d MMM", Locale.getDefault());
        time.setTimeZone(zone);
        meridiem.setTimeZone(zone);
        date.setTimeZone(zone);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_clock);
        views.setTextViewText(R.id.w_zone, tzId.replace('_', ' '));
        views.setTextViewText(R.id.w_time, time.format(now));
        views.setTextViewText(R.id.w_ampm, twelve ? meridiem.format(now) : "");
        views.setTextViewText(R.id.w_date, date.format(now));
        views.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(context, 0,
                new Intent(context, MainActivity.class), PendingIntent.FLAG_IMMUTABLE));
        manager.updateAppWidget(widgetId, views);
    }

    private static PendingIntent tickIntent(Context context, int flags) {
        Intent intent = new Intent(context, ClockWidget.class).setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(context, 0, intent, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Refreshes the minute display. Inexact, so the system can batch it with other work. */
    private static void scheduleTick(Context context) {
        long next = (System.currentTimeMillis() / MINUTE + 1) * MINUTE;
        context.getSystemService(AlarmManager.class)
                .setRepeating(AlarmManager.RTC, next, MINUTE,
                        tickIntent(context, PendingIntent.FLAG_UPDATE_CURRENT));
    }

    private static void cancelTick(Context context) {
        PendingIntent op = tickIntent(context, PendingIntent.FLAG_NO_CREATE);
        if (op != null) {
            context.getSystemService(AlarmManager.class).cancel(op);
            op.cancel();
        }
    }
}
