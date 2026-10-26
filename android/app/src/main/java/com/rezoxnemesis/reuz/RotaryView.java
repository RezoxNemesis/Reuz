package com.rezoxnemesis.reuz;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.LinearInterpolator;

/**
 * An old-fashioned rotary phone dial. Drag a finger hole clockwise to the finger stop and let go;
 * the dial spins back and the digit is reported. Geometry matches the dial in the Reuz page.
 */
public class RotaryView extends View {
    /** Called with the dialled digit 0-9. */
    public interface OnDigit {
        void onDigit(int digit);
    }

    private static final float STOP_DEG = 120f;     // finger stop, clockwise from the top
    private static final float RETURN_DEG_PER_S = 380f;
    private static final float TICK_DEG = 28f;
    private static final float SLACK_DEG = 7f;

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path plate = new Path();
    private OnDigit listener;
    private float rotation;     // how far the plate is turned, degrees clockwise
    private int active;         // 1..10 while a hole is being dragged, 0 otherwise
    private float lastAngle;
    private int lastTick;
    private boolean returning;
    private String hub = "";

    public RotaryView(Context context) {
        super(context);
    }

    public void setOnDigit(OnDigit l) {
        listener = l;
    }

    public void setHub(String text) {
        hub = text;
        invalidate();
    }

    /** Where hole n sits when the plate is at rest, as an angle clockwise from the top. */
    private static float holeAngle(int n) {
        return STOP_DEG - (20f + 28f * n);
    }

    private static float needed(int n) {
        return 20f + 28f * n;
    }

    private float cx() { return getWidth() / 2f; }
    private float cy() { return getHeight() / 2f; }
    private float radius() { return Math.min(getWidth(), getHeight()) / 2f * 0.96f; }
    private float ring() { return radius() * 0.70f; }
    private float holeR() { return radius() * 0.115f; }

    private float px(float deg, float rad) { return cx() + rad * (float) Math.sin(Math.toRadians(deg)); }
    private float py(float deg, float rad) { return cy() - rad * (float) Math.cos(Math.toRadians(deg)); }

    @Override
    protected void onMeasure(int w, int h) {
        int size = Math.min(MeasureSpec.getSize(w), MeasureSpec.getSize(h) > 0 ? MeasureSpec.getSize(h) : MeasureSpec.getSize(w));
        setMeasuredDimension(size, size);
    }

    @Override
    protected void onDraw(Canvas c) {
        float r = radius();
        // Base plate with the numbers that show through the finger holes.
        paint.setShader(new RadialGradient(cx(), cy(), r, 0xFF1A2038, 0xFF0A0D1A, Shader.TileMode.CLAMP));
        paint.setStyle(Paint.Style.FILL);
        c.drawCircle(cx(), cy(), r, paint);
        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(r * 0.012f);
        paint.setColor(0x33FFFFFF);
        c.drawCircle(cx(), cy(), r, paint);

        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0xFFFFD98C);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setFakeBoldText(true);
        paint.setTextSize(r * 0.15f);
        for (int n = 1; n <= 10; n++) {
            float a = holeAngle(n);
            c.drawText(String.valueOf(n % 10), px(a, ring()), py(a, ring()) + paint.getTextSize() * 0.35f, paint);
        }

        // The turning plate: a disc with ten holes cut out.
        plate.reset();
        plate.setFillType(Path.FillType.EVEN_ODD);
        plate.addCircle(cx(), cy(), r * 0.93f, Path.Direction.CW);
        for (int n = 1; n <= 10; n++) {
            float a = holeAngle(n);
            plate.addCircle(px(a, ring()), py(a, ring()), holeR(), Path.Direction.CW);
        }
        c.save();
        c.rotate(rotation, cx(), cy());
        paint.setColor(0xFF2A3256);
        c.drawPath(plate, paint);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(r * 0.02f);
        paint.setColor(0xFFFFB25B);
        c.drawCircle(cx(), cy(), r * 0.93f, paint);
        for (int n = 1; n <= 10; n++) {
            float a = holeAngle(n);
            c.drawCircle(px(a, ring()), py(a, ring()), holeR(), paint);
        }
        c.restore();

        // Finger stop.
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeWidth(r * 0.05f);
        paint.setColor(0xFFFFC46B);
        c.drawLine(px(STOP_DEG, r * 0.80f), py(STOP_DEG, r * 0.80f), px(STOP_DEG, r * 1.0f), py(STOP_DEG, r * 1.0f), paint);

        // Hub.
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0xFFFFC46B);
        c.drawCircle(cx(), cy(), r * 0.25f, paint);
        paint.setColor(0xFF10142A);
        c.drawCircle(cx(), cy(), r * 0.20f, paint);
        paint.setColor(0xFFFFD98C);
        paint.setTextSize(r * 0.20f);
        c.drawText(hub, cx(), cy() + paint.getTextSize() * 0.35f, paint);
    }

    private float touchAngle(float x, float y) {
        return (float) Math.toDegrees(Math.atan2(x - cx(), -(y - cy())));
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        if (returning) return true;
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                active = 0;
                for (int n = 1; n <= 10; n++) {
                    float a = holeAngle(n);
                    if (Math.hypot(e.getX() - px(a, ring()), e.getY() - py(a, ring())) <= holeR() * 1.6f) {
                        active = n;
                        break;
                    }
                }
                if (active == 0) return false;
                lastAngle = touchAngle(e.getX(), e.getY());
                rotation = 0;
                lastTick = 0;
                performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                getParent().requestDisallowInterceptTouchEvent(true);
                return true;
            case MotionEvent.ACTION_MOVE:
                if (active == 0) return true;
                float a = touchAngle(e.getX(), e.getY());
                float d = a - lastAngle;
                if (d > 180) d -= 360;
                if (d < -180) d += 360;
                lastAngle = a;
                rotation = Math.max(0, Math.min(needed(active), rotation + d));
                int step = (int) (rotation / TICK_DEG);
                if (step > lastTick) performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                lastTick = step;
                invalidate();
                return true;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (active == 0) return true;
                boolean reached = e.getActionMasked() == MotionEvent.ACTION_UP
                        && rotation >= needed(active) - SLACK_DEG;
                spinBack(reached ? active % 10 : -1);
                active = 0;
                return true;
            default:
                return true;
        }
    }

    private void spinBack(final int digit) {
        if (rotation <= 0.5f) {
            rotation = 0;
            invalidate();
            return;
        }
        returning = true;
        final float from = rotation;
        ValueAnimator va = ValueAnimator.ofFloat(from, 0f);
        va.setInterpolator(new LinearInterpolator());
        va.setDuration((long) (from / RETURN_DEG_PER_S * 1000f));
        final int[] ticked = { (int) (from / TICK_DEG) };
        va.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator a) {
                rotation = (Float) a.getAnimatedValue();
                int step = (int) (rotation / TICK_DEG);
                while (ticked[0] > step) {
                    performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                    ticked[0]--;
                }
                invalidate();
            }
        });
        va.addListener(new android.animation.AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(android.animation.Animator animation) {
                rotation = 0;
                returning = false;
                invalidate();
                if (digit >= 0 && listener != null) listener.onDigit(digit);
            }
        });
        va.start();
    }
}
