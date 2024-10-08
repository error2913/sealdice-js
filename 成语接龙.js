// ==UserScript==
// @name         成语接龙
// @author       错误
// @version      1.1.0
// @description  嘻嘻，谢谢白鱼找到的api，帮助：\n【.成语接龙】随机起头\n【.成语接龙 成语】起头\n【.成语接龙 结束】结束游戏\n【.成语接龙 查询 成语】成语解释\n【.成语接龙 排行榜】\n【接成语】进行接龙\n【接不了】给出提示
// @timestamp    1726072304
// 2024-09-05 15:43:43
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E6%88%90%E8%AF%AD%E6%8E%A5%E9%BE%99.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('idiom');
if (!ext) {
    ext = seal.ext.new('idiom', '错误', '1.1.0');
    seal.ext.register(ext);

    seal.ext.registerIntConfig(ext, "最大提示次数", 3)
    seal.ext.registerBoolConfig(ext, "能否重复", false)
    //seal.ext.registerBoolConfig(ext, "是否开启计时器", true)

    const chart = JSON.parse(ext.storageGet("chart") || '{}')
    if (!chart.hasOwnProperty('lst')) chart.lst = []

    const data = {}
    const apiUrl = 'https://api.tangdouz.com/cy.php';

    class Game {
        constructor() {
            this.lst = [];
            this.hintNum = 0;
            this.timer = null;
        }

        async getRandom(ctx, msg) {
            let id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;

            try {
                // 使用fetch发送GET请求
                const response = await fetch(`${apiUrl}?fs=1`);
                // 检查响应是否成功
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                console.log(JSON.stringify(response))

                const text = await response.text();
                this.lst.push(text);
                seal.replyToSender(ctx, msg, `游戏开始：${text}`);
            } catch (error) {
                // 处理错误
                console.error('请求失败:', error);
            }
        }

        async getNext(ctx, msg, idiom) {
            let id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;
            let name = ctx.isPrivate? ctx.player.name : ctx.group.groupName;

            if (idiom == '不了') {
                if (this.hintNum >= seal.ext.getIntConfig(ext, "最大提示次数")) {
                    seal.replyToSender(ctx, msg, `你输了，${this.end(id, name)}`);
                    return;
                }

                this.hintNum += 1;
                idiom = this.lst[this.lst.length - 1];
                this.lst = this.lst.slice(0, -1)
            } else {
                if (this.lst.includes(idiom) && !seal.ext.getBoolConfig(ext, "能否重复")) {
                    seal.replyToSender(ctx, msg, `${idiom} 已经说过啦！`);
                    return;
                }
                if (!await this.ckIdiom(idiom)) {
                    if (await findIdiom(idiom) == '不存在该成语') {
                        seal.replyToSender(ctx, msg, `${idiom} 不是一个成语，换一个吧`);
                        return;
                    }
                    seal.replyToSender(ctx, msg, `这接不上 ${this.lst[this.lst.length - 1]}，换一个吧`)
                    return;
                }
            }


            try {
                // 使用fetch发送GET请求
                const response = await fetch(`${apiUrl}?fs=3&nr=${idiom}`);
                // 检查响应是否成功
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                console.log(JSON.stringify(response))

                const text = await response.text();
                switch (text) {
                    case 'no': {
                        seal.replyToSender(ctx, msg, `这不是成语，换一个吧`);
                        return
                    }
                    case '无': {
                        seal.replyToSender(ctx, msg, `你赢了，${this.end(id, name)}`);
                        return
                    }
                    default: {
                        if (this.lst.includes(text) && !seal.ext.getBoolConfig(ext, "能否重复")) {
                            seal.replyToSender(ctx, msg, `你赢了，${this.end(id, name)}`);
                            return;
                        }
                        this.lst.push(idiom);
                        this.lst.push(text);
                        seal.replyToSender(ctx, msg, `接${text}`);
                    }
                }
            } catch (error) {
                // 处理错误
                console.error('请求失败:', error);
            }
        }

        async ckIdiom(idiom) {
            if (this.lst.length == 0) return true;

            try {
                // 使用fetch发送GET请求
                const response = await fetch(`${apiUrl}?fs=4&shou=${this.lst[this.lst.length - 1]}&nr=${idiom}`);
                // 检查响应是否成功
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                console.log(JSON.stringify(response))

                const text = await response.text();
                console.log(text)

                return text == 'no' ? false : true;
            } catch (error) {
                // 处理错误
                console.error('请求失败:', error);
                return false;
            }
        }

        /**清除计时器，并设置新的 */
        async stTimer() { }

        /**结束游戏 */
        end(id, name) {
            let num = Math.floor((this.lst.length - this.hintNum) / 2)
            delete data[id]
            updChart(name, num)
            return `该局游戏一共接了${this.lst.length}个成语，玩家接了${num}个成语，提示次数为${this.hintNum}`
        }
    }

    async function findIdiom(idiom) {
        try {
            // 使用fetch发送GET请求
            const response = await fetch(`${apiUrl}?nr=${idiom}`);
            // 检查响应是否成功
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            console.log(JSON.stringify(response))

            const text = await response.text();
            return text;
        } catch (error) {
            // 处理错误
            console.error('请求失败:', error);
            return `error`
        }
    }


    /**更新排行榜 */
    function updChart(name, num) {
        let lst = chart.lst
        let index = lst.findIndex(item => item.name == name)
        if (index == -1) lst.push({ name: name, num: num })
        else lst[index].num = Math.max(lst[index].num, num)
        lst.sort((a, b) => b.num - a.num);
        chart.lst = lst.slice(0, 10)
        ext.storageSet("chart", JSON.stringify(chart))
    }

    const cmdIdiom = seal.ext.newCmdItemInfo();
    cmdIdiom.name = '成语接龙'; // 指令名字，可用中文
    cmdIdiom.help = `帮助\n【.成语接龙】随机起头\n【.成语接龙 成语】起头\n【.成语接龙 结束】结束游戏\n【.成语接龙 查询 成语】成语解释\n【.成语接龙 排行榜】\n【接成语】进行接龙\n【接不了】给出提示`;
    cmdIdiom.solve = async (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        let id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;
        let name = ctx.isPrivate? ctx.player.name : ctx.group.groupName;
        switch (val) {
            case 'help': {
                seal.replyToSender(ctx, msg, `帮助\n【.成语接龙】随机起头\n【.成语接龙 成语】起头\n【.成语接龙 结束】结束游戏\n【.成语接龙 查询 成语】成语解释\n【.成语接龙 排行榜】\n【接成语】进行接龙\n【接不了】给出提示`);
                return;
            }
            case 'find':
            case '查询': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, '请输入成语！');
                    return;
                }
                seal.replyToSender(ctx, msg, (await findIdiom(val2)).replace(/r/g, 'n'));
                return;
            }
            case 'end':
            case '结束': {
                if (!data.hasOwnProperty(id)) {
                    seal.replyToSender(ctx, msg, `没有正在进行的游戏！`);
                    return;
                }

                seal.replyToSender(ctx, msg, data[id].end(id, name));
                return;
            }
            case 'chart':
            case '排行榜': {
                if (chart.lst.length == 0) {
                    seal.replyToSender(ctx, msg, '没有排行榜！');
                    return;
                }

                let lst = chart.lst
                let text = `成语接龙排行榜\n————————————\n♚`
                for (let i = 0; i < lst.length; i++) text += `第 ${i + 1} 名: ${lst[i].name}\n${lst[i].num}接\n`
                seal.replyToSender(ctx, msg, text);
                return;
            }
            default: {
                if (data.hasOwnProperty(id)) {
                    let lst = data[id].lst
                    seal.replyToSender(ctx, msg, `当前有正在进行的游戏！\n当前成语：${lst[lst.length - 1]}`);
                    return;
                }


                if (!val) {
                    let game = new Game()
                    await game.getRandom(ctx, msg)
                    data[id] = game
                    return;
                } else {
                    if (await findIdiom(val) == '不存在该成语') {
                        seal.replyToSender(ctx, msg, `${val} 不是一个成语，换一个吧`);
                        return;
                    }
                    let game = new Game()
                    await game.getNext(ctx, msg, val)
                    data[id] = game
                    return;
                }
            }
        }
    };
    // 将命令注册到扩展中
    ext.cmdMap['成语接龙'] = cmdIdiom;
    ext.cmdMap['cyjl'] = cmdIdiom;

    ext.onNotCommandReceived = async (ctx, msg) => {
        if (msg.message.includes('接')) {
            let id = ctx.isPrivate ? ctx.player.userId : ctx.group.groupId;
            if (data.hasOwnProperty(id)) {
                let match = msg.message.match(/^接(.*)/);
                if (!match || !match[1]) return;
                data[id].getNext(ctx, msg, match[1]);
                return;
            }
        }
    }
}