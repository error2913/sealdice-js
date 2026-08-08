# sealdice-js

海豹（SealDice）JS 插件仓库。

- 根目录为纯 JS 编写的插件，可直接放入海豹插件目录使用。
- 其余目录为 TypeScript 插件工程、牌堆资源与配套后端服务。

## 目录

项目详细说明见 [项目总览](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md)，包含以下内容：

- [仓库结构](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md#仓库结构)
- [JS 插件列表](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md#js-插件列表)
- [TypeScript 插件项目](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md#typescript-插件项目)
- [牌堆资源](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md#牌堆资源)
- [后端服务](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md#后端服务)
- [安装与使用](https://github.com/error2913/sealdice-js/blob/main/docs/project_overview.md#安装与使用)
- [插件文档目录](https://github.com/error2913/sealdice-js/blob/main/docs/plugins/README.md)

## 快速开始

1. 将需要的 `.js` 文件放入海豹的 js 插件目录（如 `data/extensions/js/`）。
2. 在海豹面板的「扩展管理」中重载 JS。
3. 按插件内的帮助指令（如 `.agv`、`.投票`）使用。

TypeScript 插件需先 `npm install` 再 `npm run build`，将 `dist/` 产物放入插件目录。
