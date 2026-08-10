# fight_with_landlord（斗地主）

- 目录：[fight_with_landlord/](https://github.com/error2913/sealdice-js/tree/main/fight_with_landlord/)
- 扩展名：FightWithLandlord2
- 版本：2.0.1
- 作者：错误
- 依赖：team（>= 4.0.0）

## 简介

TypeScript 编写的斗地主插件，使用 team 插件中的成员创建对局，支持多种牌型。

## 指令

```text
【.ddz start】使用team里的成员创建游戏
【.ddz end】结束游戏
【.ddz check】查看手牌
【.ddz test 牌型名称】测试牌型是否存在
【.ddz 牌型名称】出牌
【.ddz 不要】跳过

出牌教程（x、y、z 都为牌名）：
王炸、x、对x、三x、炸弹x
三x带y、三x带对y
四x带yz、四x带对yz

牌型连续时，n 作为连续部分的长度，x 作为起头：
n顺x、n连对x、n飞机x
n飞机x带yz...、n飞机x带对yz...
如：5飞机3带8910AJ 就是 3334445556667778910AJ
```

## 构建

```bash
npm install
npm run build
```
