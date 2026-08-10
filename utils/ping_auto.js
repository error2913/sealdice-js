// ==UserScript==
// @name         多骰联合延迟测试
// @author       错误
// @version      1.0.4
// @description  需要先用【.乒乓 set main @要设置的骰子】设置一个主机。使用【.乒乓 @骰子】获取帮助。主机需要加载依赖：错误:team:>=4.0.0
// @timestamp    1737173515
// 2025-01-18 12:11:55
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/utils/ping_auto.js
// @depends 错误:team:>=4.0.0
// ==/UserScript==

let ext = seal.ext.find('ping_auto');
if (!ext) {
    ext = seal.ext.new('ping_auto', '错误', '1.0.4');
    seal.ext.register(ext);
    seal.ext.registerStringConfig(ext, '定时任务cron表达式', '0 */4 * * *', '修改后保存并重载js');
    seal.ext.registerIntConfig(ext, '超时时间/s', 60, '修改后保存并重载js');
    seal.ext.registerIntConfig(ext, '一级test延时/ms', 3000, '修改后保存并重载js');
    seal.ext.registerIntConfig(ext, '二级test延时/ms', 1000, '修改后保存并重载js');
}

const data = {};
const list = JSON.parse(ext.storageGet(`list`) || '[]');
const cron = seal.ext.getStringConfig(ext, '定时任务cron表达式');
const timeout = Math.max(seal.ext.getIntConfig(ext, '超时时间/s') * 1000, 1000);
const interval1 = Math.max(seal.ext.getIntConfig(ext, '一级test延时/ms'), 0);
const interval2 = Math.max(seal.ext.getIntConfig(ext, '二级test延时/ms'), 0);

