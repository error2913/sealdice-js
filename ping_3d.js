// ==UserScript==
// @name         三骰联合延迟测试
// @author       错误
// @version      1.0.0
// @description  使用 .乒 test <指令前缀a> <指令前缀b> <指令前缀c> <次数>开始测试，需要三个骰子同时安装，且指令前缀不同
// @timestamp    1734356092
// 2024-12-16 21:34:52
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/ping_3d.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/ping_3d.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('ping_3d');
if (!ext) {
    ext = seal.ext.new('ping_3d', '错误', '1.0.0');
    seal.ext.register(ext);
}

const data = {};

class Ping {
    constructor(a, b, c, n) {
        this.a = a; // 指令前缀
        this.b = b;
        this.c = c;
        this.AB = 0;
        this.BC = 0;
        this.AC = 0;
        this.n = n;
        this.data = [];
    }

    average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    sigma(arr, avg) {
        return Math.sqrt(arr.map((x) => (x - avg) ** 2).reduce((a, b) => a + b, 0) / (arr.length - 1) * (arr.length));
    }

    calculate() {
        const arr_a = this.data.map(([A, B, C]) => A);
        const arr_b = this.data.map(([A, B, C]) => B);
        const arr_c = this.data.map(([A, B, C]) => C);

        const avg_a = this.average(arr_a);
        const avg_b = this.average(arr_b);
        const avg_c = this.average(arr_c);

        const sigma_a = this.sigma(arr_a, avg_a);
        const sigma_b = this.sigma(arr_b, avg_b);
        const sigma_c = this.sigma(arr_c, avg_c);

        const text_a = `${avg_a.toFixed(2)}±${sigma_a.toFixed(2)}ms`;
        const text_b = `${avg_b.toFixed(2)}±${sigma_b.toFixed(2)}ms`;
        const text_c = `${avg_c.toFixed(2)}±${sigma_c.toFixed(2)}ms`;

        return { text_a, text_b, text_c };
    }
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = '乒';
cmd.help = `帮助:
测试中请不要乱发指令，请确保有三个骰子，并确保三个骰子的指令前缀不同
【.乒 test <指令前缀a> <指令前缀b> <指令前缀c> <次数>】开始测试
【.乒 clr】重置测试，不能停止测试，停止测试请bot off
`;
cmd.disabledInPrivate = true;
cmd.solve = (ctx, msg, cmdArgs) => {
    const val = cmdArgs.getArgN(1);
    const gid = ctx.group.groupId;
    if (val === 'test') {
        const prefix_a = cmdArgs.getArgN(2);
        const prefix_b = cmdArgs.getArgN(3);
        const prefix_c = cmdArgs.getArgN(4);
        const num = parseInt(cmdArgs.getArgN(5));
        if (isNaN(num) || num <= 0) {
            seal.replyToSender(ctx, msg, '【.乒 test <指令前缀a> <指令前缀b> <指令前缀c> <次数>】开始测试');
            return seal.ext.newCmdExecuteResult(true);
        }

        const ping = new Ping(prefix_a, prefix_b, prefix_c, num);
        data[gid] = ping;

        ping.AB = Date.now();
        seal.replyToSender(ctx, msg, `${ping.b}乒 ab ${ping.a}`);
        return seal.ext.newCmdExecuteResult(true);
    }

    if (val === 'clr') {
        if (data.hasOwnProperty(gid)) {
            delete data[gid];
        }
        seal.replyToSender(ctx, msg, '已重置测试');
        return seal.ext.newCmdExecuteResult(true);
    }

    switch (val) {
        case 'ab': {
            const prefix_a = cmdArgs.getArgN(2);
            seal.replyToSender(ctx, msg, `${prefix_a}乒 ba`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'ba': {
            const ping = data[gid];
            ping.AB = Date.now() - ping.AB;

            setTimeout(() => {
                ping.AC = Date.now();
                seal.replyToSender(ctx, msg, `${ping.c}乒 ac ${ping.a}`);
            }, 5000);

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'ac': {
            const prefix_a = cmdArgs.getArgN(2);
            seal.replyToSender(ctx, msg, `${prefix_a}乒 ca`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'ca': {
            const ping = data[gid];
            ping.AC = Date.now() - ping.AC;

            setTimeout(() => {
                seal.replyToSender(ctx, msg, `${ping.b}乒 abc ${ping.a} ${ping.b} ${ping.c}`);
            }, 5000);

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'abc': {
            const prefix_a = cmdArgs.getArgN(2);
            const prefix_b = cmdArgs.getArgN(3);
            const prefix_c = cmdArgs.getArgN(4);

            const ping = new Ping(prefix_a, prefix_b, prefix_c);
            data[gid] = ping;

            setTimeout(() => {
                ping.BC = Date.now();
                seal.replyToSender(ctx, msg, `${ping.c}乒 bc ${ping.b}`);
            }, 5000);

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'bc': {
            const prefix_b = cmdArgs.getArgN(2);
            seal.replyToSender(ctx, msg, `${prefix_b}乒 cb`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'cb': {
            const ping = data[gid];
            ping.BC = Date.now() - ping.BC;

            setTimeout(() => {
                seal.replyToSender(ctx, msg, `${ping.a}乒 bca ${ping.BC}`);
            }, 5000);

            return seal.ext.newCmdExecuteResult(true);
        }
        case 'bca': {
            const BC = parseInt(cmdArgs.getArgN(2));

            const ping = data[gid];
            ping.BC = BC;

            const A = 0.5 * (ping.AB + ping.AC - ping.BC);
            const B = 0.5 * (ping.AB + ping.BC - ping.AC);
            const C = 0.5 * (ping.AC + ping.BC - ping.AB);

            ping.data.push([A, B, C]);

            if (ping.data.length < ping.n) {
                setTimeout(() => {
                    ping.AB = Date.now();
                    seal.replyToSender(ctx, msg, `${ping.b}乒 ab ${ping.a}`);
                }, 5000);

                seal.replyToSender(ctx, msg, `下一轮测试将在5秒后开始，还有${ping.n - ping.data.length}轮`);
                return seal.ext.newCmdExecuteResult(true);
            }

            const { text_a, text_b, text_c } = ping.calculate();

            const s = `结果为:
骰子a(${ping.a}): ${text_a}
骰子b(${ping.b}): ${text_b}
骰子c(${ping.c}): ${text_c}`;

            delete data[gid];

            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
        }
        default: {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
    }
};
ext.cmdMap['乒'] = cmd;   