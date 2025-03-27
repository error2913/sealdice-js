// ==UserScript==
// @name         bash运行
// @author       错误
// @version      1.0.0
// @description  暂无
// @timestamp    1743074450
// 2025-03-27 19:20:50
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/run_bash.js
// @updateUrl    https://raw.githubusercontent.com//error2913/sealdice-js/main/run_bash.js
// ==/UserScript==

let ext = seal.ext.find('run_bash');
if (!ext) {
    ext = seal.ext.new('run_bash', '错误', '1.0.0');
    seal.ext.register(ext);
}

const url = 'http://localhost:3011';

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'bash';
cmd.help = '没有帮助';
cmd.solve = (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
        seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
        return seal.ext.newCmdExecuteResult(true);
    }

    const message = msg.message;
    const segments = message.split(/[\s\n]+/);
    if (segments.length < 2) {
        seal.replyToSender(ctx, msg, '请输入要运行的命令');
        return;
    }

    const command = segments.slice(1).join(' ');
    console.log(`运行命令: ${command}`);

    const response = fetch(`${url}/bash?cmd=${command}`).then(response => {
        response.text().then(text => {
            if (!response.ok) {
                seal.replyToSender(ctx, msg, `请求失败! 状态码: ${response.status}\n响应体: ${text}`);
                return;
            }
            if (!text) {
                seal.replyToSender(ctx, msg, "响应体为空");
                return;
            }

            try {
                const data = JSON.parse(text);
                if (data.error) {
                    seal.replyToSender(ctx, msg, `执行失败! 返回码:${data.retcode}\n错误信息:\n${data.error}`);
                    return;
                }
                seal.replyToSender(ctx, msg, `返回码:${data.retcode}\n输出:\n${data.output}`);
                return;
            } catch (e) {
                seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                return;
            }
        })
    });

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['bash'] = cmd;   