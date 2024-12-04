// ==UserScript==
// @name         骰主公告极速版
// @author       错误
// @version      1.1.1
// @description  让骰主掌握立即发公告、或者广告的权利。使用 .pn help 查看帮助。公告只能发在安装插件后活跃过、且在这之后一周内活跃的群聊。每四个小时储存一次数据，期间重载js可能导致丢失，可使用 .pn save 保存数据。
// @timestamp    1732543168
// 2024-11-25 21:59:28
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/postnow.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/postnow.js
// ==/UserScript==

let ext = seal.ext.find('postnow');
if (!ext) {
    ext = seal.ext.new('postnow', '错误', '1.1.1');
    seal.ext.register(ext);

    const data = JSON.parse(ext.storageGet('postData') || '{}');

    function save() {
        ext.storageSet('postData', JSON.stringify(data));
    }

    function add(epId, gid, uid, ts) {
        if (!data.hasOwnProperty(epId)) {
            data[epId] = {};
        }

        if (!data[epId].hasOwnProperty(gid)) {
            data[epId][gid] = {
                ts: ts,
                members: {}
            }
        }

        data[epId][gid].ts = ts;
        data[epId][gid].members[uid] = ts;
    }

    // 兼容旧版本数据
    function adaptOldData() {
        const data = JSON.parse(ext.storageGet('data') || '{}');

        if (Object.keys(data).length === 0) {
            return;
        }

        for (const gid of Object.keys(data)) {
            add(data[gid].epId, gid, '0', data[gid].ts);
        }

        save();
        ext.storageSet('data', '{}');
    }
    adaptOldData();

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

    function post(s, emg = false) {
        const epIds = Object.keys(data);
        const f = 5;
        const interval = 2000;

        for (let i = 0; i < epIds.length; i++) {
            const epId = epIds[i];
            const gids = Object.keys(data[epId]);

            let arr = [];
            for (let j = 0; j < gids.length; j++) {
                arr.push(gids[j]);
    
                if (j % f === f - 1 || j === gids.length -1) {
                    const arr_copy = arr.slice();
                    const n = Math.floor(j / f);
    
                    setTimeout(() => {
                        for (let k = 0; k < arr_copy.length; k++) {
                            const gid = arr_copy[k];
    
                            sendPost(epId, gid, '0', s, emg);
                        }
                    }, n * interval + Math.floor(Math.random() * 500))
    
                    arr = [];
                }
            }
        }
    }

    function chasePost(uid, s) {
        const epIds = Object.keys(data);
        const f = 5;
        const interval = 2000;

        for (let i = 0; i < epIds.length; i++) {
            const epId = epIds[i];
            const gids = Object.keys(data[epId]);

            let arr = [];
            for (let j = 0; j < gids.length; j++) {
                const gid = gids[j];
                if (data[epId][gid].members.hasOwnProperty(uid)) {
                    arr.push(gid);
                }

                if (arr.length % f === f - 1 || j === gids.length -1) {
                    const arr_copy = arr.slice();
                    const n = Math.floor(arr.length / f);
    
                    setTimeout(() => {
                        for (let k = 0; k < arr_copy.length; k++) {
                            const gid = arr_copy[k];
    
                            sendPost(epId, gid, uid, s);
                        }
                    }, n * interval + Math.floor(Math.random() * 500))
    
                    arr = [];
                }
            }
        }
    }

    function clean(ts) {
        const limit = 1000 * 60 * 60 * 24 * 7;
        const epIds = Object.keys(data);
        for (let i = 0; i < epIds.length; i++) {
            const epId = epIds[i];

            const gids = Object.keys(data[epId]);
            for (let j = 0; j < gids.length; j++) {
                const gid = gids[j];

                if (ts - data[epId][gid].ts > limit) {
                    delete data[epId][gid];
                }

                const members = Object.keys(data[epId][gid].members);
                for (let k = 0; k < members.length; k++) {
                    const uid = members[k];

                    if (ts - data[epId][gid].members[uid] > limit) {
                        delete data[epId][gid].members[uid];
                    }
                }
            }
        }
    }

    seal.ext.registerTask(ext, "cron", "0 */4 * * *", (taskCtx) => {
        const ts = taskCtx.now;
        clean(ts);
        save();
    });

    ext.onCommandReceived = (ctx, msg, _) => {
        if (ctx.isPrivate) {
            return;
        }

        const epId = ctx.endPoint.userId;
        const gid = ctx.group.groupId;
        const uid = ctx.player.userId;
        const ts = msg.time;

        add(epId, gid, uid, ts);
    }

    ext.onNotCommandReceived = (ctx, msg) => {
        if (ctx.isPrivate) {
            return;
        }

        const epId = ctx.endPoint.userId;
        const gid = ctx.group.groupId;
        const uid = ctx.player.userId;
        const ts = msg.time;

        add(epId, gid, uid, ts);
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'pn';
    cmd.help = `帮助:
【.pn <公告内容>】发布公告，换行请使用\\ n
【.pn emg <公告内容>】发布紧急公告，忽略是否处于log状态
【.pn chase <ID> <公告内容>】发布追杀公告，在特定用户活跃的群聊发送。ID格式: QQ:114514
【.pn chaseat <ID> <公告内容>】发布追杀公告，且@对应玩家
【.pn test <公告内容>】测试公告格式，不会发出去
【.pn save】保存数据`;
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
            case 'chase': {
                const uid = cmdArgs.getArgN(2);
                const s = cmdArgs.getRestArgsFrom(3);
                chasePost(uid, s);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'chaseat': {
                const uid = cmdArgs.getArgN(2);
                const s = `[CQ:at,qq=${uid.replace(/\D+/, '')}] ` + cmdArgs.getRestArgsFrom(3);
                chasePost(uid, s);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'save': {
                save();
                seal.replyToSender(ctx, msg, '已保存');
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

    globalThis.getPostData = () => {
        return JSON.parse(JSON.stringify(data));
    }
}