package com.rezoxnemesis.reuz;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.window.OnBackInvokedDispatcher;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextClock;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Random;

/**
 * The screen that appears over the lock screen when an alarm rings. It plays the alarm sound,
 * fades the background up like a sunrise and, for Pro users, asks for a dial or math challenge
 * before the alarm can be switched off.
 */
public class RingActivity extends Activity {
    private static final long RAMP_MS = 60_000L;
    private static final long GIVE_UP_MS = 10 * 60_000L;
    private static final long ESCAPE_MS = 5 * 60_000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Random random = new Random();
    private JSONObject item = new JSONObject();
    private String id = "";
    private String challenge = "off";
    private MediaPlayer player;
    private Vibrator vibrator;
    private LinearLayout root;
    private LinearLayout stage;
    private ValueAnimator sunrise;
    private boolean finished;

    // dial challenge state
    private int[] code;
    private int codeIndex;
    private TextView codeText;
    private RotaryView rotary;

    // math challenge state
    private int answer;
    private int tries;
    private String typed = "";
    private TextView questionText;
    private TextView answerText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        id = getIntent().getStringExtra("id") == null ? "" : getIntent().getStringExtra("id");
        try {
            item = new JSONObject(getIntent().getStringExtra("item"));
        } catch (JSONException | NullPointerException e) {
            item = new JSONObject();
        }
        challenge = item.optString("challenge", "off");
        getSystemService(NotificationManager.class).cancel(id.hashCode());

