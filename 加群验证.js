// ==UserScript==
// @name         加群验证
// @author       错误
// @version      1.0.0
// @description  
// @timestamp    1760422268
// 2025-10-14 14:11:08
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// @depends 错误&白鱼:ob11网络连接依赖:>=1.0.0
// ==/UserScript==

let ext = seal.ext.find('加群验证');
if (!ext) {
    ext = seal.ext.new('加群验证', '错误', '1.0.0');
    seal.ext.register(ext);
}

const net = globalThis.net;

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
    constructor() {
        this.gid = '';
        this.reqMod = 0; // 0: 关闭，1: 按预设答案，2: 按预设答案，错误后由我确认，3: 由我确认
        this.vrfMod = 0; // 0: 关闭，1: 自动生成验证码，忽略邀请加入，2: 按预设验证码验证，忽略邀请加入，3: 自动生成验证码，4: 按预设验证码验证
        this.ansArr = [];
        this.vrfInfoArr = []; // 验证码信息数组，每个元素为 { q: 问题, a: 答案[] }
        this.flagMap = {}; // 加群请求标志位，key为user_id，value为string
    }

    static getSetting(gid) {

    }

    saveSetting() {

    }
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'agv'; // 指令名字，可用中文
cmd.help = `帮助:
【.agv status】查看当前状态

【.agv req [mod]】设置加群处理模式
0: 关闭，1: 按预设答案，2: 按预设答案，错误后由我确认，3: 由我确认

【.agv vrf [mod]】设置加群验证模式
0: 关闭，1: 自动生成验证码，忽略邀请加入，2: 按预设验证码验证，忽略邀请加入，3: 自动生成验证码，4: 按预设验证码验证

【.agv ans [答案1] [答案2] ...】设置加群申请预设答案
【.agv vi show】查看加群验证的验证码问题和答案
【.agv vi add [问题] [验证码1] [验证码2] ...】添加验证码问题和答案
【.agv vi del [问题] [问题2] ...】删除验证码问题和答案
`;
cmd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {

            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
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
                        break;
                    }
                    case 2: {
                        break;
                    }
                    case 3: {
                        break;
                    }
                    case 4: {
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
                        if (setting.flagMap.hasOwnProperty(user_id)) {
                            console.log(`用户 ${user_id} 重复申请加入群 ${group_id}`);
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
                        if (setting.flagMap.hasOwnProperty(user_id)) {
                            console.log(`用户 ${user_id} 重复申请加入群 ${group_id}`);
                            break;
                        }
                        if (!setting.ansArr.includes(comment)) {
                            console.log(`未拒绝用户 ${user_id} 申请加入群 ${group_id}，答案错误`);
                            setting.flagMap[user_id] = flag;
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
                        if (setting.flagMap.hasOwnProperty(user_id)) {
                            console.log(`用户 ${user_id} 重复申请加入群 ${group_id}`);
                            break;
                        }
                        console.log(`用户 ${user_id} 申请加入群 ${group_id}`);
                        setting.flagMap[user_id] = flag;
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

}