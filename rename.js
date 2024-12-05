// ==UserScript==
// @name         群名片集体修改器
// @author       错误
// @version      1.0.1
// @description  指令 .rn 获取帮助。七天内发言的用户才可被修改群名片。骰娘需要管理员权限。使用指令需要管理员权限。依赖于错误:骰主公告极速版:>=1.1.0。
// @timestamp    1733286874
// 2024-12-04 12:34:34
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/rename.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/rename.js
// @depends 错误:骰主公告极速版:>=1.1.0
// ==/UserScript==

let ext = seal.ext.find('rename');
if (!ext) {
    ext = seal.ext.new('rename', '错误', '1.0.1');
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

async function setNameByTmpl(epId, gid, tmpl) {
    const data = globalThis.getPostData();
    if (!data.hasOwnProperty(epId) || !data[epId].hasOwnProperty(gid)) {
        return { result: null, err: new Error('未找到数据') };
    }

    const uids = Object.keys(data[epId][gid].members);
    if (uids.length === 0) {
        return { result: null, err: new Error('当前群聊没有用户数据') };
    }

    const f = 10;
    const interval = 450;
    const result = { success: 0, fail: 0 };

    let arr = [];
    for (let i = 0; i < uids.length; i++) {
        arr.push(uids[i]);

        if (i % f === f - 1 || i === uids.length - 1) {
            const arr_copy = arr.slice();

            for (let j = 0; j < arr_copy.length; j++) {
                const uid = arr_copy[j];
                const msg = getMsg(gid, uid);
                const ctx = getCtx(epId, msg);

                try {
                    seal.setPlayerGroupCard(ctx, tmpl);
                    result.success++;
                } catch (e) {
                    result.fail++;
                }
            }

            await new Promise(resolve => etTimeout(resolve, interval + Math.floor(Math.random() * 100)));

            arr = [];
        }
    }

    if (result.success === 0) {
        return { result: null, err: new Error('全部设置失败，请检查长度') };
    }

    return { result, err: null };
}

async function setNameByDraw(epId, gid, name) {
    const data = globalThis.getPostData();
    if (!data.hasOwnProperty(epId) || !data[epId].hasOwnProperty(gid)) {
        return { result: null, err: new Error('未找到数据') };
    }

    const uids = Object.keys(data[epId][gid].members);
    if (uids.length === 0) {
        return { result: null, err: new Error('当前群聊没有用户数据') };
    }

    const f = 10;
    const interval = 450;
    const result = { success: 0, fail: 0 };

    let arr = [];
    for (let i = 0; i < uids.length; i++) {
        arr.push(uids[i]);

        if (i % f === f - 1 || i === uids.length - 1) {
            const arr_copy = arr.slice();

            for (let j = 0; j < arr_copy.length; j++) {
                const uid = arr_copy[j];
                const msg = getMsg(gid, uid);
                const ctx = getCtx(epId, msg);

                const dr = seal.deck.draw(ctx, name, true);
                if (!dr.exists) {
                    return { result: null, err: new Error(`牌堆${name}不存在:${dr.err}`) };
                }

                const tmpl = dr.result;
                if (tmpl == null) {
                    return { result: null, err: new Error(`牌堆${name}结果为空:${dr.err}`) };
                }

                try {
                    seal.setPlayerGroupCard(ctx, tmpl);
                    result.success++;
                } catch (e) {
                    result.fail++;
                }
            }

            await new Promise(resolve => setTimeout(resolve, interval + Math.floor(Math.random() * 100)));

            arr = [];
        }
    }

    if (result.success === 0) {
        return { result: null, err: new Error('全部设置失败，请检查长度') };
    }

    return { result, err: null };
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'rn';
cmd.help = `帮助:
【.rn <模板>】将群成员的群名片设置为【模板】
【.rn pefix <前缀>】为群名片添加前缀
【.rn suffix <后缀>】为群名片添加后缀
【.rn fmt <前缀> <后缀>】为群名片添加前缀和后缀
【.rn draw】将群成员的群名片设置为牌堆抽取结果
【.rn amon】阿蒙！
【.rn clr】恢复群名片`;
cmd.solve = async (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 50) {
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
        case 'prefix': {
            const prefix = cmdArgs.getArgN(2);
            if (prefix === '') {
                seal.replyToSender(ctx, msg, '请指定前缀');
                return seal.ext.newCmdExecuteResult(false);
            }

            const tmpl = `${prefix}{$t玩家_RAW}`;
            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByTmpl(epId, gid, tmpl);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'suffix': {
            const sufix = cmdArgs.getArgN(2);
            if (sufix === '') {
                seal.replyToSender(ctx, msg, '请指定后缀');
                return seal.ext.newCmdExecuteResult(false);
            }

            const tmpl = `{$t玩家_RAW}${sufix}`;
            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByTmpl(epId, gid, tmpl);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'fmt': {
            const prefix = cmdArgs.getArgN(2);
            const sufix = cmdArgs.getArgN(3);
            if (prefix === '' || sufix === '') {
                seal.replyToSender(ctx, msg, '请指定前缀和后缀');
                return seal.ext.newCmdExecuteResult(false);
            }

            const tmpl = `${prefix}{$t玩家_RAW}${sufix}`;
            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByTmpl(epId, gid, tmpl);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'draw': {
            const name = cmdArgs.getArgN(2);
            if (name === '') {
                seal.replyToSender(ctx, msg, '请指定牌堆名称');
                return seal.ext.newCmdExecuteResult(false);
            }
            if (name === 'keys') {
                cmdArgs.args = cmdArgs.args.slice(1);
                cmdArgs.rawArgs = cmdArgs.rawArgs.replace('draw', '');
                cmdArgs.cleanArgs = cmdArgs.args.join(' ');

                const extDeck = seal.ext.find('deck');
                return extDeck.cmdMap['draw'].solve(ctx, msg, cmdArgs);
            }

            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByDraw(epId, gid, name);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'amon': {
            const tmpl = seal.formatTmpl(ctx, "核心:骰子名字");
            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByTmpl(epId, gid, tmpl);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'clr': {
            const tmpl = '';
            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByTmpl(epId, gid, tmpl);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
        default: {
            const tmpl = val;
            const epId = ctx.endPoint.userId;
            const gid = ctx.group.groupId;
            const { result, err } = await setNameByTmpl(epId, gid, tmpl);
            if (err !== null) {
                seal.replyToSender(ctx, msg, err.message);
                return seal.ext.newCmdExecuteResult(false);
            }

            seal.replyToSender(ctx, msg, `${result.success}成功,${result.fail}失败`);
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
ext.cmdMap['rn'] = cmd;
