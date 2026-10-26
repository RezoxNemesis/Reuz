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
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Base of the five Reuz home-screen clocks. Each one shows the time in the same timezone and
 * 12/24h format as the web page. A single inexact minute tick refreshes all of them together.
 */
public abstract class ReuzWidget extends AppWidgetProvider {
    static final String ACTION_TICK = "com.rezoxnemesis.reuz.WIDGET_TICK";
    private static final long MINUTE = 60_000L;
    private static final Class<?>[] ALL = {
            ClockWidget.class, ClearWidget.class, FlipWidget.class,
            AnalogWidget.class, AnalogClearWidget.class };

    /** The snapshot every widget renders from. */
    static final class Moment {
        final String tzId;
        final TimeZone zone;
        final boolean twelve;
        final Date now = new Date();

        Moment(Context c) {
            SharedPreferences p = ReuzBridge.prefs(c);
            tzId = p.getString(ReuzBridge.KEY_TZ, "UTC");
            zone = TimeZone.getTimeZone(tzId);
            twelve = "12h".equals(p.getString(ReuzBridge.KEY_FORMAT, "24h"));
        }

        String fmt(String pattern) {
            SimpleDateFormat f = new SimpleDateFormat(pattern, Locale.getDefault());
            f.setTimeZone(zone);
            return f.format(now);
        }

        String time() { return fmt(twelve ? "h:mm" : "HH:mm"); }
        String ampm() { return twelve ? fmt("a") : ""; }
        String date() { return fmt("EEE d MMM"); }
        String place() { return tzId.replace('_', ' '); }

        Calendar calendar() {
            Calendar cal = Calendar.getInstance(zone);
            cal.setTime(now);
            return cal;
        }
    }

    abstract RemoteViews build(Context context, Moment moment);

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Moment m = new Moment(context);
        for (int id : appWidgetIds) manager.updateAppWidget(id, build(context, m));
        scheduleTick(context);
    }

    @Override
    public void onEnabled(Context context) {
        scheduleTick(context);
    }

    @Override
    public void onDisabled(Context context) {
        if (count(context) == 0) cancelTick(context);
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

    static PendingIntent openApp(Context c) {
        return PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE);
    }

    static int count(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int n = 0;
        for (Class<?> k : ALL) n += manager.getAppWidgetIds(new ComponentName(context, k)).length;
        return n;
    }

    /** Redraws every placed Reuz widget of every style. */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        Moment m = new Moment(context);
        for (Class<?> k : ALL) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, k));
            if (ids.length == 0) continue;
            ReuzWidget w;
            try {
                w = (ReuzWidget) k.getDeclaredConstructor().newInstance();
            } catch (ReflectiveOperationException e) {
                continue;
            }
            for (int id : ids) manager.updateAppWidget(id, w.build(context, m));
        }
    }

    private static PendingIntent tickIntent(Context context, int flags) {
        Intent intent = new Intent(context, ClockWidget.class).setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(context, 0, intent, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Refreshes the minute display. Inexact, so the system can batch it with other work. */
    static void scheduleTick(Context context) {
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
