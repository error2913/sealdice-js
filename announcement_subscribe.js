// ==UserScript==
// @name         公告订阅版
// @author       错误
// @version      1.0.1
// @description  使用指令 .订阅公告 查看帮助
// @timestamp    1776872823
// 2026-04-22 23:47:03
// @license      MIT
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/announcement_subscribe.js
// ==/UserScript==

let ext = seal.ext.find('公告订阅版');
if (!ext) {
    ext = seal.ext.new('公告订阅版', '错误', '1.0.1');
    seal.ext.register(ext);
}

/*
数据格式
data: {
    channels: {
        [channelId]: {
            regex: string,
            users: {
                userId: {
                    groupIds: [],
                    private: boolean
                }
            }
        }
    }
}
*/

const data = JSON.parse(ext.storageGet('data') || '{}');
if (!data.channels) data.channels = {};

function createMsg(messageType, uid, gid = '') {
    let msg = seal.newMessage();
    if (messageType === 'group') {
        msg.groupId = gid;
        msg.guildId = '';
    }
    msg.messageType = messageType;
    msg.sender.userId = uid;
    return msg;
}

function createCtx(epId, msg) {
    const eps = seal.getEndPoints();
    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            const ctx = seal.createTempCtx(eps[i], msg);
            ctx.isPrivate = msg.messageType === 'private';
            if (ctx.player.userId === epId) ctx.player.name = seal.formatTmpl(ctx, "核心:骰子名字");
            return ctx;
        }
    }
    return undefined;
}

function getCtxAndMsg(epId, uid, gid = '') {
    const msg = createMsg(gid ? 'group' : 'private', uid, gid);
    const ctx = createCtx(epId, msg);
    return { ctx, msg };
}

