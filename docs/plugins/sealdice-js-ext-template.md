# sealdice-js-ext-template（扩展模板）

- 目录：[sealdice-js-ext-template/](../../sealdice-js-ext-template/)
- 扩展名：test
- 版本：1.0.0
- 作者：木落
- 依赖：无

## 简介

海豹 JS 扩展的 TypeScript 项目模板。一个简单易用的项目模板，使用 esbuild 编译代码，并将多个源码文件打包成一个。仓库内其他 TS 插件（game、team、UNO 等）均基于此结构。

## 指令

```text
.seal <名字>   召唤一只海豹
```

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `src/` | TypeScript 源码 |
| `tools/` | esbuild 构建脚本 |
| `types/` | `seal.d.ts` 类型定义 |
| `header.txt` | 打包时插入的文件头 |
| `dist/` | 构建产物输出目录 |

## 构建

```bash
npm install
npm run build
```

产物 `dist/sealdice-js-ext.js` 放入海豹插件目录后重载。
