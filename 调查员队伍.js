// ==UserScript==
// @name         team
// @author       错误
// @version      2.1.0
// @description  .team 获取帮助。在其他框架看到类似的插件，找了一下发现海豹似乎没有，故自己写一个。使用.team获取帮助。非指令关键词部分请查看插件配置。
// @timestamp    1724468302
// 2024-08-24 10:58:22
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E8%B0%83%E6%9F%A5%E5%91%98%E9%98%9F%E4%BC%8D.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('team');
if (!ext) {
    ext = seal.ext.new('team', '错误', '2.1.0');
    seal.ext.register(ext);
    const data = {}

    seal.ext.registerTemplateConfig(ext, '新建队伍', ['新建<{{队伍名字}}>成功'])
    seal.ext.registerTemplateConfig(ext, '绑定队伍', ['绑定<{{队伍名字}}>成功'])
    seal.ext.registerTemplateConfig(ext, '删除队伍', ['删除<{{队伍名字}}>成功'])
    seal.ext.registerTemplateConfig(ext, '展示队伍', ['队伍如下{{队伍列表}}'])

    seal.ext.registerTemplateConfig(ext, '添加成员', ['成功添加{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。'])
    seal.ext.registerTemplateConfig(ext, '删除成员', ['成功删除{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。'])

    seal.ext.registerTemplateConfig(ext, '呼叫成员', ['下面的人来跑团啦！请在限定时间{{时间限制}}s内回复“到”：{{成员列表}}'])
    seal.ext.registerTemplateConfig(ext, '呼叫结束', ['应到{{当前人数}}人，实到{{签到人数}}人，未到{{咕咕人数}}人。未到如下：{{成员列表}}'])
    seal.ext.registerIntConfig(ext, '呼叫时间限制（s）', 60)

    seal.ext.registerTemplateConfig(ext, '展示属性', ['属性如下{{展示属性列表}}'])
    seal.ext.registerTemplateConfig(ext, '修改属性', ['修改如下{{修改属性列表}}'])
    seal.ext.registerTemplateConfig(ext, '排序属性', ['排序如下{{排序属性列表}}'])

    seal.ext.registerTemplateConfig(ext, '提示队伍为空', ['队伍里没有成员。'])

    seal.ext.registerTemplateConfig(ext, '呼叫全队关键词', ['开团了'])
    seal.ext.registerTemplateConfig(ext, '战斗轮排序关键词', ['（战斗轮开始）'])
    seal.ext.registerTemplateConfig(ext, '签到关键词', ['到'])

    function getCtxById(epId, groupId, guildId, senderId) {
        let eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                let msg = seal.newMessage();
                msg.messageType = "group";
                msg.groupId = groupId;
                msg.guildId = guildId;
                msg.sender.userId = senderId;
                return seal.createTempCtx(eps[i], msg);
            }
        }
        return undefined;
    }

    /**返回teams列表 */
    function getTeamsData(groupId) {
        try {
            let teams = JSON.parse(ext.storageGet(`${groupId}_teams`) || '{}');
            return Array.isArray(teams) && teams.length > 0 ? teams : [{ name: '默认队伍', members: [] }];
        } catch (error) {
            console.error(`Failed to initialize group data for ${groupId}_teams:`, error);
            return [{ name: '默认队伍', members: [] }];
        }
    }

    function getBindData(groupId) {
        try {
            let groupData = JSON.parse(ext.storageGet(`${groupId}_bind`) || '{}');
            data[groupId] = {
                team: {
                    name: groupData.team.name || '默认队伍',
                    members: groupData.team.members || []
                },
                call: groupData.call || []
            };
        } catch (error) {
            console.error(`Failed to initialize group data for ${groupId}_bind:`, error);
            data[groupId] = {
                team: { name: '默认队伍', members: [] },
                call: []
            }
        }
    }

    function saveTeamsData(groupId, teams) {
        ext.storageSet(`${groupId}_teams`, JSON.stringify(teams));
    };

    function saveBindData(groupId) {
        ext.storageSet(`${groupId}_bind`, JSON.stringify(data[groupId]));
    };

    function bindTeam(groupId, name, teams) {
        var index = teams.findIndex(team => team.name === data[groupId].team.name);
        if (index !== -1) teams[index].members = data[groupId].team.members;
        else teams.push({ name: data[groupId].team.name, members: data[groupId].team.members })

        var index = teams.findIndex(team => team.name === name);
        if (index !== -1) {
            saveTeamsData(groupId, teams);
            data[groupId].team = { name: name, members: teams[index].members };
            saveBindData(groupId);

            let tmpl = seal.ext.getTemplateConfig(ext, "绑定队伍")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{队伍名字}}', name)
        }
        else {
            teams.push({ name: name, members: [] })
            saveTeamsData(groupId, teams);
            data[groupId].team = { name: name, members: [] };
            saveBindData(groupId);

            let tmpl = seal.ext.getTemplateConfig(ext, "新建队伍")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{队伍名字}}', name)
        }
    }

    function delTeam(groupId, name, kwargs) {
        const keys = kwargs.map(item => { return item.name })
        let teams = getTeamsData(groupId);

        if (keys.includes('all')) {
            teams = [{ name: '默认队伍', members: [] }];
            saveTeamsData(groupId, teams);

            data[groupId].team = { name: '默认队伍', members: [] };
            saveBindData(groupId);

            return "所有队伍已删除"
        }

        //删除当前队伍
        if (keys.includes('now') || name == data[groupId].team.name) {
            name = data[groupId].team.name;
            teams = teams.filter(item => item.name !== name);
            if (teams.length == 0) teams.push({ name: '默认队伍', members: [] })
            saveTeamsData(groupId, teams);

            data[groupId].team = { name: teams[0].name, members: teams[0].members };
            saveBindData(groupId);

            let tmpl = seal.ext.getTemplateConfig(ext, "删除队伍")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{队伍名字}}', name)
        }

        //删除其他队伍
        if (!teams.some(team => team.name === name)) return "队伍不存在"

        teams = teams.filter(item => item.name !== name);
        saveTeamsData(groupId, teams);

        let tmpl = seal.ext.getTemplateConfig(ext, "删除队伍")
        return tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{队伍名字}}', name)
    }

    function showTeamList(groupId) {
        let teams = getTeamsData(groupId);
        var index = teams.findIndex(team => team.name === data[groupId].team.name);
        if (index !== -1) teams[index].members = data[groupId].team.members;
        else teams.push({ name: data[groupId].team.name, members: data[groupId].team.members })
        saveTeamsData(groupId, teams);

        let text = ''
        teams.forEach(team => {
            text += `\n${team.name} ${team.members.length}人`;
            if (team.name == data[groupId].team.name) text += '◎'
        })

        let tmpl = seal.ext.getTemplateConfig(ext, "展示队伍")
        return tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{队伍列表}}', text)
    }


    function addMembers(groupId, atlst) {
        atlst.forEach(userId => { if (!data[groupId].team.members.includes(userId)) data[groupId].team.members.push(userId); });
        saveBindData(groupId);

        let tmpl = seal.ext.getTemplateConfig(ext, "添加成员")
        return tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{被@的长度}}', atlst.length)
            .replace('{{当前人数}}', data[groupId].team.members.length);
    }

    function removeMembers(groupId, atlst, kwargs) {
        const keys = kwargs.map(item => { return item.name })
        if (keys.includes('all')) atlst = data[groupId].team.members;

        data[groupId].team.members = data[groupId].team.members.filter(userId => !atlst.includes(userId));
        saveBindData(groupId);

        let tmpl = seal.ext.getTemplateConfig(ext, "删除成员")
        return tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{被@的长度}}', atlst.length)
            .replace('{{当前人数}}', data[groupId].team.members.length);
    }


    function call(groupId, ctx, msg) {
        const timeLimit = seal.ext.getIntConfig(ext, "呼叫时间限制（s）")
        const tmpl = seal.ext.getTemplateConfig(ext, "呼叫成员")

        let text = ''
        for (let userId of data[groupId].team.members) text += `\n[CQ:at,qq=${userId.replace(/\D+/g, "")}]`;

        seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{时间限制}}', timeLimit)
            .replace('{{成员列表}}', text));

        data[groupId].call = data[groupId].team.members;
        setTimeout(() => {
            let tmpl = seal.ext.getTemplateConfig(ext, "呼叫结束");
            let text = ''
            for (let userId of data[groupId].call) text += `\n[CQ:at,qq=${userId.replace(/\D+/g, "")}]`;

            seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{当前人数}}', data[groupId].team.members.length)
                .replace('{{签到人数}}', data[groupId].team.members.length - data[groupId].call.length)
                .replace('{{咕咕人数}}', data[groupId].call.length)
                .replace('{{成员列表}}', text))

            data[groupId].call = [];
        }, timeLimit * 1000);
    }

    function showAttrb(groupId, attrb, ctx, msg) {
        let tmpl = seal.ext.getTemplateConfig(ext, "展示属性");
        let text = ''
        if (!attrb) {
            for (let userId of data[groupId].team.members) {
                let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
                text += `\n${mctx.player.name} hp${seal.vars.intGet(mctx, 'hp')[0]}/${Math.floor((seal.vars.intGet(mctx, 'con')[0] + seal.vars.intGet(mctx, 'siz')[0]) / 10)} san${seal.vars.intGet(mctx, 'san')[0]}/${seal.vars.intGet(mctx, 'pow')[0]} dex${seal.vars.intGet(mctx, 'dex')[0]}`;
            }
        } else {
            for (let userId of data[groupId].team.members) {
                let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
                text += `\n${mctx.player.name} ${attrb}${seal.vars.intGet(mctx, attrb)[0]}`;
            }
        }

        seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{展示属性列表}}', text));
    }

    function setAttrb(groupId, val, ctx, msg) {
        let match = val.match(/^(.*?)([d\d+\-*\/]+)$/);
        let tmpl = seal.ext.getTemplateConfig(ext, "修改属性");

        if (!match) seal.replyToSender(ctx, msg, "参数错误，【.team st 属性名】查看属性(修改属性)");;

        let attrb = match[1];
        let expression = match[2];
        let op = expression.match(/^([+\-])/)?.[1];
        let result = op ? `{${attrb}=${val}}` : `{${attrb}=${expression}}`;
        let text = `\n操作:${val}`;
        for (let userId of data[groupId].team.members) {
            let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
            text += `\n${mctx.player.name} ${seal.vars.intGet(mctx, attrb)[0]}=>${seal.format(mctx, result)}`;
        }

        seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{修改属性列表}}', text))
    }

    function sortAttrb(groupId, attrb, ctx, msg) {
        let tmpl = seal.ext.getTemplateConfig(ext, "排序属性");

        let ctxlst = data[groupId].team.members.map(userId => {
            return getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
        });
        let text = ''

        ctxlst.sort((a, b) => {
            return seal.vars.intGet(b, attrb)[0] - seal.vars.intGet(a, attrb)[0];
        });
        for (let ctx of ctxlst) text += `\n${ctx.player.name} ${attrb}${seal.vars.intGet(ctx, attrb)[0]}`;

        seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)]
            .replace('{{排序属性列表}}', text));
    }

    const cmdteam = seal.ext.newCmdItemInfo();
    cmdteam.name = 'team';
    cmdteam.help = `帮助：
【.team bind 队伍名字】绑定/新建队伍
【.team del 队伍名字】删除队伍
【.team del --all】删除所有队伍
【.team del --now】删除当前队伍
【.team lst】队伍列表
【.team add @xx@xxx...】添加若干成员
【.team rm @xx@xxx...】删除若干成员
【.team rm --all】删除所有成员
【.team call】调查员集结！
【.team show (属性名)】查看属性
【.team st <属性名><值/+-表达式>】修改属性
【.team sort 属性名】对成员的该项属性排序`;
    cmdteam.allowDelegate = true;
    cmdteam.disabledInPrivate = true;
    cmdteam.solve = (ctx, msg, cmdArgs) => {
        if (ctx.isPrivate) return;

        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        let groupId = ctx.group.groupId
        if (!data.hasOwnProperty(groupId)) getBindData(groupId)

        //获取所有被@的人
        let atlst = cmdArgs.at
            .filter(item => item.userId !== ctx.endPoint.userId)
            .map(item => item.userId);

        switch (val) {
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'bind': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team bind 队伍名字】绑定/新建队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                val2 = cmdArgs.getRestArgsFrom(2)

                seal.replyToSender(ctx, msg, bindTeam(groupId, val2, getTeamsData(groupId)));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'del': {
                if (!val2 && cmdArgs.kwargs.length == 0) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team del 队伍名字】删除队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                val2 = cmdArgs.getRestArgsFrom(2)

                seal.replyToSender(ctx, msg, delTeam(groupId, val2, cmdArgs.kwargs));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'lst': {
                seal.replyToSender(ctx, msg, showTeamList(groupId))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'add': {
                seal.replyToSender(ctx, msg, addMembers(groupId, atlst))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'rm': {
                seal.replyToSender(ctx, msg, removeMembers(groupId, atlst, cmdArgs.kwargs))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'call': {
                if (data[groupId].team.members.length == 0) {
                    let tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                    seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)])
                    return seal.ext.newCmdExecuteResult(true);
                }

                call(groupId, ctx, msg);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'show': {
                if (data[groupId].team.members.length == 0) {
                    let tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                    seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)])
                    return seal.ext.newCmdExecuteResult(true);
                }

                showAttrb(groupId, val2, ctx, msg)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'st': {
                if (data[groupId].team.members.length == 0) {
                    let tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                    seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)])
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team st 属性名】查看属性(修改属性)")
                    return seal.ext.newCmdExecuteResult(true);
                }

                setAttrb(groupId, val2, ctx, msg)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'sort': {
                if (data[groupId].team.members.length == 0) {
                    let tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                    seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)])
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team sort 属性名】对成员的该项属性排序")
                    return seal.ext.newCmdExecuteResult(true);
                }

                sortAttrb(groupId, val2, ctx, msg);
                return seal.ext.newCmdExecuteResult(true);
            }
            default: {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
        }
    };

    ext.onNotCommandReceived = (ctx, msg) => {
        if (ctx.isPrivate) return;
        let message = msg.message
        let groupId = ctx.group.groupId

        const callWords = seal.ext.getTemplateConfig(ext, "呼叫全队关键词")
        const sortWords = seal.ext.getTemplateConfig(ext, "战斗轮排序关键词")
        const signWords = seal.ext.getTemplateConfig(ext, "签到关键词")

        if (callWords.includes(message)) {
            if (!data.hasOwnProperty(groupId)) getBindData(groupId)

            if (data[groupId].team.members.length == 0) {
                let tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)])
                return;
            }

            call(groupId, ctx, msg);
            return;
        }
        if (signWords.includes(message)) {
            if (!data.hasOwnProperty(groupId)) getBindData(groupId)

            if (data[groupId].call.length == 0) return;

            data[groupId].call = data[groupId].call.filter(userId => userId != ctx.player.userId)
            return;
        }
        if (sortWords.includes(message)) {
            if (!data.hasOwnProperty(groupId)) getBindData(groupId)

            if (data[groupId].team.members.length == 0) {
                let tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                seal.replyToSender(ctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)])
                return;
            }

            sortAttrb(groupId, 'dex', ctx, msg);
            return;
        }
    }

    // 将命令注册到扩展中
    ext.cmdMap['team'] = cmdteam;
    ext.cmdMap['tm'] = cmdteam;
}