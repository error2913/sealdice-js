# 不定性疯狂提醒

- 源码：[insane_notice.js](https://github.com/error2913/sealdice-js/blob/main/insane_notice.js)
- 版本：1.2.1
- 作者：错误
- 依赖：无

## 简介

在特定指令后对 san 值进行不定性疯狂检测。将角色的 `sanmax` 属性作为检测不定性疯狂的 san 值上限（默认等于意志）。由于无法得知团内"一天"的开始和结束，需使用 `.st sanmax 数字` 或 `.rest` 设置 sanmax。

## 指令

```text
帮助: 重置sanmax值，作为检测不定性疯狂的san值上限。
【.rest】设置为当前san值
【.rest pow】设置为当前意志值
```

另可使用 `.st sanmax <数字>` 将 sanmax 设置为想要的数值。

## 插件设置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| 进行检测的指令 | `['sc','st']` | 在这些指令后触发不定性疯狂检测 |
