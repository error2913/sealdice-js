// ==UserScript==
// @name         加群验证
// @author       错误
// @version      1.0.0
// @description  123
// @timestamp    1760422268
// 2025-10-14 14:11:08
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// @depends 错误&白鱼:ob11网络连接依赖:>=2.0.0
// ==/UserScript==

let ext = seal.ext.find('加群验证');
if (!ext) {
    ext = seal.ext.new('加群验证', '错误', '1.0.0');
    seal.ext.register(ext);
}

const net = globalThis.net;

function generateCode() {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
}

async function getQQLevel(epId, user_id) {
    try {
        const data = await net.callApi(epId, 'get_stranger_info', {
            user_id,
            no_cache: true
        })
        return data.qqLevel;
    } catch (error) {
        console.error(`获取用户 ${user_id} QQ等级失败：${error}`);
        return 0;
    }
}

function createMsg(messageType, senderId, groupId = '') {
    let msg = seal.newMessage();

    if (messageType === 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

function createCtx(epId, msg) {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            const ctx = seal.createTempCtx(eps[i], msg);

            ctx.isPrivate = msg.messageType === 'private';

            if (ctx.player.userId === epId) {
                ctx.player.name = seal.formatTmpl(ctx, "核心:骰子名字");
            }

            return ctx;
        }
    }

    return undefined;
}

function replyToGroup(epId, gid, s) {
    const msg = createMsg('group', '', gid);
    const ctx = createCtx(epId, msg);
    seal.replyToSender(ctx, msg, s);
}

class Setting {
    static cache = {};

    constructor(gid) {
        this.gid = gid;
        this.reqMod = 0; // 0: 关闭，1: 按预设答案，2: 按预设答案，错误后由我确认，3: 由我确认
        this.vrfMod = 0; // 0: 关闭，1: 自动生成验证码，忽略邀请加入，2: 按预设验证码验证，忽略邀请加入，3: 自动生成验证码，4: 按预设验证码验证
        this.ansArr = [];
        this.vrfQQLevel = 10; // 需要验证的QQ等级
        this.vrfInterval = 300; // 验证码过期时间，单位秒
        this.vrfInfoArr = []; // 验证码信息数组，每个元素为 { q: 问题, a: 答案[] }
        this.reqMap = {}; // 加群请求，key为user_id，value为{ flag: 加群请求标志位, sub_type: 加群请求子类型 }
        this.vrfMap = {}; // 加群验证定时器，key为user_id，value为{ timer: 定时器ID, code: 验证码[] }，重载后不恢复数据
    }

    static getSetting(gid) {
        if (!Setting.cache.hasOwnProperty(gid)) {
            const setting = new Setting(gid);
            try {
                const data = JSON.parse(ext.storageGet(`setting_${gid}`) || '{}');
                setting.reqMod = data.reqMod || 0;
                setting.vrfMod = data.vrfMod || 0;
                setting.ansArr = data.ansArr || [];
                setting.vrfQQLevel = data.vrfQQLevel || 10;
                setting.vrfInterval = data.vrfInterval || 300;
                setting.vrfInfoArr = data.vrfInfoArr || [];
                setting.reqMap = data.reqMap || {};
            } catch (error) {
                console.error(`从数据库中获取${`setting_${gid}`}失败:`, error);
            }
            Setting.cache[gid] = setting;
        }

        return Setting.cache[gid];
    }

