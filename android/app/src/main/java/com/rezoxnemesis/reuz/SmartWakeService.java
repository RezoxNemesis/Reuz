package com.rezoxnemesis.reuz;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import java.text.DateFormat;
import java.util.Date;

/**
 * Smart wake window. Starts when the window opens and listens to the accelerometer. When the
 * phone (resting on the bed) feels you stirring, it rings the alarm early. If nothing happens,
 * the normal alarm rings at its set time. Readings are never stored or sent anywhere.
 */
public class SmartWakeService extends Service implements SensorEventListener {
    static final String ACTION_START = "com.rezoxnemesis.reuz.SMART_START";
    static final String ACTION_STOP = "com.rezoxnemesis.reuz.SMART_STOP";
    private static final String CHANNEL = "reuz_smart";
    private static final int NOTIFICATION_ID = 4711;
    private static final long EPOCH_MS = 20_000L;
    private static final long SETTLE_MS = 90_000L;
    private static final float STIR = 0.12f; // mean movement in m/s^2 that counts as stirring

    private final Handler handler = new Handler(Looper.getMainLooper());
    private SensorManager sensors;
    private PowerManager.WakeLock wake;
    private String id;
    private String item;
    private long deadline;
    private long startedAt;
    private long epochStart;
    private float baseline = Float.NaN;
    private float energy;
    private int samples;
    private boolean fired;

    static void stop(Context c, String id) {
        Intent i = new Intent(c, SmartWakeService.class).setAction(ACTION_STOP).putExtra("id", id);
        try {
            c.startService(i);
        } catch (RuntimeException ignored) {
            // The service is not running and the app is in the background; nothing to stop.
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_STOP.equals(intent.getAction())) {
            if (id != null && id.equals(intent.getStringExtra("id"))) finish();
            else if (id == null) stopSelf();
            return START_NOT_STICKY;
        }
        id = intent.getStringExtra("id");
        item = intent.getStringExtra("item");
        deadline = intent.getLongExtra("deadline", 0);
        long now = System.currentTimeMillis();
        startForeground(NOTIFICATION_ID, notification()); // must happen promptly after startForegroundService
        if (id == null || item == null || deadline <= now) {
            finish();
            return START_NOT_STICKY;
        }
        startedAt = epochStart = now;

        PowerManager pm = getSystemService(PowerManager.class);
        wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "reuz:smartwake");
        wake.acquire(deadline - now + 60_000L);

        sensors = getSystemService(SensorManager.class);
        Sensor accel = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (accel == null) {
            finish();
            return START_NOT_STICKY;
        }
        sensors.registerListener(this, accel, SensorManager.SENSOR_DELAY_NORMAL);
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                finish();
            }
        }, deadline - now);
        return START_NOT_STICKY;
    }

    private Notification notification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(
                CHANNEL, getString(R.string.smart_channel), NotificationManager.IMPORTANCE_LOW));
        String latest = DateFormat.getTimeInstance(DateFormat.SHORT).format(new Date(deadline));
        return new Notification.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_alarm)
                .setContentTitle(getString(R.string.smart_title))
                .setContentText(getString(R.string.smart_text, latest))
                .setOngoing(true)
                .setContentIntent(PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
                        PendingIntent.FLAG_IMMUTABLE))
                .build();
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        float mag = (float) Math.sqrt(e.values[0] * e.values[0] + e.values[1] * e.values[1] + e.values[2] * e.values[2]);
        if (Float.isNaN(baseline)) baseline = mag;
        baseline = 0.9f * baseline + 0.1f * mag;
        energy += Math.abs(mag - baseline);
        samples++;
        long now = System.currentTimeMillis();
        if (now - epochStart < EPOCH_MS) return;
        float mean = samples == 0 ? 0 : energy / samples;
        epochStart = now;
        energy = 0;
        samples = 0;
        if (!fired && now - startedAt > SETTLE_MS && mean > STIR) {
            fired = true;
            ringNow();
        }
    }

    private void ringNow() {
        sendBroadcast(ReuzBridge.fireIntent(this, id)
                .setPackage(getPackageName())
                .putExtra("id", id).putExtra("item", item).putExtra("early", true));
        finish();
    }

    private void finish() {
        handler.removeCallbacksAndMessages(null);
        if (sensors != null) sensors.unregisterListener(this);
        if (wake != null && wake.isHeld()) wake.release();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (sensors != null) sensors.unregisterListener(this);
        if (wake != null && wake.isHeld()) wake.release();
        super.onDestroy();
    }
}
