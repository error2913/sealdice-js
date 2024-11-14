// ==UserScript==
// @name         LINK!!!
// @author       错误
// @version      1.0.0
// @description  连接群聊私聊，只适配了QQ。使用 .link 获取帮助。
// @timestamp    1731573405
// 2024-11-14 16:36:45
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/link.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/link.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('link');
if (!ext) {
    ext = seal.ext.new('link', '错误', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);

    const linkList = {};//反向映射
    const data = getData();

    function getData() {
        let data = {};

        try {
            data = JSON.parse(ext.storageGet('data') || '{}');

            for (const id in data) {
                const link = data[id].link;
    
                for (let i = 0; i < link.length; i++) {
                    const linkId = link[i];
    
                    if (!linkList.hasOwnProperty(linkId)) {
                        linkList[linkId] = [];
                    }
    
                    linkList[linkId].push(id);
                }
            }
        } catch (err) {
            console.error(`在获取data时出错:${err}`);
            data = {};
        }

        return data;
    }

    function saveData() {
        ext.storageSet('data', JSON.stringify(data));
    }

    function getMsg(messageType, senderId, groupId = '') {
        let msg = seal.newMessage();

        if (messageType == 'group') {
            msg.groupId = groupId;
            msg.guildId = '';
        }

        msg.messageType = messageType;
        msg.sender.userId = senderId;
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

    /** 回复私聊消息*/
    function replyPrivate(ctx, s, id = '') {
        const mmsg = getMsg('private', id || ctx.player.userId, ctx.group.groupId);
        const mctx = getCtx(ctx.endPoint.userId, mmsg);
        seal.replyToSender(mctx, mmsg, s);
    }

    function replyGroup(ctx, s, id = '') {
        const mmsg = getMsg('group', ctx.player.userId, id || ctx.group.groupId);
        const mctx = getCtx(ctx.endPoint.userId, mmsg);
        seal.replyToSender(mctx, mmsg, s);
    }

    function replyById(ctx, s, id) {
        if (id.slice(0, 3) === 'QQ:') {
            replyPrivate(ctx, s, id);
        }

        else if (id.slice(0, 9) === 'QQ-Group:') {
            replyGroup(ctx, s, id);
        }

        else {
            console.error(`在replyById出错，未知的id:${id}`);
        }
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = 'link';
    cmd.help = `帮助
【.link private QQ号】
【.link group 群号】
【.link show】
【.link off】`;
    cmd.solve = (ctx, msg, cmdArgs) => {
        if (ctx.privilegeLevel < 100) {
            seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
            return seal.ext.newCmdExecuteResult(true);
        }

        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        const id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;

        switch (val) {
            case 'private': {
                if (!/\d+/.test(val2)) {
                    seal.replyToSender(ctx, msg, '请输入数字群号');
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (!data.hasOwnProperty(id)) {
                    data[id] = {
                        link: []
                    }
                }

                const linkId = `QQ:${val2}`;

                if (!linkList.hasOwnProperty(linkId)) {
                    linkList[linkId] = [];
                }
                linkList[linkId].push(id);
                data[id].link.push(linkId);
                saveData();

                seal.replyToSender(ctx, msg, `已连接了${linkId}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'group': {
                if (!/\d+/.test(val2)) {
                    seal.replyToSender(ctx, msg, '请输入数字群号');
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (!data.hasOwnProperty(id)) {
                    data[id] = {
                        link: []
                    }
                }

                const linkId = `QQ-Group:${val2}`;

                if (!linkList.hasOwnProperty(linkId)) {
                    linkList[linkId] = [];
                }
                linkList[linkId].push(id);
                data[id].link.push(linkId);
                saveData();

                seal.replyToSender(ctx, msg, `已连接了${linkId}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'show': {
                if (!data.hasOwnProperty(id)) {
                    seal.replyToSender(ctx, msg, `你没有正在进行的连接`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                seal.replyToSender(ctx, msg, `已连接:\n${data[id].link.join('\n')}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'off': {
                if (!data.hasOwnProperty(id)) {
                    seal.replyToSender(ctx, msg, `你没有正在进行的连接`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const link = data[id].link;

                for (let i = 0; i < link.length; i++) {
                    const linkId = link[i];
                    const index = linkList[linkId].indexOf(id);
                    linkList[linkId].splice(index, 1);
                }

                delete data[id];
                saveData();

                seal.replyToSender(ctx, msg, `已解除连接`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'help':
            default: {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
        }
    };
    ext.cmdMap['link'] = cmd;

    ext.onNotCommandReceived = (ctx, msg) => {
        const id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;

        if (linkList.hasOwnProperty(id)) {
            const s = `来自${id},${msg.sender.nickname}(${ctx.player.userId})的消息:\n${msg.message}`;

            const list = linkList[id];

            for (let i = 0; i < list.length; i++) {
                const mainId = list[i];
                replyById(ctx, s, mainId);
            }
        }

        if (data.hasOwnProperty(id)) {
            const link = data[id].link;

            for (let i = 0; i < link.length; i++) {
                const linkId = link[i];
                replyById(ctx, msg.message, linkId);
            }
        }
    }
}

/* TODO:
- 能转发指令到主窗口
- 在主窗口发送指令到其他窗口
- 记录聊天内容，进行AI总结
- 背后操控，将多个聊天窗口连接到一个（电话转接？），不分主窗口
- 适配其他平台
*/