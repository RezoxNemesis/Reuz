package com.rezoxnemesis.reuz;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
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
            p.setShader(new LinearGradient(0, 0, SIZE, SIZE, 0xE62A3350, 0xE60B0D12, Shader.TileMode.CLAMP));
            c.drawCircle(mid, mid, r, p);
            p.setShader(null);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(3f);
            p.setColor(0x44FFFFFF);
            c.drawCircle(mid, mid, r, p);
        }

        int brass = 0xFFFFC46B;
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < 60; i++) {
            boolean hour = i % 5 == 0;
            double a = Math.toRadians(i * 6);
            float outer = r - 14f, inner = outer - (hour ? 26f : 9f);
            p.setStrokeWidth(hour ? 7f : 3f);
            p.setColor(hour ? brass : 0x88FFFFFF);
            if (!withFace && !hour) p.setColor(0x66FFFFFF);
            c.drawLine(mid + (float) Math.sin(a) * inner, mid - (float) Math.cos(a) * inner,
                    mid + (float) Math.sin(a) * outer, mid - (float) Math.cos(a) * outer, p);
        }

        float sec = cal.get(Calendar.SECOND);
        float min = cal.get(Calendar.MINUTE) + sec / 60f;
        float hr = (cal.get(Calendar.HOUR) % 12) + min / 60f;
        hand(c, p, mid, hr * 30f, r * 0.50f, 13f, 0xFFF4F7FF, withFace);
        hand(c, p, mid, min * 6f, r * 0.76f, 8f, 0xFFF4F7FF, withFace);

        p.setStyle(Paint.Style.FILL);
        p.setColor(brass);
        c.drawCircle(mid, mid, 12f, p);
        p.setColor(0xFF0B0D12);
        c.drawCircle(mid, mid, 4.5f, p);
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
