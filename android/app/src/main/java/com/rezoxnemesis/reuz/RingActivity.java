package com.rezoxnemesis.reuz;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
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
import android.view.WindowInsets;
import android.window.OnBackInvokedDispatcher;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
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
    private GradientDrawable backdrop;
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
        getWindow().setStatusBarColor(0xFF0B1014);
        getWindow().setNavigationBarColor(0xFF0B1014);
        getWindow().getDecorView().setSystemUiVisibility(0);
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
        t.setTypeface(Typeface.create(bold ? "sans-serif-medium" : "sans-serif", Typeface.NORMAL));
        t.setIncludeFontPadding(false);
        return t;
    }

    private Button button(String label, boolean primary, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(16);
        b.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        b.setTextColor(primary ? 0xFF231505 : 0xFFF3F3EF);
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                primary ? new int[] { 0xFFFFC260, 0xFFFFA025 }
                        : new int[] { 0xFF30393E, 0xFF151D22 });
        bg.setCornerRadius(dp(18));
        bg.setStroke(dp(1), primary ? 0xFFFFD18A : 0xFF596165);
        b.setBackground(new RippleDrawable(ColorStateList.valueOf(
                primary ? 0x33271504 : 0x33FFBB62), bg, null));
        b.setBackgroundTintList(null);
        b.setElevation(dp(primary ? 5 : 2));
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
        root.setPadding(dp(24), dp(32), dp(24), dp(24));
        backdrop = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] { 0xFF0B1014, 0xFF211C17 });
        root.setBackground(backdrop);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                l = bars.left; t = bars.top; r = bars.right; b = bars.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(dp(24) + l, dp(32) + t, dp(24) + r, dp(24) + b);
            return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : insets.consumeSystemWindowInsets();
        });

        TextView brand = text("Reuz", 16, 0xFFFFBC61, true);
        brand.setLetterSpacing(0.08f);
        LinearLayout.LayoutParams brandParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        brandParams.bottomMargin = dp(20);
        root.addView(brand, brandParams);

        TextClock clock = new TextClock(this);
        clock.setFormat12Hour("h:mm");
        clock.setFormat24Hour("HH:mm");
        clock.setTextSize(70);
        clock.setTextColor(0xFFF4F5F2);
        clock.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        clock.setIncludeFontPadding(false);
        clock.setGravity(Gravity.CENTER);
        root.addView(clock);

        String body = item.optString("body", "");
        TextView title = text(item.optString("title", "Rise and shine"), 22, 0xFFFFBC61, true);
        title.setPadding(0, dp(14), 0, dp(8));
        root.addView(title);
        if (!body.isEmpty()) root.addView(text(body, 16, 0xFFBBC4C9, false));

        stage = new LinearLayout(this);
        stage.setOrientation(LinearLayout.VERTICAL);
        stage.setGravity(Gravity.CENTER_HORIZONTAL);
        stage.setPadding(dp(16), dp(20), dp(16), dp(16));
        GradientDrawable glass = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                new int[] { 0xD6384248, 0xE612191E, 0xD6262622 });
        glass.setCornerRadius(dp(26));
        glass.setStroke(dp(1), 0x886E777A);
        stage.setBackground(glass);
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
        stage.setGravity(Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        stage.setBackground(null);
        stage.setPadding(0, 0, 0, 0);
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
        stage.addView(text(getString(R.string.dial_prompt), 15, 0xFFBBC4C9, false));
        codeText = text("", 34, 0xFFFFBC61, true);
        codeText.setPadding(0, dp(12), 0, dp(4));
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
        // Keep every key reachable on compact screens and when the user enlarges text.
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setClipToPadding(false);
        LinearLayout keypad = new LinearLayout(this);
        keypad.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(keypad, new ScrollView.LayoutParams(
                ScrollView.LayoutParams.MATCH_PARENT, ScrollView.LayoutParams.WRAP_CONTENT));
        stage.addView(scroll, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        questionText = text("", 40, 0xFFF4F5F2, true);
        questionText.setPadding(0, dp(12), 0, dp(8));
        answerText = text("", 34, 0xFFFFBC61, true);
        keypad.addView(text(getString(R.string.math_prompt), 15, 0xFFBBC4C9, false));
        keypad.addView(questionText);
        keypad.addView(answerText);

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
            keypad.addView(line, new LinearLayout.LayoutParams(
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
        sunrise = ValueAnimator.ofObject(new ArgbEvaluator(), 0xFF211C17, 0xFF3B2A1D, 0xFF684021);
        sunrise.setDuration(RAMP_MS * 2);
        sunrise.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator a) {
                backdrop.setColors(new int[] { 0xFF0B1014, (Integer) a.getAnimatedValue() });
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
