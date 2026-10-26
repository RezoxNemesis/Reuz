package com.rezoxnemesis.reuz;

import android.content.Context;
import android.widget.RemoteViews;

/** Analog clock on a glass dial. */
public class AnalogWidget extends ReuzWidget {
    @Override
    RemoteViews build(Context c, Moment m) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_analog);
        v.setImageViewBitmap(R.id.w_face, AnalogFace.draw(m.calendar(), true));
        v.setOnClickPendingIntent(R.id.w_root, openApp(c));
        return v;
    }
}
