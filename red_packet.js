// ==UserScript==
// @name         豹语变量红包
// @author       错误
// @version      1.0.0
// @description  在插件设置填入红包使用货币的豹语变量
// @timestamp    1735226264
// 2024-12-26 23:17:44
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/red_packet.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/red_packet.js
// ==/UserScript==

let ext = seal.ext.find('red_packet');
if (!ext) {
    ext = seal.ext.new('red_packet', '错误', '1.0.0');
    seal.ext.register(ext);
}

seal.ext.registerStringConfig(ext, '豹语变量名', '$m金币', '');
const varname = seal.ext.getStringConfig(ext, '豹语变量名');

const data = JSON.parse(ext.storageGet('data') || '{}');

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

function sendRedPacket(epId, gid, uid, un, money, n, muid, mun) {
    if (!data.hasOwnProperty(gid)) {
        data[gid] = [];
    }

    const id = data[gid].length === 0 ? 1 : data[gid][data[gid].length - 1].id + 1;
    let arr = []; // 用于分配红包的随机数组
    let sum = 0;
    for (let i = 0; i < n; i++) {
        const ran = Math.random();
        arr.push(ran);
        sum += ran;
    }

    let rest = money;
    arr = arr.map((item, index) => {
        if (index === n - 1) {
            return rest;
        }

        const increase = Math.ceil(money * item / sum);
        rest -= increase;
        return increase;
    });

    data[gid].push({
        id: id,
        epId: epId,
        uid: uid,
        un: un,
        timestamp: Math.floor(Date.now() / 1000),
        money: money,
        n: n,
        arr: arr,
        muid: muid,
        mun: mun,
        history: []
    })

    ext.storageSet('data', JSON.stringify(data));
}

