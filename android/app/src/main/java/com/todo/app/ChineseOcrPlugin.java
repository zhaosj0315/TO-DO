package com.todo.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.common.model.RemoteModelManager;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import java.io.File;

@CapacitorPlugin(name = "ChineseOcr")
public class ChineseOcrPlugin extends Plugin {

    private TextRecognizer recognizer;

    @PluginMethod
    public void checkModel(PluginCall call) {
        // 尝试初始化识别器，如果模型未下载会抛出异常
        try {
            if (recognizer == null) {
                recognizer = TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("模型未下载", e);
        }
    }

    @PluginMethod
    public void downloadModel(PluginCall call) {
        // 使用动态下载版本时，首次调用会自动下载
        try {
            recognizer = TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());
            call.resolve();
        } catch (Exception e) {
            call.reject("模型下载失败", e);
        }
    }

    @PluginMethod
    public void detectText(PluginCall call) {
        String filename = call.getString("filename");
        if (filename == null) {
            call.reject("必须提供filename参数");
            return;
        }

        try {
            // 解析文件路径
            Uri uri = Uri.parse(filename);
            String path = uri.getPath();
            File file = new File(path);
            
            if (!file.exists()) {
                call.reject("文件不存在: " + path);
                return;
            }

            // 加载图片
            Bitmap bitmap = BitmapFactory.decodeFile(path);
            if (bitmap == null) {
                call.reject("无法加载图片");
                return;
            }

            InputImage image = InputImage.fromBitmap(bitmap, 0);

            // 使用中文识别器
            if (recognizer == null) {
                recognizer = TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());
            }

            recognizer.process(image)
                .addOnSuccessListener(visionText -> {
                    JSArray textDetections = new JSArray();
                    
                    for (Text.TextBlock block : visionText.getTextBlocks()) {
                        for (Text.Line line : block.getLines()) {
                            JSObject detection = new JSObject();
                            detection.put("text", line.getText());
                            
                            // 添加坐标信息（简化版）
                            if (line.getBoundingBox() != null) {
                                detection.put("topLeft", new JSArray().put(0).put(0));
                                detection.put("topRight", new JSArray().put(1).put(0));
                                detection.put("bottomLeft", new JSArray().put(0).put(1));
                                detection.put("bottomRight", new JSArray().put(1).put(1));
                            }
                            
                            textDetections.put(detection);
                        }
                    }

                    JSObject result = new JSObject();
                    result.put("textDetections", textDetections);
                    call.resolve(result);
                })
                .addOnFailureListener(e -> {
                    call.reject("OCR识别失败: " + e.getMessage(), e);
                });

        } catch (Exception e) {
            call.reject("处理图片失败: " + e.getMessage(), e);
        }
    }
}
