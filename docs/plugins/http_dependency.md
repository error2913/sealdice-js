# HTTP依赖

- 源码：[http_dependency.js](https://github.com/error2913/sealdice-js/blob/main/http_dependency.js)
- 版本：1.2.1
- 作者：错误
- 依赖：无（作为其他插件的依赖使用）

## 简介

为其他插件提供 OneBot HTTP API 调用能力。HTTP 端口请按照自己的登录方案自行配置，配置完成后在插件设置填入。插件初始化时会自动获取 HTTP 地址对应的账号并保存。

> 注意：本插件已由 [ob11 网络连接依赖](https://github.com/error2913/sealdice-plugin-ob11-net-connection) 替代，仅为兼容旧插件保留。

在其他插件中使用：

```js
globalThis.http.callApi(epId, method, data = null)
```

- `epId`：骰子账号，格式 `QQ:12345`
- `method`：方法名，如 `get_login_info`
- `data`：参数

方法可参见 [OneBot 11 公开 API](https://github.com/botuniverse/onebot-11/blob/master/api/public.md)。

## 指令

```text
.http init 初始化HTTP依赖
.http <方法> --<参数名>=<参数>

示例:
.http get_login_info
.http send_group_msg --group_id=123456 --message=[{"type":"text","data":{"text":"嘿嘿"}}]
```

## 插件设置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| HTTP端口地址 | `['http://127.0.0.1:8084']` | 修改后保存并重载 JS |
| HTTP Access Token | `['']` | 与端口地址一一对应，没有则留空 |