    saveSetting() {
        ext.storageSet(`setting_${this.gid}`, JSON.stringify(this));
    }
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'agv';
cmd.help = `帮助:
【.agv status】查看当前状态
【.agv ap [user_id]】批准加群请求
【.agv cc [user_id]】取消加群验证

【.agv req [mod]】设置加群处理模式
0: 关闭，1: 按预设答案，2: 按预设答案，错误后由我确认，3: 由我确认

【.agv vrf [mod]】设置加群验证模式
0: 关闭，1: 自动生成验证码，忽略邀请加入，2: 按预设验证码验证，忽略邀请加入，3: 自动生成验证码，4: 按预设验证码验证

【.agv ans [答案1] [答案2] ...】设置加群申请预设答案
【.agv lv [等级]】设置需要验证的QQ等级，默认10
【.agv t [秒数]】设置加群验证的验证码过期时间，单位秒
【.agv vi show】查看加群验证的验证码问题和答案
【.agv vi add [问题] [验证码1] [验证码2] ...】添加验证码问题和答案
【.agv vi del [问题] [问题2] ...】删除验证码问题和答案
`;
cmd.solve = (ctx, msg, cmdArgs) => {
    const ret = seal.ext.newCmdExecuteResult(true);
    const epId = ctx.endPoint.userId;
    const setting = Setting.getSetting(ctx.group.groupId);
    const val = cmdArgs.getArgN(1);
    switch (val) {
        case 'status': {
            seal.replyToSender(ctx, msg, `加群处理模式: ${setting.reqMod}
预设加群申请答案: ${setting.ansArr.join('、')}

加群验证模式: ${setting.vrfMod}
需要验证的QQ等级: ${setting.vrfQQLevel}
加群验证过期时间: ${setting.vrfInterval} 秒
`);
            return ret;
        }
        case 'ap': {
            const val2 = cmdArgs.getArgN(2);
            const user_id = parseInt(val2);
            if (isNaN(user_id)) {
                seal.replyToSender(ctx, msg, '批准加群请求参数错误，必须为用户ID');
                return ret;
            }
            if (!setting.reqMap[user_id]) {
                seal.replyToSender(ctx, msg, `用户 ${user_id} 没有加群请求`);
                return ret;
            }
            const { flag, sub_type } = setting.reqMap[user_id];
            net.callApi(epId, 'set_group_add_request', {
                flag,
                sub_type,
                approve: true,
                reason: ''
            }).catch((err) => {
                console.error(`同意用户 ${user_id} 申请加入群 ${setting.gid} 失败:`, err);
            });
            delete setting.reqMap[user_id];
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `用户 ${user_id} 的加群请求已批准`);
            return ret;
        }
        case 'cc': {
            const val2 = cmdArgs.getArgN(2); console.log(JSON.stringify(setting.vrfMap));
            const user_id = parseInt(val2);
            if (isNaN(user_id)) {
                seal.replyToSender(ctx, msg, '取消加群验证参数错误，必须为用户ID');
                return ret;
            }
            if (!setting.vrfMap[user_id]) {
                seal.replyToSender(ctx, msg, `用户 ${user_id} 没有加群验证`);
                return ret;
            }
            clearTimeout(setting.vrfMap[user_id].timer);
            delete setting.vrfMap[user_id];
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `用户 ${user_id} 的加群验证已取消`);
            return ret;
        }
        case 'req': {
            const val2 = cmdArgs.getArgN(2);
            const mod = parseInt(val2);
            if (isNaN(mod) || mod < 0 || mod > 3) {
                seal.replyToSender(ctx, msg, '加群处理模式参数错误，必须为0、1、2、3');
                return ret;
            }
            setting.reqMod = mod;
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `加群处理模式已设置为 ${setting.reqMod}`);
            return ret;
        }
        case 'vrf': {
            const val2 = cmdArgs.getArgN(2);
            const mod = parseInt(val2);
            if (isNaN(mod) || mod < 0 || mod > 4) {
                seal.replyToSender(ctx, msg, '加群验证模式参数错误，必须为0、1、2、3、4');
                return ret;
            }
            setting.vrfMod = mod;
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `加群验证模式已设置为 ${setting.vrfMod}`);
            return ret;
        }
        case 'ans': {
            const ansArr = cmdArgs.args.slice(1);
            if (ansArr.length === 0) {
                seal.replyToSender(ctx, msg, '加群预设答案参数错误，必须至少有一个答案');
                return ret;
            }
            setting.ansArr = ansArr;
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `加群预设答案已设置为 ${ansArr.join('、')}`);
            return ret;
        }
        case 'lv': {
            const val2 = cmdArgs.getArgN(2);
            const lv = parseInt(val2);
            if (isNaN(lv) || lv < 0) {
                seal.replyToSender(ctx, msg, '需要验证的QQ等级参数错误，必须为非负整数');
                return ret;
            }
            setting.vrfQQLevel = lv;
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `需要验证的QQ等级已设置为 ${setting.vrfQQLevel}`);
            return ret;
        }
        case 't': {
            const val2 = cmdArgs.getArgN(2);
            const t = parseInt(val2);
            if (isNaN(t) || t <= 0) {
                seal.replyToSender(ctx, msg, '加群验证过期时间参数错误，必须为正整数');
                return ret;
            }
            setting.vrfInterval = t;
            setting.saveSetting();
            seal.replyToSender(ctx, msg, `加群验证过期时间已设置为 ${setting.vrfInterval} 秒`);
            return ret;
        }
        case 'vi': {
            const val2 = cmdArgs.getArgN(2);
            switch (val2) {
                case 'show': {
                    seal.replyToSender(ctx, msg, `加群验证的验证码问题和答案:
${setting.vrfInfoArr.map(vi => `${vi.q}：\n${vi.a.join('、')}`).join('\n\n')}`);
                    return ret;
                }
                case 'add': {
                    const q = cmdArgs.getArgN(3);
                    const a = cmdArgs.args.slice(3);
                    if (a.length === 0) {
                        seal.replyToSender(ctx, msg, '加群验证验证码问题和答案参数错误，必须至少有一个答案');
                        return ret;
                    }
                    setting.vrfInfoArr.push({ q, a });
                    setting.saveSetting();
                    seal.replyToSender(ctx, msg, `加群验证验证码问题和答案已设置为 ${q}：\n${a.join('、')}`);
                    return ret;
                }
                case 'del': {
                    const qs = cmdArgs.args.slice(2);
                    if (qs.length === 0) {
                        seal.replyToSender(ctx, msg, '加群验证验证码问题参数错误，必须至少有一个问题');
                        return ret;
                    }
                    setting.vrfInfoArr = setting.vrfInfoArr.filter(vi => !qs.includes(vi.q));
                    setting.saveSetting();
                    seal.replyToSender(ctx, msg, `加群验证验证码问题和答案已删除: ${qs.join('、')}`);
                    return ret;
                }
                default: {
                    ret.showHelp = true;
                    return ret;
                }
            }
        }
        default: {
            ret.showHelp = true;
            return ret;
        }
    }
};

