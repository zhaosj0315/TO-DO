package com.todo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FullScreenNotification")
public class FullScreenNotificationPlugin extends Plugin {

    private static final String CHANNEL_ID = "fullscreen-urgent";
    private static final String CHANNEL_NAME = "全屏紧急提醒";

    @PluginMethod
    public void showFullScreenNotification(PluginCall call) {
        String title = call.getString("title", "任务提醒");
        String body = call.getString("body", "");
        int notificationId = call.getInt("id", 1);

        Context context = getContext();

        // 直接启动全屏Activity
        Intent fullScreenIntent = new Intent(context, FullScreenAlarmActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("taskId", notificationId);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);
        
        context.startActivity(fullScreenIntent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelNotification(PluginCall call) {
        int notificationId = call.getInt("id", 1);
        NotificationManager notificationManager = 
            (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancel(notificationId);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
