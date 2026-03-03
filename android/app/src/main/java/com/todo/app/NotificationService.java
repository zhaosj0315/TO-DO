package com.todo.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class NotificationService extends Service {
    private static final String CHANNEL_ID = "todo_alarm_service";
    private static final int NOTIFICATION_ID = 999;

    @Override
    public void onCreate() {
        super.onCreate();
        android.util.Log.d("NotificationService", "🔄 服务启动");
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY; // 服务被杀死后自动重启
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "任务提醒服务",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("保持应用后台运行以接收任务提醒");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TODO 任务提醒")
            .setContentText("后台运行中，等待任务提醒...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true) // 不可滑动删除
            .build();
    }
}
