// ==UserScript==
// @name         骰主公告极速版HTTP版
// @author       错误
// @version      1.0.0
// @description  让骰主掌握立即发公告、或者广告的权利。使用 .pnh help 查看帮助。依赖于错误:HTTP依赖:>=1.0.0。
// @timestamp    1732543168
// 2024-11-25 21:59:28
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/postnow_http.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/postnow_http.js
// @depends 错误:HTTP依赖:>=1.0.0
// ==/UserScript==

let ext = seal.ext.find('postnow_http');
if (!ext) {
    ext = seal.ext.new('postnow_http', '错误', '1.0.0');
    seal.ext.register(ext);

    let readyToSend = false;
    let task = async () => {
        return null;
    };

    function getMsg(gid, uid) {
        let msg = seal.newMessage();

        msg.groupId = gid;
        msg.guildId = '';
        msg.messageType = 'group';
        msg.sender.userId = uid;

        return msg;
    }

    function getCtx(epId, msg) {
        const eps = seal.getEndPoints();

        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                return seal.createTempCtx(eps[i], msg);
            }
        }

        return undefined;
    }

    function sendPost(epId, gid, uid, s, emg = false) {
        const msg = getMsg(gid, uid);
        const ctx = getCtx(epId, msg);

        if (!emg && ctx.group.logOn) {
            return;
        }

        seal.replyToSender(ctx, msg, s);
    }

    async function post(s, emg = false) {
        const f = 5;
        const interval = 2000;
        let result = 0;

        const eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            const epId = eps[i].userId;

            const data = await globalThis.http.getData(epId,'get_group_list?no_cache=true');
            if (data === null) {
                continue;
            }

            const gids = data.map(item => `QQ-Group:${item.group_id}`);

            let arr = [];
            for (let j = 0; j < gids.length; j++) {
                arr.push(gids[j]);

                if (j % f === f - 1 || j === gids.length - 1) {
                    const arr_copy = arr.slice();

                    for (let k = 0; k < arr_copy.length; k++) {
                        const gid = arr_copy[k];

                        sendPost(epId, gid, '0', s, emg);
                        result++;
                    }

                    await new Promise(resolve => setTimeout(resolve, interval + Math.floor(Math.random() * 500)));
                    arr = [];
                }
            }
        }

        return result;
    }

    async function chasePost(uid, s) {
        const f = 5;
        const interval = 2000;
        let result = 0;

        const eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            const epId = eps[i].userId;

            const data = await globalThis.http.getData(epId,'get_group_list?no_cache=true');
            if (data === null) {
                continue;
            }

            const gids = data.map(item => `QQ-Group:${item.group_id}`);

            let arr = [];
            for (let j = 0; j < gids.length; j++) {
                const gid = gids[j];
                const group_member_list = await globalThis.http.getData(epId, `get_group_member_list?group_id=${gid.replace(/\D+/, '')}`);
                if (group_member_list === null) {
                    continue;
                }
                group_member_list.forEach(item => {
                    if (item.user_id == uid.replace(/\D+/, '')) {
                        arr.push(gid);
                    }
                });

                if (arr.length % f === f - 1 || j === gids.length - 1) {
                    const arr_copy = arr.slice();

                    for (let k = 0; k < arr_copy.length; k++) {
                        const gid = arr_copy[k];

                        sendPost(epId, gid, '0', s);
                        result++;
                    }

                    await new Promise(resolve => setTimeout(resolve, interval + Math.floor(Math.random() * 500)));
                    arr = [];
                }
            }
        }

        return result;
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'pnh';
    cmd.help = `帮助:
【.pnh <公告内容>】发布公告，换行请使用\\ n
【.pnh emg <公告内容>】发布紧急公告，忽略是否处于log状态
【.pnh chase <ID> <公告内容>】发布追杀公告，在特定用户活跃的群聊发送。ID格式: QQ:114514
【.pnh chaseat <ID> <公告内容>】发布追杀公告，且@对应玩家
【.pnh send】确认发送
【.pnh cancel】取消发送`;
    cmd.solve = async (ctx, msg, cmdArgs) => {
        if (ctx.privilegeLevel < 100) {
            const s = seal.formatTmpl(ctx, "核心:提示_无权限");

            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }

        const val = cmdArgs.getArgN(1);

        switch (val) {
            case '':
            case 'help': {
                seal.replyToSender(ctx, msg, cmd.help);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'emg': {
                if (readyToSend) {
                    seal.replyToSender(ctx, msg, `请输入【.pnh send】确认发送，或者输入【.pnh cancel】取消发送`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const s = cmdArgs.getRestArgsFrom(2);

                readyToSend = true;
                task = async () => {
                    return await post(s, true);
                }

                seal.replyToSender(ctx, msg, `确认发送【.pnh send】，或者输入【.pnh cancel】取消发送。消息预览: \n--------------------------\n${s}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'chase': {
                if (readyToSend) {
                    seal.replyToSender(ctx, msg, `请输入【.pnh send】确认发送，或者输入【.pnh cancel】取消发送`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const uid = cmdArgs.getArgN(2);
                const s = cmdArgs.getRestArgsFrom(3);

                readyToSend = true;
                task = async () => {
                    return await chasePost(uid, s);
                }

                seal.replyToSender(ctx, msg, `确认发送【.pnh send】，或者输入【.pnh cancel】取消发送。消息预览: \n--------------------------\n${s}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'chaseat': {
                if (readyToSend) {
                    seal.replyToSender(ctx, msg, `请输入【.pnh send】确认发送，或者输入【.pnh cancel】取消发送`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const uid = cmdArgs.getArgN(2);
                const s = `[CQ:at,qq=${uid.replace(/\D+/, '')}] ` + cmdArgs.getRestArgsFrom(3);

                readyToSend = true;
                task = async () => {
                    return await chasePost(uid, s);
                }

                seal.replyToSender(ctx, msg, `确认发送【.pnh send】，或者输入【.pnh cancel】取消发送。消息预览: \n--------------------------\n${s}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'send': {
                if (!readyToSend) {
                    seal.replyToSender(ctx, msg, `请先输入【.pnh】查看帮助。`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                readyToSend = false;
                const result = await task();

                seal.replyToSender(ctx, msg, `发送完成，共发送${result}条消息。`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'cancel': {
                if (!readyToSend) {
                    seal.replyToSender(ctx, msg, `请先输入【.pnh】查看帮助。`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                readyToSend = false;
                task = async () => {
                    return null;
                }

                seal.replyToSender(ctx, msg, `已取消发送`);
                return seal.ext.newCmdExecuteResult(true);
            }
            default: {
                if (readyToSend) {
                    seal.replyToSender(ctx, msg, `请输入【.pnh send】确认发送，或者输入【.pnh cancel】取消发送`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const s = cmdArgs.getRestArgsFrom(1);

                readyToSend = true;
                task = async () => {
                    return await post(s);
                }

                seal.replyToSender(ctx, msg, `确认发送【.pnh send】，或者输入【.pnh cancel】取消发送。消息预览: \n--------------------------\n${s}`);
                return seal.ext.newCmdExecuteResult(true);
            }
        }
    };
    ext.cmdMap['pnh'] = cmd;
}