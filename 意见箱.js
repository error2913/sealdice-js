// ==UserScript==
// @name         意见箱
// @author       错误
// @version      1.0.1
// @description  使用 .意见 来获取帮助。\n这是一个提供给用户提意见的插件，它能储存和管理用户提交的意见。插件接收到的意见不像 .send 那样具有时效性，所以不用担心会打扰到骰主的好梦，从而让用户没有后顾之忧地提出意见。
// @timestamp    1732016949
// 2024-11-19 19:49:09
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/意见箱.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/意见箱.js
// ==/UserScript==

let ext = seal.ext.find('意见箱');
if (!ext) {
    ext = seal.ext.new('意见箱', '错误', '1.0.1');
    seal.ext.register(ext);

    seal.ext.registerIntConfig(ext, '意见箱通知上限', 100, '意见箱内意见达到上线后会向通知列表发送提醒')

    let data = [];
    try {
        data = JSON.parse(ext.storageGet('data') || '[]');

        if (!Array.isArray(data)) {
            throw new Error('data不是数组');
        }
    } catch (err) {
        console.error(`在获取data时出错:${err}`);
    }

    const box = data;

    function saveData() {
        ext.storageSet('data', JSON.stringify(box));
    }

    function getSuggestions(ids) {
        const suggestions = [];

        for (let i = 0; i < ids.length; i++) {
            const id = parseInt(ids[i]);

            if (isNaN(id)) {
                const s = `${id}不是数字`;
                suggestions.push(s);
                continue;
            }

            const index = box.findIndex(item => item.id === id);
            if (index == -1) {
                const s = `编号为${id}的意见不存在`;
                suggestions.push(s);
                continue;
            }

            const item = box.splice(index, 1)[0];

            suggestions.push(item.s);
        }

        return suggestions;
    }

    function deleteSuggestions(ids) {
        let n = 0;

        for (let i = 0; i < ids.length; i++) {
            const id = parseInt(ids[i]);

            if (isNaN(id)) {
                continue;
            }

            const index = box.findIndex(item => item.id === id);
            if (index == -1) {
                continue;
            }

            box.splice(index, 1);

            n++;
        }

        return n;
    }

    function getRandSuggestions(n) {
        const suggestions = [];

        for (let i = 0; i < n; i++) {
            const index = Math.floor(Math.random() * box.length);
            const item = box.splice(index, 1)[0];

            suggestions.push(item.s);
        }

        return suggestions;
    }

    function showBox() {
        const pageSize = 10;
        const totalPages = Math.ceil(box.length / pageSize);
        const pages = [];

        let arr = [];

        for (let i = 0; i < box.length; i++) {
            const item = box[i];

            const s = `${item.id}.【${item.title}】`;

            arr.push(s);

            if (i % pageSize === pageSize - 1 || i === box.length - 1) {
                const pageNum = i === 0 ? 1 : Math.ceil(i / pageSize);

                const s = `意见箱列表:\n` + arr.join('\n') + `\n第${pageNum}/${totalPages}页`;
                pages.push(s);
                arr = [];
            }
        }

        return pages;
    }

    function createNewId() {
        if (box.length === 0) {
            return 1;
        }

        return box[box.length - 1].id + 1;
    }

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = '意见';
    cmd.help = `帮助:
【.意见 <简短标题> <内容>】向意见箱提交意见
【.意见 查看】查看当前意见箱列表
【.意见 清空】清空意见箱
【.意见 查看 ...<编号>】查看编号对应的意见
【.意见 删除 ...<编号>】删除编号对应的意见
【.意见 查看 随机 <数量=1>】随机几条意见`;
    cmd.solve = (ctx, msg, cmdArgs) => {
        const val = cmdArgs.getArgN(1);
        const ret = seal.ext.newCmdExecuteResult(true);
        switch (val) {
            case '':
            case 'help': {
                if (ctx.privilegeLevel < 100) {
                    const s = `帮助:向意见箱提交意见\n【.意见 <简短标题> <内容>】`;

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }
                
                ret.showHelp = true;
                return ret;
            }
            case '查看': {
                if (ctx.privilegeLevel < 100) {
                    const s = seal.formatTmpl(ctx, "核心:提示_无权限");

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                if (box.length === 0) {
                    const s = `意见箱为空`;

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                const val2 = cmdArgs.getArgN(2);
                switch (val2) {
                    case '': {
                        const pages = showBox();

                        for (let i = 0; i < pages.length; i++) {
                            const s = pages[i];

                            setTimeout(() => {
                                seal.replyToSender(ctx, msg, s);
                            }, i * 2000);
                        }

                        saveData();
                        return ret;
                    }
                    case '随机': {
                        let count = parseInt(cmdArgs.getArgN(3));
                        
                        if (isNaN(count) || count <= 0) {
                            count = 1;
                        }

                        if (count > box.length) {
                            count = box.length;
                        }

                        if (count > 10) {
                            const s = `数量过大，请输入10以内的数字`;

                            seal.replyToSender(ctx, msg, s);
                            return ret;
                        }

                        const suggestions = getRandSuggestions(count);

                        for (let i = 0; i < suggestions.length; i++) {
                            const s = suggestions[i];

                            setTimeout(() => {
                                seal.replyToSender(ctx, msg, s);
                            }, i * 2000);
                        }

                        saveData();
                        return ret;
                    }
                    default: {
                        const ids = cmdArgs.args.slice(1);
                        const suggestions = getSuggestions(ids);

                        if (ids.length > 10) {
                            const s = `数量过大，最多为10条`;

                            seal.replyToSender(ctx, msg, s);
                            return ret;
                        }

                        for (let i = 0; i < suggestions.length; i++) {
                            const s = suggestions[i];

                            setTimeout(() => {
                                seal.replyToSender(ctx, msg, s);
                            }, i * 2000);
                        }

                        saveData();
                        return ret;
                    }
                }
            }
            case '清空': {
                if (ctx.privilegeLevel < 100) {
                    const s = seal.formatTmpl(ctx, "核心:提示_无权限");

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                if (box.length === 0) {
                    const s = `意见箱为空`;

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                const n = box.length;
                box.length = 0;

                const s = `已删除${n}条意见`;
                seal.replyToSender(ctx, msg, s);
                saveData();
                return ret;
            }
            case '删除': {
                if (ctx.privilegeLevel < 100) {
                    const s = seal.formatTmpl(ctx, "核心:提示_无权限");

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                if (box.length === 0) {
                    const s = `意见箱为空`;

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                const ids = cmdArgs.args.slice(1);
                const n = deleteSuggestions(ids);

                const s = `已删除${n}条意见`;
                seal.replyToSender(ctx, msg, s);
                saveData();
                return ret;
            }
            default: {
                const title = val;
                const content = cmdArgs.getRestArgsFrom(2);

                if (title.length > 12) {
                    const s = `标题过长，请输入12字符以内的标题`;

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                if (content.length > 300) {
                    const s = `内容过长，请输入300字符以内的内容`;

                    seal.replyToSender(ctx, msg, s);
                    return ret;
                }

                const id = createNewId();

                const prefix = ctx.isPrivate ? `` : `来自群${ctx.group.groupId.replace(/\D+/, '')},`;
                const info = prefix + `${ctx.player.name}(${ctx.player.userId}):\n`;

                const s = info + `${id}.【${title}】\n` + content;

                const item = {
                    id: id,
                    title: title,
                    s: s
                }

                box.push(item);

                const limit = seal.ext.getIntConfig(ext,  '意见箱通知上限');
                if (box.length >= limit) {
                    ctx.notice('意见箱已满，请及时清理')
                }

                saveData();
                seal.replyToSender(ctx, msg, `意见箱提交成功，编号为${id}`);
                return ret;
            }
        }
    };
    ext.cmdMap['意见'] = cmd;
}