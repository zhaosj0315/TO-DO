package com.todo.app;

import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmPermission")
public class AlarmPermissionPlugin extends Plugin {

    @PluginMethod
    public void openAlarmSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // Android 12+
                intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            } else {
                // 旧版本打开应用详情
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            }
            getActivity().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open settings", e);
        }
    }
    
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) getContext().getSystemService(android.content.Context.ALARM_SERVICE);
            ret.put("canSchedule", alarmManager.canScheduleExactAlarms());
        } else {
            ret.put("canSchedule", true);
        }
        call.resolve(ret);
    }
}
