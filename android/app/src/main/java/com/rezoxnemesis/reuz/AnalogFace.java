package com.rezoxnemesis.reuz;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;

import java.util.Calendar;

/** Draws the analog clock into a bitmap, so it follows the home timezone and needs no view tricks. */
final class AnalogFace {
    private static final int SIZE = 400;

    private AnalogFace() {}

    static Bitmap draw(Calendar cal, boolean withFace) {
        Bitmap bmp = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        float mid = SIZE / 2f, r = SIZE / 2f - 8f;
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        if (withFace) {
            p.setStyle(Paint.Style.FILL);
            p.setShader(new LinearGradient(0, 0, SIZE, SIZE,
                    new int[] { 0xFFBAB3A3, 0xFF3D4549, 0xFF131A1E, 0xFF97765B },
                    new float[] { 0f, 0.25f, 0.70f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(mid, mid, r, p);
            p.setShader(new RadialGradient(mid - 50f, mid - 60f, SIZE,
                    0xFF242C31, 0xFF080D10, Shader.TileMode.CLAMP));
            c.drawCircle(mid, mid, r - 8f, p);
            p.setShader(null);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(1.5f);
            p.setColor(0xAAABB0AC);
            c.drawCircle(mid, mid, r - 3f, p);
            p.setColor(0xAA687172);
            c.drawCircle(mid, mid, r - 14f, p);
        }

        int brass = 0xFFFFB44F;
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < 60; i++) {
            boolean hour = i % 5 == 0;
            double a = Math.toRadians(i * 6);
            float outer = r - 23f, inner = outer - (hour ? 22f : 8f);
            p.setStrokeWidth(hour ? 5f : 2f);
            p.setColor(hour ? brass : 0xFF748084);
            if (!withFace && !hour) p.setColor(0x66FFFFFF);
            c.drawLine(mid + (float) Math.sin(a) * inner, mid - (float) Math.cos(a) * inner,
                    mid + (float) Math.sin(a) * outer, mid - (float) Math.cos(a) * outer, p);
        }

        float sec = cal.get(Calendar.SECOND);
        float min = cal.get(Calendar.MINUTE) + sec / 60f;
        float hr = (cal.get(Calendar.HOUR) % 12) + min / 60f;
        hand(c, p, mid, hr * 30f, r * 0.50f, 10f, 0xFFFFC16A, withFace);
        hand(c, p, mid, min * 6f, r * 0.76f, 6f, brass, withFace);

        p.setStyle(Paint.Style.FILL);
        p.setColor(brass);
        c.drawCircle(mid, mid, 11f, p);
        p.setColor(0xFF11181C);
        c.drawCircle(mid, mid, 4f, p);
        return bmp;
    }

    private static void hand(Canvas c, Paint p, float mid, float deg, float len, float width,
                             int color, boolean withFace) {
        double a = Math.toRadians(deg);
        float x = mid + (float) Math.sin(a) * len, y = mid - (float) Math.cos(a) * len;
        if (!withFace) { // soft dark edge keeps hands readable on bright wallpapers
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeCap(Paint.Cap.ROUND);
            p.setStrokeWidth(width + 6f);
            p.setColor(0x55000000);
            c.drawLine(mid, mid, x, y, p);
        }
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setStrokeWidth(width);
        p.setColor(color);
        c.drawLine(mid, mid, x, y, p);
    }
}
