// ==UserScript==
// @name         team
// @author       错误
// @version      3.0.0
// @description  这是一个海豹插件，它提供了一套完整的队伍管理功能，允许用户在 QQ 群组中创建和管理队伍。\n- 更多自定义配置请查看配置项（即插件设置部分）。\n - 如果你也是一名插件作者，你也可以通过globalThis.team.xxx在你的插件中来调用该插件的方法。具体方法请在该插件的源码中查看。\n- 若使用过程中遇到问题或BUG，请联系开发者。如果您有更好的想法，欢迎前往主页提交 Pull Request 或 Issue，共同完善该插件
// @timestamp    1724468302
// 2024-08-24 10:58:22
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E8%B0%83%E6%9F%A5%E5%91%98%E9%98%9F%E4%BC%8D.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('team');
if (!ext) {
    ext = seal.ext.new('team', '错误', '3.0.0');
    seal.ext.register(ext);
    const data = {}

    seal.ext.registerTemplateConfig(ext, '新建队伍', ['新建<{{队伍名字}}>成功'])
    seal.ext.registerTemplateConfig(ext, '绑定队伍', ['绑定<{{队伍名字}}>成功'])
    seal.ext.registerTemplateConfig(ext, '删除队伍', ['删除<{{队伍名字}}>成功'])
    seal.ext.registerTemplateConfig(ext, '展示队伍', ['队伍如下{{队伍列表}}'])

    seal.ext.registerTemplateConfig(ext, '添加成员', ['成功添加{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。'])
    seal.ext.registerTemplateConfig(ext, '删除成员', ['成功删除{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。'])
    seal.ext.registerTemplateConfig(ext, '抽取成员', ['抽到了：{{成员名称}}'])

    seal.ext.registerTemplateConfig(ext, '呼叫成员', ['下面的人来跑团啦！请在限定时间{{时间限制}}s内回复“到”：{{成员列表}}'])
    seal.ext.registerTemplateConfig(ext, '呼叫结束', ['应到{{当前人数}}人，实到{{签到人数}}人，未到{{咕咕人数}}人。未到如下：{{成员列表}}'])
    seal.ext.registerIntConfig(ext, '呼叫时间限制（s）', 60)

    seal.ext.registerTemplateConfig(ext, '展示属性', ['属性如下{{展示属性列表}}'])
    seal.ext.registerTemplateConfig(ext, '修改属性', ['修改如下{{修改属性列表}}'])
    seal.ext.registerTemplateConfig(ext, '排序属性', ['排序如下{{排序属性列表}}'])

    seal.ext.registerTemplateConfig(ext, '提示队伍为空', ['队伍里没有成员。'])
    seal.ext.registerTemplateConfig(ext, '提示队伍不存在', ['队伍不存在。'])
    seal.ext.registerTemplateConfig(ext, '提示正在呼叫', ['当前正在呼叫中。'])

    seal.ext.registerTemplateConfig(ext, '呼叫全队关键词', ['开团了'])
    seal.ext.registerTemplateConfig(ext, '战斗轮排序关键词', ['（战斗轮开始）'])
    seal.ext.registerTemplateConfig(ext, '签到关键词', ['到'])

    class Team {
        constructor() {
            this.id = '';
            this.teams = [];
            this.team = {};
            this.call = [];
        }

        getTeamsData(groupId) {
            try {
                let teams = JSON.parse(ext.storageGet(`${groupId}_teams`) || '[]');

                if (!teams || !Array.isArray(teams) || teams.length == 0) {
                    teams = [{ name: '默认队伍', members: [] }];
                    saveTeamsData(groupId, teams);
                }
                return teams;
            } catch (error) {
                console.error(`Failed to initialize group data for ${groupId}_teams:`, error);
                return [{ name: '默认队伍', members: [] }];
            }
        }

        getBindData(groupId) {
            let team;
            if (!data.hasOwnProperty(groupId)) {
                try {
                    let groupData = JSON.parse(ext.storageGet(`${groupId}_bind`) || '{}');
                    team = {
                        name: groupData.name || '默认队伍',
                        members: groupData.members || []
                    };
                } catch (error) {
                    console.error(`Failed to initialize group data for ${groupId}_bind:`, error);
                    team = { name: '默认队伍', members: [] }
                }

                data[groupId] = team;
            } else {
                team = data[groupId]
            }
            return team;
        }

        getCallData(groupId) {
            try {
                let call = JSON.parse(ext.storageGet(`${groupId}_call`) || '[]');
                if (!call || !Array.isArray(call)) {
                    call = [];
                    saveCallData(groupId, call);
                }
                return call;
            } catch (error) {
                console.error(`Failed to initialize group data for ${groupId}_call:`, error);
                return [];
            }
        }

        bindTeam(groupId, name) {
            const team = this.getBindData(groupId)
            const teams = this.getTeamsData(groupId)

            //保存当前绑定的队伍信息到列表
            var index = teams.findIndex(item => item.name === team.name);
            if (index !== -1) {
                teams[index].members = team.members;
            } else {
                teams.push(team)
            }

            //绑定或新建队伍
            var index = teams.findIndex(item => item.name === name);
            if (index !== -1) {
                data[groupId] = teams[index];
                var tmpl = seal.ext.getTemplateConfig(ext, "绑定队伍")
            }
            else {
                let team = { name: name, members: [] }
                teams.push(team)
                data[groupId] = team;
                var tmpl = seal.ext.getTemplateConfig(ext, "新建队伍")
            }

            saveTeamsData(groupId, teams);
            saveBindData(groupId);

            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{队伍名字}}', name)
        }

        delTeam(groupId, name, kwargs) {
            let teams = this.getTeamsData(groupId);
            const keys = kwargs.map(item => { return item.name })

            //删除所有队伍
            if (keys.includes('all')) {
                let team = { name: '默认队伍', members: [] }

                name = teams.map(item => { return item.name }).join('、');
                teams = [team];

                data[groupId] = team;
                saveBindData(groupId);
            }

            //删除当前队伍
            else if (keys.includes('now') || name == data[groupId].name) {
                let team = { name: '默认队伍', members: [] };

                name = data[groupId].name;
                teams = teams.filter(item => item.name !== name);
                if (teams.length == 0) teams.push(team)

                data[groupId] = teams[0]
                saveBindData(groupId);
            }

            //删除其他队伍
            else {
                if (!teams.some(item => item.name === name)) {
                    const tmpl = seal.ext.getTemplateConfig(ext, "提示队伍不存在")
                    return tmpl[Math.floor(Math.random() * tmpl.length)]
                }

                teams = teams.filter(item => item.name !== name);
            }

            saveTeamsData(groupId, teams);
            const tmpl = seal.ext.getTemplateConfig(ext, "删除队伍")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{队伍名字}}', name)
        }

        showTeamList(groupId) {
            const team = this.getBindData(groupId)
            const teams = this.getTeamsData(groupId);

            //保存当前绑定的队伍信息到列表
            var index = teams.findIndex(item => item.name === team.name);
            if (index !== -1) {
                teams[index].members = team.members;
            } else {
                teams.push(team)
            }

            let text = ''
            teams.forEach(item => {
                text += `\n${item.name} ${item.members.length}人`;
                if (item.name == team.name) text += '◎'
            })

            const tmpl = seal.ext.getTemplateConfig(ext, "展示队伍")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{队伍列表}}', text)
        }


        addMembers(groupId, atlst) {
            const team = this.getBindData(groupId)
            atlst.forEach(userId => {
                if (!team.members.includes(userId)) {
                    data[groupId].members.push(userId);
                }
            });
            saveBindData(groupId);

            const tmpl = seal.ext.getTemplateConfig(ext, "添加成员")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{被@的长度}}', atlst.length)
                .replace('{{当前人数}}', data[groupId].members.length);
        }

        removeMembers(groupId, atlst, kwargs) {
            const team = this.getBindData(groupId)
            const keys = kwargs.map(item => { return item.name })
            if (keys.includes('all')) atlst = team.members;

            data[groupId].members = team.members.filter(userId => !atlst.includes(userId));
            saveBindData(groupId);

            const tmpl = seal.ext.getTemplateConfig(ext, "删除成员")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{被@的长度}}', atlst.length)
                .replace('{{当前人数}}', data[groupId].members.length);
        }

        drawMember(groupId, epId, guildId) {
            const team = this.getBindData(groupId)

            if (team.members.length == 0) {
                const tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                return tmpl[Math.floor(Math.random() * tmpl.length)]
            }

            const members = team.members;
            const userId = members[Math.floor(Math.random() * members.length)];
            const mctx = getCtxById(epId, groupId, guildId, userId);
            const name = mctx.player.name;

            const tmpl = seal.ext.getTemplateConfig(ext, "抽取成员")
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{成员名称}}', name);
        }

        callMembers(groupId, epId, guildId) {
            const team = this.getBindData(groupId)

            if (team.members.length == 0) {
                const tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                return tmpl[Math.floor(Math.random() * tmpl.length)]
            }

            const call = this.getCallData(groupId)

            if (call.length > 0) {
                const tmpl = seal.ext.getTemplateConfig(ext, "提示正在呼叫");
                return tmpl[Math.floor(Math.random() * tmpl.length)]
            }

            const timeLimit = seal.ext.getIntConfig(ext, "呼叫时间限制（s）")
            const tmpl = seal.ext.getTemplateConfig(ext, "呼叫成员")

            let text = ''
            for (let userId of team.members) text += `\n[CQ:at,qq=${userId.replace(/\D+/g, "")}]`;
            saveCallData(groupId, team.members);

            setTimeout(() => {
                const call = this.getCallData(groupId)
                saveCallData(groupId, []);

                let text = ''
                for (let userId of call) text += `\n[CQ:at,qq=${userId.replace(/\D+/g, "")}]`;

                const userId = 'QQ:114514'
                const mctx = getCtxById(epId, groupId, guildId, userId)
                const msg = seal.newMessage();
                msg.messageType = "group";
                msg.groupId = groupId;
                msg.guildId = guildId;
                msg.sender.userId = userId;

                const tmpl = seal.ext.getTemplateConfig(ext, "呼叫结束");
                seal.replyToSender(mctx, msg, tmpl[Math.floor(Math.random() * tmpl.length)]
                    .replace('{{当前人数}}', team.members.length)
                    .replace('{{签到人数}}', team.members.length - call.length)
                    .replace('{{咕咕人数}}', call.length)
                    .replace('{{成员列表}}', text))
            }, timeLimit * 1000);
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{时间限制}}', timeLimit)
                .replace('{{成员列表}}', text);
        }

        showAttrb(groupId, attrb, epId, guildId) {
            const team = this.getBindData(groupId)

            if (team.members.length == 0) {
                const tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                return tmpl[Math.floor(Math.random() * tmpl.length)]
            }

            let text = ''
            if (!attrb) {
                for (let userId of team.members) {
                    let mctx = getCtxById(epId, groupId, guildId, userId);
                    text += `\n${mctx.player.name} hp${seal.vars.intGet(mctx, 'hp')[0]}/${Math.floor((seal.vars.intGet(mctx, 'con')[0] + seal.vars.intGet(mctx, 'siz')[0]) / 10)} san${seal.vars.intGet(mctx, 'san')[0]}/${seal.vars.intGet(mctx, 'pow')[0]} dex${seal.vars.intGet(mctx, 'dex')[0]}`;
                }
            } else {
                for (let userId of team.members) {
                    let mctx = getCtxById(epId, groupId, guildId, userId);
                    text += `\n${mctx.player.name} ${attrb}${seal.vars.intGet(mctx, attrb)[0]}`;
                }
            }


            const tmpl = seal.ext.getTemplateConfig(ext, "展示属性");
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{展示属性列表}}', text);
        }

        setAttrb(groupId, val, epId, guildId) {
            const team = this.getBindData(groupId)

            if (team.members.length == 0) {
                const tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                return tmpl[Math.floor(Math.random() * tmpl.length)]
            }

            let match = val.match(/^(.*?)([d\d+\-*\/]+)$/);

            if (!match) return "参数错误，【.team st 属性名】查看属性(修改属性)";

            let attrb = match[1];
            let expression = match[2];
            let op = expression.match(/^([+\-])/)?.[1];
            let result = op ? `{${attrb}=${val}}` : `{${attrb}=${expression}}`;
            let text = `\n操作:${val}`;
            for (let userId of team.members) {
                let mctx = getCtxById(epId, groupId, guildId, userId);
                text += `\n${mctx.player.name} ${seal.vars.intGet(mctx, attrb)[0]}=>${seal.format(mctx, result)}`;
            }

            const tmpl = seal.ext.getTemplateConfig(ext, "修改属性");
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{修改属性列表}}', text)
        }

        sortAttrb(groupId, attrb, epId, guildId) {
            const team = this.getBindData(groupId)

            if (team.members.length == 0) {
                const tmpl = seal.ext.getTemplateConfig(ext, "提示队伍为空")
                return tmpl[Math.floor(Math.random() * tmpl.length)]
            }

            let ctxlst = team.members.map(userId => {
                return getCtxById(epId, groupId, guildId, userId);
            });

            ctxlst.sort((a, b) => {
                return seal.vars.intGet(b, attrb)[0] - seal.vars.intGet(a, attrb)[0];
            });

            let text = ''
            for (let ctx of ctxlst) text += `\n${ctx.player.name} ${attrb}${seal.vars.intGet(ctx, attrb)[0]}`;

            const tmpl = seal.ext.getTemplateConfig(ext, "排序属性");
            return tmpl[Math.floor(Math.random() * tmpl.length)]
                .replace('{{排序属性列表}}', text);
        }
    }

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

    function saveTeamsData(groupId, teams) {
        ext.storageSet(`${groupId}_teams`, JSON.stringify(teams));
    };

    function saveBindData(groupId) {
        ext.storageSet(`${groupId}_bind`, JSON.stringify(data[groupId]));
    };

    function saveCallData(groupId, call) {
        ext.storageSet(`${groupId}_call`, JSON.stringify(call));
    };

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
【.team draw】随机抽取一个成员
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
        const team = new Team();

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

                seal.replyToSender(ctx, msg, team.bindTeam(groupId, val2, team.getTeamsData(groupId)));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'del': {
                if (!val2 && cmdArgs.kwargs.length == 0) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team del 队伍名字】删除队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                val2 = cmdArgs.getRestArgsFrom(2)

                seal.replyToSender(ctx, msg, team.delTeam(groupId, val2, cmdArgs.kwargs));
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'lst': {
                seal.replyToSender(ctx, msg, team.showTeamList(groupId))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'add': {
                ctx.delegateText = ''
                seal.replyToSender(ctx, msg, team.addMembers(groupId, atlst))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'rm': {
                ctx.delegateText = ''
                seal.replyToSender(ctx, msg, team.removeMembers(groupId, atlst, cmdArgs.kwargs))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'draw': {
                seal.replyToSender(ctx, msg, team.drawMember(groupId, ctx.endPoint.userId, msg.guildId))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'call': {
                seal.replyToSender(ctx, msg, team.callMembers(groupId, ctx.endPoint.userId, msg.guildId))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'show': {
                seal.replyToSender(ctx, msg, team.showAttrb(groupId, val2, ctx.endPoint.userId, msg.guildId))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'st': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team st 属性名】查看属性(修改属性)")
                    return seal.ext.newCmdExecuteResult(true);
                }

                seal.replyToSender(ctx, msg, team.setAttrb(groupId, val2, ctx.endPoint.userId, msg.guildId))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'sort': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team sort 属性名】对成员的该项属性排序")
                    return seal.ext.newCmdExecuteResult(true);
                }

                seal.replyToSender(ctx, msg, team.sortAttrb(groupId, val2, ctx.endPoint.userId, msg.guildId))
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
            seal.replyToSender(ctx, msg, team.callMembers(groupId, ctx.endPoint.userId, msg.guildId))
            return;
        }
        if (signWords.includes(message)) {
            const team = new Team();
            const call = team.getCallData(groupId);

            if (call.length == 0) return;

            const index = call.indexOf(ctx.player.userId)
            if (index !== -1) call.splice(index, 1);
            saveCallData(groupId, call)
            return;
        }
        if (sortWords.includes(message)) {
            const team = new Team();
            seal.replyToSender(ctx, msg, team.sortAttrb(groupId, 'dex', ctx.endPoint.userId, msg.guildId));
            return;
        }
    }

    // 将命令注册到扩展中
    ext.cmdMap['team'] = cmdteam;
    ext.cmdMap['tm'] = cmdteam;
    globalThis.team = new Team();
}