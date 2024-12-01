# game依赖插件

## vars变量管理

使用`globalThis.varsManager.registerVarsType(type, check, parse)`可以注册变量类型，参数介绍：

```js
type // 变量类型名称，字符串
check // 检查函数，参数为defaultData，返回值为布尔值，用于检查defaultData是否符合要求
parse // 解析函数，参数为data和defaultData，返回值为解析后的值，用于从字符串中解析变量
```

示例：

```js
// 一个污染类，用于模拟污染
class Pollution {
    constructor() {
        this.time = 0;
        this.level = '';
    }

    // 检查函数，检查defaultData是否符合要求
    static check(defaultData) {
        if (defaultData === null || typeof defaultData !== 'object' || Array.isArray(defaultData)) {
            return false;
        }

        if (!defaultData.hasOwnProperty('time') || typeof defaultData.time !== 'number') {
            return false;
        }

        if (!defaultData.hasOwnProperty('level') || typeof defaultData.level!== 'string') {
            return false;
        }

        return true;
    }

    // 解析函数，参数为data和defaultData，返回值为解析后的值，用于从字符串中解析变量
    static parse(data, defaultData) {
        const pollution = new Pollution();

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            pollution.level = defaultData;
            return pollution;
        }

        if (data.hasOwnProperty('time') && typeof data.time == 'number') {
            pollution.time = data.time;
        }

        if (data.hasOwnProperty('level') && typeof data.level== 'string') {
            pollution.level = data.level;
        } else {
            pollution.level = defaultData;
        }

        return pollution;
    }

    // 污染函数，参数为污染值，用于根据污染值更新污染等级
    pollute(pollutionValue) {
        this.time++;

        if (pollutionValue >= 100) {
            this.level = '高';
        } else if (pollutionValue >= 50) {
            this.level = '中';
        } else {
            this.level = '低';
        }
    }
}

// 注册变量类型，参数为变量类型名称，检查函数，解析函数
globalThis.varsManager.registerVarsType('pollution', Pollution.check, Pollution.parse);
```

### VarsInfo 变量信息

在注册游戏时提供，结构为

```js
变量名称: [变量类型, 变量默认值]
```

示例：

```js
const vi = {
    pollution: ['pollution', '低'], // 自定义的变量类型，需要在前面注册过
    pollutionValue: ['number', 0],
    content: ['string', '字符串'],
    haveNuke: ['boolean', false],
    entry: ['backpack', { '普通': 1 }]
}
```

### varsMap 变量映射表

结构为

```js
变量名称: 具体变量
```

## game游戏管理

使用`globalThis.getNewGM(ext, gvi, pvi)`可以获取游戏管理器，`gvi`和`pvi`分别为游戏和玩家的变量信息，示例：

```js
const gm = globalThis.getNewGM(ext, gvi, pvi);
```

### 结构介绍

```js
player // 玩家管理器
chart // 排行榜管理器
shop // 商店管理器
market // 市场管理器
propMap // 道具映射表
```

### 方法介绍

```js
clearCache() // 清除缓存

getGame(gid): Game // 获取游戏对象
saveGame(gid) // 保存游戏

// 下面是道具相关
newPropItem(): Prop // 获得一个新的道具对象
registerProp(prop) // 注册道具，需要提供道具对象作为参数
getProp(name): Prop | undefined // 获取道具
useProp(ctx, msg, cmdArgs, player, name, count, game?): boolean // 使用道具
```

### game对象结构

```js
gid // 游戏id
varsMap // 变量映射表
```

## player玩家管理

玩家管理器为`gm.player`

### 方法介绍

```js
parse(data, uid, name, vi): Player // 解析玩家数据，一般用不到

clearCache() // 清除缓存

getPlayer(uid, name): Player // 获取玩家对象，传入的name不会更新旧的名字，只用于生成新的玩家
savePlayer(uid) // 保存玩家
```

使用示例：

```js
const player = gm.player.getPlayer(uid, name);
player.varsMap.money += 10;
gm.player.savePlayer(uid);
```

### player对象结构

```js
uid // 用户id
name // 用户名
backpack // 背包对象
varsMap // 变量映射表
```

## chart排行榜管理

排行榜管理器为`gm.chart`

### 方法介绍

