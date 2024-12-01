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

    // 污染类，用于模拟污染
    class Pollution {
        constructor() {
            this.time = 0; // 遭受的时间
            this.value = 0; // 遭受的污染值
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

            if (!defaultData.hasOwnProperty('value') || typeof defaultData.value!== 'number') {
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
                return pollution;
            }

            if (data.hasOwnProperty('time') && typeof data.time == 'number') {
                pollution.time = data.time;
            }

            if (data.hasOwnProperty('value') && typeof data.value == 'number') {
                pollution.value = data.value;
            }

            if (data.hasOwnProperty('level') && typeof data.level == 'string') {
                pollution.level = data.level;
            } else {
                pollution.level = defaultData;
            }

            return pollution;
        }

        reduce() {
            const now = Math.floor(Date.now() / 1000);
            const delta = now - this.time;

            this.value *= Math.pow(0.95, delta);
            
            this.time = Math.floor(Date.now() / 1000);
        }

        pollute(count) {
            this.value += count;

            if (this.value >= 100) {
                this.level = '高';
            } else if (this.value >= 50) {
                this.level = '中';
            } else {
                this.level = '低';
            }
        }
    }

    globalThis.varsManager.registerVarsType('pollution', Pollution.check, Pollution.parse);

    const gvi = {
        pollution: ['pollution', '低'],
        nukePlayerNumber: ['number', 0]
    }
    const pvi = {
        pollution: ['pollution', '低'],
        money: ['number', 0],
        develop: ['number', 0],
        haveNuke: ['boolean', false],
        target: ['backpack', {}]
    }
    const gm = globalThis.getNewGM(ext, gvi, pvi);

    const game = gm.getGame('全局');

    const prop = gm.newPropItem();
    prop.name = '普通核弹'; // 名字
    prop.desc = '非常恐怖，威力巨大'; // 描述
    prop.type = '核弹'; // 类型
    prop.reply = ''; // 回复，此回复只在单个使用时会发送，可使用豹语
    prop.solve = (ctx, msg, cmdArgs, player, count, game) => {
        const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
        const muid = mctx.player.userId;

        if (player.uid === muid) {
            seal.replyToSender(ctx, msg, '请选择你的目标');
            return false;
        }

        const mun = mctx.player.name;
        const mplayer = gm.player.getPlayer(muid, mun);

        mplayer.varsMap.pollution.reduce();
        mplayer.varsMap.pollution.pollute(count);
        mplayer.varsMap.develop *= 0.8;

        seal.replyToSender(ctx, msg, `<${player.name}>对<${mplayer.name}>使用了${count}个核弹！！！`);

        return true;
    }
    gm.registerProp(prop);

    gm.chart.registerChart('富豪榜', 'money');

    const giArr = {
        '铀': {
            price: { base: 10000, delta: 500 },
            count: { base: 10, delta: 1 },
            prob: 1
        },
        '浓缩装置': {
            price: { base: 50000, delta: 1000 },
            count: { base: 2, delta: 1 },
            prob: 0.1
        },
        '核弹': {
            price: { base: 100000, delta: 10000 },
            count: { base: 1, delta: 1 },
            prob: 0.01
        }
    }
    gm.shop.registerShop('普通', giArr);

    
    function checkNuke(player)  {
        if (player.varsMap.haveNuke) {
            if (player.varsMap.backpack.checkTypesExist(gm, ['核弹'])) {
                return;
            }

            player.varsMap.haveNuke = false;
            game.varsMap.nukePlayerNumber -= 1;
            return;
        }

        if (player.varsMap.backpack.checkTypesExist(gm, ['核弹'])) {
            player.varsMap.haveNuke = true;
            game.varsMap.nukePlayerNumber += 1;
        }
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'nu';
    cmd.help = `帮助:
help
show
use <道具名> <数量>
chart
shop
sell <道具名> <数量> <价格>
market`;
    cmd.allowDelegate = true;
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
                const targetText = Object.keys(player.varsMap.target.items).join('\n');
                const s = `玩家:<${player.name}>
污染值:${player.varsMap.pollution.value}
污染等级:${player.varsMap.pollution.level}
钱包:${player.varsMap.money}
发展度:${player.varsMap.develop}
是否有核武:${player.varsMap.haveNuke}
威慑目标:${targetText}`
                seal.replyToSender(ctx, msg, s);
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

                player.backpack.add(name, count);
                checkNuke(player);

                seal.replyToSender(ctx, msg, `你获得了${count}个${name}`);

                gm.player.savePlayer(uid);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'use': {
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

                gm.useProp(ctx, msg, cmdArgs, player, name, count, game);
                
                setTimeout(() => {
                    checkNuke(player);
                    gm.player.savePlayer(uid);
                    gm.chart.updateChart('富豪榜', player);
                }, 1000);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'chart': {
                const chart = gm.chart.getChart('富豪榜');
                seal.replyToSender(ctx, msg, JSON.stringify(chart));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'shop': {
                const shop = gm.shop.getShop('普通');
                seal.replyToSender(ctx, msg, JSON.stringify(shop));
                return seal.ext.newCmdExecuteResult(true);
            }
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
                if (!player.backpack.checkExist(name, count)) {
                    seal.replyToSender(ctx, msg, `你没有${count}个${name}`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const result = gm.market.putOnSale(uid, title, content, name, price, count);

                if (result) {
                    player.backpack.remove(name, count);
                    seal.replyToSender(ctx, msg, `你出售了${count}个${title}，价格为${price}`);
                } else {
                    seal.replyToSender(ctx, msg, `格式错误，请检查你的输入`);
                }

                gm.player.savePlayer(uid);
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