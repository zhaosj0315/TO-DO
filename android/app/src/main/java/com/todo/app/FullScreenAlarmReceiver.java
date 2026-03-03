package com.todo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class FullScreenAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        android.util.Log.d("AlarmReceiver", "收到 AlarmManager 触发");
        
        // 创建通知渠道
        NotificationManager notificationManager = 
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "fullscreen-urgent",
                "全屏紧急提醒",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("紧急任务的全屏提醒");
            notificationManager.createNotificationChannel(channel);
        }
        
        // 创建全屏 Intent
        Intent fullScreenIntent = new Intent(context, FullScreenAlarmActivity.class);
        fullScreenIntent.putExtras(intent.getExtras());
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            intent.getIntExtra("taskId", 0),
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // 使用全屏通知（官方推荐方式）
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "fullscreen-urgent")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(intent.getStringExtra("title"))
            .setContentText(intent.getStringExtra("body"))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(true);
        
        android.util.Log.d("AlarmReceiver", "显示全屏通知");
        notificationManager.notify(intent.getIntExtra("taskId", 0), builder.build());
    }
}
