package com.todo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "task_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        // 获取唤醒锁，确保设备被唤醒
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK | 
            PowerManager.ACQUIRE_CAUSES_WAKEUP | 
            PowerManager.ON_AFTER_RELEASE,
            "TODO:AlarmWakeLock"
        );
        wakeLock.acquire(10000); // 保持10秒唤醒
        
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        int notificationId = intent.getIntExtra("notificationId", 1);

        // 格式化当前时间
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Shanghai"));
        String currentTimeStr = sdf.format(new java.util.Date());

        android.util.Log.e("AlarmReceiver", "========================================");
        android.util.Log.e("AlarmReceiver", "🔔 闹钟触发！");
        android.util.Log.e("AlarmReceiver", "📝 任务名称: " + body);
        android.util.Log.e("AlarmReceiver", "⏰ 触发时间: " + currentTimeStr);
        android.util.Log.e("AlarmReceiver", "========================================");

        // 启动全屏提醒 Activity
        Intent fullScreenIntent = new Intent(context, FullScreenAlarmActivity.class);
        fullScreenIntent.putExtra("taskTitle", title);
        fullScreenIntent.putExtra("taskDescription", body);
        fullScreenIntent.putExtra("taskId", notificationId);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        android.util.Log.e("AlarmReceiver", "🚀 启动全屏提醒界面...");
        context.startActivity(fullScreenIntent);
        
        // 释放唤醒锁
        if (wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
