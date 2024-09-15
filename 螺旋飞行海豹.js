// ==UserScript==
// @name         螺旋飞行海豹
// @author       错误
// @version      1.0.0
// @description  使用.fly让你的海豹起飞吧！使用.seal来查看信息！
// @timestamp    1726307175
// 2024-09-14 17:46:15
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E8%9E%BA%E6%97%8B%E9%A3%9E%E8%A1%8C%E6%B5%B7%E8%B1%B9.js
// ==/UserScript==

let ext = seal.ext.find('flyseal');
if (!ext) {
    ext = seal.ext.new('flyseal', '错误', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
    seal.ext.registerIntConfig(ext, "初始耐力值", 20)
    const players = {}
    const playerlist = JSON.parse(ext.storageGet("playerlist") || '{}')

    class FlySeal {
        constructor(id, name) {
            this.id = id;
            this.name = name;
            this.spiral = 0
            this.maxSpiral = 0
            this.dex = Math.ceil(Math.random() * 6)
            this.str = Math.ceil(Math.random() * 6)
            this.endr = seal.ext.getIntConfig(ext, "初始耐力值")

            this.state = '无'
            this.package = {}
            this.meet = {}
        }

        // 从存储中获取数据并初始化玩家对象
        static getData(id) {
            try {
                let idData = JSON.parse(ext.storageGet(id) || '{}');
                let player = new FlySeal(id, idData.name)
                player.spiral = idData.spiral || 0
                player.maxSpiral = idData.maxSpiral || 0
                player.dex = idData.dex || Math.ceil(Math.random() * 6)
                player.str = idData.str || Math.ceil(Math.random() * 6)
                player.endr = idData.endr || seal.ext.getIntConfig(ext, "初始耐力值")
                player.state = idData.state || '无'
                player.package = idData.package || {}
                player.meet = idData.meet || {}

                players[id] = player
            } catch (error) {
                console.error(`Failed to initialize ${id}:`, error);
            }
        }

        // 保存玩家数据到存储
        saveData() {
            ext.storageSet(this.id, JSON.stringify(this));
        }

        fly() {
            this.endr -= 2
            this.meet = {}
            let text = `<${this.name}豹>起飞！消耗2点耐力值(${this.endr})，遇到了`

            //若耐力归零
            if (this.endr <= 0) {
                let spiral = this.spiral
                this.endr = seal.ext.getIntConfig(ext, "初始耐力值")
                this.state = '无'
                this.maxSpiral = Math.max(this.maxSpiral, this.spiral)
                this.spiral = 0
                this.saveData()
                return `<${this.name}豹>耐力值归零，螺旋结束了……本次螺旋记录:${spiral}`
            }

            let textMap = {
                "海面上一大片雾气": this.meetFog.bind(this),
                "海面下有什么波动": this.meetFish.bind(this),
                "一个巨大的恐怖漩涡！": this.meetVortex.bind(this),
                "一座诱人的小岛": this.meetIsland.bind(this)
            };

            let keys = Object.keys(textMap); // 先将键存储在一个数组中

            for (let i = 0; i < 2; i++) {
                let index = Math.floor(Math.random() * keys.length);
                let key = keys[index];
                let num = 0
                do num = num = Math.ceil(Math.random() * 99)
                while (this.meet.hasOwnProperty(num))
                this.meet[num] = textMap[key]
                text += `\n${num}.${key}`;
                keys.splice(index, 1); // 从数组中移除已经抽取的键
            }

            this.saveData()
            return text
        }

        /**检查状态并清空 */
        ckState() {
            if (this.state == '豹炸') {
                this.state = '无'
                this.dex -= 1
                return `【豹炸】状态结束，豹速-1(${this.dex})\n`
            }
            if (this.state == '豹怒') {
                this.state = '无'
                this.str -= 1
                return `【豹怒】状态结束，豹力-1(${this.str})\n`
            }
            return ''
        }

        //雾气：休息区，暴风雨
        meetFog() {
            let ran = Math.random()
            //休息区
            if (ran <= 0.18) {
                this.dex += 1
                return `飞到了平静的海域，豹速+1(${this.dex})！\n` + this.ckState()
            }
            //风暴
            else if (ran <= 0.9) {
                let ran = Math.random() * 6
                if (ran <= this.dex) {
                    this.endr -= 3
                    let increase = Math.ceil(Math.random() * this.dex)
                    this.spiral += increase
                    return `遇到了风暴，赶紧螺旋加速绕开了，消耗了2点耐力(${this.endr})，螺旋+${increase}(${this.spiral})！\n` + this.ckState()
                } else {
                    this.endr -= 4
                    return `遇到了风暴，不幸的是被卷进去了，消耗了4点耐力(${this.endr})\n` + this.ckState()
                }
            } else {
                this.endr += 3
                return `遇到了飞鱼群，饱餐一顿！回复了3点耐力(${this.endr})\n` + this.ckState()
            }
        }

        //水下有生物：鱼，海豚，鲨鱼
        meetFish() {
            let ran = Math.random()
            //海豚
            if (ran <= 0.18) {
                this.str += 1
                return `遇到了海豚的祝福！豹力+1(${this.str})！\n` + this.ckState()
            }
            //鲨鱼
            else if (ran <= 0.9) {
                let ran = Math.random() * 6
                if (ran <= this.str) {
                    this.endr -= 3
                    let increase = Math.ceil(Math.random() * this.str)
                    this.spiral += increase
                    return `遇到了鲨鱼！消耗了3点耐力(${this.endr})，战胜了鲨鱼！螺旋+${increase}(${this.spiral})！\n` + this.ckState()
                } else {
                    this.endr -= 4
                    return `遇到了鲨鱼！消耗了4点耐力(${this.endr})，逃脱了鲨鱼的追咬\n` + this.ckState()
                }
            }
            //鱼群
            else {
                this.endr += 3
                return `遇到了鱼群，饱餐一顿！回复了3点耐力(${this.endr})\n` + this.ckState()
            }
        }

        meetVortex() {
            let ran = Math.random() * 18
            if (ran <= this.dex + this.str) {
                this.dex += 1
                this.str += 1
                let increase = Math.ceil(Math.random() * (this.dex + this.str))
                this.spiral += increase
                return `在漩涡疯狂螺旋！豹速+1(${this.dex})！豹力+1(${this.str})！螺旋+${increase}(${this.spiral})！\n` + this.ckState()
            }
            else {
                this.endr -= 8
                return `被卷进了漩涡！消耗了8点耐力值(${this.endr})，堪堪逃了出来\n` + this.ckState()
            }
        }

        //小岛：宝藏、敌人
        meetIsland() {
            let ran = Math.random()
            //海市蜃楼
            if (ran <= 0.35) {
                this.endr -= 2
                return `<${this.name}豹>靠近后发现根本没有什么小岛，消耗了2点耐力(${this.endr})\n`
            }
            //小岛
            else if (ran <= 0.9) {
                if (Math.random() <= 0.5) {
                    let text = this.ckState()
                    this.state = '豹炸'
                    this.dex += 1
                    return text + `登陆小岛，遇到了野生的煤气罐！获得状态【豹炸】，豹速+1(${this.dex})持续一回合\n`
                } else {
                    let text = this.ckState()
                    this.state = '豹怒'
                    this.str += 1
                    return text + `登陆小岛，遇到了可恶的企鹅！获得状态【豹怒】，豹力+1(${this.str})持续一回合\n`
                }
            } else {
                this.endr += 3
                return `登陆小岛，遇到了好心人，饱餐一顿！回复了3点耐力(${this.endr})\n` + this.ckState()
            }
        }
    }

    for (let id in playerlist) if (!players.hasOwnProperty(id)) FlySeal.getData(id)

    /** 检查是否存在该玩家并加入游戏*/
    function ckId(id, name) {
        if (!playerlist.hasOwnProperty(id)) {
            const player = new FlySeal(id, name)
            players[id] = player
            players[id].saveData()
            playerlist[id] = getTime()
            ext.storageSet('playerlist', JSON.stringify(playerlist));
        }
    }

    /** 检查参数是否为数字并返回，若为all则返回ifAll，无效则返回0*/
    function ckNum(val, ifAll) {
        switch (val) {
            case '': return 0
            case 'all': return ifAll
            default: {
                val = parseInt(val)
                return isNaN(val) ? 0 : val
            }
        }
    }

    function getTime() {
        const now = new Date();
        const dateString = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/,/g, '');;
        const [date, time] = dateString.split(' ');
        const [month, day, year] = date.split('/');
        const [hours, minutes, seconds] = time.split(':');

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
    }

    const cmdfly = seal.ext.newCmdItemInfo();
    cmdfly.name = 'fly'; // 指令名字，可用中文
    cmdfly.help = '使用.fly开始游戏！\n使用.fly 选项数字 做出选择！\n使用.fly next 跳过本次选择！\n使用.fly end结束游戏！';
    cmdfly.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        const id = ctx.player.userId
        const name = ctx.player.name
        ckId(id, name)

        switch (val) {
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'end': {
                players[id].endr = 0
                seal.replyToSender(ctx, msg, players[id].fly());
                return
            }
            case 'next': {
                seal.replyToSender(ctx, msg, players[id].fly());
                return
            }
            default: {
                if (Object.keys(players[id].meet).length == 0) {
                    players[id].dex = Math.ceil(Math.random() * 6)
                    players[id].str = Math.ceil(Math.random() * 6)
                    players[id].endr = seal.ext.getIntConfig(ext, "初始耐力值")
                    let text = `豹速:${players[id].dex} | 豹力:${players[id].str}\n`
                    seal.replyToSender(ctx, msg, text + players[id].fly());
                    return
                }

                if (!val) {
                    const ret = seal.ext.newCmdExecuteResult(true);
                    ret.showHelp = true;
                    return ret;
                }

                if (!Object.keys(players[id].meet).includes(val)) {
                    seal.replyToSender(ctx, msg, '没有这个选项');
                    return
                }

                seal.replyToSender(ctx, msg, players[id].meet[val]() + players[id].fly());
                return
            }
        }
    };

    const cmdseal = seal.ext.newCmdItemInfo();
    cmdseal.name = 'seal'; // 指令名字，可用中文
    cmdseal.help = '【.seal info】查看你的个豹信息\n【.seal 排行榜】查看螺旋飞行排行榜\n【.seal name 名字】改名';
    cmdseal.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        const id = ctx.player.userId
        const name = ctx.player.name
        ckId(id, name)

        switch (val) {
            case 'info': {
                const player = players[id]
                let title = `<${player.name}豹>
螺旋纪录:${player.maxSpiral}
状态:${player.state}
豹速:${player.dex} | 豹力:${player.str}
耐力值:${player.endr} | 螺旋:${player.spiral}`
                seal.replyToSender(ctx, msg, title);
                return;
            }
            case '排行榜':
            case 'chart': {
                let spiral = {}
                for (let id in playerlist) spiral[id] = players[id].maxSpiral

                let arr = Object.keys(spiral).sort(function (a, b) { return spiral[b] - spiral[a] })

                let title = `螺旋飞行排行榜\n♚`
                for (let i = 0; i < arr.length && i < 10; i++) {
                    let id = arr[i]
                    title += `第${i + 1}名：\n<${players[id].name}豹>  ${spiral[id]}\n`
                }

                let index = arr.indexOf(id)
                title += `我的纪录：${players[id].maxSpiral} 第${index + 1}名`

                seal.replyToSender(ctx, msg, title)
                return;
            }
            case 'name': {
                players[id].name = val2
                players[id].saveData()

                seal.replyToSender(ctx, msg, `${players[id].name}豹！螺旋起飞！`);
                return;
            }
            default: {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
        }
    };
    // 将命令注册到扩展中
    ext.cmdMap['seal'] = cmdseal;
    ext.cmdMap['fly'] = cmdfly;
}