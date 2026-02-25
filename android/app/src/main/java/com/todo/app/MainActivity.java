package com.todo.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    
    private BroadcastReceiver alarmActionReceiver;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FullScreenNotificationPlugin.class);
        registerPlugin(ChineseOcrPlugin.class);
        super.onCreate(savedInstanceState);
        
        // 注册广播接收器
        alarmActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getStringExtra("action");
                int taskId = intent.getIntExtra("taskId", 0);
                
                // 通知前端
                Plugin plugin = getBridge().getPlugin("FullScreenNotification").getInstance();
                if (plugin != null) {
                    FullScreenNotificationPlugin.notifyTaskAction(plugin, action, taskId);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.todo.app.ALARM_ACTION");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(alarmActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(alarmActionReceiver, filter);
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // 处理从FullScreenAlarmActivity传来的JS执行请求
        String jsCode = intent.getStringExtra("executeJS");
        if (jsCode != null && getBridge() != null) {
            getBridge().getWebView().post(() -> {
                getBridge().getWebView().evaluateJavascript(jsCode, null);
            });
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (alarmActionReceiver != null) {
            unregisterReceiver(alarmActionReceiver);
        }
    }
}