        if (Build.VERSION.SDK_INT >= 33) { // Android 13+ delivers Back through this callback, not onBackPressed
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> {
                        if ("off".equals(challenge)) finishRinging();
                    });
        }

        buildUi();
        startSound(item.optBoolean("gentle", true));
        startSunrise();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                finishRinging();
            }
        }, GIVE_UP_MS);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private Button button(String label, boolean primary, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(17);
        b.setTextColor(primary ? 0xFF1A1004 : 0xFFEEF2FB);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(18));
        bg.setColor(primary ? 0xFFFFC46B : 0x33FFFFFF);
        b.setBackground(bg);
        b.setOnClickListener(l);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(56));
        lp.topMargin = dp(10);
        b.setLayoutParams(lp);
        return b;
    }

    private void buildUi() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(dp(24), dp(56), dp(24), dp(32));
        root.setBackgroundColor(0xFF0B0D12);

        TextClock clock = new TextClock(this);
        clock.setFormat12Hour("h:mm");
        clock.setFormat24Hour("HH:mm");
        clock.setTextSize(76);
        clock.setTextColor(0xFFFFFFFF);
        clock.setTypeface(Typeface.create("sans-serif-thin", Typeface.NORMAL));
        clock.setGravity(Gravity.CENTER);
        root.addView(clock);

        String body = item.optString("body", "");
        root.addView(text(item.optString("title", "Rise and shine"), 22, 0xFFFFC46B, true));
        if (!body.isEmpty()) root.addView(text(body, 16, 0xFFD5DBEA, false));

        stage = new LinearLayout(this);
        stage.setOrientation(LinearLayout.VERTICAL);
        stage.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        sp.topMargin = dp(24);
        root.addView(stage, sp);
        setContentView(root);

        if ("dial".equals(challenge)) buildDial();
        else if ("math".equals(challenge)) buildMath();
        else buildPlain();
    }

    private void buildPlain() {
        stage.setGravity(Gravity.BOTTOM);
        stage.addView(button(getString(R.string.dismiss), true, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finishRinging();
            }
        }));
        stage.addView(button(getString(R.string.snooze), false, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                ReuzBridge.snooze(RingActivity.this, item);
                finishRinging();
            }
        }));
    }

    /** After a few minutes a stuck challenge offers a plain dismiss, so nobody is locked in. */
    private void scheduleEscape() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (finished) return;
                stage.addView(button(getString(R.string.emergency_dismiss), false, new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        finishRinging();
                    }
                }));
            }
        }, ESCAPE_MS);
    }

    // ---- Dial challenge ----------------------------------------------------------------------

    private void buildDial() {
        code = new int[3];
        for (int i = 0; i < code.length; i++) code[i] = random.nextInt(10);
        stage.addView(text(getString(R.string.dial_prompt), 15, 0xFFD5DBEA, false));
        codeText = text("", 34, 0xFFFFFFFF, true);
        stage.addView(codeText);
        rotary = new RotaryView(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        lp.topMargin = dp(8);
        stage.addView(rotary, lp);
        rotary.setHub("?");
        rotary.setOnDigit(new RotaryView.OnDigit() {
            @Override
            public void onDigit(int digit) {
                if (digit == code[codeIndex]) {
                    codeIndex++;
                    rotary.setHub(String.valueOf(digit));
                    if (codeIndex == code.length) finishRinging();
                } else {
                    codeIndex = 0;
                    rotary.setHub("x");
                    vibrate(120);
                }
                renderCode();
            }
        });
        renderCode();
        scheduleEscape();
    }

    private void renderCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < code.length; i++) {
            if (i > 0) sb.append("   ");
            sb.append(i < codeIndex ? "✓" : String.valueOf(code[i]));
        }
        codeText.setText(sb.toString());
    }

    // ---- Math challenge ----------------------------------------------------------------------

    private void buildMath() {
        questionText = text("", 40, 0xFFFFFFFF, true);
        answerText = text("", 34, 0xFFFFC46B, true);
        stage.addView(text(getString(R.string.math_prompt), 15, 0xFFD5DBEA, false));
        stage.addView(questionText);
        stage.addView(answerText);

        String[][] rows = { { "1", "2", "3" }, { "4", "5", "6" }, { "7", "8", "9" }, { "⌫", "0", "OK" } };
        for (String[] row : rows) {
            LinearLayout line = new LinearLayout(this);
            line.setOrientation(LinearLayout.HORIZONTAL);
            for (final String key : row) {
                Button b = button(key, "OK".equals(key), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        press(key);
                    }
                });
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(56), 1f);
                lp.setMargins(dp(4), dp(6), dp(4), 0);
                b.setLayoutParams(lp);
                line.addView(b);
            }
            stage.addView(line, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        }
        nextQuestion();
        scheduleEscape();
    }

    private void nextQuestion() {
        int a = 23 + random.nextInt(67), b = 17 + random.nextInt(60);
        boolean minus = random.nextBoolean() && a > b;
        answer = minus ? a - b : a + b;
        questionText.setText(a + (minus ? " − " : " + ") + b);
        typed = "";
        tries = 0;
        answerText.setText("_");
    }

    private void press(String key) {
        if ("⌫".equals(key)) {
            if (!typed.isEmpty()) typed = typed.substring(0, typed.length() - 1);
        } else if ("OK".equals(key)) {
            if (typed.equals(String.valueOf(answer))) {
                finishRinging();
                return;
            }
            vibrate(120);
            typed = "";
            if (++tries >= 3) nextQuestion();
        } else if (typed.length() < 4) {
            typed += key;
        }
        answerText.setText(typed.isEmpty() ? "_" : typed);
    }

    // ---- Sound, vibration, sunrise ----------------------------------------------------------

    private void startSound(boolean gentle) {
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            player.setDataSource(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
            player.setLooping(true);
            player.prepare();
            player.setVolume(gentle ? 0.05f : 1f, gentle ? 0.05f : 1f);
            player.start();
            if (gentle) ramp();
        } catch (Exception e) {
            player = null; // no sound available; vibration and the screen still wake the user
        }
        vibrator = getSystemService(Vibrator.class);
        if (vibrator != null && vibrator.hasVibrator()) {
            vibrator.vibrate(VibrationEffect.createWaveform(new long[] { 0, 500, 500 }, 0));
        }
    }

    private void ramp() {
        final long start = System.currentTimeMillis();
        handler.post(new Runnable() {
            @Override
            public void run() {
                if (player == null || finished) return;
                float f = Math.min(1f, (System.currentTimeMillis() - start) / (float) RAMP_MS);
                float v = 0.05f + 0.95f * f * f;
                try {
                    player.setVolume(v, v);
                } catch (IllegalStateException ignored) {
                    return;
                }
                if (f < 1f) handler.postDelayed(this, 500);
            }
        });
    }

    private void startSunrise() {
        sunrise = ValueAnimator.ofObject(new ArgbEvaluator(), 0xFF0B0D12, 0xFF6A3A16, 0xFFFFB25B);
        sunrise.setDuration(RAMP_MS * 2);
        sunrise.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator a) {
                root.setBackgroundColor((Integer) a.getAnimatedValue());
            }
        });
        sunrise.start();
    }

    private void vibrate(long ms) {
        Vibrator v = getSystemService(Vibrator.class);
        if (v != null && v.hasVibrator()) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
    }

    private void finishRinging() {
        if (finished) return;
        finished = true;
        handler.removeCallbacksAndMessages(null);
        if (sunrise != null) sunrise.cancel();
        if (player != null) {
            try {
                player.stop();
            } catch (IllegalStateException ignored) {
                // already stopped
            }
            player.release();
            player = null;
        }
        if (vibrator != null) vibrator.cancel();
        getSystemService(NotificationManager.class).cancel(id.hashCode());
        finish();
    }

    @Override
    public void onBackPressed() {
        if ("off".equals(challenge)) finishRinging(); // with a challenge, back does nothing
    }

    @Override
    protected void onDestroy() {
        if (!finished) { // the system closed the screen; make sure nothing keeps ringing
            finished = true;
            if (player != null) player.release();
            if (vibrator != null) vibrator.cancel();
        }
        super.onDestroy();
    }
}
