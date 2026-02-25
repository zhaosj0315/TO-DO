#!/usr/bin/env python3
"""
Ollama API 代理服务
将本地Ollama服务暴露到公网，支持CORS跨域访问
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # 允许所有跨域请求

# 本地Ollama地址
OLLAMA_URL = "http://192.168.31.159:11434"

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate():
    """代理 /api/generate 请求"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        print(f"📥 收到请求: model={data.get('model')}, prompt长度={len(data.get('prompt', ''))}")
        
        # 转发到本地Ollama
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=data,
            stream=data.get('stream', False)
        )
        
        if data.get('stream', False):
            # 流式响应
            def generate_stream():
                for line in response.iter_lines():
                    if line:
                        yield line + b'\n'
            return Response(generate_stream(), content_type='application/json')
        else:
            # 非流式响应
            result = response.json()
            print(f"✅ 响应成功: {result.get('response', '')[:100]}...")
            return jsonify(result)
            
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """代理 /api/chat 请求（兼容OpenAI格式）"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        # 转换为Ollama格式
        prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
        
        ollama_data = {
            "model": data.get('model', 'gemma2:2b'),
            "prompt": prompt,
            "stream": data.get('stream', False)
        }
        
        print(f"📥 Chat请求: {len(messages)}条消息")
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=ollama_data
        )
        
        result = response.json()
        print(f"✅ Chat响应成功")
        
        return jsonify(result)
            
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tags', methods=['GET'])
def tags():
    """获取可用模型列表"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        if response.status_code == 200:
            return jsonify({"status": "ok", "ollama": "connected"})
    except:
        pass
    return jsonify({"status": "error", "ollama": "disconnected"}), 503

if __name__ == '__main__':
    print("🚀 Ollama API 代理服务启动")
    print(f"📍 本地Ollama: {OLLAMA_URL}")
    print(f"🌐 代理服务: http://0.0.0.0:8899")
    print(f"💡 使用方法: 将TO-DO应用的API地址改为公网隧道地址")
    app.run(host='0.0.0.0', port=8899, debug=False)
