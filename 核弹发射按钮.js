// ==UserScript==
// @name         核弹发射按钮
// @author       错误
// @version      1.0.0
// @description  发展科技，积累资源，制造核弹。快使用核武污染和威慑别人吧。
// @timestamp    1732866663
// 2024-11-29 15:51:03
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/核弹发射按钮.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/核弹发射按钮.js
// @depends 错误:game依赖:>=1.0.0
// ==/UserScript==

let ext = seal.ext.find('nuclear');
if (!ext) {
    ext = seal.ext.new('nuclear', '错误', '1.0.0');
    seal.ext.register(ext);

}

// 核弹制造所需道具
const nukeMaterials = {
    '原子弹': {
        time: 3,
        materials: { '铀矿石': 100, '高级金属': 50 }
    },
    '氢弹': {
        time: 7,
        materials: { '氘化锂': 200, '高级金属': 100 }
    },
    '中子弹': {
        time: 5,
        materials: { '钚-239': 50, '高级金属': 75 }
    },
    '三相弹': {
        time: 10,
        materials: { '铀-238': 150, '氘化锂': 250, '高级金属': 125 }
    },
    '电磁脉冲弹': {
        time: 4,
        materials: { '电子元件': 200, '高级金属': 25 }
    },
    '伽马射线弹': {
        time: 6,
        materials: { '铀矿石': 50, '高级金属': 75 }
    },
    '感生辐射弹': {
        time: 8,
        materials: { '铀矿石': 75, '高级金属': 100 }
    },
    '冲击波弹': {
        time: 9,
        materials: { '氘化锂': 150, '高级金属': 125 }
    },
    '红汞核弹': {
        time: 12,
        materials: { '红汞': 30, '高级金属': 150 }
    }
};

class Pollution {
    constructor() {
        this.time = 0; // 上一次计算的时间点
        this.value = 0; // 遭受的污染值
        this.level = '无污染'; // 污染等级
    }

    static parse(data) {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        const pollution = new Pollution();

        if (data.hasOwnProperty('time') && typeof data.time == 'number') {
            pollution.time = data.time;
        }

        if (data.hasOwnProperty('value') && typeof data.value == 'number') {
            pollution.value = data.value;
        }

        if (data.hasOwnProperty('level') && typeof data.level == 'string') {
            pollution.level = data.level;
        }

        return pollution;
    }

