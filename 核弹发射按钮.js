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

    const gk = 'nuclear';
    const pk1 = '1';

    const gv = {
        pollution:['number', 0]
    }
    globalThis.game.registerGame(ext, gk, gv)

    const pv = {
        pollution:['number', 0],
        money:['number', 0],
        develop:['number', 0],
        haveN:['boolean', false],
        entry:['backpack', {
            '普通':1
        }]
    }
    globalThis.game.registerPlayer(gk, pk1, pv)

    const propTest = globalThis.game.newPropItem(gk);
    propTest.name = '核弹';
    propTest.desc = '核弹';
    propTest.type = '核弹';
    propTest.reply = '使用了核弹';
    propTest.solve = (ctx, msg, cmdArgs, player, game) => {
        player.varsMap.pollution += 1;
    }
    globalThis.game.registerProp(gk, propTest);

    globalThis.game.registerChart(gk, '一个排行榜', 'pollution');


    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'nu';
    cmd.help = '还没写';
    cmd.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        const uid = ctx.player.userId;
        const un = ctx.player.name;
        const gid = ctx.group.groupId;

        switch (val) {
            case '':
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'show': {
                const player = globalThis.game.getPlayer(gk, pk1, uid, un);
                seal.replyToSender(ctx, msg, JSON.stringify(player));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'get': {
                const player = globalThis.game.getPlayer(gk, pk1, uid, un);
                player.backpack.add('核弹', 1);
                seal.replyToSender(ctx, msg, '获得了核弹');
                globalThis.game.savePlayer(gk, pk1, uid, un);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'use': {
                const player = globalThis.game.getPlayer(gk, pk1, uid, un);
                const game = globalThis.game.getGame(gk, '');
                globalThis.game.useProp(ctx, msg, cmdArgs, player, game, '核弹');

                setTimeout(() => {
                    globalThis.game.savePlayer(gk, pk1, uid, un);
                    globalThis.game.updateChart(gk, '一个排行榜', player);
                }, 1000);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'chart': {
                const chart = globalThis.game.getChart(gk, '一个排行榜');
                seal.replyToSender(ctx, msg, JSON.stringify(chart));
                return seal.ext.newCmdExecuteResult(true);
            }
            default: {
                
                return seal.ext.newCmdExecuteResult(true);
            }
        }
    };
    ext.cmdMap['nu'] = cmd;   
}