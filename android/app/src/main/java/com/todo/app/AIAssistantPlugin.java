package com.todo.app;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "AIAssistant")
public class AIAssistantPlugin extends Plugin {

    // 可用模型列表
    private static final String[][] AVAILABLE_MODELS = {
        {"Qwen2-0.5B", "500MB", "https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/resolve/main/qwen2-0_5b-instruct-q4_0.gguf", "阿里千问，中文优秀"},
        {"TinyLlama-1.1B", "600MB", "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf", "轻量通用模型"},
        {"Gemma-2B", "1.5GB", "https://huggingface.co/google/gemma-2b-it-GGUF/resolve/main/gemma-2b-it-q4_0.gguf", "Google出品，推理强"}
    };

    private long downloadId = -1;
    private String currentModelName = "";

    @PluginMethod
    public void getAvailableModels(PluginCall call) {
        JSArray models = new JSArray();
        for (String[] model : AVAILABLE_MODELS) {
            JSObject modelObj = new JSObject();
            modelObj.put("name", model[0]);
            modelObj.put("size", model[1]);
            modelObj.put("url", model[2]);
            modelObj.put("description", model[3]);
            models.put(modelObj);
        }
        call.resolve(new JSObject().put("models", models));
    }

    @PluginMethod
    public void checkModelStatus(PluginCall call) {
        // 使用外部存储的私有目录
        File modelsDir = new File(getContext().getExternalFilesDir(null), "models");
        JSArray downloadedModels = new JSArray();
        
        if (modelsDir.exists()) {
            File[] files = modelsDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.getName().endsWith(".gguf")) {
                        JSObject model = new JSObject();
                        model.put("name", file.getName());
                        model.put("size", file.length());
                        model.put("path", file.getAbsolutePath());
                        downloadedModels.put(model);
                    }
                }
            }
        }
        
        JSObject result = new JSObject();
        result.put("hasModel", downloadedModels.length() > 0);
        result.put("models", downloadedModels);
        call.resolve(result);
    }

    @PluginMethod
    public void downloadModel(PluginCall call) {
        String modelUrl = call.getString("url");
        String modelName = call.getString("name");
        
        if (modelUrl == null || modelName == null) {
            call.reject("必须提供url和name参数");
            return;
        }

        try {
            // 使用外部存储的私有目录
            File modelsDir = new File(getContext().getExternalFilesDir(null), "models");
            if (!modelsDir.exists()) {
                modelsDir.mkdirs();
            }

            String filename = modelName.replaceAll("[^a-zA-Z0-9.-]", "_") + ".gguf";
            File modelFile = new File(modelsDir, filename);
            
            if (modelFile.exists()) {
                call.resolve(new JSObject().put("status", "already_downloaded").put("path", modelFile.getAbsolutePath()));
                return;
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(modelUrl));
            request.setTitle("下载AI模型: " + modelName);
            request.setDescription("正在下载...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            // 使用外部存储目录
            request.setDestinationInExternalFilesDir(getContext(), "models", filename);

            DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            downloadId = downloadManager.enqueue(request);
            currentModelName = modelName;

            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            result.put("modelName", modelName);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("下载失败: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getDownloadProgress(PluginCall call) {
        if (downloadId == -1) {
            call.reject("没有正在进行的下载");
            return;
        }

        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query();
        query.setFilterById(downloadId);

        Cursor cursor = downloadManager.query(query);
        if (cursor.moveToFirst()) {
            int bytesDownloadedIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
            int bytesTotalIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);

            long bytesDownloaded = cursor.getLong(bytesDownloadedIndex);
            long bytesTotal = cursor.getLong(bytesTotalIndex);
            int status = cursor.getInt(statusIndex);

            JSObject result = new JSObject();
            result.put("bytesDownloaded", bytesDownloaded);
            result.put("bytesTotal", bytesTotal);
            result.put("progress", bytesTotal > 0 ? (int)((bytesDownloaded * 100) / bytesTotal) : 0);
            result.put("status", status);
            result.put("completed", status == DownloadManager.STATUS_SUCCESSFUL);
            result.put("modelName", currentModelName);

            cursor.close();
            call.resolve(result);
        } else {
            cursor.close();
            call.reject("无法获取下载进度");
        }
    }

    @PluginMethod
    public void summarizeText(PluginCall call) {
        String text = call.getString("text");
        if (text == null) {
            call.reject("必须提供text参数");
            return;
        }

        // 检查是否有已下载的模型（使用外部存储）
        File modelsDir = new File(getContext().getExternalFilesDir(null), "models");
        if (!modelsDir.exists() || modelsDir.listFiles() == null || modelsDir.listFiles().length == 0) {
            call.reject("请先下载AI模型");
            return;
        }

        // 获取第一个.gguf模型文件
        File modelFile = null;
        for (File file : modelsDir.listFiles()) {
            if (file.getName().endsWith(".gguf")) {
                modelFile = file;
                break;
            }
        }

        if (modelFile == null) {
            call.reject("未找到可用的模型文件");
            return;
        }

        try {
            // TODO: 暂时使用模拟AI总结，等找到支持Android的llama.cpp库后替换
            // 原因：de.kherud:llama库不支持Android平台（缺少libllama.so）
            
            String summary = generateMockSummary(text);
            
            JSObject result = new JSObject();
            result.put("summary", summary);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("推理失败: " + e.getMessage(), e);
        }
    }
    
    // 模拟AI总结（基于规则生成）
    private String generateMockSummary(String text) {
        // 提取关键信息
        int logCount = 0;
        int progress = 0;
        int duration = 0;
        boolean hasBlocks = false;
        
        String[] lines = text.split("\n");
        for (String line : lines) {
            if (line.contains("执行日志数量：")) {
                try {
                    logCount = Integer.parseInt(line.replaceAll("[^0-9]", ""));
                } catch (Exception e) {}
            }
            if (line.contains("进度:")) {
                try {
                    String progressStr = line.substring(line.indexOf("进度:") + 3);
                    progressStr = progressStr.substring(0, progressStr.indexOf("%"));
                    progress = Integer.parseInt(progressStr.trim());
                } catch (Exception e) {}
            }
            if (line.contains("耗时:")) {
                try {
                    String durationStr = line.substring(line.indexOf("耗时:") + 3);
                    durationStr = durationStr.substring(0, durationStr.indexOf("分钟"));
                    duration += Integer.parseInt(durationStr.trim());
                } catch (Exception e) {}
            }
            if (line.contains("[阻碍]")) {
                hasBlocks = true;
            }
        }
        
        // 生成总结
        StringBuilder summary = new StringBuilder();
        
        if (logCount == 0) {
            summary.append("任务尚未开始执行，暂无执行记录。建议尽快启动任务并记录执行过程。");
        } else {
            summary.append("任务已推进").append(logCount).append("次");
            
            if (duration > 0) {
                summary.append("，累计耗时").append(duration).append("分钟");
            }
            
            if (progress > 0) {
                summary.append("，当前进度").append(progress).append("%");
            }
            
            summary.append("。");
            
            if (hasBlocks) {
                summary.append("执行过程中遇到阻碍，需要关注解决方案的落实情况。");
            } else if (progress >= 80) {
                summary.append("任务进展顺利，即将完成。");
            } else if (progress >= 50) {
                summary.append("任务进展正常，继续保持推进节奏。");
            } else if (progress > 0) {
                summary.append("任务刚刚启动，需要加快推进速度。");
            }
        }
        
        return summary.toString();
    }

    @PluginMethod
    public void deleteModel(PluginCall call) {
        String modelName = call.getString("name");
        if (modelName == null) {
            call.reject("必须提供name参数");
            return;
        }

        File modelsDir = new File(getContext().getFilesDir(), "models");
        File modelFile = new File(modelsDir, modelName);
        
        if (modelFile.exists() && modelFile.delete()) {
            call.resolve(new JSObject().put("success", true));
        } else {
            call.reject("删除失败");
        }
    }
}