    settle() {
        if (this.time === 0) {
            this.time = Math.floor(Date.now() / 1000);
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        const t = now - this.time;
        const tau = 3 * 24 * 60 * 60;

        this.value *= Math.pow(Math.E, (-t / tau));
        this.value = parseFloat(this.value.toFixed(2));

        this.time = Math.floor(Date.now() / 1000);

        if (this.value > 50000) {
            this.level = '核冬天';
        } else if (this.value > 20000) {
            this.level = '毒雾';
        } else if (this.value > 10000) {
            this.level = '灰霾';
        } else if (this.value > 3000) {
            this.level = '辐射尘';
        } else if (this.value > 0) {
            this.level = '微尘';
        } else {
            this.level = '无污染';
        }
    }
}
globalThis.varsManager.registerVarsType('pollution', Pollution.parse);

const gvi = {
    nukeTeam: ['team', []]
}
const pvi = {
    money: ['number', 0],
    date: ['string', ''],
    haveNuke: ['boolean', false],
    production: ['string', ''],
    startProduceTime: ['number', 0],
    pollution: ['pollution']
}
const gm = globalThis.getGameManager(ext);
gm.varsInfo = gvi;
gm.player.varsInfo = pvi;
globalThis.registerGameManager(gm);

function nukeSolve(val, reduce) {
    return (player, count, mplayer) => {
        if (player.varsMap.pollution.level === '核冬天') {
            const err = new Error('污染值过高，无法发射');
            return { result: null, err: err }
        }

        mplayer.varsMap.pollution.value += val * count;

        return { result: null, err: null };
    }
}

function nukeRegister(name, desc, val, reduce) {
    const prop = gm.prop.getProp();
    prop.name = name;
    prop.desc = desc;
    prop.type = '核弹';
    prop.reply = '';
    prop.solve = nukeSolve(val, reduce);
    gm.prop.registerProp(prop);
}

nukeRegister(
    '原子弹',
    `这是最早的核武器，利用重核铀或钚裂变的核弹。原子弹的原理是核裂变链式反应，由中子轰击铀-235或钚-239，使其原子核裂开产生能量，包括冲击波、瞬间核辐射、电磁脉冲干扰、核污染、光辐射等杀伤作用。
制作材料:铀矿石x100，高级金属x50
制作时间:3小时
污染值:1000`,
    1000, 0.5
)
nukeRegister(
    '氢弹',
    `氢弹是核裂变加核聚变的反应，由原子弹引爆氢弹，原子弹放出来的高能中子与氘化锂反应生成氚，氚和氘聚合产生能量。氢弹爆炸实际上是两次核反应（重核裂变和轻核聚变），两颗核弹爆炸（原子弹和氢弹），因此氢弹的威力比原子弹要更加强大。
制作材料:氘化锂x200，高级金属x100
制作时间:7小时
污染值:2500`,
    2500, 0.25
)
nukeRegister(
    '中子弹',
    `以氘和氚聚变原理制作，以高能中子为主要杀伤力的核弹。中子弹是一种特殊类型的小型氢弹，是核裂变加核聚变，但不是用原子弹引爆，而是用内部的中子源轰击钚-239产生裂变，裂变产生的高能中子和高温促使氘氚混合物聚变。
制作材料:钚-239x50，高级金属x75
制作时间:5小时
污染值:1500`,
    1500, 0.33
)
nukeRegister(
    '三相弹',
    `在氢弹的外层又加一层可裂变的铀-238，破坏力和杀伤力更大，污染也更加严重，即为“脏弹”。
制作材料:铀-238x150，氘化锂x250，高级金属x125
制作时间:10小时
污染值:3000`,
    3000, 0.17
)
nukeRegister(
    '电磁脉冲弹',
    `利用核爆炸能量来加速核电磁脉冲效应的一种核弹。产生的电磁波可“烧毁”电子设备，造成大范围的指挥、控制、通信系统瘫痪。
制作材料:电子元件x200，高级金属x25
制作时间:4小时
污染值:500`,
    500, 0.83
)
nukeRegister(
    '伽马射线弹',
    `爆炸后尽管各种效应不大，也不会使人立刻死去，但能造成放射性沾染，迫使敌人离开。
制作材料:铀矿石x50，高级金属x75
制作时间:6小时
污染值:800`,
    800, 0.63
)
nukeRegister(
    '感生辐射弹',
    `是一种强放射性污染的核武器，在一定时间和一定空间上造成放射性沾染，达到迟滞敌军和杀伤敌军的目的。
制作材料:铀矿石x75，高级金属x100
制作时间:8小时
污染值:1200`,
    1200, 0.42
)
nukeRegister(
    '冲击波弹',
    `是一种小型氢弹，采用慢化吸收中子技术，减少了中子活化，削弱了辐射的作用。它爆炸后，部队可迅速进入爆区投入战斗。
制作材料:氘化锂x150，高级金属x125
制作时间:9小时
污染值:1800`,
    1800, 0.31
)
nukeRegister(
    '红汞核弹',
    `用红汞（氧化汞锑）作为中子源，体积和重量大大减小。一枚小型的红汞核弹只有一个棒球大小，但当量可达万吨。
制作材料:红汞x30，高级金属x150
制作时间:12小时
污染值:2000`,
    2000, 0.21
)

gm.chart.registerChart('钱包', (player) => {
    return player.varsMap.money;
});

gm.chart.registerChart('污染', (player) => {
    return player.varsMap.pollution.value;
});

gm.chart.registerChart('核弹数', (player) => {
    return player.backpack.sumByTypes(gm, '核弹');
});

const gc = {
    '铀矿石': {
        price: { base: 10000, delta: 500 },
        count: { base: 100, delta: 10 },
        prob: 1
    },
    '高级金属': {
        price: { base: 15000, delta: 750 },
        count: { base: 50, delta: 10 },
        prob: 1
    },
    '氘化锂': {
        price: { base: 20000, delta: 1000 },
        count: { base: 100, delta: 10 },
        prob: 0.3
    },
    '钚-239': {
        price: { base: 30000, delta: 1500 },
        count: { base: 50, delta: 10 },
        prob: 0.1
    },
    '铀-238': {
        price: { base: 25000, delta: 1250 },
        count: { base: 100, delta: 10 },
        prob: 0.2
    },
    '电子元件': {
        price: { base: 5000, delta: 250 },
        count: { base: 200, delta: 10 },
        prob: 1
    },
    '红汞': {
        price: { base: 50000, delta: 2500 },
        count: { base: 50, delta: 10 },
        prob: 0.1
    }
};
gm.shop.registerShop('普通', gc);

function checkNuke(player, game) {
    if (player.backpack.checkTypesExists(gm, '核弹')) {
        player.varsMap.haveNuke = true;
        game.varsMap.nukeTeam.addMember(player.uid);
    } else {
        player.varsMap.haveNuke = false;
        game.varsMap.nukeTeam.removeMember(player.uid);
    }
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'nu';
cmd.help = `帮助:
help
`;
cmd.allowDelegate = true;
cmd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const uid = ctx.player.userId;
    const un = ctx.player.name;

    const gid = ctx.group.groupId;
    const game = gm.getGame(gid);

    /*
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const muid = mctx.player.userId;

    if (player.uid === muid) {
        seal.replyToSender(ctx, msg, '请选择你的目标');
        return false;
    }

    const mun = mctx.player.name;
    const mplayer = gm.player.getPlayer(muid, mun);

    seal.replyToSender(ctx, msg, `<${player.name}>对<${mplayer.name}>使用了${count}个核弹！！！`);
    */

    switch (val) {
        case '':
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        case 'cheat': {
            const varsName = cmdArgs.getArgN(2);
            const count = parseInt(cmdArgs.getArgN(3));
            if (isNaN(count) || count < 0) {
                seal.replyToSender(ctx, msg, '请输入数量');
                return seal.ext.newCmdExecuteResult(true);
            }

            const player = gm.player.getPlayer(uid, un);
            player.varsMap.pollution.settle();

            if (varsName === '污染') {
                player.varsMap.pollution.value = count;
            } else if (varsName === '钱') {
                player.varsMap.money = count;
            } else {
                seal.replyToSender(ctx, msg, '请输入变量名');
                return seal.ext.newCmdExecuteResult(true);
            }

            seal.replyToSender(ctx, msg, `执行成功`);

            gm.chart.updateAllChart(player);
            gm.player.savePlayer(uid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'get': {
            const name = cmdArgs.getArgN(2);
            if (!name) {
                seal.replyToSender(ctx, msg, '请输入道具名');
                return seal.ext.newCmdExecuteResult(true);
            }

            const count = parseInt(cmdArgs.getArgN(3));
            if (isNaN(count) || count < 1) {
                seal.replyToSender(ctx, msg, '请输入数量');
                return seal.ext.newCmdExecuteResult(true);
            }

            const player = gm.player.getPlayer(uid, un);
            player.varsMap.pollution.settle();

            player.backpack.addItem(name, count);

            seal.replyToSender(ctx, msg, `你获得了${count}个${name}`);

            checkNuke(player, game);
            gm.player.savePlayer(uid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '展示':
        case 'show': {
            const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
            const muid = mctx.player.userId;
            const mun = mctx.player.name;
            const player = gm.player.getPlayer(muid, mun);
            player.varsMap.pollution.settle();

            const s = `【${player.varsMap.haveNuke ? '有核' : '无核'}】<${player.name}>
钱包:${player.varsMap.money}
污染值:${player.varsMap.pollution.value}
污染等级:${player.varsMap.pollution.level}`;

            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '背包': {
            const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
            const muid = mctx.player.userId;
            const mun = mctx.player.name;
            const player = gm.player.getPlayer(muid, mun);
            player.varsMap.pollution.settle();

            let s = `<${player.name}>的背包:\n`;
            s += player.backpack.showBackpack();

            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '查询': {
            const name = cmdArgs.getArgN(2);
            const prop = gm.prop.getProp(name);
            if (prop.name == '') {
                let s = '【可查询道具】\n';
                s += gm.prop.showPropList();

                seal.replyToSender(ctx, msg, s);
                return seal.ext.newCmdExecuteResult(true);
            }

            const s = prop.showProp();

            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '制造': {
            const player = gm.player.getPlayer(uid, un);
            player.varsMap.pollution.settle();

            const name = player.varsMap.production;

            if (name !== '') {
                const t = Math.floor(Date.now() / 1000) - player.varsMap.startProduceTime;
                const time = nukeMaterials[name].time * 60 * 60;
                if (t < time) {
                    const progress = Math.floor((t / time) * 100);
                    const restTime = parseFloat(((time - t) / 60).toFixed(2));
                    const s = `【${item.name}】\n制造进度：${progress}%\n剩余完成时间：${restTime} 分钟`;
                    seal.replyToSender(ctx, msg, s);
                    return seal.ext.newCmdExecuteResult(true);
                } else {
                    player.varsMap.production = '';
                    player.varsMap.startProduceTime = 0;

                    player.backpack.addItem(name, 1);

                    seal.replyToSender(ctx, msg, `制造完成，<${player.name}>获得了【${name}】`);

                    checkNuke(player, game);
                    gm.player.savePlayer(uid);
                    return seal.ext.newCmdExecuteResult(true);
                }
            }

            const val2 = cmdArgs.getArgN(2);

            if (!nukeMaterials.hasOwnProperty(val2)) {
                let s = '【核弹制造】\n';
                s += gm.prop.showPropList();

                seal.replyToSender(ctx, msg, s);
                return seal.ext.newCmdExecuteResult(true);
            }

            const materials = nukeMaterials[name].materials;
            for (const material in materials) {
                if (!player.backpack.checkExists(material, materials[material])) {
                    seal.replyToSender(ctx, msg, `你还需要${materials[material]}件【${material}】`);
                    return seal.ext.newCmdExecuteResult(true);
                }
            }

            for (const material in materials) {
                player.backpack.removeItem(material, materials[material]);
            }

            player.varsMap.production = name;
            player.varsMap.startProduceTime = Math.floor(Date.now() / 1000);

            seal.replyToSender(ctx, msg, `【${name}】已加入制作队列`);

            gm.player.savePlayer(uid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '发射': {
            const name = cmdArgs.getArgN(2);
            if (!name) {
                seal.replyToSender(ctx, msg, '请输入道具名');
                return seal.ext.newCmdExecuteResult(true);
            }

            let count = parseInt(cmdArgs.getArgN(3));
            if (isNaN(count) || count < 1) {
                count = 1;
            }

            const player = gm.player.getPlayer(uid, un);
            player.varsMap.pollution.settle();

            ctx.delegateText = '';
            const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
            const muid = mctx.player.userId;

            if (player.uid === muid) {
                seal.replyToSender(ctx, msg, '请选择你的目标');
                return seal.ext.newCmdExecuteResult(true);
            }

            const mun = mctx.player.name;
            const mplayer = gm.player.getPlayer(muid, mun);
            mplayer.varsMap.pollution.settle();

            const { result, err } = gm.prop.useProp(name, player, count, mplayer);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(true);
            }

            seal.replyToSender(ctx, msg, `<${player.name}>对<${mplayer.name}>发射了${count}个【${name}】！！！`);

            setTimeout(() => {
                checkNuke(player, game);
                gm.chart.updateAllChart(player);
                gm.chart.updateAllChart(mplayer);
                gm.player.savePlayer(uid);
                gm.player.savePlayer(muid);
            }, 500);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '排行榜': {
            const chart = gm.chart.getChart('钱包');
            const s = chart.showChart();
            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '商店': {
            const shop = gm.shop.getShop('普通');
            const s = shop.showShop();
            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }
        case '购买': {
            const name = cmdArgs.getArgN(2);
            if (!name) {
                seal.replyToSender(ctx, msg, '请输入物品名');
                return seal.ext.newCmdExecuteResult(true);
            }

            const count = parseInt(cmdArgs.getArgN(3));
            if (isNaN(count) || count < 1) {
                seal.replyToSender(ctx, msg, '请输入数量');
                return seal.ext.newCmdExecuteResult(true);
            }

            const player = gm.player.getPlayer(uid, un);
            const shop = gm.shop.getShop('普通');
            const goods = shop.getGoods(name);
            if (goods === undefined) {
                seal.replyToSender(ctx, msg, '物品不存在');
                return seal.ext.newCmdExecuteResult(true);
            }

            if (count > goods.count) {
                seal.replyToSender(ctx, msg, `数量不足，最多只能购买${goods.count}个`);
                return seal.ext.newCmdExecuteResult(true);
            }

            const price = goods.price * count;
            if (player.varsMap.money < price) {
                seal.replyToSender(ctx, msg, `你的钱不够，需要${price}元`);
                return seal.ext.newCmdExecuteResult(true);
            }

            player.varsMap.money -= price;
            player.backpack.addItem(name, count);
            shop.buyGoods(name, count);

            seal.replyToSender(ctx, msg, `你购买了${count}个${name}，花费了${price}元`);

            checkNuke(player, game);
            gm.chart.updateAllChart(player);
            gm.player.savePlayer(uid);
            return seal.ext.newCmdExecuteResult(true);
        }
        /*
        case 'sell': {
            const name = cmdArgs.getArgN(2);
            if (!name) {
                seal.replyToSender(ctx, msg, '请输入道具名');
                return seal.ext.newCmdExecuteResult(true);
            }

            const count = parseInt(cmdArgs.getArgN(3));
            if (isNaN(count) || count < 1) {
                seal.replyToSender(ctx, msg, '请输入数量');
                return seal.ext.newCmdExecuteResult(true);
            }

            const price = parseInt(cmdArgs.getArgN(4));
            if (isNaN(price) || price < 1) {
                seal.replyToSender(ctx, msg, '请输入价格');
                return seal.ext.newCmdExecuteResult(true);
            }

            const title = name;
            const content = `${count}个${name}，价格为${price}`;

            const player = gm.player.getPlayer(uid, un);
            if (!player.backpack.checkExists(name, count)) {
                seal.replyToSender(ctx, msg, `你没有${count}个${name}`);
                return seal.ext.newCmdExecuteResult(true);
            }

            const result = gm.market.putOnSale(uid, title, content, name, price, count);

            if (result) {
                player.backpack.removeItem(name, count);
                seal.replyToSender(ctx, msg, `你出售了${count}个${title}，价格为${price}`);
            } else {
                seal.replyToSender(ctx, msg, `格式错误，请检查你的输入`);
            }

            gm.player.savePlayer(uid);
            return seal.ext.newCmdExecuteResult(true);
        }
            */
        case '市场': {
            const market = gm.market.showSellInfo();
            seal.replyToSender(ctx, msg, JSON.stringify(market));
            return seal.ext.newCmdExecuteResult(true);
        }
        default: {

            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
ext.cmdMap['nu'] = cmd;