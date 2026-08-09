# 多骰联合延迟测试

- 源码：[ping_auto.js](https://github.com/error2913/sealdice-js/blob/main/ping_auto.js)
- 版本：1.0.3
- 作者：错误
- 依赖：team（>= 4.0.0）

## 简介

自动化的多骰联合延迟检测。需要先用 `.乒乓 set main @要设置的骰子` 设置一个主机，主机需加载 team 依赖。

## 指令

```text
【.乒乓 <main|sub> @要设置的骰子】设置为主机或从机，默认为从机
【.乒乓 ding】立即开始检测
【.乒乓 dong】停止检测
【.乒乓 click】开启自动检测
【.乒乓 clack】关闭自动检测
【.乒乓 status】查看自动检测状态
```
