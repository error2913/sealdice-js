// ==UserScript==
// @name         多骰联合延迟测试
// @author       错误
// @version      1.0.0
// @description  需要先用【.乒乓 set main @要设置的骰子】设置一个主机。使用【.乒乓 @骰子】获取帮助。主机需要加载依赖：错误:team:>=4.0.0
// @timestamp    1737173515
// 2025-01-18 12:11:55
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/ping_auto.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/ping_auto.js
// ==/UserScript==

let ext = seal.ext.find('ping_auto');
if (!ext) {
    ext = seal.ext.new('ping_auto', '错误', '1.0.0');
    seal.ext.register(ext);
    seal.ext.registerStringConfig(ext, '定时任务cron表达式', '0 */4 * * *', '修改后保存并重载js');
    seal.ext.registerIntConfig(ext, '超时时间/s', 60, '修改后保存并重载js');
    seal.ext.registerIntConfig(ext, '一级test延时/ms', 3000, '修改后保存并重载js');
    seal.ext.registerIntConfig(ext, '二级test延时/ms', 1000, '修改后保存并重载js');
}

const data = {};
const list = JSON.parse(ext.storageGet(`list`) || '[]');
const cron = seal.ext.getStringConfig(ext, '定时任务cron表达式');
const timeout = seal.ext.getIntConfig(ext, '超时时间/s') * 1000;
const interval1 = seal.ext.getIntConfig(ext, '一级test延时/ms');
const interval2 = seal.ext.getIntConfig(ext, '二级test延时/ms');

seal.ext.registerTask(ext, "cron", cron, () => {
    for (let i = 0; i < list.length; i++) {
       const { gid, epId } = list[i];
       const msg = getMsg(gid, epId);
       const ctx = getCtx(epId, msg);
       const ping = Ping.getPing(gid);

       start(ctx, msg, gid, ping);
    }
});

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


function start(ctx, msg, gid, ping) {
    const team = teamManager.getTeamList(gid)[0];
    if (team.members.length < 2) {
        seal.replyToSender(ctx, msg, '骰数不足，无法进行测试');
        return seal.ext.newCmdExecuteResult(true);
    }
    ping.members = team.members;
    ping.data = [];
    for (let i = 0; i < ping.members.length; i++) {
        ping.data.push(new Array(ping.members.length - i).fill(0));
    }
    ping.incomplete = ping.members.length;

    test1(ctx, msg, ping, 0);
}

function test1(ctx, msg, ping, index) {
    setTimeout(() => {
        const text = ping.members.slice(index).map(item => `[CQ:at,qq=${item.replace(/\D+/g, '')}]`).join(' ');
        ping.data[0][index] = Date.now();
        seal.replyToSender(ctx, msg, `.乒乓 test1 ${text}`);
    
        ping.timeoutId = setTimeout(() => {
            const lost_uid = ping.members[index];
    
            teamManager.remove(ctx, [lost_uid], []);
            seal.replyToSender(ctx, msg, `.乒乓 stop [CQ:at,qq=${lost_uid.replace(/\D+/g, '')}]失踪了，移除后重新进行检测`);
    
            start(ctx, msg, gid, ping);
        }, timeout);
    
        Ping.savePing(gid);
    }, interval1);
}

function test2(ctx, msg, ping, index) {
    setTimeout(() => {
        ping.row[index] = Date.now();
        seal.replyToSender(ctx, msg, `.乒乓 test2 [CQ:at,qq=${ping.members[index].replace(/\D+/g, '')}]`);
    
        ping.timeoutId = setTimeout(() => {
            seal.replyToSender(ctx, msg, `.乒乓 timeout [CQ:at,qq=${ping.members[index].replace(/\D+/g, '')}]`);
            Ping.savePing(gid);
        }, timeout);
    
        Ping.savePing(gid);
    }, interval2);
}

function settlement(ctx, msg, ping) {
    const result = ping.calculate();
    const text = result.map((item, index) => {
        if (index === 0) {
            return `[CQ:at,qq=${ctx.endPoint.userId.replace(/\D+/g, '')}]: ${item}ms`;
        }
        return `[CQ:at,qq=${ping.members[index - 1].replace(/\D+/g, '')}]: ${item}ms`
    }).join('\n');
    seal.replyToSender(ctx, msg, `结果:\n${text}`);
}

