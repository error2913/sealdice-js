// ==UserScript==
// @name         coc7指令中文版
// @author       错误
// @version      1.0.0
// @description  en 给老子升级\nsetcoc 规矩老子说了算\nti 当场发癫\nli 事后算总账\nra 过个\nrav 来干架\nsc 阿巴阿巴\ncoc 搓个新崽\nst 属性给老子改成
// @timestamp    1749959677
// 2025-06-15 11:54:37
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/coc7指令中文版.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/coc7指令中文版.js
// ==/UserScript==

let ext = seal.ext.find('coc7_cn');
if (!ext) {
    ext = seal.ext.new('coc7_cn', '错误', '1.0.0');
    seal.ext.register(ext);
}

const config = {
    "en": ["给老子升级"],
    "setcoc": ["规矩老子说了算"],
    "ti": ["当场发癫"],
    "li": ["事后算总账"],
    "ra": ["过个"],
    "rav": ["来干架"],
    "sc": ["阿巴阿巴"],
    "coc": ["搓个新崽"],
    "st": ["属性给老子改成"]
}

const extcoc = seal.ext.find('coc7');

for (const cmdName in config) {
    for (const alias of config[cmdName]) {
        const cmd = seal.ext.newCmdItemInfo();
        cmd.name = alias;
        cmd.help = extcoc.cmdMap[cmdName].help;
        cmd.allowDelegate = extcoc.cmdMap[cmdName].allowDelegate;
        cmd.disabledInPrivate = extcoc.cmdMap[cmdName].disabledInPrivate;
        cmd.solve = extcoc.cmdMap[cmdName].solve;
        ext.cmdMap[alias] = cmd;
    }
}