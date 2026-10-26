package com.rezoxnemesis.reuz;

import android.content.Context;
import android.widget.RemoteViews;

/** Glass digital clock. Also receives the shared minute tick. */
public class ClockWidget extends ReuzWidget {
    @Override
    RemoteViews build(Context c, Moment m) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_clock);
        v.setTextViewText(R.id.w_zone, m.place());
        v.setTextViewText(R.id.w_time, m.time());
        v.setTextViewText(R.id.w_ampm, m.ampm());
        v.setTextViewText(R.id.w_date, m.date());
        v.setOnClickPendingIntent(R.id.w_root, openApp(c));
        return v;
    }

    static void updateAll(Context context) {
        ReuzWidget.updateAll(context);
    }
}
