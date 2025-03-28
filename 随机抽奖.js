// ==UserScript==
// @name         随机抽奖
// @author       错误
// @version      1.0.0
// @description  指令 .lo <数量> <附加文本> 进行随机抽奖。七天内发言的用户才可被抽取。同一次抽取中奖者不会重复。使用指令需要骰主权限。依赖于错误:骰主公告极速版:>=1.1.0。
// @timestamp    1733286874
// 2024-12-04 12:34:34
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/随机抽奖.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/随机抽奖.js
// @depends 错误:骰主公告极速版:>=1.1.0
// ==/UserScript==

let ext = seal.ext.find('lottery');
if (!ext) {
    ext = seal.ext.new('lottery', '错误', '1.0.0');
    seal.ext.register(ext);
}

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

function getAlluids(epId) {
    const data = globalThis.getPostData();
    if (!data.hasOwnProperty(epId)) {
        return { alluids: null, err: new Error('未找到数据') };
    }

    const alluids = {};
    for (const gid of Object.keys(data[epId])) {
        const members = data[epId][gid].members;
        for (const uid of Object.keys(members)) {
            alluids[uid] = gid;
        }
    }

    return { alluids, err: null };
}

async function lottery(epId, n, s) {
    const { alluids, err } = getAlluids(epId);
    if (err !== null) {
        return { result: null, err };
    }

    if (Object.keys(alluids).length < n) {
        return { result: null, err: new Error(`抽奖失败！可抽取的人数为${Object.keys(alluids).length}`) };
    }

    const winuids = {};
    for (let i = 0; i < n; i++) {
        const alluidsArr = Object.keys(alluids);
        const uid = alluidsArr[Math.floor(Math.random() * alluidsArr.length)];
        winuids[uid] = alluids[uid];
        delete alluids[uid];
    }

    const wingids = {};
    for (const uid of Object.keys(winuids)) {
        const gid = winuids[uid];
        if (!wingids.hasOwnProperty(gid)) {
            wingids[gid] = [];
        }

        wingids[gid].push(uid);
    }

    const f = 5;
    const interval = 2000;
    let result = [];

    const wingidsArr = Object.keys(wingids);
    let arr = [];
    for (let i = 0; i < wingidsArr.length; i++) {
        arr.push(wingidsArr[i]);

        if (i % f === f - 1 || i === wingidsArr.length - 1) {
            const arr_copy = arr.slice();

            for (let j = 0; j < arr_copy.length; j++) {
                const gid = arr_copy[j];
                const uids = wingids[gid];
                const msg = getMsg(gid, '0');
                const ctx = getCtx(epId, msg);

                const CQuids = uids.map(uid => `[CQ:at,qq=${uid.replace(/\D+/, '')}]`);
                const reply = `该群中奖用户:\n${CQuids.join('\n')}\n${s}`;
                seal.replyToSender(ctx, msg, reply);
                result.push(...uids);
            }

            await new Promise(resolve => setTimeout(resolve, interval + Math.floor(Math.random() * 100)));

            arr = [];
        }
    }

    return { result: result, err: null };
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'lo';
cmd.help = `帮助:
【.lo <数量> <附加文本>】进行抽奖
【.lo show】查看可抽取人数`;
cmd.solve = async (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
        const s = seal.formatTmpl(ctx, "核心:提示_无权限");

        seal.replyToSender(ctx, msg, s);
        return seal.ext.newCmdExecuteResult(true);
    }

    const val = cmdArgs.getArgN(1);
    if (val === 'help' || val === '') {
        seal.replyToSender(ctx, msg, cmd.help);
        return seal.ext.newCmdExecuteResult(true);
    }
    if (val === 'show') {
        const epId = ctx.endPoint.userId;
        const { alluids, err } = getAlluids(epId);
        if (err!== null) {
            seal.replyToSender(ctx, msg, err.message);
            return seal.ext.newCmdExecuteResult(true);
        }
        seal.replyToSender(ctx, msg, `可抽取的人数为${Object.keys(alluids).length}`);
        return seal.ext.newCmdExecuteResult(true);
    }

    const n = parseInt(val);
    if (isNaN(n) || n < 1) {
        seal.replyToSender(ctx, msg, '请输入大于0的数字');
    }

    const s = cmdArgs.getRestArgsFrom(2);
    const epId = ctx.endPoint.userId;
    const { result, err } = await lottery(epId, n, s);
    if (err !== null) {
        seal.replyToSender(ctx, msg, err.message);
        return seal.ext.newCmdExecuteResult(true);
    }

    seal.replyToSender(ctx, msg, `中奖用户:\n${result.join('\n')}`);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['lo'] = cmd;   