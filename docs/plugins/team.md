# team（队伍系统）

- 目录：[team/](../../team/)
- 扩展名：team
- 版本：4.0.2
- 作者：错误
- 依赖：无（作为其他插件的依赖使用）

## 简介

TypeScript 编写的队伍系统插件。绑定队伍、增删成员、抽取成员、属性查看与修改，并为其他插件提供 `globalThis.teamManager` 接口（斗地主、UNO、多骰延迟测试等插件依赖它）。

## 指令

```text
【.team bind <队伍名字>】绑定/新建队伍
【.team del <队伍名字>】删除队伍
【.team del --all】删除所有队伍
【.team del --now】删除当前队伍
【.team list】查看队伍列表
【.team add ...@玩家】添加若干成员
【.team rm ...@玩家】删除若干成员
【.team rm --all】删除所有成员
【.team draw <抽取数量=1>】随机抽取队伍内成员
【.team call】限时呼叫队内成员
【.team show ...<属性名>】查看队内成员属性
【.team st <属性名> <表达式>】修改队内成员属性
【.team sort <属性名>】对队内成员属性进行排序
```

## 构建

```bash
npm install
npm run build
```
