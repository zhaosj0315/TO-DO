package com.todo.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        long triggerTime = call.getLong("triggerTime", 0L);
        String title = call.getString("title", "提醒");
        String body = call.getString("body", "");
        int notificationId = call.getInt("id", 1);

        // 格式化时间显示
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Shanghai"));
        String triggerTimeStr = sdf.format(new java.util.Date(triggerTime));
        String currentTimeStr = sdf.format(new java.util.Date());
        
        android.util.Log.d("AlarmPlugin", "========================================");
        android.util.Log.d("AlarmPlugin", "📝 任务名称: " + body);
        android.util.Log.d("AlarmPlugin", "⏰ 创建时间: " + currentTimeStr);
        android.util.Log.d("AlarmPlugin", "🔔 预订通知: " + triggerTimeStr);
        android.util.Log.d("AlarmPlugin", "========================================");

        if (triggerTime == 0) {
            android.util.Log.e("AlarmPlugin", "❌ triggerTime is 0, rejecting");
            call.reject("triggerTime is required");
            return;
        }

        Context context = getContext();
        
        // 启动前台服务保活
        Intent serviceIntent = new Intent(context, NotificationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
        android.util.Log.d("AlarmPlugin", "🔄 前台服务已启动");
        
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("notificationId", notificationId);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            android.util.Log.d("AlarmPlugin", "✅ 闹钟已设置 (setExactAndAllowWhileIdle)");
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            android.util.Log.d("AlarmPlugin", "✅ 闹钟已设置 (setExact)");
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        int notificationId = call.getInt("id", 1);

        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        alarmManager.cancel(pendingIntent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
