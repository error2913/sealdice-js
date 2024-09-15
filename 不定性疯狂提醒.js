// ==UserScript==
// @name         不定性疯狂提醒
// @author       错误
// @version      1.1.1
// @description  通过指令sc，st来进行检测。需要手动录入一个msan属性作为san值上限（不录入默认等于意志），因为没有办法知道团内“一天”什么时候开始。
// @timestamp    1725024341
// 2024-08-30 21:25:41
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E4%B8%8D%E5%AE%9A%E6%80%A7%E7%96%AF%E7%8B%82%E6%8F%90%E9%86%92.js
// ==/UserScript==
let ext = seal.ext.find('crazycheck');
if (!ext) {
    ext = seal.ext.new('crazycheck', '错误', '1.1.1');
    // 注册扩展
    seal.ext.register(ext);
    seal.ext.registerBoolConfig(ext, '是否在log开启时提醒录入san上限', true)
    seal.ext.registerBoolConfig(ext, '是否只在log状态时提醒不定性疯狂', true)
    seal.ext.registerStringConfig(ext, 'log开启时提醒录入san上限', '为了能自动提醒不定性疯狂，当“一天”开始时，请记得录入“一天”开始时san值上限，指令.st msan数字。不录入默认等于意志。')
    seal.ext.registerStringConfig(ext, '不定性疯狂提醒', '<{{调查员}}>已不定性疯狂')

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

    ext.onCommandReceived = (ctx, msg, cmdArgs) => {
        let command = cmdArgs.command
        if (command == 'log' && (cmdArgs.args.includes('new') || cmdArgs.args.includes('on')) && seal.ext.getBoolConfig(ext, '是否在log开启时提醒录入san上限')) setTimeout(() => {seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, 'log开启时提醒录入san上限'));}, 500)
        let cmdlst = ['sc', 'st']
        if (cmdlst.includes(command) && (ctx.group.logOn || !seal.ext.getBoolConfig(ext, '是否只在log状态时提醒不定性疯狂'))) setTimeout(() => {if (checksan(ctx)) seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, '不定性疯狂提醒').replace('{{调查员}}', ctx.player.name));}, 500)
    }
}