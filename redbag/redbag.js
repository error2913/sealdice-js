// ==UserScript==
// @name         豹语变量红包
// @author       错误
// @version      1.2.0
// @description  在插件设置填入红包使用货币的豹语变量
// @timestamp    1735226264
// 2024-12-26 23:17:44
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/redbag/redbag.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/redbag/redbag.js
// ==/UserScript==

let ext = seal.ext.find('redbag');
if (!ext) {
    ext = seal.ext.new('redbag', '错误', '1.2.0');
    seal.ext.register(ext);
}

seal.ext.registerStringConfig(ext, '豹语变量名', '$m金币', '修改后保存并重载js');
seal.ext.registerStringConfig(ext, 'URL地址', 'http://localhost:3000', '修改后保存并重载js');
const varname = seal.ext.getStringConfig(ext, '豹语变量名');
const url = seal.ext.getStringConfig(ext, 'URL地址');

const redbagData = JSON.parse(ext.storageGet('data') || '{}');

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

function sendRedbag(epId, gid, uid, un, amount, total, muid, mun) {
    if (!redbagData.hasOwnProperty(gid)) {
        redbagData[gid] = [];
    }

    const id = redbagData[gid].length === 0 ? 1 : redbagData[gid][redbagData[gid].length - 1].id + 1;

    let weight = []; // 用于分配红包的随机数组
    let sum = 0;
    for (let i = 0; i < total; i++) {
        const ran = Math.random();
        weight.push(ran);
        sum += ran;
    }

    let remaining = amount - total;
    weight = weight.map((item, index) => {
        if (index === total - 1) {
            return remaining + 1;
        }

        const n = Math.floor(item / sum * (amount - total));
        remaining -= n;

        return n + 1;
    });

    redbagData[gid].push({
        id: id,
        epId: epId,
        uid: uid,
        un: un,
        timestamp: Math.floor(Date.now() / 1000),
        amount: amount,
        total: total,
        weight: weight,
        muid: muid,
        mun: mun,
        history: []
    })

    ext.storageSet('data', JSON.stringify(redbagData));
}

const cmdSend = seal.ext.newCmdItemInfo();
cmdSend.name = '发红包';
cmdSend.help = `帮助:
【.发红包 <金额> <数量>】发送红包，可通过@发送专属红包
【.抢红包 <指定序号(可选)>】抢红包
【.查看红包 <指定序号(可选)>】查看该群红包`;
cmdSend.allowDelegate = true;
cmdSend.disabledInPrivate = true;
cmdSend.solve = (ctx, msg, cmdArgs) => {
    ctx.delegateText = '';
    const amount = parseInt(cmdArgs.getArgN(1));
    if (isNaN(amount) || amount < 1) {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
    }
    if (amount > 50000) {
        seal.replyToSender(ctx, msg, '红包金额不能超过50000');
        return seal.ext.newCmdExecuteResult(true);
    }

    const [val, exists] = seal.vars.intGet(ctx, varname);
    if (!exists || val < amount) {
        seal.replyToSender(ctx, msg, '货币不足，红包发送失败');
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
        const text = cmdArgs.getArgN(2);
        if (text.length > 9) {
            seal.replyToSender(ctx, msg, '文字长度不能超过9');
            return seal.ext.newCmdExecuteResult(true);
        }

        fetch(`${url}/send_exclusive_redbag`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user_id: uid.replace(/\D+/g, ''),
                    user_name: un,
                    target_user_id: muid.replace(/\D+/g, ''),
                    target_user_name: mun,
                    amount: amount,
                    text: text ? text : '恭喜发财，大吉大利'
                })
            }
        ).then(response => {
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
                    const imageUrl = data.image_url;
                    if (!imageUrl) {
                        seal.replyToSender(ctx, msg, "响应体中缺少 image_url");
                        return;
                    }

                    seal.replyToSender(ctx, msg, `[CQ:image,file=${imageUrl}]`);

                    sendRedbag(epId, gid, uid, un, amount, 1, muid, mun);
                    seal.vars.intSet(ctx, varname, val - amount);
                    return;
                } catch (e) {
                    seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                    return;
                }
            })
        });
    } else {
        const total = parseInt(cmdArgs.getArgN(2));
        if (isNaN(total) || total < 1) {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        if (total > 12) {
            seal.replyToSender(ctx, msg, '红包数量不能超过12');
            return seal.ext.newCmdExecuteResult(true);
        }

        const text = cmdArgs.getArgN(3);
        if (text.length > 9) {
            seal.replyToSender(ctx, msg, '文字长度不能超过9');
            return seal.ext.newCmdExecuteResult(true);
        }

        if (amount < total) {
            seal.replyToSender(ctx, msg, '你不能发送货币数小于红包数的红包');
            return seal.ext.newCmdExecuteResult(true);
        }

        fetch(`${url}/send_redbag`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user_id: uid.replace(/\D+/g, ''),
                    user_name: un,
                    amount: amount,
                    total: total,
                    text: text ? text : '恭喜发财，大吉大利'
                })
            }
        ).then(response => {
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
                    const imageUrl = data.image_url;
                    if (!imageUrl) {
                        seal.replyToSender(ctx, msg, "响应体中缺少 image_url");
                        return;
                    }

                    seal.replyToSender(ctx, msg, `[CQ:image,file=${imageUrl}]`);

                    sendRedbag(epId, gid, uid, un, amount, total, '', '');
                    seal.vars.intSet(ctx, varname, val - amount);
                    return;
                } catch (e) {
                    seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                    return;
                }
            })
        });
    }
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['发红包'] = cmdSend;

