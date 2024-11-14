// ==UserScript==
// @name         LINK!!!
// @author       错误
// @version      1.0.1
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
    ext = seal.ext.new('link', '错误', '1.0.1');
    // 注册扩展
    seal.ext.register(ext);

    let data1 = {}, data2 = {};
    try {
        data1 = JSON.parse(ext.storageGet('mainData') || '{}');
        data2 = JSON.parse(ext.storageGet('linkData') || '{}');
    } catch (err) {
        console.error(`在获取data时出错:${err}`);
    }

    const mainData = data1;
    const linkData = data2;

    function saveData() {
        ext.storageSet('mainData', JSON.stringify(mainData));
        ext.storageSet('linkData', JSON.stringify(linkData));
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
【.link group QQ群号】
【.link show】展示连接状态，包括已连接和被连接
【.link off】断开主动连接(静默执行)
【.link quit】断开被动连接(通知被断开对象)
【.link divert】转接当前录入的所有连接对象`;
    cmd.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        const id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;

        switch (val) {
            case 'private': {
                if (ctx.privilegeLevel < 100) {
                    seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (!/\d+/.test(val2)) {
                    seal.replyToSender(ctx, msg, '请输入数字群号');
                    return seal.ext.newCmdExecuteResult(true);
                }

                const linkId = `QQ:${val2}`;

                if (!mainData.hasOwnProperty(id)) {
                    mainData[id] = [];
                }
                if (!linkData.hasOwnProperty(linkId)) {
                    linkData[linkId] = [];
                }

                linkData[linkId].push(id);
                mainData[id].push(linkId);
                saveData();

                seal.replyToSender(ctx, msg, `已连接了${linkId}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'group': {
                if (ctx.privilegeLevel < 100) {
                    seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (!/\d+/.test(val2)) {
                    seal.replyToSender(ctx, msg, '请输入数字群号');
                    return seal.ext.newCmdExecuteResult(true);
                }

                const linkId = `QQ-Group:${val2}`;

                if (!mainData.hasOwnProperty(id)) {
                    mainData[id] = [];
                }
                if (!linkData.hasOwnProperty(linkId)) {
                    linkData[linkId] = [];
                }

                linkData[linkId].push(id);
                mainData[id].push(linkId);
                saveData();

                seal.replyToSender(ctx, msg, `已连接了${linkId}`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'show': {
                const arr = [];

                if (mainData.hasOwnProperty(id)) {
                    arr.push(`主动连接:\n${mainData[id].join('\n')}`);
                }

                if (linkData.hasOwnProperty(id)) {
                    arr.push(`被动连接:\n${linkData[id].join('\n')}`);
                }

                const s = arr.join('\n');

                seal.replyToSender(ctx, msg, s || '你没有进行中的连接');
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'off': {
                if (!mainData.hasOwnProperty(id)) {
                    seal.replyToSender(ctx, msg, `没有正在进行的主动连接`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                mainData[id].forEach(linkId => {
                    if (linkData.hasOwnProperty(linkId)) {
                        const index = linkData[linkId].indexOf(id);
                        if (index !== -1) {
                            linkData[linkId].splice(index, 1);

                            if (linkData[linkId].length === 0) {
                                delete linkData[linkId];
                            }
                        }
                    }
                });

                delete mainData[id];
                saveData();

                seal.replyToSender(ctx, msg, `已解除连接`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'quit': {
                if (!linkData.hasOwnProperty(id)) {
                    seal.replyToSender(ctx, msg, `没有正在进行的被动连接`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                linkData[id].forEach(mainId => {
                    //退出被主动连接的情况
                    if (mainData.hasOwnProperty(mainId)) {
                        const index = mainData[mainId].indexOf(id);
                        if (index !== -1) {
                            mainData[mainId].splice(index, 1);

                            if (mainData[mainId].length === 0) {
                                delete mainData[mainId];
                            }

                            replyById(ctx, `${id}已退出被连接状态`, mainId);
                        }
                    }

                    //退出转接连接的情况
                    const linkId = mainId;

                    //判断是否为自己主动连接的
                    if (mainData.hasOwnProperty(id) && mainData[id].includes(linkId)) {
                        return;
                    }

                    if (linkData.hasOwnProperty(linkId)) {
                        const index = linkData[linkId].indexOf(id);
                        if (index !== -1) {
                            linkData[linkId].splice(index, 1);

                            if (linkData[linkId].length === 0) {
                                delete linkData[linkId];
                            }

                            replyById(ctx, `${id}已退出转接连接状态`, mainId);
                        }
                    }
                });

                delete linkData[id];
                saveData();

                seal.replyToSender(ctx, msg, `已退出被连接`);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'divert': {
                if (ctx.privilegeLevel < 100) {
                    seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (!mainData.hasOwnProperty(id)) {
                    seal.replyToSender(ctx, msg, `你没有正在进行的连接`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (mainData[id].length < 2) {
                    seal.replyToSender(ctx, msg, `连接对象应大于2个`);
                    return seal.ext.newCmdExecuteResult(true);
                }

                const s = `完成转接:\n${mainData[id].join('\n')}`;

                mainData[id].forEach(linkId => {
                    if (linkData.hasOwnProperty(linkId)) {
                        const index = linkData[linkId].indexOf(id);
                        if (index !== -1) {
                            linkData[linkId].splice(index, 1);
                        }
                    }

                    const link = mainData[id].filter(linkId2 => linkId2!== linkId);

                    linkData[linkId].push(...link);
                    replyById(ctx, `已与建立连接:\n${link.join('\n')}\n解除请使用【.link quit】`, linkId);
                });

                delete mainData[id];
                saveData();

                seal.replyToSender(ctx, msg, s);
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

        if (mainData.hasOwnProperty(id)) {
            const s = msg.message;

            mainData[id].forEach(linkId => {
                replyById(ctx, s, linkId);
            });
        }

        if (linkData.hasOwnProperty(id)) {
            const prefix = id === ctx.player.userId ? `` : `来自${id},`;
            const s = prefix + `${msg.sender.nickname}(${ctx.player.userId})的消息:\n${msg.message}`;

            linkData[id].forEach(mainId => {
                replyById(ctx, s, mainId);
            });
        }
    }

    /* 指令消息，感觉不是很必要。
    ext.onCommandReceived = (ctx, msg, cmdArgs) => {
        const id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;

        if (linkData.hasOwnProperty(id)) {
            const s = `来自${id},${msg.sender.nickname}(${ctx.player.userId})的指令消息:\n${msg.message}`;

            linkData[id].forEach(mainId => {
                replyById(ctx, s, mainId);
            });
        }
    }
    */
}

/* TODO:
- 在主窗口发送指令到其他窗口。想不到什么好的解决方案，搁置。
- 记录聊天内容，进行AI总结
- 适配其他平台
*/