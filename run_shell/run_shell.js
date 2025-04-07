// ==UserScript==
// @name         shell运行
// @author       错误
// @version      1.1.1
// @description  发送 .shell 查看帮助，在插件设置内设置权限，需要搭建相应后端服务。\n进入后端服务目录，运行：\npip install -r requirements.txt\npython main.py
// @timestamp    1743074450
// 2025-03-27 19:20:50
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/run_shell/run_shell.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/run_shell/run_shell.js
// ==/UserScript==

let ext = seal.ext.find('run_shell');
if (!ext) {
    ext = seal.ext.new('run_shell', '错误', '1.1.1');
    seal.ext.register(ext);

    seal.ext.registerTemplateConfig(ext, "白名单", ["QQ:1234567890"], "可使用指令的QQ号");
    seal.ext.registerStringConfig(ext, "token", "123456", "访问令牌，请在后端服务main.py文件中设置");
}

const url = 'http://localhost:3011';

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'shell';
cmd.help = `帮助:
【.shell run <命令>】运行shell命令并返回结果，若执行时间超过10秒则会返回超时错误
【.shell create <命令>】创建shell进程并返回PID
【.shell check <PID> <行数起始序号(默认为-10)> <行数结束序号(可选)>】查看shell进程输出
【.shell del <PID>】删除shell进程
【.shell list】列出所有shell进程`;
cmd.solve = (ctx, msg, cmdArgs) => {
    if (!seal.ext.getTemplateConfig(ext, "白名单").includes(ctx.player.userId)) {
        seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
        return seal.ext.newCmdExecuteResult(true);
    }

    const token = seal.ext.getStringConfig(ext, "token");

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

            const command = segments.slice(2).join(' ');
            console.log(`运行命令: ${command}`);

            fetch(`${url}/run?token=${encodeURIComponent(token)}&cmd=${encodeURIComponent(command)}`).then(response => {
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
                            (data?.error_url ? `\n错误信息:\n[CQ:image,file=${data.error_url}]` : '') +
                            (data?.output_url ? `\n输出:\n[CQ:image,file=${data.output_url}]` : '');
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

            if (segments[2] !== val2 && segments[0].endsWith('create')) {
                segments.splice(2, 0, val2);
            }

            const command = segments.slice(2).join(' ');
            console.log(`运行命令: ${command}`);

            fetch(`${url}/create_process?token=${encodeURIComponent(token)}&cmd=${encodeURIComponent(command)}`).then(response => {
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
            const val3 = cmdArgs.getArgN(3);
            const val4 = cmdArgs.getArgN(4);
            fetch(`${url}/check_process?token=${encodeURIComponent(token)}&pid=${val2}${val3 ? `&start_index=${val3}` : `&start_index=-100`}${val4 ? `&end_index=${val4}` : ``}`).then(response => {
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
                            `\n输出行数:${data.lines}` +
                            (data?.error_url ? `\n错误信息:\n[CQ:image,file=${data.error_url}]` : '') +
                            (data?.output_url ? `\n输出:\n[CQ:image,file=${data.output_url}]` : '');
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
            fetch(`${url}/del_process?token=${encodeURIComponent(token)}&pid=${val2}`).then(response => {
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
            fetch(`${url}/list_process?token=${encodeURIComponent(token)}`).then(response => {
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
                            return `PID: ${pid}\n命令: ${process.cmd}\n状态: ${process.done ? '已完成' : '运行中'}`;
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

ext.cmdMap['shell'] = cmd;   