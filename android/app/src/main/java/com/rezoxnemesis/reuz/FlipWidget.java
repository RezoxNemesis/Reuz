package com.rezoxnemesis.reuz;

import android.content.Context;
import android.widget.RemoteViews;

/** Flip-card clock: each digit sits on its own dark tile. */
public class FlipWidget extends ReuzWidget {
    @Override
    RemoteViews build(Context c, Moment m) {
        String hhmm = m.fmt(m.twelve ? "hh:mm" : "HH:mm");
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_flip);
        v.setTextViewText(R.id.f_h1, hhmm.substring(0, 1));
        v.setTextViewText(R.id.f_h2, hhmm.substring(1, 2));
        v.setTextViewText(R.id.f_m1, hhmm.substring(3, 4));
        v.setTextViewText(R.id.f_m2, hhmm.substring(4, 5));
        v.setTextViewText(R.id.f_info, (m.twelve ? m.ampm() + "  ·  " : "") + m.date());
        v.setOnClickPendingIntent(R.id.w_root, openApp(c));
        return v;
    }
}
