// ==UserScript==
// @name         集骰监听
// @author       错误
// @version      1.0.1
// @description  会把疑似集骰的群号发给通知列表，极大可能误报，仅作参考。\n个性化设置请移步 插件设置。\n白名单修改指令: .monitor
// @timestamp    1727866889
// 2024-10-02 19:01:29
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E9%9B%86%E9%AA%B0%E7%9B%91%E5%90%AC.js
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('集骰监听');
if (!ext) {
    ext = seal.ext.new(('集骰监听'), '错误', '1.0.1');
    // 注册扩展
    seal.ext.register(ext);
    seal.ext.registerIntConfig(ext, "集骰通知阈值", 3, "包括自己");
    seal.ext.registerBoolConfig(ext, "是否监听全部指令", false, "");
    seal.ext.registerTemplateConfig(ext, "监听指令名称", ["bot", "r"], "");
    seal.ext.registerBoolConfig(ext, "是否计入全部消息", false, "");
    seal.ext.registerTemplateConfig(ext, "计入消息模版", ["SealDice|Shiki|AstralDice|OlivaDice|SitaNya", "[Dd]\\d"], "使用正则表达式");
    seal.ext.registerIntConfig(ext, "指令后n秒内计入", 5, "");
    seal.ext.registerFloatConfig(ext, "暂时白名单时限/分钟", 720, "监听一次指令后会暂时加入白名单");

    const whiteList = JSON.parse(ext.storageGet("whiteList") || '{}');

    ext.onCommandReceived = (ctx, msg, cmdArgs) => {
        if (ctx.isPrivate) return;
        const isAll = seal.ext.getBoolConfig(ext, "是否监听全部指令");
        const commands = seal.ext.getTemplateConfig(ext, "监听指令名称");
        const whiteListTime = seal.ext.getFloatConfig(ext, "暂时白名单时限/分钟") * 60;
        const rawGroupId = ctx.group.groupId.replace(/\D+/g, "")

        if ((isAll || commands.includes(cmdArgs.command)) && (!whiteList[rawGroupId] || parseInt(msg.time) - whiteList[rawGroupId].time > whiteListTime)) {
            console.log(`暂时加入白名单:群号${rawGroupId}`)
            whiteList[rawGroupId] = { time: parseInt(msg.time), dices: [], notice: false };
            ext.storageSet("whiteList", JSON.stringify(whiteList));
        }
    }

    ext.onNotCommandReceived = (ctx, msg) => {
        if (ctx.isPrivate) return;
        const noticeLimit = seal.ext.getIntConfig(ext, "集骰通知阈值");
        const isAllMsg = seal.ext.getBoolConfig(ext, "是否计入全部消息");
        const msgTemplate = seal.ext.getTemplateConfig(ext, "计入消息模版");
        const time = seal.ext.getIntConfig(ext, "指令后n秒内计入");
        const rawGroupId = ctx.group.groupId.replace(/\D+/g, "")

        if ((isAllMsg || msgTemplate.some(template => msg.message.match(template))) && whiteList[rawGroupId] && parseInt(msg.time) - whiteList[rawGroupId].time < time) {
            if (!whiteList[rawGroupId].dices.includes(ctx.player.userId)) whiteList[rawGroupId].dices.push(ctx.player.userId);
            if (whiteList[rawGroupId].dices.length + 1 >= noticeLimit && !whiteList[rawGroupId].notice) {
                ctx.notice(`疑似集骰警告:群号${rawGroupId}，请注意检查\n疑似骰子QQ号:\n${whiteList[rawGroupId].dices.join('\n')}`)
                whiteList[rawGroupId].notice = true;
                ext.storageSet("whiteList", JSON.stringify(whiteList));
            }
        }
    }

    const cmdmonitor = seal.ext.newCmdItemInfo();
    cmdmonitor.name = 'monitor'; // 指令名字，可用中文
    cmdmonitor.help = '添加白名单： .monitor add/del 群号';
    cmdmonitor.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);

        if (!/\d+/.test(val2) || val == 'help') {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        if (val == "add") {
            whiteList[val2] = { time: 2000000000, dices: [], notice: true };
            seal.replyToSender(ctx, msg, '添加成功');
            ext.storageSet("whiteList", JSON.stringify(whiteList));
            return seal.ext.newCmdExecuteResult(true);
        }
        if (val == "del") {
            whiteList[val2] = { time: 2000000000, dices: [], notice: true };
            delete whiteList[val2]
            seal.replyToSender(ctx, msg, '删除成功');
            ext.storageSet("whiteList", JSON.stringify(whiteList));
            return seal.ext.newCmdExecuteResult(true);
        }
    };
    // 将命令注册到扩展中
    ext.cmdMap['monitor'] = cmdmonitor;
}