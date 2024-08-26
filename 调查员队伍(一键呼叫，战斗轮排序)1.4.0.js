// ==UserScript==
// @name         team call
// @author       错误
// @version      1.4.0
// @description  .team 获取帮助。在其他框架看到类似的插件，找了一下发现海豹似乎没有，故自己写一个。1.1更新：添加了定时器功能，呼叫后未在限定时间回复的成员将被提及。1.2更新：添加了查看队伍属性功能。在重载插件后，需要队伍成员在群里发言过一次，否则会出现难以理解的bug。1.3更新：添加了设置全队属性的功能和一些配置项。1.4更新：添加了战斗轮排序功能。
// @timestamp    1724468302
// 2024-08-24 10:58:22
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('teamcall');
if (!ext) {
    ext = seal.ext.new('teamcall', '错误（2913949387）', '1.4.0');
    seal.ext.register(ext);
    const data = JSON.parse(ext.storageGet("data") || '{}')
    if (!data.hasOwnProperty('call')) data['call'] = {}

    seal.ext.registerStringConfig(ext, '呼叫队伍里所有成员前缀语', '下面的人来跑团啦！请在限定时间{{时间限制}}s内回复“到”：')
    seal.ext.registerStringConfig(ext, '展示成员前缀语', '成员如下')
    seal.ext.registerStringConfig(ext, '展示属性前缀语', '属性如下')
    seal.ext.registerStringConfig(ext, '排序前缀语', '排序如下')
    seal.ext.registerStringConfig(ext, '添加成员回复', '成功添加{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。')
    seal.ext.registerStringConfig(ext, '删除成员回复', '成功删除{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。')
    seal.ext.registerStringConfig(ext, '队伍为空', '队伍里没有成员。')
    seal.ext.registerStringConfig(ext, '清空队伍', '队伍已清空。')
    seal.ext.registerStringConfig(ext, '属性设置回复', '全队属性设置成功')
    seal.ext.registerStringConfig(ext, '非指令呼叫全队', '开团了')
    seal.ext.registerStringConfig(ext, '开始战斗轮排序', '（战斗轮开始）')
    seal.ext.registerStringConfig(ext, '签到', '到')
    seal.ext.registerIntConfig(ext, '呼叫时间限制（s）', 60)
    seal.ext.registerIntConfig(ext, '使用指令所需权限', 50)

    const cmdteam = seal.ext.newCmdItemInfo();
    cmdteam.name = 'team';
    cmdteam.help = '帮助：\n【.team add@xx@xxx...】添加若干成员\n【.team del@xx@xxx...】删除若干成员\n【.team clr】清除队伍\n【.team call】调查员集结！\n【.team lst】成员列表\n【.team show (属性名)】查看属性（可能出现属性全为0的异常情况，队伍中成员在群内发送任意消息可解决）\n【.team st 属性名】数值设置全队属性\n【.team sort 属性名】对成员的该项属性排序';
    cmdteam.allowDelegate = true;
    cmdteam.solve = (ctx, msg, cmdArgs) => {
        if (ctx.privilegeLevel < seal.ext.getIntConfig(ext, "使用指令所需权限") || ctx.isPrivate) return;
        
        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        let val3 = cmdArgs.getArgN(3);
        let groupId = ctx.group.groupId
        if (!data.hasOwnProperty(groupId)) data[groupId] = []

        //获取所有被@的人
        let ctxlst = []
        let pos = 1
        let mctx = seal.getCtxProxyFirst(ctx, cmdArgs)
        while (mctx && mctx.player.userId != ctx.player.userId) {
            let sign = false
            for (let ctx of ctxlst) {
                if (mctx.player.userId == ctx.player.userId) {
                    sign = true
                    break;
                }
            }
            if (!sign) ctxlst.push(mctx)
            mctx = seal.getCtxProxyAtPos(ctx, cmdArgs, pos)
            pos++;
        }


        switch (val) {
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'add': {
                for (let mctx of ctxlst) {
                    let sign = false
                    for (let ctx of data[groupId]) {
                        if (mctx.player.userId == ctx.player.userId) {
                            sign = true
                            break;
                        }
                    }
                    if (!sign) data[groupId].push(mctx)
                }
                let text = seal.ext.getStringConfig(ext, "添加成员回复")
                text = text.replace('{{被@的长度}}',ctxlst.length)
                text = text.replace('{{当前人数}}',data[groupId].length)
                seal.replyToSender(ctx, msg, text)
                ext.storageSet("data", JSON.stringify(data))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'del': {
                data[groupId] = data[groupId].filter(ctx => !ctxlst.some(mctx => mctx.player.userId == ctx.player.userId))
                let text = seal.ext.getStringConfig(ext, "删除成员回复")
                text = text.replace('{{被@的长度}}',ctxlst.length)
                text = text.replace('{{当前人数}}',data[groupId].length)
                seal.replyToSender(ctx, msg, text)
                ext.storageSet("data", JSON.stringify(data))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'clr': {
                data[groupId] = []
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "清空队伍"))
                ext.storageSet("data", JSON.stringify(data))
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'call': {
                if (data[groupId].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }
                let text = seal.ext.getStringConfig(ext, "呼叫队伍里所有成员前缀语")
                text = text.replace('{{时间限制}}',seal.ext.getIntConfig(ext, "呼叫时间限制（s）"))
                for (let mctx of data[groupId]) text += `\n[CQ:at,qq=${mctx.player.userId.replace(/\D+/g, "")}]`;
                seal.replyToSender(ctx, msg, text)

                data['call'][groupId] = data[groupId]
                setTimeout(() => {
                    let text = `应到${data[groupId].length}人，实到${data[groupId].length - data['call'][groupId].length}人，未到${data['call'][groupId].length}人。未到如下：`
                    for (let mctx of data['call'][groupId]) text += `\n[CQ:at,qq=${mctx.player.userId.replace(/\D+/g, "")}]`;
                    seal.replyToSender(ctx, msg, text)
                    delete data['call'][groupId];
                    ext.storageSet("data", JSON.stringify(data))
                    return;
                },seal.ext.getIntConfig(ext, "呼叫时间限制（s）") * 1000)
            }
            case 'lst': {
                if (data[groupId].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }
                let text = seal.ext.getStringConfig(ext, "展示成员前缀语")
                for (let mctx of data[groupId]) text += `\n${mctx.player.name}`;
                seal.replyToSender(ctx, msg, text)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'show': {
                if (data[groupId].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }
                
                let text = seal.ext.getStringConfig(ext, "展示属性前缀语")
                if (val2) for (let mctx of data[groupId]) text += `\n${mctx.player.name} ${val2}${seal.vars.intGet(mctx, val2)[0]}`;
                else for (let mctx of data[groupId]) text += `\n${mctx.player.name} hp${seal.vars.intGet(mctx, 'hp')[0]}/${Math.floor((seal.vars.intGet(mctx, 'con')[0] + seal.vars.intGet(mctx, 'siz')[0])/10)} san${seal.vars.intGet(mctx, 'san')[0]}/${seal.vars.intGet(mctx, 'pow')[0]} dex${seal.vars.intGet(mctx, 'dex')[0]}`;
                seal.replyToSender(ctx, msg, text)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'sort': {
                if (data[groupId].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误")
                    return seal.ext.newCmdExecuteResult(true);
                }
                
                let text = seal.ext.getStringConfig(ext, "排序前缀语")
                data[groupId].sort(function (a, b) { return seal.vars.intGet(b, val2)[0] - seal.vars.intGet(a, val2)[0] })
                for (let mctx of data[groupId]) text += `\n${mctx.player.name} ${val2}${seal.vars.intGet(mctx, val2)[0]}`;
                
                seal.replyToSender(ctx, msg, text)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'st': {
                if (data[groupId].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }
                if(!val3){
                    seal.replyToSender(ctx, msg, "参数错误")
                    return seal.ext.newCmdExecuteResult(true);
                }

                for (let mctx of data[groupId]) {
                    seal.vars.intSet(mctx, val2, parseInt(val3))
                }
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "属性设置回复"))
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
        let message = msg.message
        let groupId = ctx.group.groupId

        //重载后会有bug，这段用于更新team成员的ctx
        if (data.hasOwnProperty(groupId)){
            let exist = data[groupId].find(mctx => mctx.player.userId == ctx.player.userId);
            if (exist) {
                data[groupId] = data[groupId].filter(mctx => ctx.player.userId != mctx.player.userId)
                data[groupId].push(ctx)
            }   
        }

        if (message == seal.ext.getStringConfig(ext, "非指令呼叫全队")) {
            if (ctx.privilegeLevel < seal.ext.getIntConfig(ext, "使用指令所需权限") || ctx.isPrivate) return;
            if (!data.hasOwnProperty(groupId)) data[groupId] = []
            if (data[groupId].length == 0) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                return seal.ext.newCmdExecuteResult(true);
            }
            let text = seal.ext.getStringConfig(ext, "呼叫队伍里所有成员前缀语")
            text = text.replace('{{时间限制}}',seal.ext.getIntConfig(ext, "呼叫时间限制（s）"))
            for (let mctx of data[groupId]) text += `\n[CQ:at,qq=${mctx.player.userId.replace(/\D+/g, "")}]`;
            seal.replyToSender(ctx, msg, text)

            data['call'][groupId] = data[groupId]
            setTimeout(() => {
                let text = `应到${data[groupId].length}人，实到${data[groupId].length - data['call'][groupId].length}人，未到${data['call'][groupId].length}人。未到如下：`
                for (let mctx of data['call'][groupId]) text += `\n[CQ:at,qq=${mctx.player.userId.replace(/\D+/g, "")}]`;
                seal.replyToSender(ctx, msg, text)
                delete data['call'][groupId];
                ext.storageSet("data", JSON.stringify(data))
                return;
            },seal.ext.getIntConfig(ext, "呼叫时间限制（s）") * 1000)
        }
        if (message == seal.ext.getStringConfig(ext, "签到")){
            if (!data['call'].hasOwnProperty(groupId)) return;
            data['call'][groupId] = data['call'][groupId].filter(mctx => mctx.player.userId != ctx.player.userId)
            ext.storageSet("data", JSON.stringify(data))
            return;
        }
        if (message == seal.ext.getStringConfig(ext, "开始战斗轮排序")){
            if (ctx.privilegeLevel < seal.ext.getIntConfig(ext, "使用指令所需权限") || ctx.isPrivate) return;

            if (data[groupId].length == 0) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                return seal.ext.newCmdExecuteResult(true);
            }
            
            let text = seal.ext.getStringConfig(ext, "排序前缀语")
            data[groupId].sort(function (a, b) { return seal.vars.intGet(b, 'dex')[0] - seal.vars.intGet(a, 'dex')[0] })
            for (let mctx of data[groupId]) text += `\n${mctx.player.name} dex${seal.vars.intGet(mctx, 'dex')[0]}`;
            
            seal.replyToSender(ctx, msg, text)
            return seal.ext.newCmdExecuteResult(true);
        }
    }

    // 将命令注册到扩展中
    ext.cmdMap['team'] = cmdteam;
}