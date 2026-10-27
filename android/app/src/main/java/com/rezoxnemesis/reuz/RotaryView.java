package com.rezoxnemesis.reuz;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
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
        // Layered steel rim around the dark number plate.
        paint.setStyle(Paint.Style.FILL);
        paint.setShader(new LinearGradient(cx() - r, cy() - r, cx() + r, cy() + r,
                new int[] { 0xFFB6B1A4, 0xFF454B4D, 0xFF12191E, 0xFF857465 },
                new float[] { 0f, 0.28f, 0.68f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(cx(), cy(), r, paint);
        paint.setShader(new RadialGradient(cx() - r * 0.25f, cy() - r * 0.3f, r * 1.4f,
                0xFF222A2F, 0xFF070B0E, Shader.TileMode.CLAMP));
        c.drawCircle(cx(), cy(), r * 0.965f, paint);
        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(r * 0.004f);
        paint.setColor(0x998E989A);
        c.drawCircle(cx(), cy(), r * 0.985f, paint);
        paint.setColor(0xCC070B0E);
        c.drawCircle(cx(), cy(), r * 0.945f, paint);

        // Numbers stay fixed while the finger plate turns above them.
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0xFFF4F2E9);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setFakeBoldText(false);
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
        paint.setShader(new LinearGradient(cx() - r, cy() - r, cx() + r, cy() + r,
                new int[] { 0xFF4A5051, 0xFF20282D, 0xFF0B1115, 0xFF383630 },
                new float[] { 0f, 0.25f, 0.7f, 1f }, Shader.TileMode.CLAMP));
        c.drawPath(plate, paint);
        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(r * 0.008f);
        paint.setColor(0xFF7A7F7C);
        c.drawCircle(cx(), cy(), r * 0.93f, paint);
        paint.setStrokeWidth(r * 0.006f);
        for (int n = 1; n <= 10; n++) {
            float a = holeAngle(n);
            paint.setColor(0xFF95978E);
            c.drawCircle(px(a, ring()), py(a, ring()), holeR(), paint);
            paint.setColor(0xFF070B0D);
            c.drawCircle(px(a, ring()), py(a, ring()), holeR() + r * 0.012f, paint);
        }
        paint.setColor(0x665D6568);
        paint.setStrokeWidth(r * 0.005f);
        c.drawCircle(cx(), cy(), r * 0.40f, paint);
        c.restore();

        // The fixed finger stop catches the light like a small piece of brushed metal.
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeWidth(r * 0.075f);
        paint.setColor(0xFF080C0F);
        c.drawLine(px(STOP_DEG, r * 0.78f), py(STOP_DEG, r * 0.78f), px(STOP_DEG, r * 1.0f), py(STOP_DEG, r * 1.0f), paint);
        paint.setStrokeWidth(r * 0.052f);
        paint.setShader(new LinearGradient(px(STOP_DEG, r * 0.80f), py(STOP_DEG, r * 0.80f),
                px(STOP_DEG, r), py(STOP_DEG, r), 0xFFEBE8D9, 0xFF897866, Shader.TileMode.CLAMP));
        c.drawLine(px(STOP_DEG, r * 0.80f), py(STOP_DEG, r * 0.80f), px(STOP_DEG, r * 1.0f), py(STOP_DEG, r * 1.0f), paint);
        paint.setShader(null);

        // Hub.
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0xFF080C0E);
        c.drawCircle(cx(), cy(), r * 0.30f, paint);
        paint.setShader(new RadialGradient(cx() - r * 0.08f, cy() - r * 0.10f, r * 0.43f,
                0xFFFFD284, 0xFFF39422, Shader.TileMode.CLAMP));
        c.drawCircle(cx(), cy(), r * 0.265f, paint);
        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(r * 0.008f);
        paint.setColor(0xFFFFD790);
        c.drawCircle(cx(), cy(), r * 0.265f, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0xFF211709);
        paint.setFakeBoldText(true);
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