async function post(ctx, msg, epId, channelId, content) {
    const delay = 1000; let count = 0, time = Date.now();
    const reply = `来自频道${channelId}：<${ctx.player.name}>的订阅公告\n------\n${content}`;
    const groups = {};
    const users = data.channels[channelId].users;
    for (const userId in users) {
        const user = users[userId];
        if (user.private) {
            const { ctx: mctx, msg: mmsg } = getCtxAndMsg(epId, userId);
            seal.replyToSender(mctx, mmsg, reply);
            count++;
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            for (const groupId of user.groupIds) {
                if (!groups[groupId]) groups[groupId] = new Set();
                groups[groupId].add(userId);
            }
        }
    }
    for (const groupId in groups) {
        const { ctx: mctx, msg: mmsg } = getCtxAndMsg(epId, '', groupId);
        seal.replyToSender(mctx, mmsg, Array.from(groups[groupId]).map(uid => `[CQ:at,qq=${uid.replace(/^.+:/, '')}]`).join(' ') + '\n' + reply);
        count++;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    seal.replyToSender(ctx, msg, `已发送${count}条公告，耗时${Date.now() - time - delay}ms`);
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = '订阅公告';
cmd.help = `订阅公告使用
.订阅公告 添加 <频道名称> <公告内容正则表达式>
.订阅公告 删除 <频道名称>
.订阅公告 频道列表
.订阅公告 发布 <频道名称> <公告内容>
.订阅公告 订阅 <频道名称>
.订阅公告 取消订阅 <频道名称>
.订阅公告 订阅列表
`;
cmd.solve = (ctx, msg, cmdArgs) => {
    const ret = seal.ext.newCmdExecuteResult(true);
    try {
        const epId = ctx.endPoint.userId;
        const userId = ctx.player.userId;
        const groupId = ctx.group ? ctx.group.groupId : '';
        const a = cmdArgs.getArgN(1);
        switch (a) {
            case '添加':
            case 'add': {
                if (ctx.privilegeLevel < 100) throw new Error(seal.formatTmpl(ctx, "核心:提示_无权限"));
                const channelId = cmdArgs.getArgN(2);
                const regex = cmdArgs.getArgN(3) || '[\\s\\S]*';
                if (channelId === '' || regex === '') throw new Error('参数不能为空');
                if (data.channels[channelId]) throw new Error('订阅公告已存在');
                try {
                    new RegExp(regex);
                } catch (e) {
                    throw new Error(`正则表达式${regex}无效`);
                }
                data.channels[channelId] = {
                    regex,
                    users: {}
                };
                ext.storageSet('data', JSON.stringify(data));
                seal.replyToSender(ctx, msg, `订阅公告${channelId}已添加，正则表达式为${regex}`);
                return ret;
            }
            case '删除':
            case 'del': {
                if (ctx.privilegeLevel < 100) {
                    seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                    return ret;
                }
                const channelId = cmdArgs.getArgN(2);
                if (channelId === '') throw new Error('参数不能为空');
                if (!data.channels[channelId]) throw new Error('订阅公告不存在');
                delete data.channels[channelId];
                ext.storageSet('data', JSON.stringify(data));
                seal.replyToSender(ctx, msg, `订阅公告${channelId}已删除`);
                return ret;
            }
            case '频道列表':
            case 'list': {
                seal.replyToSender(ctx, msg, `当前订阅公告列表\n${Object.keys(data.channels).join('\n')}`);
                return ret;
            }
            case '发布':
            case 'post': {
                const channelId = cmdArgs.getArgN(2);
                const content = cmdArgs.getRestArgsFrom(3);
                if (channelId === '' || content === '') throw new Error('参数不能为空');
                if (!data.channels[channelId]) throw new Error('订阅公告不存在');
                const regex = new RegExp(data.channels[channelId].regex);
                if (!regex.test(content)) throw new Error(`内容${content}不符合正则表达式${data.channels[channelId].regex}`);
                post(ctx, msg, epId, channelId, content);
                seal.replyToSender(ctx, msg, `订阅公告发布中…………`);
                return ret;
            }
            case '订阅':
            case 'subscribe': {
                const channelId = cmdArgs.getArgN(2);
                if (channelId === '') throw new Error('参数不能为空');
                if (!data.channels[channelId]) throw new Error('订阅公告不存在');
                if (!data.channels[channelId].users[userId]) data.channels[channelId].users[userId] = { groupIds: [], private: false };
                if (ctx.isPrivate) {
                    if (data.channels[channelId].users[userId].private) throw new Error('你已订阅了');
                    data.channels[channelId].users[userId].private = true;
                } else {
                    if (data.channels[channelId].users[userId].groupIds.includes(groupId)) throw new Error('你已订阅了');
                    data.channels[channelId].users[userId].groupIds.push(groupId);
                }
                ext.storageSet('data', JSON.stringify(data));
                seal.replyToSender(ctx, msg, `订阅公告${channelId}已订阅`);
                return ret;
            }
            case '取消订阅':
            case 'unsubscribe': {
                const channelId = cmdArgs.getArgN(2);
                if (channelId === '') throw new Error('参数不能为空');
                if (!data.channels[channelId]) throw new Error('订阅公告不存在');
                if (!data.channels[channelId].users[userId]) throw new Error('你未订阅');
                if (ctx.isPrivate) {
                    if (!data.channels[channelId].users[userId].private) throw new Error('你未订阅');
                    data.channels[channelId].users[userId].private = false;
                } else {
                    if (!data.channels[channelId].users[userId].groupIds.includes(groupId)) throw new Error('你未订阅');
                    data.channels[channelId].users[userId].groupIds = data.channels[channelId].users[userId].groupIds.filter(g => g !== groupId);
                }
                if (data.channels[channelId].users[userId].groupIds.length === 0 && !data.channels[channelId].users[userId].private) {
                    delete data.channels[channelId].users[userId];
                }
                ext.storageSet('data', JSON.stringify(data));
                seal.replyToSender(ctx, msg, `订阅公告${channelId}已取消订阅`);
                return ret;
            }
            case '订阅列表':
            case 'subscribe-list': {
                const ch = [];
                for (const channelId in data.channels) {
                    if (data.channels[channelId].users[userId]) ch.push(channelId);
                }
                seal.replyToSender(ctx, msg, `你订阅的订阅公告列表\n${ch.join('\n')}`);
                return ret;
            }
            default: {
                ret.showHelp = true;
                return ret;
            }
        }
    } catch (e) {
        seal.replyToSender(ctx, msg, e.message);
        return ret;
    }
};
ext.cmdMap['订阅公告'] = cmd;   
