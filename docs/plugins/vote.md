# 投票

- 源码：[vote.js](https://github.com/error2913/sealdice-js/blob/main/vote.js)
- 版本：1.0.1
- 作者：错误
- 依赖：无

## 简介

投票插件，支持创建、投票、查看结果、列表与清空。使用 `.投票` 指令操作。

## 指令

```text
.投票 create ID <选项1> <选项2> ... --limit=m:n 创建投票
    m,n 为投票数范围，m<n，若不指定，默认为1:1
.投票 delete ID 删除投票
.投票 vote ID <选项1> <选项2> ... 投票
.投票 result ID 查看投票结果
.投票 list 查看所有投票列表
.投票 clear 清空所有投票
```

## 备注

- 投票数据保存在扩展存储中，重载 JS 后仍保留。
