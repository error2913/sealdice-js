// ==UserScript==
// @name         不定性疯狂提醒
// @author       错误
// @version      1.2.0
// @description  在特定指令后对san值进行不定性疯狂检测。将角色的msan属性作为检测不定性疯狂的san值上限（默认等于意志）。由于无法得知团内“一天”的开始和结束，故需使用指令.st msan数字 或 .rest 设置msan。
// @timestamp    1725024341
// 2024-08-30 21:25:41
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E4%B8%8D%E5%AE%9A%E6%80%A7%E7%96%AF%E7%8B%82%E6%8F%90%E9%86%92.js
// ==/UserScript==
let ext = seal.ext.find('insaneNotice');
if (!ext) {
    ext = seal.ext.new('insaneNotice', '错误', '1.2.0');
    // 注册扩展
    seal.ext.register(ext);
    seal.ext.registerStringConfig(ext, '不定性疯狂提醒词', '{$t玩家}已不定性疯狂。当新的“一天”开始时，可使用 .rest 重置用于检测不定性疯狂的san值上限。', '');
    seal.ext.registerTemplateConfig(ext, '进行检测的指令', ['sc', 'st'], '');

    function getVar(ctx, s) {
        return parseInt(seal.format(ctx, `{${s}}`));
    }

    // 为什么数值变动时不能用intGet读取数值？害我试了半天最后改成用format读取
    function checkSan(ctx, msg) {
        setTimeout(() => {
            const san = getVar(ctx, 'san');
            if (isNaN(san)) {
                return;
            }

            let msan = getVar(ctx, 'msan');
            if (isNaN(msan) || msan === 0) {
                const pow = getVar(ctx, 'pow');
                if (isNaN(pow)) {
                    return;
                }

                msan = pow;
            }

            if (msan - san < msan / 5) {
                return;
            }

            getVar(ctx, 'msan=-1');

            const s = seal.format(ctx, seal.ext.getStringConfig(ext, '不定性疯狂提醒词'));
            seal.replyToSender(ctx, msg, s);
        }, 500)
    }

    ext.onCommandReceived = (ctx, msg, cmdArgs) => {
        const command = cmdArgs.command;
        const cmds = seal.ext.getTemplateConfig(ext, '进行检测的指令');
        if (cmds.includes(command)) {
            checkSan(ctx, msg);
        }
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'rest';
    cmd.help = `帮助: 重置msan值，作为检测不定性疯狂的san值上限。
【.rest】设置为当前san值
【.rest pow】设置为当前意志值
另可使用 .st msan数字 设置msan为想要的数值`;
    cmd.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        switch (val) {
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'pow': {
                const [pow, e3] = seal.vars.intGet(ctx, 'pow');
                if (!e3) {
                    seal.replyToSender(ctx, msg, `未检测到<${ctx.player.name}>的pow值，请用 .st 指令录入`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                seal.vars.intSet(ctx, 'msan', pow);

                seal.replyToSender(ctx, msg, `<${ctx.player.name}>的msan已设置为${pow}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            default: {
                const [san, e1] = seal.vars.intGet(ctx, 'san');
                if (!e1) {
                    seal.replyToSender(ctx, msg, `未检测到<${ctx.player.name}>的san值，请用 .st 指令录入`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                seal.vars.intSet(ctx, 'msan', san);

                seal.replyToSender(ctx, msg, `<${ctx.player.name}>的msan已设置为${san}`);
                return seal.ext.newCmdExecuteResult(true);
            }
        }
    };
    ext.cmdMap['rest'] = cmd;
}