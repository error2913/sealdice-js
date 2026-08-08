# shell运行

- 源码：[run_shell.js](../../run_shell/run_shell.js)
- 版本：1.1.3
- 作者：错误
- 依赖：独立 Python 后端

## 简介

通过骰子远程运行 shell 命令，输出渲染为图片返回。在插件设置内设置可用 QQ 白名单，需要搭建相应后端服务。

## 指令

```text
【.shell run <命令>】运行shell命令并返回结果，执行时间超过10秒返回超时错误
【.shell create <命令>】创建shell进程并返回PID
【.shell check <PID> <行数起始序号(默认-100)> <行数结束序号(可选)>】查看shell进程输出
【.shell del <PID>】删除shell进程
【.shell list】列出所有shell进程
```

## 插件设置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| 后端url地址 | `http://localhost:3011` | 后端服务地址，修改后保存并重载 JS |
| 白名单 | `['QQ:1234567890']` | 可使用指令的 QQ 号 |

## 后端部署

```bash
cd run_shell/run_shell后端
pip install -r requirements.txt
python main.py
```

## 备注

- 后端包含进程管理器（`process_manager.py`）与图片渲染（`image_utils.py`）。