const cmdGrab = seal.ext.newCmdItemInfo();
cmdGrab.name = '抢红包';
cmdGrab.help = `帮助:
【.发红包 <金额> <数量>】发送红包，可通过@发送专属红包
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
            if (!redbagData.hasOwnProperty(gid) || redbagData[gid].length === 0) {
                seal.replyToSender(ctx, msg, '当前群无红包');
                return seal.ext.newCmdExecuteResult(true);
            }

            const uid = ctx.player.userId;
            const un = ctx.player.name;

            const id = parseInt(arg);
            let index = -1;
            if (!isNaN(id)) {
                index = redbagData[gid].findIndex(item => item.id === id);
                if (index === -1) {
                    seal.replyToSender(ctx, msg, '该序号红包不存在');
                    return seal.ext.newCmdExecuteResult(true);
                }

                const muid = redbagData[gid][index].muid;
                const history = redbagData[gid][index].history;
                if ((muid !== '' && muid !== uid) || history.some(item => item.uid === uid)) {
                    seal.replyToSender(ctx, msg, '无法领取该红包');
                    return seal.ext.newCmdExecuteResult(true);
                }
            } else {
                for (let i = redbagData[gid].length - 1; i > -1; i--) {
                    const muid = redbagData[gid][i].muid;
                    const history = redbagData[gid][i].history;
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

            const amount = redbagData[gid][index].amount;
            const total = redbagData[gid][index].total;
            const history = redbagData[gid][index].history;
            const increase = redbagData[gid][index].weight[history.length];
            const [val, _] = seal.vars.intGet(ctx, varname);

            seal.vars.intSet(ctx, varname, val + increase);
            history.push({
                uid: uid,
                un: un,
                amount: increase
            })

            let remaining = amount;
            for (let i = 0; i < history.length; i++) {
                remaining -= history[i].amount;
            }

            fetch(`${url}/open_redbag`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: uid.replace(/\D+/g, ''),
                        user_name: un,
                        sender_user_name: redbagData[gid][index].un,
                        amount: increase,
                        total: total,
                        remaining: remaining,
                        history: history
                    })
                }
            ).then(response => {
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
                        const imageUrl = data.image_url;
                        if (!imageUrl) {
                            seal.replyToSender(ctx, msg, "响应体中缺少 image_url");
                            return;
                        }

                        seal.replyToSender(ctx, msg, `[CQ:image,file=${imageUrl}]`);

                        if (history.length === total) {
                            redbagData[gid].splice(index, 1);
                        }

                        ext.storageSet('data', JSON.stringify(redbagData));
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
ext.cmdMap['抢红包'] = cmdGrab;
ext.cmdMap['开红包'] = cmdGrab;

const cmdShow = seal.ext.newCmdItemInfo();
cmdShow.name = '查看红包';
cmdShow.help = '这有什么好写帮助的';
cmdShow.disabledInPrivate = true;
cmdShow.solve = (ctx, msg, cmdArgs) => {
    const gid = ctx.group.groupId;
    if (!redbagData.hasOwnProperty(gid) || redbagData[gid].length === 0) {
        seal.replyToSender(ctx, msg, '当前群无红包');
        return seal.ext.newCmdExecuteResult(true);
    }

    const id = parseInt(cmdArgs.getArgN(1));
    if (!isNaN(id)) {
        const index = redbagData[gid].findIndex(item => item.id === id);
        if (index === -1) {
            seal.replyToSender(ctx, msg, '该序号红包不存在');
            return seal.ext.newCmdExecuteResult(true);
        }

        const un = redbagData[gid][index].un;
        const amount = redbagData[gid][index].amount;
        const total = redbagData[gid][index].total;
        const muid = redbagData[gid][index].muid;
        const mun = redbagData[gid][index].mun;
        const history = redbagData[gid][index].history;

        let s = '';
        if (muid === '') {
            s += `来自<${un}>的红包`;
        } else {
            s += `来自<${un}>发给<${mun}>的专属红包`;
        }

        s += `\n总金额:${amount}`;

        if (history.length > 0) {
            let remaining = amount;
            for (let i = 0; i < history.length; i++) {
                remaining -= history[i].amount;
            }

            fetch(`${url}/history`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        total: total,
                        remaining: remaining,
                        history: history
                    })
                }
            ).then(response => {
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
                        const imageUrl = data.image_url;
                        if (!imageUrl) {
                            seal.replyToSender(ctx, msg, "响应体中缺少 image_url");
                            return;
                        }

                        s += `[CQ:image,file=${imageUrl}]`;

                        seal.replyToSender(ctx, msg, s);
                        return;
                    } catch (e) {
                        seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                })
            });
        } else {
            s += `\n数量:${total}`;
            seal.replyToSender(ctx, msg, s);
        }
        return seal.ext.newCmdExecuteResult(true);
    }

    const s = redbagData[gid].map(item => {
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

let isTaskRunning = false;
seal.ext.registerTask(ext, "cron", "0 */2 * * *", async () => {
    if (isTaskRunning) {
        console.log('清除过期红包任务正在运行，跳过');
        return;
    }

    isTaskRunning = true;
    console.log('清除过期红包任务开始');

    const timestamp = Math.floor(Date.now() / 1000);
    for (const gid of Object.keys(redbagData)) {
        for (let i = 0; i < redbagData[gid].length && i >= 0; i++) {
            if (timestamp - redbagData[gid][i].timestamp > 24 * 60 * 60) {
                const epId = redbagData[gid][i].epId;
                const uid = redbagData[gid][i].uid;
                const msg = getMsg(gid, uid);
                const ctx = getCtx(epId, msg);

                const amount = redbagData[gid][i].amount;
                const total = redbagData[gid][i].total;
                const history = redbagData[gid][i].history;
                const [val, _] = seal.vars.intGet(ctx, varname);

                let s = `<${redbagData[gid][i].un}>的红包已退回`;

                if (history.length > 0) {
                    let remaining = amount;
                    for (let i = 0; i < history.length; i++) {
                        remaining -= history[i].amount;
                    }

                    const response = await fetch(`${url}/history`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                total: total,
                                remaining: remaining,
                                history: history
                            })
                        }
                    );

                    const text = await response.text();

                    if (!response.ok) {
                        console.error(`请求失败! 状态码: ${response.status}\n响应体: ${text}`);
                        return;
                    }
                    if (!text) {
                        console.error("响应体为空");
                        return;
                    }

                    try {
                        const data = JSON.parse(text);
                        const imageUrl = data.image_url;
                        if (!imageUrl) {
                            console.error("响应体中缺少 image_url");
                            return;
                        }

                        s += `[CQ:image,file=${imageUrl}]`;

                        seal.vars.intSet(ctx, varname, val + remaining);
                    } catch (e) {
                        console.error(`解析响应体时出错:${e}\n响应体:${text}`);
                        return;
                    }
                } else {
                    seal.vars.intSet(ctx, varname, val + amount);
                    s += `\n总金额:${amount}`;
                }

                seal.replyToSender(ctx, msg, s);
                redbagData[gid].splice(i, 1);
                i--;

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (redbagData[gid].length === 0) {
            delete redbagData[gid];
        }
    }
    ext.storageSet('data', JSON.stringify(redbagData));

    isTaskRunning = false;
    console.log('清除过期红包任务结束');
});

ext.onNotCommandReceived = (ctx, msg) => {
    if (ctx.isPrivate) {
        return;
    }

    if (msg.message === '开') {
        const gid = ctx.group.groupId;
        if (!redbagData.hasOwnProperty(gid) || redbagData[gid].length === 0) {
            seal.replyToSender(ctx, msg, '当前群无红包');
            return seal.ext.newCmdExecuteResult(true);
        }

        const uid = ctx.player.userId;
        const un = ctx.player.name;

        let index = -1;
        for (let i = redbagData[gid].length - 1; i > -1; i--) {
            const muid = redbagData[gid][i].muid;
            const history = redbagData[gid][i].history;
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

        const amount = redbagData[gid][index].amount;
        const total = redbagData[gid][index].total;
        const history = redbagData[gid][index].history;
        const increase = redbagData[gid][index].weight[history.length];
        const [val, _] = seal.vars.intGet(ctx, varname);

        seal.vars.intSet(ctx, varname, val + increase);
        history.push({
            uid: uid,
            un: un,
            amount: increase
        })

        let remaining = amount;
        for (let i = 0; i < history.length; i++) {
            remaining -= history[i].amount;
        }

        fetch(`${url}/open_redbag`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user_id: uid.replace(/\D+/g, ''),
                    user_name: un,
                    sender_user_name: redbagData[gid][index].un,
                    amount: increase,
                    total: total,
                    remaining: remaining,
                    history: history
                })
            }
        ).then(response => {
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
                    const imageUrl = data.image_url;
                    if (!imageUrl) {
                        seal.replyToSender(ctx, msg, "响应体中缺少 image_url");
                        return;
                    }

                    seal.replyToSender(ctx, msg, `[CQ:image,file=${imageUrl}]`);

                    if (history.length === total) {
                        redbagData[gid].splice(index, 1);
                    }

                    ext.storageSet('data', JSON.stringify(redbagData));
                    return;
                } catch (e) {
                    seal.replyToSender(ctx, msg, `解析响应体时出错:${e}\n响应体:${text}`);
                    return;
                }
            })
        });
    }
}