seal.ext.registerTask(ext, "cron", cron, () => {
    for (let i = 0; i < list.length; i++) {
        const { gid, epId } = list[i];
        const msg = getMsg(gid, epId);
        const ctx = getCtx(epId, msg);
        if (!ctx) {
            console.warn(`ping_auto: 未找到端点 ${epId}，跳过群 ${gid}`);
            continue;
        }
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

// 取 userId 中的纯数字部分构造 CQ at 码
function buildAt(userId) {
    const m = String(userId || '').match(/\d+/);
    return m ? `[CQ:at,qq=${m[0]}]` : '';
}

// 获取成员名字，取不到时回退
function getPlayerName(gid, epId, uid) {
    const mmsg = getMsg(gid, uid);
    const mctx = getCtx(epId, mmsg);
    if (mctx && mctx.player && mctx.player.name) {
        return mctx.player.name;
    }
    return uid;
}

// 检查 team 插件版本 >= 4.0.0
function checkTeam() {
    const extteam = seal.ext.find('team');
    if (!extteam) {
        return false;
    }
    const v = String(extteam.version || '').replace(/^v/i, '');
    const parts = v.split('.');
    const major = parseInt(parts[0]) || 0;
    const minor = parseInt(parts[1]) || 0;
    return major > 4 || (major === 4 && minor >= 0);
}

// 统计尚未上报 zing 的成员数（下标从 1 起）
function countMissingZing(ping) {
    let n = 0;
    for (let i = 1; i < ping.members.length; i++) {
        if (!ping.zinged[i]) {
            n++;
        }
    }
    return n;
}

// 获取尚未上报 zing 的成员列表
function getMissingZingMembers(ping) {
    const lost = [];
    for (let i = 1; i < ping.members.length; i++) {
        if (!ping.zinged[i]) {
            lost.push(ping.members[i]);
        }
    }
    return lost;
}

function start(ctx, msg, gid, ping) {
    if (!globalThis.teamManager) {
        seal.replyToSender(ctx, msg, '未找到team插件');
        return seal.ext.newCmdExecuteResult(true);
    }

    const team = teamManager.getTeamList(gid)[0];
    if (!team || team.members.length < 2) {
        seal.replyToSender(ctx, msg, '骰数不足，无法进行测试');
        return seal.ext.newCmdExecuteResult(true);
    }

    // 新一轮：从 team 重新拉取成员，重建状态，避免本地残留
    ping.running = true;
    ping.token = nextToken();
    ping.members = team.members.slice();
    ping.data = [];
    for (let i = 0; i < ping.members.length; i++) {
        ping.data.push(new Array(ping.members.length - i).fill(0));
    }
    ping.incomplete = ping.members.length; // 等待 pong
    ping.zingIncomplete = ping.members.length - 1; // 等待 zing
    ping.zinged = new Array(ping.members.length).fill(false);
    ping.stage = 'test1';

    clearTimer(ping, 'pongTimer');
    clearTimer(ping, 'zingTimer');
    Ping.savePing(gid);

    test1(ctx, msg, gid, ping, 0);
}

function nextToken() {
    return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xfffff).toString(36);
}

function clearTimer(ping, key) {
    if (ping[key]) {
        clearTimeout(ping[key]);
        ping[key] = null;
    }
}

// 主机：一级测试，逐个 ping 成员并测 主机->成员 延迟
function test1(ctx, msg, gid, ping, index) {
    const token = ping.token;
    setTimeout(() => {
        if (!ping.running || ping.token !== token) {
            return;
        }

        const ats = ping.members.slice(index).map(buildAt).join(' ');
        ping.data[0][index] = Date.now();
        seal.replyToSender(ctx, msg, `.乒乓 ping --token=${token} --lvl=1 ${ats}`);
        Ping.savePing(gid);

        clearTimer(ping, 'pongTimer');
        ping.pongTimer = setTimeout(() => {
            if (!ping.running || ping.token !== token) {
                return;
            }
            const lostUid = ping.members[index];
            seal.replyToSender(ctx, msg, `.乒乓 dong --token=${token} ${buildAt(lostUid)} 失踪了，移除后重新进行检测`);
            ctx.notice(`${lostUid}失踪了`);
            teamManager.remove(ctx, [lostUid], []);
            start(ctx, msg, gid, ping);
        }, Math.max(timeout, interval1 * (ping.members.length + 1)));
    }, interval1);
}

// 从机：二级测试，逐个 ping 自己后面的成员
function test2(ctx, msg, gid, ping, index) {
    const token = ping.token;
    setTimeout(() => {
        if (!ping.running || ping.token !== token) {
            return;
        }

        ping.row[index] = Date.now();
        seal.replyToSender(ctx, msg, `.乒乓 ping --token=${token} --lvl=2 --i=${index} ${buildAt(ping.members[index])}`);
        Ping.savePing(gid);

        clearTimer(ping, 'pongTimer');
        ping.pongTimer = setTimeout(() => {
            if (!ping.running || ping.token !== token) {
                return;
            }
            const lostUid = ping.members[index];
            seal.replyToSender(ctx, msg, `.乒乓 beep --token=${token} --lost=${lostUid} ${buildAt(ping.members[0])}`);
            Ping.savePing(gid);
        }, Math.max(timeout, interval2 * (ping.members.length + 1)));
    }, interval2);
}

function settlement(ctx, msg, gid, ping) {
    ping.running = false;
    ping.stage = 'idle';
    clearTimer(ping, 'pongTimer');
    clearTimer(ping, 'zingTimer');

    const result = ping.calculate();
    const text = result.map((item, index) => {
        let name;
        if (index === 0) {
            name = seal.formatTmpl(ctx, "核心:骰子名字") || '主机';
        } else {
            const epId = ctx.endPoint.userId;
            const uid = ping.members[index - 1];
            name = getPlayerName(gid, epId, uid);
        }

        return `${name}:${item}ms`;
    }).join('\n');

    seal.replyToSender(ctx, msg, text);
    ctx.notice(`检测报告:\n${text}`);
    Ping.savePing(gid);
}

class Ping {
    constructor() {
        this.main = false;
        this.running = false; // 本轮是否进行中
        this.token = ''; // 本轮令牌，防止旧消息/串轮
        this.stage = 'idle'; // idle | test1 | wait-zing | test2
        this.members = []; // n个成员，下标0为主机
        this.incomplete = 0; // 未完成的成员数
        this.zingIncomplete = 0; // 主机等待的 zing 数
        this.zinged = []; // 各成员是否已上报 zing
        this.row = []; // 一级从机获取的数据
        this.data = []; // [[1, ..., n], [2,..., n], ..., [n]]
        this.matrix = [];
        this.pongTimer = null;
        this.zingTimer = null;
    }

    static parse(data) {
        const ping = new Ping();
        ping.main = data.main || false;
        ping.members = data.members || [];
        ping.data = data.data || [];
        ping.incomplete = data.incomplete || 0;
        ping.zingIncomplete = data.zingIncomplete || 0;
        ping.zinged = data.zinged || [];
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
            ext.storageSet(`ping_${gid}`, JSON.stringify({
                main: ping.main,
                running: false, // 定时器不可序列化，重载后不再运行
                members: ping.members,
                data: ping.data,
                incomplete: ping.incomplete,
                zingIncomplete: ping.zingIncomplete,
                zinged: ping.zinged
            }));
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
        return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
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
【.乒乓 set <main|sub> @要设置的骰子】设置为主机或从机并写入队伍，默认为从机
【.乒乓 <main|sub>】仅切换本机主/从机状态（兼容旧版）
【.乒乓 ding】立即开始检测
【.乒乓 dong】停止检测
【.乒乓 click】开启自动检测
【.乒乓 clack】关闭自动检测
【.乒乓 status】查看自动检测状态`;
cmd.allowDelegate = true;
cmd.disabledInPrivate = true;
cmd.solve = (ctx, msg, cmdArgs) => {
    ctx.delegateText = '';
    const gid = ctx.group.groupId;
    const uid = ctx.player.userId;
    const ping = Ping.getPing(gid);

    const val = cmdArgs.getArgN(1);
    const tokenKw = cmdArgs.getKwarg('token');
    const token = tokenKw && tokenKw.value ? tokenKw.value : '';

    switch (val) {
        // 广播指令
        case 'set': {// 来源：用户
            const mode = cmdArgs.getArgN(2);
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            if (!checkTeam()) {
                seal.replyToSender(ctx, msg, '未找到team插件');
                return seal.ext.newCmdExecuteResult(true);
            }

            // 第一个 at 必须是本机，其余为队伍成员
            const atUids = cmdArgs.at.slice(1).map(item => item.userId);
            ping.main = mode !== 'sub';
            ping.members = atUids;
            teamManager.add(ctx, atUids);

            seal.replyToSender(ctx, msg, ping.main ? '已设置为主机' : '已设置为从机');
            Ping.savePing(gid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'main': {// 来源：用户
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            if (!checkTeam()) {
                seal.replyToSender(ctx, msg, '未找到team插件');
                return seal.ext.newCmdExecuteResult(true);
            }
            ping.main = true;
            seal.replyToSender(ctx, msg, '已设置为主机');
            Ping.savePing(gid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'sub': {// 来源：用户
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            ping.main = false;
            seal.replyToSender(ctx, msg, '已设置为从机');
            Ping.savePing(gid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'dong': {// 来源：用户、主机
            if (cmdArgs.amIBeMentionedFirst) {
                // 主机广播：让全体停下
                if (token && ping.token === token) {
                    ping.running = false;
                    ping.stage = 'idle';
                    clearTimer(ping, 'pongTimer');
                    clearTimer(ping, 'zingTimer');
                    Ping.savePing(gid);

                    if (ping.main && ping.members.length > 0) {
                        const ats = ping.members.map(buildAt).join(' ');
                        seal.replyToSender(ctx, msg, `.乒乓 boom --token=${token} ${ats}`);
                    }
                }
                return seal.ext.newCmdExecuteResult(true);
            }

            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            ping.running = false;
            ping.stage = 'idle';
            ping.members = [];
            clearTimer(ping, 'pongTimer');
            clearTimer(ping, 'zingTimer');
            seal.replyToSender(ctx, msg, '检测已停止');
            Ping.savePing(gid);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'pong': {// 来源：一级从机、二级从机
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!token || ping.token !== token || !ping.running) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = ping.members.indexOf(uid);
            if (index <= 0 || index === -1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            if (ping.main) {// 一级 pong：index 范围 1~n-1
                const lvlKw = cmdArgs.getKwarg('lvl');
                const lvl = lvlKw && lvlKw.value ? parseInt(lvlKw.value) : 1;
                if (lvl === 2) {
                    // 二级 pong 是成员之间的应答，主机不参与，直接忽略
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (ping.stage !== 'test1') {
                    return seal.ext.newCmdExecuteResult(true);
                }

                ping.data[0][index] = Date.now() - ping.data[0][index];
                clearTimer(ping, 'pongTimer');
                ping.incomplete--;

                if (index !== ping.members.length - 1) {
                    // 收到最后一个 pong 前，顺序 ping 下一个
                    test1(ctx, msg, gid, ping, index + 1);
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (ping.incomplete === 0) {
                    ping.stage = 'wait-zing';
                    Ping.savePing(gid);

                    // 重新统计尚未上报的 zing（zing 可能提前于最后一个 pong 到达）
                    ping.zingIncomplete = countMissingZing(ping);
                    if (ping.zingIncomplete === 0) {
                        settlement(ctx, msg, gid, ping);
                        return seal.ext.newCmdExecuteResult(true);
                    }

                    // 覆盖整个二级测试窗口，超时视为有成员失联
                    clearTimer(ping, 'zingTimer');
                    const n = ping.members.length;
                    ping.zingTimer = setTimeout(() => {
                        if (!ping.running || ping.token !== token) {
                            return;
                        }
                        const lost = getMissingZingMembers(ping);
                        if (lost.length > 0) {
                            const ats = lost.map(buildAt).join(' ');
                            seal.replyToSender(ctx, msg, `.乒乓 dong --token=${token} ${ats} 失踪了，移除后重新进行检测`);
                            ctx.notice(`${lost.join(',')}失踪了`);
                            teamManager.remove(ctx, lost, []);
                        } else {
                            seal.replyToSender(ctx, msg, '.乒乓 dong 检测超时，重新进行检测');
                        }
                        start(ctx, msg, gid, ping);
                    }, Math.max(timeout * 3, timeout + interval1 * (n + 1) + timeout + interval2 * (2 * n + 1)));
                }
                return seal.ext.newCmdExecuteResult(true);
            } else {// 二级 pong：从机等待自己的 test2 结果
                if (ping.stage !== 'test2') {
                    return seal.ext.newCmdExecuteResult(true);
                }

                const lvlKw = cmdArgs.getKwarg('lvl');
                const lvl = lvlKw && lvlKw.value ? parseInt(lvlKw.value) : 1;
                if (lvl !== 2) {
                    return seal.ext.newCmdExecuteResult(true);
                }
                const iKw = cmdArgs.getKwarg('i');
                const i = iKw && iKw.value ? parseInt(iKw.value) : -1;
                if (Number.isNaN(i) || i < 0 || i >= ping.members.length) {
                    return seal.ext.newCmdExecuteResult(true);
                }

                ping.row[i] = Date.now() - ping.row[i];
                clearTimer(ping, 'pongTimer');
                ping.incomplete--;

                if (i !== ping.members.length - 1) {
                    test2(ctx, msg, gid, ping, i + 1);
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (ping.incomplete === 0) {
                    ping.running = false;
                    ping.stage = 'idle';
                    seal.replyToSender(ctx, msg, `.乒乓 zing --token=${token} ${JSON.stringify(ping.row)} ${buildAt(ping.members[0])}`);
                    Ping.savePing(gid);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
        // 仅限主机
        case 'ding': {// 来源：用户
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
        case 'click': {// 来源：用户
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

            seal.replyToSender(ctx, msg, '自动检测开启');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'clack': {// 来源：用户
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = list.findIndex(item => item.gid === gid);
            if (index !== -1) {
                list.splice(index, 1);
                ext.storageSet(`list`, JSON.stringify(list));
            }

            seal.replyToSender(ctx, msg, '自动检测关闭');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'status': {// 来源：用户
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (ctx.privilegeLevel < 100) {
                seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = list.findIndex(item => item.gid === gid);
            if (index !== -1) {
                seal.replyToSender(ctx, msg, '自动检测已经开启');
            } else {
                seal.replyToSender(ctx, msg, '自动检测已经关闭');
            }

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'zing': {// 来源：一级从机
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!token || ping.token !== token || !ping.running) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const index = ping.members.indexOf(uid);
            if (index <= 0 || index === -1) {
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

            if (ping.data[index].length !== row.length) {
                seal.replyToSender(ctx, msg, '数据长度错误');
                return seal.ext.newCmdExecuteResult(true);
            }

            if (ping.zinged[index]) {
                // 重复上报，忽略
                return seal.ext.newCmdExecuteResult(true);
            }
            ping.data[index] = row;
            ping.zinged[index] = true;
            if (ping.zingIncomplete > 0) {
                ping.zingIncomplete--;
            }
            Ping.savePing(gid);

            if (ping.zingIncomplete <= 0 && ping.stage === 'wait-zing') {
                settlement(ctx, msg, gid, ping);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'beep': {// 来源：一级从机
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!token || ping.token !== token || !ping.running) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const lostKw = cmdArgs.getKwarg('lost');
            let lostUid = lostKw && lostKw.value ? lostKw.value : '';
            if (!lostUid && cmdArgs.at.length > 0) {
                lostUid = cmdArgs.at[0].userId;
            }

            const senderIndex = ping.members.indexOf(uid);
            const lostIndex = lostUid ? ping.members.indexOf(lostUid) : -1;
            if (senderIndex === -1 || lostIndex === -1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            clearTimer(ping, 'pongTimer');
            clearTimer(ping, 'zingTimer');
            seal.replyToSender(ctx, msg, `.乒乓 dong --token=${token} ${buildAt(lostUid)} 失踪了，移除后重新进行检测`);
            ctx.notice(`${lostUid}失踪了`);
            teamManager.remove(ctx, [lostUid], []);

            start(ctx, msg, gid, ping);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'boom': {// 来源：一级从机、二级从机
            if (!ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!token || ping.token !== token) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const senderUid = uid;
            const index = ping.members.indexOf(senderUid);
            if (index !== -1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            clearTimer(ping, 'pongTimer');
            clearTimer(ping, 'zingTimer');
            teamManager.add(ctx, [senderUid]);
            seal.replyToSender(ctx, msg, `.乒乓 dong --token=${token} ${buildAt(senderUid)} 加入，重新进行检测`);
            ctx.notice(`${senderUid}加入了`);

            start(ctx, msg, gid, ping);
            return seal.ext.newCmdExecuteResult(true);
        }
        // 仅限从机
        case 'ping': {// 来源：主机、一级从机
            if (ping.main) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!cmdArgs.amIBeMentionedFirst) {
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!token || token.length === 0) {
                return seal.ext.newCmdExecuteResult(true);
            }

            const iKw = cmdArgs.getKwarg('i');
            const i = iKw && iKw.value ? parseInt(iKw.value) : -1;
            const hostUid = cmdArgs.at[0].userId;
            const lvlKw = cmdArgs.getKwarg('lvl');
            const lvl = lvlKw && lvlKw.value ? parseInt(lvlKw.value) : 1;

            if (i >= 0) {
                // 二级 ping：上级测我。无论当前处于什么阶段，都立即回 pong（不重置自己的轮次）
                if (lvl === 2 && token === ping.token) {
                    seal.replyToSender(ctx, msg, `.乒乓 pong --token=${token} --lvl=2 --i=${i} ${buildAt(hostUid)}`);
                    Ping.savePing(gid);
                }
                return seal.ext.newCmdExecuteResult(true);
            }

            // 一级 ping：新一轮开始时重置自己的状态
            if (lvl !== 1) {
                return seal.ext.newCmdExecuteResult(true);
            }

            if (ping.token !== token) {
                ping.token = token;
                ping.running = true;
                ping.members = cmdArgs.at.slice(1).map(item => item.userId);
                ping.data = [];
                for (let k = 0; k < ping.members.length; k++) {
                    ping.data.push(new Array(ping.members.length - k).fill(0));
                }
                clearTimer(ping, 'pongTimer');
                clearTimer(ping, 'zingTimer');
            } else if (ping.stage === 'test2') {
                // 同轮重复的一级 ping，忽略
                return seal.ext.newCmdExecuteResult(true);
            }

            ping.stage = 'test2';
            ping.row = new Array(ping.members.length).fill(0);
            ping.incomplete = ping.members.length;
            seal.replyToSender(ctx, msg, `.乒乓 pong --token=${token} --lvl=1 ${buildAt(hostUid)}`);
            Ping.savePing(gid);

            if (ping.members.length !== 0) {
                test2(ctx, msg, gid, ping, 0);
            } else {
                // 没有后面的成员：无需测二级，直接结束
                ping.running = false;
                ping.stage = 'idle';
            }
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
