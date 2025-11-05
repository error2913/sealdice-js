// ==UserScript==
// @name         非跑团群检测
// @author       错误
// @version      1.0.1
// @description  请在插件设置填写相关配置。插件原理为：进群后或使用跑团功能后，超过阈值时间，使用了娱乐功能，则会向通知列表告警\n注：私聊或bot off时不会检测
// @timestamp    1762271196
// 2025-11-04 23:46:36
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/非跑团群检测.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/非跑团群检测.js
// ==/UserScript==

let ext = seal.ext.find('非跑团群检测');
if (!ext) {
    ext = seal.ext.new('非跑团群检测', '错误', '1.0.1');
    seal.ext.register(ext);
}

seal.ext.registerTemplateConfig(ext, '白名单群号', [''], '');
seal.ext.registerTemplateConfig(ext, '跑团指令', ['r', 'ra', 'rc', 'rh', 'sc', 'ri', 'log', 'setcoc', 'coc', 'dnd'], '');
seal.ext.registerTemplateConfig(ext, '跑团非指令正则表达式', [''], '');
seal.ext.registerTemplateConfig(ext, '娱乐指令', ['jrrp'], '');
seal.ext.registerTemplateConfig(ext, '娱乐非指令正则表达式', [''], '');
seal.ext.registerFloatConfig(ext, '告警阈值时间/h', 12, '');
seal.ext.registerFloatConfig(ext, '告警冷却时间/h', 4, '');

const data = JSON.parse(ext.storageGet('data') || '{}');
const coolDog = JSON.parse(ext.storageGet('coolDog') || '{}');

function getRegexConfig(key) {
    const regexes = seal.ext.getTemplateConfig(ext, key).filter(x => x);
    if (regexes.length > 0) {
        try {
            return new RegExp(regexes.join('|'));
        } catch (e) {
            console.error(`正则表达式错误，内容:${regexes.join('|')}，错误信息:${e.message}`);
            return /[^]/;
        }
    }
    return /[^]/;
}

function checkMsg(ctx) {
    if (ctx.isPrivate || !ctx.group.active) return false;
    const gid = ctx.group.groupId;
    const whiteList = seal.ext.getTemplateConfig(ext, '白名单群号');
    if (whiteList.includes(gid.replace(/^.+:/, ''))) return false;
    return true;
}

function handleTrpgMsg(ctx, msg) {
    const gid = ctx.group.groupId;
    data[gid] = msg.time;
    ext.storageSet('data', JSON.stringify(data));
}

function handlePlayMsg(ctx, msg) {
    const gid = ctx.group.groupId;

    const cooldownInterval = seal.ext.getFloatConfig(ext, '告警冷却时间/h');
    if (coolDog[gid]) {
        if (msg.time - coolDog[gid] < cooldownInterval * 60) return;
        delete coolDog[gid];
        ext.storageSet('coolDog', JSON.stringify(coolDog));
    }

    const lastTime = data[gid] || ctx.group.enteredTime;
    const alertThreshold = seal.ext.getFloatConfig(ext, '告警阈值时间/h');
    if (alertThreshold <= 0) return;
    if (msg.time - lastTime > alertThreshold * 60) {
        coolDog[gid] = msg.time;
        ext.storageSet('coolDog', JSON.stringify(coolDog));
        ctx.notice(`群聊(${gid})使用了娱乐功能，超过阈值时间, 请检查是否为非跑团群\n检测消息:${msg.message}`);
    }
}

ext.onCommandReceived = (ctx, msg, cmdArgs) => {
    if (!checkMsg(ctx)) return;
    const trpgCmd = seal.ext.getTemplateConfig(ext, '跑团指令');
    if (trpgCmd.includes(cmdArgs.command)) handleTrpgMsg(ctx, msg);
    const playCmd = seal.ext.getTemplateConfig(ext, '娱乐指令');
    if (playCmd.includes(cmdArgs.command)) handlePlayMsg(ctx, msg);
}

ext.onNotCommandReceived = (ctx, msg) => {
    if (!checkMsg(ctx)) return;
    const trpgRegex = getRegexConfig('跑团非指令正则表达式');
    if (trpgRegex.test(msg.message)) handleTrpgMsg(ctx, msg);
    const playRegex = getRegexConfig('娱乐非指令正则表达式');
    if (playRegex.test(msg.message)) handlePlayMsg(ctx, msg);
}