```js
clearCache() // 清除缓存

registerChart(name, vn) // 注册排行榜，参数为 排行榜名称 和 变量名称

getChart(name): Chart | undefined // 获取排行榜
saveChart(name) // 保存排行榜，一般用不到，更新时会自动保存

updateChart(name, player) // 更新排行榜
updateAllChart(player) // 更新所有排行榜
```

使用示例：

```js
gm.chart.registerChart('一个排行榜', 'money');

// 变量发生变化时，调用排行榜更新
const player = gm.player.getPlayer(uid, name);
gm.chart.updateChart('一个排行榜', player);

// 获取排行榜对象
const chart = gm.chart.getChart('一个排行榜');
```

### chart对象结构

```js
varName // 变量名称
list // 排行榜列表，是一个数组
```

`list`元素的结构为

```js
uid // 用户id
name // 用户名
value // 变量值
```

## shop商店管理器

商店管理器为`gm.shop`

### 方法介绍

```js
registerShop(name, giArr) // 注册商店，参数为 商店名称 和 商品信息数组

getShop(name): Shop | undefined // 获取商店对象
saveShop(name) // 保存商店

updateShop(name): Shop | undefined // 更新商店，根据商品信息数组重新生成商店
```

### goodsInfoArr商品信息数组

生成商店用的配置信息，元素的结构为

```js
name // 商品名称
price: {
    base, // 基础价格
    delta // 价格增量
}
count: {
    base // 基础数量
    delta // 数量增量
}
prob // 出现概率，0-1之间的小数
```

其中`price`和`count`最终大小的范围是`base ± delta`

### shop对象结构

```js
updateTime // 更新时间
goods // 商品映射表
```

`goods`的结构为

```js
商品名称: {
    price // 价格
    count // 数量
}
```

## market市场管理器

市场管理器为`gm.market`

### 方法介绍

```js
getMarket(): SellInfo[] | undefined // 获取市场信息
saveMarket()  // 保存市场信息，一般用不到

sell(player, title, content, name, price, count): boolean // 出售商品
getSellInfo(id): SellInfo | undefined // 获取商品信息
removeSellInfo(id): boolean // 删除商品信息
showSellInfo(): string[]  // 显示商品信息，返回一个字符串数组，用于发送给玩家
```

### sellInfo商品信息结构

```js
id // 商品id
title // 标题
content // 内容
name // 商品名称
price // 价格
count // 数量
uid // 卖家id
```

## prop道具

使用`gm.newPropItem()`可以获得一个新的道具对象，注册道具使用`gm.registerProp(prop)`，参数为道具对象，示例：

```js
const prop = gm.newPropItem();
prop.name = '核弹'; // 名字
prop.desc = '很恐怖'; // 描述
prop.type = '武器'; // 类型
prop.reply = '你使用了一个核弹！！！'; // 回复，此回复只在单个使用时会发送，可使用豹语

// solve方法，在使用道具后，发送prop.reply前会调用此方法，需要返回一个布尔值，代表是否成功使用，true为成功，false为失败
prop.solve = (ctx, msg, cmdArgs, player, count, game) => {
    player.varsMap.pollutionValue += count;
    player.varsMap.pollution.pollute(player.varsMap.pollutionValue);

    if (count !== 1) {
        seal.replyToSender(ctx, msg, `你使用了${count}个核弹！！！`);
    }

    return true;
}
gm.registerProp(prop);
```

## backpack背包

`backpack.items`包含了背包内物品的映射表，结构为

```js
道具名称: 道具数量
```

### 方法介绍

```js
checkExist(name, count): boolean // 检查背包内是否存在指定数量的物品

getTotalCount(): number // 获取背包内物品总数量
getTotalCountByTypes(gm, types: string[]): number  // 根据道具类型获取背包内物品总数量

add(name, count) // 增加物品
remove(name, count) // 减少物品
clear() // 清空背包

merge(backpack) // 合并另一个背包的物品

draw(n): Backpack // 随机抽取n个物品，返回一个新的背包对象

findByTypes(gm, types: string[]): string[] // 根据道具类型获取物品名称数组
findByCountRange(min, max): string[] // 根据道具数量范围获取物品名称数组

getTypes(gm): string[] // 获取道具类型数组
```