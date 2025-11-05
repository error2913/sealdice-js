// ==UserScript==
// @name         非跑团群检测
// @author       错误
// @version      1.0.0
// @description  请在插件设置填写相关配置。插件原理为：使用跑团功能超过阈值时间只使用娱乐功能则告警
// @timestamp    1762271196
// 2025-11-04 23:46:36
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/非跑团群检测.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/非跑团群检测.js
// ==/UserScript==

let ext = seal.ext.find('非跑团群检测');
if (!ext) {
    ext = seal.ext.new('非跑团群检测', '错误', '1.0.0');
    seal.ext.register(ext);
}

seal.ext.registerTemplateConfig(ext, '跑团指令', ['r', 'ra', 'rc', 'rh', 'sc', 'ri', 'log', 'setcoc', 'coc', 'dnd'], '');
seal.ext.registerTemplateConfig(ext, '跑团非指令正则表达式', [''], '');
seal.ext.registerTemplateConfig(ext, '娱乐指令', ['jrrp'], '');
seal.ext.registerTemplateConfig(ext, '娱乐非指令正则表达式', [''], '');
seal.ext.registerFloatConfig(ext, '告警阈值时间/h', 12, '使用跑团功能超过阈值时间只使用娱乐功能则告警');
seal.ext.registerFloatConfig(ext, '告警冷却时间/h', 1, '');

const data = JSON.parse(ext.storageGet('data') || '{}');
const coolDog = JSON.parse(ext.storageGet('coolDog') || '{}');

ext.onCommandReceived = (ctx, msg, cmdArgs) => {
    if (ctx.isPrivate) return;
    const gid = ctx.group.groupId;

    const trpgCmd = seal.ext.getTemplateConfig(ext, '跑团指令');
    if (trpgCmd.includes(cmdArgs.command)) {
        data[gid] = msg.time;
        ext.storageSet('data', JSON.stringify(data));
    }

    const cooldownInterval = seal.ext.getFloatConfig(ext, '告警冷却时间/h');
    if (coolDog[gid]) {
        if (msg.time - coolDog[gid] < cooldownInterval * 60) return;
        delete coolDog[gid];
        ext.storageSet('coolDog', JSON.stringify(coolDog));
    }

    const playCmd = seal.ext.getTemplateConfig(ext, '娱乐指令');
    if (playCmd.includes(cmdArgs.command)) {
        const lastTime = data[gid] || ctx.group.enteredTime;
        const alertThreshold = seal.ext.getFloatConfig(ext, '告警阈值时间/h');
        if (msg.time - lastTime > alertThreshold * 60) {
            coolDog[gid] = msg.time;
            ext.storageSet('coolDog', JSON.stringify(coolDog));
            ctx.notice(`群聊(${gid})使用了娱乐功能，超过阈值时间, 请检查是否为非跑团群\n检测指令:${cmdArgs.command}`);
        }
    }
}

ext.onNotCommandReceived = (ctx, msg) => {
    if (ctx.isPrivate) return;
    const gid = ctx.group.groupId;

    const trpgRegexes = seal.ext.getTemplateConfig(ext, '跑团非指令正则表达式').filter(x => x);
    let trpgPattern;
    if (trpgRegexes.length > 0) {
        try {
            trpgPattern = new RegExp(trpgRegexes.join('|'));
        } catch (e) {
            console.error(`正则表达式错误，内容:${trpgRegexes.join('|')}，错误信息:${e.message}`);
        }
    }
    if (trpgPattern && trpgPattern.test(msg.message)) {
        data[gid] = msg.time;
        ext.storageSet('data', JSON.stringify(data));
    }

    const cooldownInterval = seal.ext.getFloatConfig(ext, '告警冷却时间/h');
    if (coolDog[gid]) {
        if (msg.time - coolDog[gid] < cooldownInterval * 60) return;
        delete coolDog[gid];
        ext.storageSet('coolDog', JSON.stringify(coolDog));
    }

    const playRegexes = seal.ext.getTemplateConfig(ext, '娱乐非指令正则表达式').filter(x => x);
    let playPattern;
    if (playRegexes.length > 0) {
        try {
            playPattern = new RegExp(playRegexes.join('|'));
        } catch (e) {
            console.error(`正则表达式错误，内容:${playRegexes.join('|')}，错误信息:${e.message}`);
        }
    }
    if (playPattern && playPattern.test(msg.message)) {
        const lastTime = data[gid] || ctx.group.enteredTime;
        const alertThreshold = seal.ext.getFloatConfig(ext, '告警阈值时间/h');
        if (msg.time - lastTime > alertThreshold * 60) {
            coolDog[gid] = msg.time;
            ext.storageSet('coolDog', JSON.stringify(coolDog));
            ctx.notice(`群聊(${gid})使用了娱乐功能，超过阈值时间, 请检查是否为非跑团群\n检测消息:${msg.message}`);
        }
    }
}