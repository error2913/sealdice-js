// ==UserScript==
// @name         不定性疯狂提醒
// @author       错误
// @version      1.0.0
// @description  通过指令sc，st来进行检测。需要手动录入一个msan属性作为san值上限（不录入默认等于意志），因为没有办法知道团内“一天”什么时候开始。
// @timestamp    1725024341
// 2024-08-30 21:25:41
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E4%B8%8D%E5%AE%9A%E6%80%A7%E7%96%AF%E7%8B%82%E6%8F%90%E9%86%92.js
// ==/UserScript==
let ext = seal.ext.find('crazycheck');
if (!ext) {
    ext = seal.ext.new('crazycheck', '错误', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
    seal.ext.registerBoolConfig(ext, '是否在log开启时提醒录入san上限', true)
    seal.ext.registerStringConfig(ext, 'log开启时提醒录入san上限', '为了能自动提醒不定性疯狂，当“一天”开始时，请记得录入“一天”开始时san值上限，指令.st msan数字。不录入默认等于意志。')
    seal.ext.registerStringConfig(ext, '不定性疯狂提醒', '已不定性疯狂')

    const cmdlog = seal.ext.newCmdItemInfo();
    cmdlog.name = 'log'; // 指令名字，可用中文
    cmdlog.help = '';
    cmdlog.allowDelegate = true;
    cmdlog.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        if (/^new/.test(val) || /^on/.test(val)) if (seal.ext.getBoolConfig(ext, '是否在log开启时提醒录入san上限')) setTimeout(() => {seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, 'log开启时提醒录入san上限'));}, 500)
    };

    function checksan(ctx) {
        let msan = seal.vars.intGet(ctx, 'msan')[0]
        if (!msan) msan = seal.vars.intGet(ctx, 'pow')[0]
        let san = seal.vars.intGet(ctx, 'san')[0]
        if (msan - san >= msan/5) {
            seal.vars.intSet(ctx, 'msan', -1)
            return true;
        }
        else return false;
    }

    const cmdsc = seal.ext.newCmdItemInfo();
    cmdsc.name = 'sc'; // 指令名字，可用中文
    cmdsc.help = '';
    cmdsc.allowDelegate = true;
    cmdsc.solve = (ctx, msg, cmdArgs) => {
        if (ctx.group.logOn) setTimeout(() => {if (checksan(ctx)) seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '不定性疯狂提醒'));}, 500)
    };
    const cmdst = seal.ext.newCmdItemInfo();
    cmdst.name = 'st'; // 指令名字，可用中文
    cmdst.help = '';
    cmdst.allowDelegate = true;
    cmdst.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getRestArgsFrom(1)
        if (/san/.test(val)) if (ctx.group.logOn) setTimeout(() => {if (checksan(ctx)) seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '不定性疯狂提醒'));}, 500)
    };

    // 将命令注册到扩展中
    ext.cmdMap['log'] = cmdlog;
    ext.cmdMap['sc'] = cmdsc;
    ext.cmdMap['st'] = cmdst;
}