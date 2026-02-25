# 🌐 Ollama公网访问方案

## 问题
TO-DO应用部署在公网，但Ollama运行在本地，无法直接访问。

## 解决方案
通过代理服务 + 公网隧道，将本地Ollama暴露到公网。

## 快速开始

### 1. 启动代理服务
```bash
cd /Users/zhaosj/Desktop/TO-DO
./start-ollama-proxy.sh
```

### 2. 获取公网地址
启动后会显示类似：
```
Forwarding HTTP traffic from https://abc123.serveo.net
```

复制这个域名（例如：`https://abc123.serveo.net`）

### 3. 配置TO-DO应用
1. 打开TO-DO应用
2. 点击🤖按钮
3. 选择"盘古大模型"
4. 填入：`https://abc123.serveo.net/api/generate`

### 4. 开始使用
现在可以在任何地方通过公网访问你的本地Ollama了！

## 架构图
```
TO-DO应用 (公网)
    ↓ HTTPS
公网隧道 (serveo.net)
    ↓
代理服务 (localhost:8899)
    ↓
Ollama (192.168.31.159:11434)
```

## 手动启动（如果脚本失败）

### 1. 安装依赖
```bash
pip3 install flask flask-cors requests
```

### 2. 启动代理
```bash
python3 ollama-proxy.py
```

### 3. 启动隧道（新终端）
```bash
ssh -R 80:localhost:8899 serveo.net
```

## API端点

### /api/generate
Ollama原生格式
```bash
curl https://xxx.serveo.net/api/generate \
  -d '{"model":"gemma2:2b","prompt":"你好","stream":false}'
```

### /api/chat
OpenAI兼容格式
```bash
curl https://xxx.serveo.net/api/chat \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

### /health
健康检查
```bash
curl https://xxx.serveo.net/health
```

## 优势
✅ 免费（无需购买API Key）
✅ 隐私（数据不离开本地）
✅ 快速（局域网速度）
✅ 灵活（支持所有Ollama模型）

## 注意事项
1. **安全性**：公网隧道任何人都可访问，建议添加认证
2. **稳定性**：隧道可能断开，需要重启
3. **性能**：受限于上传带宽
4. **电脑**：需要保持开机运行

## 进阶：添加认证（可选）

编辑 `ollama-proxy.py`，添加：
```python
API_KEY = "your-secret-key"

@app.before_request
def check_auth():
    if request.path != '/health':
        key = request.headers.get('Authorization')
        if key != f'Bearer {API_KEY}':
            return jsonify({"error": "Unauthorized"}), 401
```

## 故障排查

### 问题1：端口被占用
```bash
# 查看占用
lsof -i :8899
# 杀死进程
kill -9 <PID>
```

### 问题2：隧道断开
重新运行启动脚本即可

### 问题3：Ollama连接失败
检查Ollama是否运行：
```bash
curl http://192.168.31.159:11434/api/tags
```

## 文件说明
- `ollama-proxy.py` - 代理服务主程序
- `start-ollama-proxy.sh` - 一键启动脚本
- `OLLAMA_PROXY_GUIDE.md` - 本文档

---
**提示**：这个方案也适用于其他需要公网访问本地服务的场景！
