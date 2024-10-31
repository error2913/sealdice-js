// ==UserScript==
// @name         消息合并
// @author       错误
// @version      1.0.1
// @description  手机QQ不能进行复杂的图文混排？！没关系，我帮你合并！使用 .合 获取帮助！
// @timestamp    1730121013
// 2024-10-28 21:10:13
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('消息合并');
if (!ext) {
    ext = seal.ext.new('消息合并', '错误', '1.0.1');
    // 注册扩展
    seal.ext.register(ext);

    const data = {};

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = '合'; // 指令名字，可用中文
    cmd.help = '使用 .合 数字，就可以将后面指定条消息合成一条！\n使用 .合停，就可以暂停！';
    cmd.solve = (ctx, msg, cmdArgs) => {
        const userId = ctx.player.userId
        const groupId = ctx.group.groupId
        const id = ctx.isPrivate ? userId : groupId;

        let val = cmdArgs.getArgN(1);
        switch (val) {
            case '':
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case '停': {
                if (!data[id]) {
                    seal.replyToSender(ctx, msg, '没有正在进行的合并！')
                    return;
                }

                seal.replyToSender(ctx, msg, data[id].text.join(''));
                delete data[id];
                seal.replyToSender(ctx, msg, '合并已暂停！');
                return;
            }
            default: {
                const num = parseInt(val)
                if (isNaN(num) || num < 2) {
                    seal.replyToSender(ctx, msg, '请输入大于一的数字！');
                    return seal.ext.newCmdExecuteResult(true)
                }

                data[id] = {
                    num: num,
                    text: []
                }
                
                seal.replyToSender(ctx, msg, `合并已开启！目标，${num}条！`);
                return seal.ext.newCmdExecuteResult(true);
            }
        }
    };
    ext.cmdMap['合'] = cmd;

    ext.onNotCommandReceived = (ctx, msg) => {
        const userId = ctx.player.userId
        const groupId = ctx.group.groupId
        const id = ctx.isPrivate ? userId : groupId;

        if (!data[id]) {
            return;
        }

        data[id].text.push(msg.message);
        seal.replyToSender(ctx, msg, `已收到${data[id].text.length}条！目标，${data[id].num}条！`);

        if (data[id].text.length >= data[id].num) {
            seal.replyToSender(ctx, msg, data[id].text.join(''));
            delete data[id];
        }

        return;
    }
}