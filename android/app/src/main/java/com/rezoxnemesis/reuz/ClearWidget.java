package com.rezoxnemesis.reuz;

import android.content.Context;
import android.widget.RemoteViews;

/** Fully transparent digital clock: big light digits that float over the wallpaper. */
public class ClearWidget extends ReuzWidget {
    @Override
    RemoteViews build(Context c, Moment m) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_clear);
        v.setTextViewText(R.id.w_time, m.time());
        v.setTextViewText(R.id.w_ampm, m.ampm());
        v.setTextViewText(R.id.w_date, m.date() + "  ·  " + m.place());
        v.setOnClickPendingIntent(R.id.w_root, openApp(c));
        return v;
    }
}
