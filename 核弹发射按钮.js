// ==UserScript==
// @name         核弹发射按钮
// @author       错误
// @version      1.0.0
// @description  测试
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

            if (!defaultData.hasOwnProperty('level') || typeof defaultData.level !== 'string') {
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

            if (data.hasOwnProperty('level') && typeof data.level == 'string') {
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

    globalThis.varsManager.registerVarsType('pollution', Pollution.check, Pollution.parse);

    const gvi = {
        pollution: ['pollution', '低'],
        n: ['number', 0]
    }
    const pvi = {
        pollution: ['pollution', '低'],
        pullutionValue: ['number', 0],
        money: ['number', 0],
        develop: ['number', 0],
        haveNuke: ['boolean', false],
        entry: ['backpack', { '普通': 1 }]
    }
    const gm = globalThis.getNewGM(ext, gvi, pvi);

    const game = gm.getGame('全局');

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

    gm.chart.registerChart('一个排行榜', 'pollutionValue');

    const giArr = [
        {
            name: '铀',
            price: {
                base: 10000,
                delta: 500
            },
            count: {
                base: 10,
                delta: 1
            },
            prob: 1
        },
        {
            name: '浓缩装置',
            price: {
                base: 50000,
                delta: 1000
            },
            count: {
                base: 2,
                delta: 1
            },
            prob: 0.1
        }
    ]
    gm.shop.registerShop('普通', giArr);


    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'nu';
    cmd.help = '还没写';
    cmd.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        const uid = ctx.player.userId;
        const un = ctx.player.name;

        switch (val) {
            case '':
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'show': {
                const player = gm.player.getPlayer(uid, un);
                seal.replyToSender(ctx, msg, JSON.stringify(player));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'get': {
                const player = gm.player.getPlayer(uid, un);
                player.backpack.add('核弹', 1);
                seal.replyToSender(ctx, msg, '获得了核弹');
                gm.player.savePlayer(uid);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'use': {
                const player = gm.player.getPlayer(uid, un);
                gm.useProp(ctx, msg, cmdArgs, player, '核弹', 1, game);

                setTimeout(() => {
                    gm.player.savePlayer(uid);
                    gm.chart.updateChart('一个排行榜', player);
                }, 1000);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'chart': {
                const chart = gm.chart.getChart('一个排行榜');
                seal.replyToSender(ctx, msg, JSON.stringify(chart));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'shop': {
                const shop = gm.shop.getShop('普通');
                shop.updateShop();
                seal.replyToSender(ctx, msg, JSON.stringify(shop));
                gm.shop.saveShop('普通');
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'market': {
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
}