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
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/run_bash.js
// ==/UserScript==

let ext = seal.ext.find('run_bash');
if (!ext) {
    ext = seal.ext.new('run_bash', '错误', '1.0.0');
    seal.ext.register(ext);
}

const url = 'http://localhost:3011';

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'bash';
cmd.help = `帮助:
【.bash run <命令>】运行bash命令并返回结果
【.bash create <命令>】创建bash进程并返回PID
【.bash check <PID> <行数(可选)>】查看bash进程输出
【.bash del <PID>】删除bash进程
【.bash list】列出所有bash进程`;
cmd.solve = (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
        seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
        return seal.ext.newCmdExecuteResult(true);
    }

    const message = msg.message;
    const segments = message.split(/[\s\n]+/);
    const val = cmdArgs.getArgN(1);
    switch (val) {
        case 'run': {
            const val2 = cmdArgs.getArgN(2);
            if (!val2) {
                seal.replyToSender(ctx, msg, '请输入要运行的命令');
                return;
            }

            if (segments[2] !== val2 && segments[0].endsWith('run')) {
                segments.splice(2, 0, val2);
            }

            const command = segments.slice(2).join(' ').replace(/\&/g, '%26');
            console.log(`运行命令: ${command}`);

            fetch(`${url}/bash?cmd=${command}`).then(response => {
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
                        const reply = `返回码:${data.retcode}` +
                            (data.error ? `\n错误信息:\n${data.error}` : '') +
                            `\n输出:\n${data.output}`;
                        seal.replyToSender(ctx, msg, reply);
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'create': {
            const val2 = cmdArgs.getArgN(2);
            if (!val2) {
                seal.replyToSender(ctx, msg, '请输入要运行的命令');
                return;
            }

            if (segments[2] !== val2 && segments[0].endsWith('run')) {
                segments.splice(2, 0, val2);
            }

            const command = segments.slice(2).join(' ').replace(/\&/g, '%26');
            console.log(`运行命令: ${command}`);

            fetch(`${url}/create_process?cmd=${command}`).then(response => {
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
                        const pid = data.pid;
                        seal.replyToSender(ctx, msg, `进程已创建，PID: ${pid}`);
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'check': {
            const val2 = cmdArgs.getArgN(2);
            const val3 = cmdArgs.getArgN(3) || 10;
            fetch(`${url}/check_process?pid=${val2}&lines=${val3}`).then(response => {
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
                        const reply = `返回码:${data.retcode}` +
                            `\n进程状态:${data.done ? '已完成' : '运行中'}` +
                            (data.error ? `\n错误信息:\n${data.error}` : '') +
                            `\n输出:\n${data.output}`;
                        seal.replyToSender(ctx, msg, reply);
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'del': {
            const val2 = cmdArgs.getArgN(2);
            fetch(`${url}/del_process?pid=${val2}`).then(response => {
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
                        seal.replyToSender(ctx, msg, `状态:${data.status}`);
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'list': {
            const val2 = cmdArgs.getArgN(2);
            fetch(`${url}/list_process?pid=${val2}`).then(response => {
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
                        const reply = Object.keys(data).map(pid => {
                            const process = data[pid];
                            return `PID: ${pid}\n命令: ${process.cmd}\n状态: ${process.done? '已完成' : '运行中'}`;
                        }).join('\n\n') || '无进程';
                        seal.replyToSender(ctx, msg, reply);
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });

            return seal.ext.newCmdExecuteResult(true);
        }
        default: {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
    }
};

ext.cmdMap['bash'] = cmd;   