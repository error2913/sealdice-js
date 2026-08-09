// ==UserScript==
// @name         投票
// @author       错误
// @version      1.0.1
// @description  使用 .投票 指令进行投票操作
// @timestamp    1774360085
// 2026-03-24 21:48:05
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==

let ext = seal.ext.find('投票');
if (!ext) {
    ext = seal.ext.new('投票', '错误', '1.0.1');
    seal.ext.register(ext);
}

const data = getVoteData();

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'toupiao'; // 指令名字，可用中文
cmd.help = `使用：
.投票 create ID <选项1> <选项2> ... --limit=m:n 创建投票
    m,n 为投票数范围，m<n，若不指定，默认为1:1
.投票 delete ID 删除投票
.投票 vote ID <选项1> <选项2> ... 投票
.投票 result ID 查看投票结果
.投票 list 查看所有投票列表
.投票 clear 清空所有投票
`;
cmd.solve = (ctx, msg, cmdArgs) => {
    const ret = seal.ext.newCmdExecuteResult(true);
    try {
        const uid = ctx.player.userId;
        const sid = ctx.isPrivate ? uid : ctx.group.groupId;
        const val = cmdArgs.getArgN(1);
        const id = cmdArgs.getArgN(2);
        const options = cmdArgs.args.slice(2);

        switch (val) {
            case 'c':
            case 'crt':
            case 'create': {
                if (id === '') throw new Error('投票ID不能为空');
                const limit = cmdArgs.getKwarg('limit');
                let min = 1, max = 1;
                if (limit && limit.valueExists) {
                    if (isNaN(parseInt(limit.value))) {
                        const [minStr, maxStr] = limit.value.split(/[:：,，\-]/).map(s => s.trim());
                        min = parseInt(minStr);
                        max = parseInt(maxStr);
                    } else {
                        min = parseInt(limit.value);
                        max = parseInt(limit.value);
                    }
                }
                createVote(sid, id, min, max, options);
                seal.replyToSender(ctx, msg, `投票<${id}>已创建，投票数范围为${min}-${max}`);
                return ret;
            }
            case 'd':
            case 'del':
            case 'delete': {
                if (id === '') throw new Error('投票ID不能为空');
                deleteVote(sid, id);
                seal.replyToSender(ctx, msg, `投票${id}已删除`);
                return ret;
            }
            case 'v':
            case 'vote': {
                if (id === '') throw new Error('投票ID不能为空');
                vote(sid, uid, id, options);
                seal.replyToSender(ctx, msg, `投票成功`);
                return ret;
            }
            case 'r':
            case 'res':
            case 'result': {
                if (id === '') throw new Error('投票ID不能为空');
                const res = getResult(sid, id);
                const options = Object.keys(res.votes);
                options.sort((a, b) => res.votes[b] - res.votes[a]);
                const total = options.reduce((sum, op) => sum + res.votes[op], 0);
                seal.replyToSender(ctx, msg, `关于
<${id}>
的投票结果为：
共${total}人投票
${options.map(op => `${op}：${res.votes[op]}`).join('\n')}`);
                return ret;
            }
            case 'l':
            case 'ls':
            case 'lst':
            case 'list': {
                if (!data.hasOwnProperty(sid) || Object.keys(data[sid]).length === 0) {
                    seal.replyToSender(ctx, msg, '当前群没有投票');
                    return ret;
                }
                seal.replyToSender(ctx, msg, `当前投票列表为：
${Object.keys(data[sid]).map((id, index) => `${index + 1}. ${id}`).join('\n')}`);
                return ret;
            }
            case 'clr':
            case 'clear': {
                clearVote(sid);
                seal.replyToSender(ctx, msg, `当前群所有投票已清空`);
                return ret;
            }
            default: {
                ret.showHelp = true;
                return ret;
            }
        }
    } catch (e) {
        seal.replyToSender(ctx, msg, e.message);
        return ret;
    }
};

ext.cmdMap['toupiao'] = cmd;
ext.cmdMap['投票'] = cmd;
ext.cmdMap['tp'] = cmd;

function getVoteData() {
    return JSON.parse(ext.storageGet('vote') || '{}');
}

function setVoteData() {
    ext.storageSet('vote', JSON.stringify(data));
}

function createVote(sid, id, min = 1, max = 1, options) {
    if (!data.hasOwnProperty(sid)) data[sid] = {};
    if (data[sid].hasOwnProperty(id)) throw new Error('投票已存在');
    if (options.length === 0) throw new Error('投票选项不能为空');
    if (Array.from(new Set(options)).length !== options.length) throw new Error('选项重复');
    if (options.length < 2) throw new Error(`投票选项不能少于2个`);
    if (options.length < min) throw new Error(`投票数不在范围内${min}:${max}`);
    if (isNaN(min) || isNaN(max) || min > max || min < 1 || max < 1) throw new Error('投票数范围错误');
    data[sid][id] = {
        min, max,
        users: {},
        votes: options.reduce((obj, op) => {
            obj[op] = 0;
            return obj;
        }, {})
    };
    setVoteData();
}

function deleteVote(sid, id) {
    if (!data.hasOwnProperty(sid) || !data[sid].hasOwnProperty(id)) throw new Error('投票不存在');
    delete data[sid][id];
    setVoteData();
}

function vote(sid, uid, id, options) {
    if (!data.hasOwnProperty(sid) || !data[sid].hasOwnProperty(id)) throw new Error('投票不存在');
    if (options.length === 0) throw new Error('投票选项不能为空');
    if (Array.from(new Set(options)).length !== options.length) throw new Error('选项重复');
    const { min, max, users, votes } = data[sid][id];
    if (users.hasOwnProperty(uid)) {
        if (users[uid] + options.length > max) throw new Error(`投票数不能超过${max}，当前已投票${users[uid]}张`);
    } else {
        if (options.length < min || options.length > max) throw new Error(`投票数不在范围内${min}-${max}`);
    }
    options.forEach(op => {
        if (!votes.hasOwnProperty(op)) throw new Error(`选项 ${op} 不存在，可选选项为${Object.keys(votes).join('、')}`);
    });
    options.forEach(op => votes[op]++);
    if (!users.hasOwnProperty(uid)) users[uid] = 0;
    users[uid] += options.length;
    setVoteData();
}

function getResult(sid, id) {
    if (!data.hasOwnProperty(sid) || !data[sid].hasOwnProperty(id)) throw new Error('投票不存在');
    return data[sid][id];
}

function clearVote(sid) {
    if (data.hasOwnProperty(sid)) delete data[sid];
    setVoteData();
}
