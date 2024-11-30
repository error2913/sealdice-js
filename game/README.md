# game依赖插件

## 变量管理

使用`globalThis.varsManager.registerVarsType(type, check, parse)`可以注册变量类型，参数介绍：

```js
type // 变量类型名称，字符串
check // 检查函数，参数为defaultData，返回值为布尔值，用于检查defaultData是否符合要求
parse // 解析函数，参数为data和defaultData，返回值为解析后的值，用于从字符串中解析变量
```

示例：

```js
// 污染类，用于模拟污染
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

## 游戏管理

### varsInfo 变量信息

在注册游戏时提供，结构为

```
变量名称: [变量类型, 变量默认值]
```

### 获取游戏管理器

使用`globalThis.getNewGM(ext, gvi, pvi)`可以获取游戏管理器，示例：

```js
// 游戏的变量信息
const gvi = {
    pollution: ['pollution', '低'],
    n: ['number', 0]
}

// 玩家的变量信息
const pvi = {
    pollution: ['pollution', '低'],
    pullutionValue: ['number', 0],
    money: ['number', 0],
    develop: ['number', 0],
    haveNuke: ['boolean', false],
    entry: ['backpack', { '普通': 1 }]
}

// 获取游戏管理器
const gm = globalThis.getNewGM(ext, gvi, pvi);
```

### 使用

结构介绍

```
player // 玩家管理器
chart // 排行榜管理器
shop // 商店管理器
market // 市场管理器
propMap // 道具映射表
```

方法介绍

```js
clearCache() // 清除缓存

getGame(gid: string): Game // 获取游戏
saveGame(gid: string) // 保存游戏

newPropItem(): Prop // 创建道具
registerProp(prop: Prop) // 注册道具
getProp(name: string): Prop | undefined // 获取道具
useProp(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, player: Player, name: string, count: number = 1, game?: Game): boolean // 使用道具
```

### player玩家管理器

方法介绍

```js
parse(data: any, uid: string, name: string, vi: VarsInfo): Player // 解析玩家数据

clearCache() // 清除缓存

getPlayer(uid: string, name: string): Player // 获取玩家，传入的name不会更新旧的名字，只用于生成新的玩家
savePlayer(uid: string) // 保存玩家
```

### chart排行榜管理器

方法介绍

```js
clearCache() // 清除缓存

registerChart(name: string, vn: string) // 注册排行榜，参数为排行榜名称和变量名称

getChart(name: string): Chart | undefined // 获取排行榜
saveChart(name: string) // 保存排行榜

updateChart(name: string, player: Player) // 更新排行榜
updateAllChart(player: Player) // 更新所有排行榜
```

### shop商店管理器

方法介绍

```js
registerShop(name: string, giArr: GoodsInfo[]) // 注册商店，参数为商店名称和商品信息数组

getShop(name: string): Shop | undefined // 获取商店
saveShop(name: string) // 保存商店

updateShop(name: string): Shop | undefined // 更新商店
```

#### goodsInfoArr商品信息数组

生成商店用的配置信息，结构为

```
name // 商品名称
price: {
    base, // 基础价格
    delta // 价格增量
}
count: {
    base // 基础数量
    delta // 数量增量
}
prob // 出现概率
```

其中`price`和`count`最终大小的范围是`base ± delta`

#### prop道具

道具，注册的例子为

```js
const prop = gm.newPropItem();
prop.name = '核弹'; // 名字
prop.desc = '很恐怖'; // 描述
prop.type = '武器'; // 类型
prop.reply = '你使用了一个核弹！！！'; // 回复，此回复只在单个使用时会发送，可使用豹语
prop.solve = (ctx, msg, cmdArgs, player, count, game) => {
    player.varsMap.pollutionValue += count;
    player.varsMap.pollution.pollute(player.varsMap.pollutionValue);

    if (count !== 1) {
        seal.replyToSender(ctx, msg, `你使用了${count}个核弹！！！`);
    }
}
gm.registerProp(prop);
```