# 🚀 Ollama公网访问 - 快速参考

## 一键启动
```bash
cd /Users/zhaosj/Desktop/TO-DO
./start-ollama-proxy.sh
```

## 配置TO-DO应用
1. 点击 🤖 按钮
2. 选择"盘古大模型"
3. 填入公网域名 + `/api/generate`
   例如：`https://abc123.serveo.net/api/generate`

## 测试
```bash
./test-ollama-proxy.sh
```

## 架构
```
手机/公网 → serveo.net → localhost:8899 → Ollama
```

## 文件
- `ollama-proxy.py` - 代理服务
- `start-ollama-proxy.sh` - 启动脚本
- `test-ollama-proxy.sh` - 测试脚本
- `OLLAMA_PROXY_GUIDE.md` - 详细指南

## 优势
✅ 免费 ✅ 隐私 ✅ 快速 ✅ 灵活

---
**详细文档**: [OLLAMA_PROXY_GUIDE.md](./OLLAMA_PROXY_GUIDE.md)
