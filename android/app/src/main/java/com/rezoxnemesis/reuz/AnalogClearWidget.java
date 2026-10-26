package com.rezoxnemesis.reuz;

import android.content.Context;
import android.widget.RemoteViews;

/** Analog clock with no dial at all: just ticks and hands over the wallpaper. */
public class AnalogClearWidget extends ReuzWidget {
    @Override
    RemoteViews build(Context c, Moment m) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_analog_clear);
        v.setImageViewBitmap(R.id.w_face, AnalogFace.draw(m.calendar(), false));
        v.setOnClickPendingIntent(R.id.w_root, openApp(c));
        return v;
    }
}
