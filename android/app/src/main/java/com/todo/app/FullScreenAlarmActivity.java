package com.todo.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
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
import android.widget.LinearLayout;
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
        String category = getIntent().getStringExtra("category");
        String priority = getIntent().getStringExtra("priority");
        String type = getIntent().getStringExtra("type");
        String deadline = getIntent().getStringExtra("deadline");
        String created = getIntent().getStringExtra("created");
        String description = getIntent().getStringExtra("description");

        // 设置UI
        TextView titleView = findViewById(R.id.alarm_title);
        TextView bodyView = findViewById(R.id.alarm_body);
        TextView categoryView = findViewById(R.id.task_category);
        TextView priorityView = findViewById(R.id.task_priority);
        TextView typeView = findViewById(R.id.task_type);
        TextView deadlineView = findViewById(R.id.task_deadline);
        TextView createdView = findViewById(R.id.task_created);
        LinearLayout descriptionSection = findViewById(R.id.description_section);
        TextView descriptionView = findViewById(R.id.task_description);
        
        titleView.setText(title);
        bodyView.setText(taskText);
        
        if (category != null && !category.isEmpty()) {
            categoryView.setText(category);
        }
        
        if (priority != null && !priority.isEmpty()) {
            priorityView.setText(priority);
        }
        
        if (type != null && !type.isEmpty()) {
            typeView.setText(type);
        }
        
        if (deadline != null && !deadline.isEmpty()) {
            // 移除"⏰ 截止："前缀，只显示时间
            String deadlineTime = deadline.replace("⏰ 截止：", "⏰ ");
            deadlineView.setText(deadlineTime);
        }
        
        if (created != null && !created.isEmpty()) {
            // 移除"🕐 创建于："前缀
            String createdTime = created.replace("🕐 创建于：", "🕐 ");
            createdView.setText(createdTime);
        }
        
        if (description != null && !description.isEmpty()) {
            descriptionSection.setVisibility(View.VISIBLE);
            descriptionView.setText(description);
        }

        // 按钮事件
        Button btnComplete = findViewById(R.id.btn_complete);
        Button btnSnooze1 = findViewById(R.id.btn_snooze_1);
        Button btnSnooze5 = findViewById(R.id.btn_snooze_5);
        Button btnSnooze10 = findViewById(R.id.btn_snooze_10);
        Button btnSnooze30 = findViewById(R.id.btn_snooze_30);
        Button btnSnooze60 = findViewById(R.id.btn_snooze_60);
        Button btnDismiss = findViewById(R.id.btn_dismiss);

        btnComplete.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('complete', " + taskId + ")");
            finish();
        });

        btnSnooze1.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('snooze', " + taskId + ", 1)");
            finish();
        });

        btnSnooze5.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('snooze', " + taskId + ", 5)");
            finish();
        });

        btnSnooze10.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('snooze', " + taskId + ", 10)");
            finish();
        });

        btnSnooze30.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('snooze', " + taskId + ", 30)");
            finish();
        });

        btnSnooze60.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('snooze', " + taskId + ", 60)");
            finish();
        });

        btnDismiss.setOnClickListener(v -> {
            stopAlarm();
            executeJavaScript("window.handleAlarmAction('dismiss', " + taskId + ")");
            finish();
        });

        // 启动闹钟和震动
        startAlarm();
    }

    private void executeJavaScript(String script) {
        // 通过Intent返回主Activity并执行JS
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("executeJS", script);
        startActivity(intent);
    }

    private void sendBroadcast(String action, int taskId) {
        Intent intent = new Intent("com.todo.app.ALARM_ACTION");
        intent.putExtra("action", action);
        intent.putExtra("taskId", taskId);
        sendBroadcast(intent);
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
