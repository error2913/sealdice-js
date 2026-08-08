# sealdice-js 项目总览

本仓库为海豹（SealDice）骰娘生态的插件集合，包含纯 JS 插件、TypeScript 插件工程、牌堆资源和配套后端服务。

## 仓库结构

```text
sealdice-js/
├── *.js                  # 纯 JS 插件，可直接放入海豹 js 插件目录使用
├── animal_world/         # TS 插件：动物世界（养成玩法）
├── card_game_template/   # TS 插件：卡牌游戏模板（deck/game/player 结构示例）
├── chart/                # TS 插件：排行榜图表
├── deck/                 # 牌堆资源（.deck / .json）
├── fight_with_landlord/  # TS 插件：斗地主
├── game/                 # TS 插件：综合游戏框架（背包/商店/市场/队伍等）
├── redbag/               # 红包插件（JS + Python 后端）
├── run_shell/            # 命令行执行插件（JS + Python 后端）
├── team/                 # TS 插件：队伍系统
├── UNO/                  # TS 插件：UNO 卡牌游戏
└── README.md
```

## JS 插件列表

以下为根目录下的纯 JS 插件，均为海豹扩展，通过指令调用。

| 文件 | 插件名 | 说明 |
| --- | --- | --- |
| insane_notice.js | [不定性疯狂提醒](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/insane_notice.md) | 特定指令后对 san 值进行不定性疯狂检测，需用 `.st sanmax` 或 `.rest` 设置上限 |
| idiom.js | [成语接龙](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/idiom.md) | 成语接龙小游戏，支持查询解释与排行榜 |
| non_trpg_group_detect.js | [非跑团群检测](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/non_trpg_group_detect.md) | 群内超过阈值时间使用娱乐功能时向通知列表告警 |
| announcement_subscribe.js | [公告订阅版](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/announcement_subscribe.md) | 订阅公告，使用 `.订阅公告` 查看帮助 |
| nuclear_button.js | [核弹发射按钮](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/nuclear_button.md) | 发展科技、积累资源、制造核弹的对抗玩法 |
| dice_group_monitor.js | [集骰监听](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/dice_group_monitor.md) | 检测疑似集骰的群并通知，可自定义白名单 |
| join_group_verify.js | [加群验证](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/join_group_verify.md) | 加群申请与验证码验证，支持预设答案、错误答案、退群消息开关，使用 `.agv` 查看帮助 |
| today_in_history.js | [历史上的今天](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/today_in_history.md) | 发送「历史上的今天」获取当天历史事件 |
| fly_seal.js | [螺旋飞行海豹](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/fly_seal.md) | 娱乐插件，`.fly` 起飞、`.seal` 查看信息 |
| random_lottery.js | [随机抽奖](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/random_lottery.md) | 七天内有发言的用户可参与抽奖，中奖者不重复 |
| sui_favorability.js | [穗好感](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/sui_favorability.md) | 角色好感度插件 |
| vote.js | [投票](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/vote.md) | 创建/参与/查看投票，使用 `.投票` 查看帮助 |
| message_merge.js | [消息合并](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/message_merge.md) | 将多段消息合并为图文混排消息发送 |
| crab_cult_game.js | [蟹脚小游戏](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/crab_cult_game.md) | 克苏鲁题材养成小游戏，`.cult` 查看指引、`.cult master` 查看骰主指令 |
| suggestion_box.js | [意见箱](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/suggestion_box.md) | 收集和管理用户意见，使用 `.意见` 查看帮助 |
| auto_groupsign.js | [自动群打卡](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/auto_group_sign.md) | 自动群签到，需 HTTP 依赖，使用 `.gs help` 查看帮助 |
| coc7_cn.js | [coc7指令中文版](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/coc7_cn.md) | 将内置 COC7 指令改写为中文别名 |
| coc_forward_msg.js | [COC生成属性合并消息](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/coc_forward_msg.md) | 修改内置 `.coc`，将生成结果合并为一条消息，需 HTTP 依赖 |
| http_dependency.js | [HTTP依赖](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/http_dependency.md) | 基础依赖插件，提供 `globalThis.http.callApi()` 供其他插件调用 OneBot API |
| link.js | [LINK!!!](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/LINK.md) | 连接群聊与私聊消息，使用 `.link` 查看帮助 |
| ping_3d.js | [三骰联合延迟测试](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/ping_3d.md) | 三个骰子同时安装时测试指令延迟，使用 `.乒` 开始测试 |
| ping_auto.js | [多骰联合延迟测试](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/ping_auto.md) | 自动化的多骰延迟测试，依赖 team 插件，使用 `.乒乓` 查看帮助 |
| postnow_http.js | [骰主公告极速版HTTP版](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/postnow_http.md) | 通过 HTTP 直接发送公告/广告，使用 `.pnh help` 查看帮助 |
| postnow.js | [骰主公告极速版](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/postnow.md) | 向活跃群发送公告/广告，使用 `.pn help` 查看帮助 |
| rename_http.js | [群名片集体修改器HTTP版](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/rename_http.md) | 批量修改群名片，需要管理员权限，使用 `.rnh` 查看帮助 |
| rename.js | [群名片集体修改器](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/rename.md) | 批量修改群名片（七天内活跃用户），需要管理员权限，使用 `.rn` 查看帮助 |

