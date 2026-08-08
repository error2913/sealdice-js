# 群名片集体修改器HTTP版

- 源码：[rename_http.js](https://github.com/error2913/sealdice-js/blob/main/rename_http.js)
- 版本：1.0.0
- 作者：错误
- 依赖：HTTP依赖（>= 1.0.0）、deck 牌堆扩展

## 简介

通过 OneBot HTTP 接口批量修改群内成员群名片。骰娘和指令使用者都需要管理员权限。使用 `.rnh` 获取帮助。

## 指令

```text
【.rnh <模板>】将群成员的群名片设置为【模板】
【.rnh pefix <前缀>】为群名片添加前缀
【.rnh suffix <后缀>】为群名片添加后缀
【.rnh fmt <前缀> <后缀>】为群名片添加前缀和后缀
【.rnh draw】将群成员的群名片设置为牌堆抽取结果
【.rnh amon】阿蒙！
【.rnh clr】恢复群名片
```

## 备注

- 与[群名片集体修改器](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/rename.md)功能一致，区别是走 HTTP 接口，不依赖活跃名单。
- 依赖 `deck` 牌堆扩展用于 `.rnh draw`。
