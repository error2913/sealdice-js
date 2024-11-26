// ==UserScript==
// @name         骰主公告极速版
// @author       错误
// @version      1.0.0
// @description  让骰主掌握立即发公告、或者广告的权利。使用 .pn help 查看帮助。公告只能发在安装插件后活跃过、且在这之后一周内活跃的群聊。
// @timestamp    1732543168
// 2024-11-25 21:59:28
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/postnow.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/postnow.js
// ==/UserScript==

let ext = seal.ext.find('postnow');
if (!ext) {
    ext = seal.ext.new('postnow', '错误', '1.0.0');
    seal.ext.register(ext);

    const data = JSON.parse(ext.storageGet('data') || '{}');

    function save() {
        ext.storageSet('data', JSON.stringify(data));
    }

    function getMsg(gid) {
        let msg = seal.newMessage();

        msg.groupId = gid;
        msg.guildId = '';
        msg.messageType = 'group';
        msg.sender.userId = 'QQ:114514';

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

    function sendPost(gid, epId, s, emg) {
        const msg = getMsg(gid);
        const ctx = getCtx(epId, msg);

        if (!emg && ctx.group.logOn) {
            return;
        }

        seal.replyToSender(ctx, msg, s);
    }

    function post(s, emg = false) {
        const gids = Object.keys(data);

        let arr = [];
        for (let i = 0; i < gids.length; i++) {
            arr.push(data[gids[i]]);

            if (i % 5 === 5 - 1 || i === gids.length -1) {
                const arr_copy = arr.slice();
                const n = Math.floor(i / 5);

                setTimeout(() => {
                    for (let j = 0; j < arr_copy.length; j++) {
                        const gid = arr_copy[j].gid;
                        const epId = arr_copy[j].epId;

                        sendPost(gid, epId, s, emg);
                    }
                }, n * 2 * 1000 + Math.floor(Math.random() * 500))

                arr = [];
            }
        }
    }

    function add(ctx, msg) {
        if (ctx.isPrivate) {
            return;
        }

        const gid = ctx.group.groupId;
        const epId = ctx.endPoint.userId;

        data[gid] = {
            ts: msg.time,
            gid: gid,
            epId: epId
        }
    }

    function clean(ts) {
        const limit = 1000 * 60 * 60 * 24 * 7;
        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            const gid = keys[i];
            if (ts - data[gid].ts > limit) {
                delete data[gid];
            }
        }
    }

    seal.ext.registerTask(ext, "cron", "0 */4 * * *", (taskCtx) => {
        clean(taskCtx.now);
        save();
    });

    ext.onCommandReceived = (ctx, msg, _) => {
        add(ctx, msg);
    }

    ext.onNotCommandReceived = (ctx, msg) => {
        add(ctx, msg);
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'pn';
    cmd.help = `帮助:
【.pn <公告内容>】发布公告，换行请使用\\ n
【.pn emg <公告内容>】发布紧急公告，忽略是否处于log状态
【.pn test <公告内容>】测试公告格式，不会发出去`;
    cmd.solve = (ctx, msg, cmdArgs) => {
        if (ctx.privilegeLevel < 100) {
            const s = seal.formatTmpl(ctx, "核心:提示_无权限");

            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }

        const val = cmdArgs.getArgN(1);
        switch (val) {
            case '':
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'test': {
                const s = cmdArgs.getRestArgsFrom(2);
                seal.replyToSender(ctx, msg, s);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'emg': {
                const s = cmdArgs.getRestArgsFrom(2);
                post(s, true);
                return seal.ext.newCmdExecuteResult(true);
            }
            default: {
                const s = cmdArgs.getRestArgsFrom(1);
                post(s);
                return seal.ext.newCmdExecuteResult(true);
            }
        }
    };
    ext.cmdMap['pn'] = cmd;
}