package com.todo.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class FullScreenAlarmActivity extends AppCompatActivity {

    private Ringtone ringtone;
    private Vibrator vibrator;
    private int taskId;
    private String taskText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 设置全屏显示（覆盖锁屏）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            keyguardManager.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        setContentView(R.layout.activity_fullscreen_alarm);

        // 获取传递的数据
        taskId = getIntent().getIntExtra("taskId", 0);
        String title = getIntent().getStringExtra("title");
        taskText = getIntent().getStringExtra("body");

        // 设置UI
        TextView titleView = findViewById(R.id.alarm_title);
        TextView bodyView = findViewById(R.id.alarm_body);
        titleView.setText(title);
        bodyView.setText(taskText);

        // 按钮事件
        Button btnComplete = findViewById(R.id.btn_complete);
        Button btnSnooze = findViewById(R.id.btn_snooze);
        Button btnDismiss = findViewById(R.id.btn_dismiss);

        btnComplete.setOnClickListener(v -> {
            stopAlarm();
            // TODO: 通知前端完成任务
            finish();
        });

        btnSnooze.setOnClickListener(v -> {
            stopAlarm();
            // TODO: 通知前端稍后提醒
            finish();
        });

        btnDismiss.setOnClickListener(v -> {
            stopAlarm();
            finish();
        });

        // 启动闹钟和震动
        startAlarm();
    }

    private void startAlarm() {
        // 播放闹钟铃声
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(this, alarmUri);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone.setLooping(true);
            }
            ringtone.play();
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 启动震动
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = {0, 1000, 500, 1000, 500, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
    }

    private void stopAlarm() {
        // 停止铃声
        if (ringtone != null && ringtone.isPlaying()) {
            ringtone.stop();
        }
        
        // 停止震动
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlarm();
    }

    @Override
    public void onBackPressed() {
        // 禁用返回键，必须点击按钮才能关闭
    }
}
