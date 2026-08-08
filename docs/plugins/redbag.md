# 豹语变量红包

- 源码：[redbag.js](https://github.com/error2913/sealdice-js/blob/main/redbag/redbag.js)
- 版本：1.2.0
- 作者：错误
- 依赖：独立 Python 后端（FastAPI）

## 简介

基于豹语变量的群红包插件：发送红包消耗指定货币变量，生成红包图片，群成员可抢。红包图片由配套的 Python 后端生成。

## 指令

```text
【.发红包 <金额> <数量>】发送红包，可通过@发送专属红包
【.抢红包 <指定序号(可选)>】抢红包
【.查看红包 <指定序号(可选)>】查看该群红包
```

## 插件设置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| 豹语变量名 | `$m金币` | 红包使用的货币变量，修改后保存并重载 JS |
| URL地址 | `http://localhost:3000` | 红包后端地址，修改后保存并重载 JS |

## 后端部署

```bash
cd redbag/redbag后端
pip install -r requirements.txt
python main.py
```

背景图片可存放在 `resources/background/` 内，生成红包图片时会自动随机选取，支持 jpg、png、jpeg 格式。

## 备注

- 红包金额上限 50000，数量上限 12。
- 货币不足会发送失败；不能发送货币数小于红包数的红包。
