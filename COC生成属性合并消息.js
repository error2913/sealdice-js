// ==UserScript==
// @name         COC生成属性合并消息
// @author       错误
// @version      1.0.0
// @description  目前仅有napcat能使用。具体配置请查看插件设置。依赖于错误:HTTP依赖:>=1.0.0。
// @timestamp    1737050266
// 2025-01-17 01:57:46
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/COC生成属性合并消息.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/COC生成属性合并消息.js
// @depends 错误:HTTP依赖:>=1.0.0
// ==/UserScript==

let ext = seal.ext.find('coc_forward_msg');
if (!ext) {
    ext = seal.ext.new('coc_forward_msg', '错误', '1.0.0');
    seal.ext.register(ext);
    seal.ext.registerIntConfig(ext, "制卡上限", 20);
    seal.ext.registerTemplateConfig(ext, "合并消息预览", ["{核心:骰子名字}: 属性已生成"]);
    seal.ext.registerTemplateConfig(ext, "合并消息外部预览", ["{核心:骰子名字}为{$t玩家}生成了属性"]);
    seal.ext.registerTemplateConfig(ext, "聊天记录来源", ["{核心:骰子名字}与{$t玩家_RAW}的聊天记录"]);
}

const extcoc = seal.ext.find('coc7');
const cmd = extcoc.cmdMap['coc'];
cmd.solve = (ctx, msg, cmdArgs) => {
    const n = cmdArgs.getArgN(1);
    let val = parseInt(n, 10);
    if (n === '') {
        val = 1;
    }
    if (isNaN(val) || val < 1) {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
    }

    const max = seal.ext.getIntConfig(ext, "制卡上限");
    if (val > max) {
        val = max;
    }

    const ss = [];
    for (let i = 0; i < val; i++) {
        const resultText = seal.format(ctx, `力量:{$t力量=3d6*5} 敏捷:{$t敏捷=3d6*5} 意志:{$t意志=3d6*5}\n体质:{$t体质=3d6*5} 外貌:{$t外貌=3d6*5} 教育:{$t教育=(2d6+6)*5}\n体型:{$t体型=(2d6+6)*5} 智力:{$t智力=(2d6+6)*5} 幸运:{$t幸运=3d6*5}\nHP:{($t体质+$t体型)/10} <DB:{($t力量 + $t体型) < 65 ? -2, ($t力量 + $t体型) < 85 ? -1, ($t力量 + $t体型) < 125 ? 0, ($t力量 + $t体型) < 165 ? '1d4', ($t力量 + $t体型) < 205 ? '1d6'}> [{$t力量+$t敏捷+$t意志+$t体质+$t外貌+$t教育+$t体型+$t智力}/{$t力量+$t敏捷+$t意志+$t体质+$t外貌+$t教育+$t体型+$t智力+$t幸运}]`);
        ss.push(resultText);
    }

    seal.vars.strSet(ctx, "$t制卡结果文本", '**sep**');
    const text = seal.formatTmpl(ctx, "COC:制卡");
    const arr = text.split('**sep**');
    ss[0] = arr[0] + ss[0];
    ss[ss.length - 1] += arr[1];

    // 发送消息
    const epId = ctx.endPoint.userId;
    const gid = ctx.group.groupId;
    const diceName = seal.formatTmpl(ctx, "核心:骰子名字");
    const messages = ss.map((s) => {
        return {
            "type": "node",
            "data": {
                "user_id": epId.replace(/\D+/g, ''),
                "nickname": diceName,
                "content": {
                    "type": "text",
                    "data": {
                        "text": s
                    }
                }
            }
        }
    });

    const newsTmpl = seal.ext.getTemplateConfig(ext, "合并消息预览");
    const news = seal.format(ctx, newsTmpl[Math.floor(Math.random() * newsTmpl.length)]);
    const promptTmpl = seal.ext.getTemplateConfig(ext, "合并消息外部预览");
    const prompt = seal.format(ctx, promptTmpl[Math.floor(Math.random() * promptTmpl.length)]);
    const sourceTmpl = seal.ext.getTemplateConfig(ext, "聊天记录来源");
    const source = seal.format(ctx, sourceTmpl[Math.floor(Math.random() * sourceTmpl.length)]);

    const data = {
        "group_id": gid.replace(/\D+/g, ''),
        "messages": messages,
        "news": [
            {
                "text": news
            }
        ],
        "prompt": prompt,
        "summary": `查看${val}条转发消息`,
        "source": source
    }
    http.getData(epId, 'send_forward_msg', data)

    return seal.ext.newCmdExecuteResult(true);
};