class Ping {
    constructor() {
        this.main = false;
        this.members = []; // n个成员
        this.incomplete = 0; // 未完成的成员数
        this.row = []; // 一级从机获取的数据
        this.data = [];// [[1, ..., n], [2,..., n], ..., [n]]
        this.matrix = [];
        this.timeoutId = null;
    }

    static parse(data) {
        const ping = new Ping();
        ping.main = data.main || false;
        ping.members = data.members || [];
        ping.incomplete = data.incomplete || 0;
        ping.row = data.row || [];
        ping.data = data.data || [];
        ping.matrix = data.matrix || [];
        ping.timeoutId = data.timeoutId || null;
        return ping;
    }

    static getPing(gid) {
        if (!data.hasOwnProperty(gid)) {
            let data1 = {};

            try {
                data1 = JSON.parse(ext.storageGet(`ping_${gid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`ping_${gid}`}失败:`, error);
            }

            data[gid] = Ping.parse(data1);
        }

        return data[gid];
    }

    static savePing(gid) {
        if (data.hasOwnProperty(gid)) {
            const ping = data[gid];
            ext.storageSet(`ping_${gid}`, JSON.stringify(ping));
        }
    }

    handleData() {
        this.matrix = [];

        for (let i = 0; i < this.data.length + 1; i++) {
            const row = []; // 第i行的数据，0 1 2 ... i | i+1 i+2 ... n，前半部分从其他获取

            for (let j = 0; j < i; j++) {
                row.push(this.data[j][i - j - 1]); // a[i][j] = a[j][i]
            }

            row.push(0); // a[i][i]

            if (i !== this.data.length) {
                row.push(...this.data[i]); // a[i][i+1] ... a[i][n]
            }

            this.matrix.push(row);
        }
    }

    average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    calculate() {
        this.handleData();

        const result = [];

        for (let i = 0; i < this.matrix.length; i++) {
            const row = this.matrix[i];
            const arr = [];

            for (let j = 0; j < row.length; j++) {
                if (i === j) {
                    continue;
                }

                for (let k = j + 1; k < row.length; k++) {
                    if (i === k) {
                        continue;
                    }

                    arr.push((row[j] + row[k] - this.matrix[j][k]) / 2);
                }
            }

            result.push(this.average(arr).toFixed(2));
        }

        return result;
    }
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = '乒乓';
cmd.help = `帮助:
【.乒乓 set <main|sub> @要设置的骰子】设置为主机或从机，默认为从机
【.乒乓 stop】停止检测
【.乒乓 start】立即开始检测
【.乒乓 on】开启自动检测
【.乒乓 off】关闭自动检测`;
cmd.allowDelegate = true;
cmd.disabledInPrivate = true;
cmd.solve = (ctx, msg, cmdArgs) => {
    ctx.delegateText = '';
    const gid = ctx.group.groupId;
    const uid = ctx.player.userId;
    const ping = Ping.getPing(gid);

    const val = cmdArgs.getArgN(1);
    switch (val) {
        // 广播指令
        case 'set': {// 来源：用户
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const val2 = cmdArgs.getArgN(2);
            switch (val2) {
                case 'main': {
                    const extteam = seal.ext.find('team');
                    if (!extteam || parseInt(extteam.version[0]) < 4) {
                        seal.replyToSender(ctx, msg, '未找到team插件');
                        return seal.ext.newCmdExecuteResult(true);
                    }
                    ping.main = true;
                    seal.replyToSender(ctx, msg, '已设置为主机');
                    Ping.savePing(gid);
                    return seal.ext.newCmdExecuteResult(true);
                }
                case 'sub': {
                    ping.main = false;
                    seal.replyToSender(ctx, msg, '已设置为从机');
                    Ping.savePing(gid);
                    return seal.ext.newCmdExecuteResult(true);
                }
                default: {
                    seal.replyToSender(ctx, msg, '【.乒乓 set <main|sub> @要设置的骰子】设置为主机或从机，默认为从机');
                    return seal.ext.newCmdExecuteResult(true);
                }
            }
        }
        case 'stop': {// 来源：用户、主机
            clearTimeout(ping.timeoutId);
            ping.timeoutId = null;
            ping.members = [];
            seal.replyToSender(ctx, msg, '检测已停止');
            Ping.savePing(gid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'pong': {// 来源：一级从机、二级从机
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = ping.members.indexOf(uid);
            if (index === -1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            if (ping.main) {// index范围: 0~n-1
                ping.data[0][index] = Date.now() - ping.data[0][index];
                clearTimeout(ping.timeoutId);
                ping.timeoutId = null;

                if (index !== ping.members.length - 1) {
                    test1(ctx, msg, ping, index + 1);
                    return seal.ext.newCmdExecuteResult(true);
                } else {
                    ping.incomplete--;

                    if (ping.incomplete === 0) {
                        settlement(ctx, msg, ping);
                        return seal.ext.newCmdExecuteResult(true);
                    }
                }
            } else {// index范围: 0~n-i-1 => i+1~n
                ping.row[index] = Date.now() - ping.row[index];
                ping.incomplete--;
                clearTimeout(ping.timeoutId);
                ping.timeoutId = null;

                if (index !== ping.members.length - 1) {
                    test2(ctx, msg, ping, index + 1);
                    return seal.ext.newCmdExecuteResult(true);
                } else if (ping.incomplete === 0) {
                    seal.replyToSender(ctx, msg, `.乒乓 return ${JSON.stringify(ping.row)}`);
                    return seal.ext.newCmdExecuteResult(true);
                }
            }

            return seal.ext.newCmdExecuteResult(true);
        }
        // 仅限主机
        case 'start': {// 来源：用户
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            start(ctx, msg, gid, ping);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'on': {// 来源：用户
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            const epId = ctx.endPoint.userId;
            const index = list.findIndex(item => item.gid === gid);
            if (index === -1) {
                list.push({
                    gid: gid,
                    epId: epId
                });
                ext.storageSet(`list`, JSON.stringify(list));
            }

            seal.replyToSender(ctx, msg, '自动检测已经开启');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'off': {// 来源：用户
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = list.findIndex(item => item.gid === gid);
            if (index !== -1) {
                list.splice(index, 1);
                ext.storageSet(`list`, JSON.stringify(list));
            }

            seal.replyToSender(ctx, msg, '自动检测已经关闭');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'return': {// 来源：一级从机
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = ping.members.indexOf(uid);
            if (index === -1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const val2 = cmdArgs.getArgN(2);
            let row = [];
            try {
                row = JSON.parse(val2);
            } catch (err) {
                seal.replyToSender(ctx, msg, '数据格式错误');
                return seal.ext.newCmdExecuteResult(true);
            }

            if (ping.data[index + 1].length !== row.length) {
                seal.replyToSender(ctx, msg, '数据长度错误');
                return seal.ext.newCmdExecuteResult(true);
            }

            ping.data[index + 1] = row;
            ping.incomplete--;

            if (ping.incomplete === 0) {
                settlement(ctx, msg, ping);
                return seal.ext.newCmdExecuteResult(true);
            }

            Ping.savePing(gid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'timeout': {// 来源：一级从机
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const lost_uid = cmdArgs.at[0].userId;

            const index = ping.members.indexOf(lost_uid);
            if (index === -1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            teamManager.remove(ctx, [lost_uid], []);
            seal.replyToSender(ctx, msg, `.乒乓 stop [CQ:at,qq=${lost_uid.replace(/\D+/g, '')}]失踪了，移除后重新进行检测`);

            start(ctx, msg, gid, ping);
            return seal.ext.newCmdExecuteResult(true);
        }
        // 仅限一级从机
        case 'test1': {// 来源：主机
            if (ping.main) {
                seal.replyToSender(ctx, msg, '好像有多个主机，这对吗？');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }

            seal.replyToSender(ctx, msg, `.乒乓 pong [CQ:at,qq=${uid.replace(/\D+/g, '')}]`);

            ping.members = cmdArgs.at.slice(1).map(item => item.userId);
            if (ping.members.length !== 0) {
                ping.row = new Array(ping.members.length).fill(0);
                ping.incomplete = ping.members.length;

                test2(ctx, msg, ping, 0);
            }

            return seal.ext.newCmdExecuteResult(true);
        }
        // 仅限二级从机
        case 'test2': {// 来源：一级从机
            if (ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }

            seal.replyToSender(ctx, msg, `.乒乓 pong [CQ:at,qq=${uid.replace(/\D+/g, '')}]`);
            return seal.ext.newCmdExecuteResult(true);
        }
        default: {
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
    }
};
ext.cmdMap['乒乓'] = cmd;   