const cmdSend = seal.ext.newCmdItemInfo();
cmdSend.name = '发红包';
cmdSend.help = `帮助:
【.发红包 <货币数> <红包数>】发送红包，可通过@发送专属红包
【.抢红包 <指定序号(可选)>】抢红包
【.查看红包 <指定序号(可选)>】查看该群红包`;
cmdSend.allowDelegate = true;
cmdSend.disabledInPrivate = true;
cmdSend.solve = (ctx, msg, cmdArgs) => {
    const money = parseInt(cmdArgs.getArgN(1));
    const num = parseInt(cmdArgs.getArgN(2));
    if (isNaN(money) || money < 1 || isNaN(num) || num < 1) {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
    }
    if (money < num) {
        seal.replyToSender(ctx, msg, '你不能发送货币数小于红包数的红包');
        return seal.ext.newCmdExecuteResult(true);
    }

    const [val, exists] = seal.vars.intGet(ctx, varname);
    if (!exists || val < money) {
        seal.replyToSender(ctx, msg, '货币不足');
        return seal.ext.newCmdExecuteResult(true);
    }

    const epId = ctx.endPoint.userId;
    const gid = ctx.group.groupId;
    const uid = ctx.player.userId;
    const un = ctx.player.name;
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const muid = mctx.player.userId;
    const mun = mctx.player.name;
    if (uid !== muid) {
        ctx.delegateText = '';
        if (num !== 1) {
            seal.replyToSender(ctx, msg, '专属红包的数量只能为1');
            return seal.ext.newCmdExecuteResult(true);
        }

        sendRedPacket(epId, gid, uid, un, money, num, muid, mun);
        seal.replyToSender(ctx, msg, `<${un}>向<${mun}>发送了一个专属红包！`);
    } else {
        sendRedPacket(epId, gid, uid, un, money, num, '', '');
        seal.replyToSender(ctx, msg, `<${un}>发送了一个红包！`);
    }

    seal.vars.intSet(ctx, varname, val - money);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['发红包'] = cmdSend;

const cmdGrab = seal.ext.newCmdItemInfo();
cmdGrab.name = '抢红包';
cmdGrab.help = `帮助:
【.发红包 <货币数> <红包数>】发送红包，可通过@发送专属红包
【.抢红包 <指定序号(可选)>】抢红包
【.查看红包 <指定序号(可选)>】查看该群红包`;
cmdGrab.disabledInPrivate = true;
cmdGrab.solve = (ctx, msg, cmdArgs) => {
    const arg = cmdArgs.getArgN(1);
    switch (arg) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            const gid = ctx.group.groupId;
            if (!data.hasOwnProperty(gid) || data[gid].length === 0) {
                seal.replyToSender(ctx, msg, '当前群无红包');
                return seal.ext.newCmdExecuteResult(true);
            }

            const uid = ctx.player.userId;
            const un = ctx.player.name;

            const id = parseInt(arg);
            let index = -1;
            if (!isNaN(id)) {
                index = data[gid].findIndex(item => item.id === id);
                if (index === -1) {
                    seal.replyToSender(ctx, msg, '该序号红包不存在');
                    return seal.ext.newCmdExecuteResult(true);
                }

                const muid = data[gid][index].muid;
                const history = data[gid][index].history;
                if ((muid !== '' && muid !== uid) || history.some(item => item.uid === uid)) {
                    seal.replyToSender(ctx, msg, '无法领取该红包');
                    return seal.ext.newCmdExecuteResult(true);
                }
            } else {
                for (let i = data[gid].length - 1; i > -1; i--) {
                    const muid = data[gid][i].muid;
                    const history = data[gid][i].history;
                    if ((muid !== '' && muid !== uid) || history.some(item => item.uid === uid)) {
                        if (i === 0) {
                            seal.replyToSender(ctx, msg, '没有可以领的红包');
                            return seal.ext.newCmdExecuteResult(true);
                        }
                        continue;
                    }

                    index = i;
                    break;
                }
            }

            const money = data[gid][index].money;
            const n = data[gid][index].n;
            const history = data[gid][index].history;
            const increase = data[gid][index].arr[history.length];
            const [val, _] = seal.vars.intGet(ctx, varname);

            seal.vars.intSet(ctx, varname, val + increase);
            history.push({
                uid: uid,
                un: un,
                money: increase
            })

            seal.replyToSender(ctx, msg, `<${un}>领取了<${data[gid][index].un}>的红包，获得${increase}`);

            if (history.length === n) {
                let s = `<${data[gid][index].un}>的红包已被领完\n总金额:${money}\n数量:${n}\n历史记录:`;
                for (let i = 0; i < history.length; i++) {
                    s += `\n<${history[i].un}>:${history[i].money}`;
                }
                seal.replyToSender(ctx, msg, s);

                data[gid].splice(index, 1);
            }

            ext.storageSet('data', JSON.stringify(data));
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
ext.cmdMap['抢红包'] = cmdGrab;
ext.cmdMap['收红包'] = cmdGrab;

const cmdShow = seal.ext.newCmdItemInfo();
cmdShow.name = '查看红包';
cmdShow.help = '这有什么好写帮助的';
cmdShow.disabledInPrivate = true;
cmdShow.solve = (ctx, msg, cmdArgs) => {
    const gid = ctx.group.groupId;
    if (!data.hasOwnProperty(gid) || data[gid].length === 0) {
        seal.replyToSender(ctx, msg, '当前群无红包');
        return seal.ext.newCmdExecuteResult(true);
    }

    const id = parseInt(cmdArgs.getArgN(1));
    if (!isNaN(id)) {
        const index = data[gid].findIndex(item => item.id === id);
        if (index === -1) {
            seal.replyToSender(ctx, msg, '该序号红包不存在');
            return seal.ext.newCmdExecuteResult(true);
        }

        const un = data[gid][index].un;
        const money = data[gid][index].money;
        const n = data[gid][index].n;
        const muid = data[gid][index].muid;
        const mun = data[gid][index].mun;
        const history = data[gid][index].history;

        let s = '';
        if (muid === '') {
            s += `来自<${un}>的红包`;
        } else {
            s += `来自<${un}>发给<${mun}>的专属红包`;
        }

        s += `\n总金额:${money}\n数量:${n}\n历史记录:`

        if (history.length === 0) {
            s += '\n暂无';
        } else {
            for (let i = 0; i < history.length; i++) {
                s += `\n<${history[i].un}>:${history[i].money}`;
            }
        }

        seal.replyToSender(ctx, msg, s);
        return seal.ext.newCmdExecuteResult(true);
    }

    const s = data[gid].map(item => {
        if (item.muid === '') {
            return `${item.id}.来自<${item.un}>的红包`;
        } else {
            return `${item.id}.来自<${item.un}>发给<${item.mun}>的专属红包`;
        }
    }).join('\n');

    seal.replyToSender(ctx, msg, s);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['查看红包'] = cmdShow;

seal.ext.registerTask(ext, "cron", "0 */4 * * *", () => {
    console.log('清除过期红包任务开始');
    const timestamp = Math.floor(Date.now() / 1000);
    for (const gid of Object.keys(data)) {
        for (let i = 0; i < data[gid].length; i++) {
            if (timestamp - data[gid][i].timestamp > 24 * 60 * 60) {
                const epId = data[gid][i].epId;
                const uid = data[gid][i].uid;
                const msg = getMsg(gid, uid);
                const ctx = getCtx(epId, msg);

                const money = data[gid][i].money;
                const n = data[gid][i].n;
                const history = data[gid][i].history;
                const [val, _] = seal.vars.intGet(ctx, varname);

                let rest = money;
                let s = `<${data[gid][i].un}>的红包已退回\n总金额:${money}\n数量:${n}\n历史记录:`
                for (let i = 0; i < history.length; i++) {
                    s += `\n<${history[i].un}>:${history[i].money}`;
                    rest -= history[i].money;

                }
                s += `\n退回${rest}`;

                seal.vars.intSet(ctx, varname, val + rest);
                seal.replyToSender(ctx, msg, s);
                data[gid].splice(i, 1);
                i--;
            }
        }
    }
    ext.storageSet('data', JSON.stringify(data));
});