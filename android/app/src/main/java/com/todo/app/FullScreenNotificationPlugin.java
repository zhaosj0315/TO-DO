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
        String category = call.getString("category", "");
        String priority = call.getString("priority", "");
        String type = call.getString("type", "");
        String deadline = call.getString("deadline", "");
        String created = call.getString("created", "");
        String description = call.getString("description", "");
        int notificationId = call.getInt("id", 1);

        Context context = getContext();

        // 直接启动全屏Activity
        Intent fullScreenIntent = new Intent(context, FullScreenAlarmActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("taskId", notificationId);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);
        fullScreenIntent.putExtra("category", category);
        fullScreenIntent.putExtra("priority", priority);
        fullScreenIntent.putExtra("type", type);
        fullScreenIntent.putExtra("deadline", deadline);
        fullScreenIntent.putExtra("created", created);
        fullScreenIntent.putExtra("description", description);
        
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

    // 供Activity调用的静态方法
    public static void notifyTaskAction(Plugin plugin, String action, int taskId) {
        JSObject data = new JSObject();
        data.put("action", action);
        data.put("taskId", taskId);
        ((FullScreenNotificationPlugin) plugin).notifyListeners("alarmAction", data);
    }
}