## TypeScript 插件项目

各 TS 项目结构一致：`src/` 为源码，使用 esbuild 打包，产物输出到 `dist/`。

| 目录 | 说明 |
| --- | --- |
| animal_world | [动物世界](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/animal_world.md)，包含动物养成、玩家管理与排行榜 |
| card_game_template | [卡牌游戏模板](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/card_game_template.md)，展示 deck/game/player 的标准结构 |
| chart | [排行榜图表](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/chart.md)，可同步变量并生成图表 |
| fight_with_landlord | [斗地主](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/fight_with_landlord.md) |
| game | [综合游戏框架](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/game.md)，含背包、商店、市场、队伍、道具等模块 |
| team | [队伍系统](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/team.md)，`.team` 创建/管理队伍，供其他插件依赖 |
| UNO | [UNO 卡牌游戏](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/UNO.md) |

## 牌堆资源

`deck/` 目录下为可直接导入海豹的牌堆文件：

- suiyu_voice.deck
- emoticons.json
- ww1_weapons_events.json

## 后端服务

部分插件带有独立的 Python 后端，需要按对应目录内的说明部署：

| 目录 | 说明 |
| --- | --- |
| redbag/ | [豹语变量红包](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/redbag.md)，前端为 `redbag.js`，后端为 FastAPI 服务（生成红包图片等） |
| run_shell/ | [shell运行](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/run_shell.md)，前端为 `run_shell.js`，后端负责进程管理与输出渲染 |

## 安装与使用

### 纯 JS 插件

1. 将需要的 `.js` 文件放入海豹的 js 插件目录（如 `data/extensions/js/`）。
2. 在海豹面板的「扩展管理」中重载 JS。
3. 按插件内的帮助指令（如 `.agv`、`.投票`）使用。

### TypeScript 插件

1. 进入对应目录，执行 `npm install`。
2. 执行 `npm run build` 生成 `dist/` 产物。
3. 将产物放入海豹插件目录并重载。

### 依赖说明

部分插件之间存在依赖关系，例如：

- `auto_groupsign.js`、`postnow_http.js`、`rename_http.js`、`coc_forward_msg.js` 依赖 `ob11网络连接依赖`（>= 2.1.0）
- `join_group_verify.js` 依赖 `ob11网络连接依赖`（>= 2.1.0）
- `ping_auto.js` 依赖 `team` 插件
- `random_lottery.js` 依赖 `骰主公告极速版`
- `rename.js` 依赖 `骰主公告极速版`

安装前请确认对应依赖已加载。
