# 骰主公告极速版HTTP版

- 源码：[postnow_http.js](https://github.com/error2913/sealdice-js/blob/main/postnow_http.js)
- 版本：1.0.0
- 作者：错误
- 依赖：HTTP依赖（>= 1.0.0）

## 简介

骰主公告极速版的 HTTP 版本，通过 OneBot HTTP 接口直接发公告/广告。使用 `.pnh help` 查看帮助。

## 指令

```text
【.pnh <公告内容>】发布公告，换行请使用 \n
【.pnh emg <公告内容>】发布紧急公告，忽略是否处于 log 状态
【.pnh chase <ID> <公告内容>】发布追杀公告，在特定用户活跃的群聊发送。ID格式: QQ:114514
【.pnh chaseat <ID> <公告内容>】发布追杀公告，且@对应玩家
【.pnh send】确认发送
【.pnh cancel】取消发送
```
