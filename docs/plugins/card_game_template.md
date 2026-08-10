# card_game_template（卡牌游戏模板）

- 目录：[card_game_template/](https://github.com/error2913/sealdice-js/tree/main/card_game_template/)
- 扩展名：cardGameTemplate
- 版本：1.0.0
- 作者：错误
- 依赖：无

## 简介

卡牌游戏的 TypeScript 项目模板，展示了基于牌堆（deck）的卡牌游戏标准结构：牌堆、游戏状态、玩家。可作为开发新卡牌游戏时的起点。

## 指令

```text
.game   游戏主指令（帮助文案为占位符，按模板自行完善）
```

## 源码结构

| 文件 | 说明 |
| --- | --- |
| `src/deck.ts` | 牌堆管理 |
| `src/game.ts` | 游戏状态机 |
| `src/player.ts` | 玩家数据 |
| `src/utils.ts` | 工具函数 |
| `src/index.ts` | 扩展注册与指令 |

## 构建

```bash
npm install
npm run build
```
