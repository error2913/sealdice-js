// ==UserScript==
// @name         自动群打卡
// @author       错误
// @version      1.0.0
// @description  使用 .gs help 查看帮助。目前好像只有napcat可以用？依赖于错误:HTTP依赖:>=1.0.0。
// @timestamp    1734091336
// 2024-12-13 20:02:16
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/auto_groupsign.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/auto_groupsign.js
// @depends 错误:HTTP依赖:>=1.0.0
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('auto_groupsign');
if (!ext) {
    ext = seal.ext.new('auto_groupsign', '错误', '1.0.0');
    seal.ext.register(ext);
}

let flag = ext.storageGet('flag');
if (flag !== '0' && flag !== '1') {
    flag = '0';
    ext.storageSet('flag', flag);
}

async function sign() {
    const f = 5;
    const interval = 500;
    let result = 0;

    const eps = seal.getEndPoints();
    for (let i = 0; i < eps.length; i++) {
        const epId = eps[i].userId;

        const data = await globalThis.http.getData(epId, 'get_group_list?no_cache=true');
        if (data === null) {
            continue;
        }

        const gids = data.map(item => `QQ-Group:${item.group_id}`);

        let arr = [];
        for (let j = 0; j < gids.length; j++) {
            arr.push(gids[j]);

            if (j % f === f - 1 || j === gids.length - 1) {
                const arr_copy = arr.slice();

                for (let k = 0; k < arr_copy.length; k++) {
                    const gid = arr_copy[k];

                    await globalThis.http.getData(epId, `send_group_sign?group_id=${gid.replace(/\D+/, '')}`);
                    result++;
                }

                await new Promise(resolve => setTimeout(resolve, interval + Math.floor(Math.random() * 500)));
                arr = [];
            }
        }
    }

    return result;
}

seal.ext.registerTask(ext, "daily", "00:01", async (_) => {
    if (flag === '0') {
        console.log('自动打卡未开启，跳过')
        return;
    }

    const result = await sign();
    console.log(`已向${result}个群发送打卡事件`);
});

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'gs';
cmd.help = `帮助:
【.gs on】开启自动打卡
【.gs off】关闭自动打卡
【.gs status】查看自动打卡状态
【.gs now】立即打卡`;
cmd.solve = async (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'on': {
            flag = '1';
            ext.storageSet('flag', flag);
            seal.replyToSender(ctx, msg, '已开启自动打卡');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'off': {
            flag = '0';
            ext.storageSet('flag', flag);
            seal.replyToSender(ctx, msg, '已关闭自动打卡');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'status': {
            seal.replyToSender(ctx, msg, `自动打卡状态: ${flag === '1' ? '开启' : '关闭'}`);
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'now': {
            const result = await sign();
            seal.replyToSender(ctx, msg, `已向${result}个群发送打卡事件`);
            return seal.ext.newCmdExecuteResult(true);
        }
        default: {
            seal.replyToSender(ctx, msg, cmd.help);
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
ext.cmdMap['gs'] = cmd;   