ext.cmdMap['agv'] = cmd;

net.getWs(ext)
    .then((ws) => {
        ws.onNoticeEvent = (epId, event) => {
            console.log('onNoticeEvent', epId, JSON.stringify(event));

            if (event.notice_type === 'group_increase') {
                const { sub_type, group_id, operator_id, user_id } = event;
                console.log(`群成员增加，加群方式: ${sub_type}，群ID: ${group_id}，操作人ID: ${operator_id}，用户ID: ${user_id}`);
                const setting = Setting.getSetting(`QQ-Group:${group_id}`);
                switch (setting.vrfMod) {
                    case 1: {
                        if (setting.vrfMap[user_id]) {
                            break;
                        }
                        if (sub_type === 'invite') {
                            break;
                        }

                        getQQLevel(epId, user_id).then((qqLevel) => {
                            if (qqLevel < setting.vrfQQLevel) {
                                const timer = setTimeout(() => {
                                    console.log(`用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒`);
                                    net.callApi(epId, 'set_group_kick', {
                                        group_id,
                                        user_id,
                                        reject_add_request: false
                                    }).then(() => {
                                        replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒，已被踢出`);
                                    }).catch((err) => {
                                        console.error(`踢出用户 ${user_id} 加群 ${group_id} 失败: ${err}`);
                                    });
                                    delete setting.vrfMap[user_id];
                                }, setting.vrfInterval * 1000);

                                const code = generateCode();
                                setting.vrfMap[user_id] = { timer, code: [code] };
                                replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id}
QQ等级: ${qqLevel}
请在 ${setting.vrfInterval} 秒内输入验证码：${code}`);
                            }
                        });

                        break;
                    }
                    case 2: {
                        if (setting.vrfMap[user_id]) {
                            break;
                        }
                        if (sub_type === 'invite') {
                            break;
                        }

                        getQQLevel(epId, user_id).then((qqLevel) => {
                            if (qqLevel < setting.vrfQQLevel) {
                                const timer = setTimeout(() => {
                                    console.log(`用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒`);
                                    net.callApi(epId, 'set_group_kick', {
                                        group_id,
                                        user_id,
                                        reject_add_request: false
                                    }).then(() => {
                                        replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒，已被踢出`);
                                    }).catch((err) => {
                                        console.error(`踢出用户 ${user_id} 加群 ${group_id} 失败: ${err}`);
                                    });
                                    delete setting.vrfMap[user_id];
                                }, setting.vrfInterval * 1000);

                                const qIndex = Math.floor(Math.random() * setting.vrfInfoArr.length);
                                const q = setting.vrfInfoArr[qIndex].q;
                                const a = setting.vrfInfoArr[qIndex].a;
                                setting.vrfMap[user_id] = { timer, code: a };
                                replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id}
QQ等级: ${qqLevel}
请在 ${setting.vrfInterval} 秒内回答问题：
${q}`);
                            }
                        });

                        break;
                    }
                    case 3: {
                        if (setting.vrfMap[user_id]) {
                            break;
                        }

                        getQQLevel(epId, user_id).then((qqLevel) => {
                            if (qqLevel < setting.vrfQQLevel) {
                                const timer = setTimeout(() => {
                                    console.log(`用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒`);
                                    net.callApi(epId, 'set_group_kick', {
                                        group_id,
                                        user_id,
                                        reject_add_request: false
                                    }).then(() => {
                                        replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒，已被踢出`);
                                    }).catch((err) => {
                                        console.error(`踢出用户 ${user_id} 加群 ${group_id} 失败: ${err}`);
                                    });
                                    delete setting.vrfMap[user_id];
                                }, setting.vrfInterval * 1000);

                                const code = generateCode();
                                setting.vrfMap[user_id] = { timer, code: [code] };
                                replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id}
QQ等级: ${qqLevel}
请在 ${setting.vrfInterval} 秒内输入验证码：${code}`);
                            }
                        });

                        break;
                    }
                    case 4: {
                        if (setting.vrfMap[user_id]) {
                            break;
                        }

                        getQQLevel(epId, user_id).then((qqLevel) => {
                            if (qqLevel < setting.vrfQQLevel) {
                                const timer = setTimeout(() => {
                                    console.log(`用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒`);
                                    net.callApi(epId, 'set_group_kick', {
                                        group_id,
                                        user_id,
                                        reject_add_request: false
                                    }).then(() => {
                                        replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id} 未验证加群 ${group_id}，超时 ${setting.vrfInterval} 秒，已被踢出`);
                                    }).catch((err) => {
                                        console.error(`踢出用户 ${user_id} 加群 ${group_id} 失败: ${err}`);
                                    });
                                    delete setting.vrfMap[user_id];
                                }, setting.vrfInterval * 1000);

                                const qIndex = Math.floor(Math.random() * setting.vrfInfoArr.length);
                                const q = setting.vrfInfoArr[qIndex].q;
                                const a = setting.vrfInfoArr[qIndex].a;
                                setting.vrfMap[user_id] = { timer, code: a };
                                replyToGroup(epId, `QQ-Group:${group_id}`, `用户 ${user_id}
QQ等级: ${qqLevel}
请在 ${setting.vrfInterval} 秒内回答问题：
${q}`);
                            }
                        });

                        break;
                    }
                }
            }
        };

        ws.onRequestEvent = (epId, event) => {
            console.log('onRequestEvent', epId, JSON.stringify(event));

            if (event.request_type === 'group' && event.sub_type === 'add') {
                const { sub_type, group_id, user_id, comment, flag } = event;
                console.log(`加群申请，群ID: ${group_id}，用户ID: ${user_id}，申请信息: ${comment}，标志位: ${flag}`);
                const setting = Setting.getSetting(`QQ-Group:${group_id}`);
                switch (setting.reqMod) {
                    case 1: {
                        if (setting.reqMap.hasOwnProperty(user_id)) {
                            console.log(`用户 ${user_id} 重复申请加入群 ${group_id}`);
                            delete setting.reqMap[user_id];
                            break;
                        }
                        if (!setting.ansArr.includes(comment)) {
                            console.log(`拒绝用户 ${user_id} 申请加入群 ${group_id}，答案错误`);
                            net.callApi(epId, 'set_group_add_request', {
                                flag,
                                sub_type,
                                approve: false,
                                reason: '答案错误'
                            }).then(() => {
                                replyToGroup(epId, setting.gid, `加群申请:
QQ: ${user_id}
申请信息: ${comment}
答案错误，已拒绝`);
                            }).catch((err) => {
                                console.error(`拒绝用户 ${user_id} 申请加入群 ${group_id} 失败:`, err);
                            });
                            break;
                        }
                        console.log(`用户 ${user_id} 申请加入群 ${group_id}，答案正确`);
                        net.callApi(epId, 'set_group_add_request', {
                            flag,
                            sub_type,
                            approve: true,
                            reason: ''
                        }).then(() => {
                            replyToGroup(epId, setting.gid, `加群申请:
QQ: ${user_id}
申请信息: ${comment}
答案正确，已同意`);
                        }).catch((err) => {
                            console.error(`同意用户 ${user_id} 申请加入群 ${group_id} 失败:`, err);
                        });
                        break;
                    }
                    case 2: {
                        if (setting.reqMap.hasOwnProperty(user_id)) {
                            console.log(`用户 ${user_id} 重复申请加入群 ${group_id}`);
                            delete setting.reqMap[user_id];
                            break;
                        }
                        if (!setting.ansArr.includes(comment)) {
                            console.log(`未拒绝用户 ${user_id} 申请加入群 ${group_id}，答案错误`);
                            setting.reqMap[user_id] = { flag, sub_type };
                            setting.saveSetting();
                            replyToGroup(epId, setting.gid, `加群申请:
QQ: ${user_id}
申请信息: ${comment}
答案错误，未拒绝`);
                            break;
                        }
                        console.log(`用户 ${user_id} 申请加入群 ${group_id}，答案正确`);
                        net.callApi(epId, 'set_group_add_request', {
                            flag,
                            sub_type,
                            approve: true,
                            reason: ''
                        }).then(() => {
                            replyToGroup(epId, setting.gid, `加群申请:
QQ: ${user_id}
申请信息: ${comment}
答案正确，已同意`);
                        }).catch((err) => {
                            console.error(`同意用户 ${user_id} 申请加入群 ${group_id} 失败:`, err);
                        });
                        break;
                    }
                    case 3: {
                        if (setting.reqMap.hasOwnProperty(user_id)) {
                            console.log(`用户 ${user_id} 重复申请加入群 ${group_id}`);
                            delete setting.reqMap[user_id];
                            break;
                        }
                        console.log(`用户 ${user_id} 申请加入群 ${group_id}`);
                        setting.reqMap[user_id] = { flag, sub_type };
                        setting.saveSetting();
                        replyToGroup(epId, setting.gid, `加群申请:
QQ: ${user_id}
申请信息: ${comment}`);
                        break;
                    }
                }
            }
        };
    })
    .catch((err) => {
        console.error('getWs error:', err);
    });

ext.onNotCommandReceived = (ctx, msg) => {
    if (ctx.isPrivate) {
        return;
    }
    const setting = Setting.getSetting(ctx.group.groupId);
    if (setting.vrfMod === 0) {
        return;
    }
    const user_id = ctx.player.userId.replace(/\D/g, '');
    if (!setting.vrfMap.hasOwnProperty(user_id)) {
        return;
    }
    const { timer, code } = setting.vrfMap[user_id];
    if (!code.includes(msg.message)) {
        return;
    }
    clearTimeout(timer);
    delete setting.vrfMap[user_id];
    seal.replyToSender(ctx, msg, `加群验证:
QQ: ${user_id}
验证成功，欢迎加入！`);
}