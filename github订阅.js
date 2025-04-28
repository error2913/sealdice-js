// ==UserScript==
// @name         github订阅
// @author       错误
// @version      1.0.0
// @description  TODO
// @timestamp    1744633680
// 2025-04-14 20:28:00
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/github订阅.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/github订阅.js
// ==/UserScript==

let ext = seal.ext.find('github_subscribe');
if (!ext) {
    ext = seal.ext.new('github_subscribe', '错误', '1.0.0');
    seal.ext.register(ext);
}

class GithubSub {
    constructor(id, subs = {}) {
        this.id = id;
        this.subs = subs;
    }

    static getGithubSub(epId, id) {
        if (!data.hasOwnProperty(epId)) {
            data[epId] = {};
        }

        if (!data[epId].hasOwnProperty(id)) {
            data[epId][id] = new GithubSub(id);
        }

        return data[epId][id];
    }

    static saveGithubSub() {
        ext.storageSet('data', JSON.stringify(data));
    }

    async updateSub(repos, updateTime, etag) {
        this.subs[repos] = {
            updateTime: updateTime,
            etag: etag
        }
    }

    async getSubStatus(repos, etag = null, sub) {
        const token = '';
        try {
            const response = await getGithubApi(repos, etag);

            if (response.status === 304) {
                console.log("304")
                return null;
            }

            const text = await response.text();
            if (!response.ok) {
                throw new Error(`请求失败! 状态码: ${response.status}\n响应体:${text}`);
            }
            if (!text) {
                throw new Error("响应体为空");
            }

            const newEtag = response.headers.get('ETag');
            if (newEtag && newEtag !== etag) {
                await this.updateSub(repos, Date.now(), newEtag);
            }

            try {
                let data = JSON.parse(text);
                if (data.message) {
                    if (data.message.includes("API rate limit exceeded")) {
                        console.error("GitHub API 超出速率限制");
                        if (!token) {
                            console.error("请设置 GitHub 用户名和 OAuth Token 以提高限制");
                        }
                    } else if (data.message.includes("Not Found")) {
                        console.error(`无法找到仓库 ${repos}`);
                    }
                    return null;
                }


                const oldTime = this.subs[repos] ? this.subs[repos].updateTime : 0;
                console.log(JSON.stringify(data.map(item => ({type: item.type, time: new Date(item.created_at).getTime() - oldTime}))))
                data = data.filter(item => item.type !== 'CreateEvent' && new Date(item.created_at).getTime() - oldTime > -2 * 24 * 60 * 60 * 1000);
                console.log(JSON.stringify(data))
                if (data.length !== 0) {
                    const eventTime = new Date(data[0].created_at).getTime();
                    await this.updateSub(repos, eventTime, null);
                    const msgList = [];
                    for (let i = 0; i < data.length; i++) {
                        const msg = generatePlain(data[i]);
                        if (msg) {
                            msgList.push(`仓库:${repos}
    
${msg}
🕒 获取时间:
    ${new Date().toLocaleString()}`);
                        }
                    }
                    return msgList;
                }
                return null;
            } catch (e) {
                throw new Error(`解析响应体时出错:${e}\n响应体:${text}`);
            }
        }
        catch (e) {
            console.error("获取订阅状态失败: ", e.message);
            return null;
        }
    }

    async addSub(repos) {
        repos = repos.replace("\\", "/");
        const segments = repos.split('/')
        if (segments.length != 2) {
            return "订阅参数错误，格式为：owner/repo"
        }

        try {
            const response = await getGithubApi(repos);
            if (response.status === 403) {
                return `你无权访问该仓库${repos}`;
            }

            if (response.status === 404) {
                return `仓库${repos}不存在`;
            }

            const text = await response.text();
            if (!response.ok) {
                throw new Error(`请求失败! 状态码: ${response.status}\n响应体:${text}`);
            }
            if (!text) {
                throw new Error("响应体为空");
            }

            try {
                const data = JSON.parse(text);
                if (data.error) {
                    throw new Error(`请求失败! 错误信息: ${data.error.message}`);
                }
                if (data.message) {
                    throw new Error(`请求失败! 错误信息: ${data.message}`);
                }
                if (!response.headers.has('etag')) {
                    throw new Error("响应头中没有etag字段");
                }
                await this.updateSub(repos, Date.now(), null)
                return `已成功订阅仓库${repos}`;
            } catch (e) {
                throw new Error(`解析响应体时出错:${e}\n响应体:${text}`);
            }
        } catch (e) {
            console.error("获取订阅状态失败: ", e.message);
            return `获取订阅状态失败: ${e.message}`;
        }
    }

    delSub(repos) {
        delete this.subs[repos];
    }

    getSubList() {
        return Object.keys(this.subs);
    }
}

const data = JSON.parse(ext.storageGet('data') || '{}');
for (const epId in data) {
    for (const id in data[epId]) {
        const subs = data[epId][id].subs;
        data[epId][id] = new GithubSub(id, subs);
    }
}
const base_url = "https://api.github.com/repos/{}/events";

function createMsg(messageType, senderId, groupId = '') {
    let msg = seal.newMessage();

    if (messageType == 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

function createCtx(epId, msg) {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            const ctx = seal.createTempCtx(eps[i], msg);

            if (ctx.player.userId === epId) {
                ctx.player.name = seal.formatTmpl(ctx, "核心:骰子名字");
            }

            return ctx;
        }
    }

    return undefined;
}

async function getGithubApi(repos, etag = null) {
    const token = '';
    // 需要超时处理？
    return await fetch(base_url.replace('{}', repos), {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github+json',
            'if-none-match': null,
            'Authorization': token ? `token ${token}` : ``
        }
    });
}

function generatePlain(event) {
    const actor = event.actor.display_login;
    const eventTime = new Date(event.created_at).getTime();

    if (event.type === 'IssuesEvent' && event.payload.action === 'opened') {
        const title = event.payload.issue.title;
        const number = event.payload.issue.number;
        let body = event.payload.issue.body;
        if (body && body.length > 100) {
            body = body.slice(0, 100) + "......";
        }
        return `━━━ [新 Issue] ━━━
👤 发布人: ${actor}
🔖 Issue: #${number} ${title}
📝 描述: \n${body}
🕒 时间: \n${eventTime}
🔗 链接: \n${event.payload.issue.html_url}
━━━━━━━━━━`;
    } else if (event.type === 'IssueCommentEvent' && event.payload.action === 'created') {
        const title = event.payload.issue.title;
        const number = event.payload.issue.number;
        let body = event.payload.comment.body;
        if (body && body.length > 100) {
            body = body.slice(0, 100) + "......";
        }
        return `━━━ [新 Comment] ━━━
👤 发布人: ${actor}
🔖 Issue: #${number} ${title}
💬 评论: \n${body}
🕒 时间: \n${eventTime}
🔗 链接: \n${event.payload.comment.html_url}
━━━━━━━━━━`;
    } else if (event.type === 'PullRequestEvent' && event.payload.action === 'opened') {
        const title = event.payload.pull_request.title;
        const number = event.payload.pull_request.number;
        let body = event.payload.pull_request.body;
        if (body && body.length > 100) {
            body = body.slice(0, 100) + "......";
        }
        const head = event.payload.pull_request.head.label;
        const base = event.payload.pull_request.base.label;
        const commits = event.payload.pull_request.commits;
        return `━━━ [新 PR] ━━━
👤 发布人: ${actor}
🔖 PR: #${number} ${title}
📝 描述:\n${body}
🔀 分支:\n${head} → ${base}
📑 提交数: ${commits}
🕒 时间:\n${eventTime}
🔗 链接:\n${event.payload.pull_request.html_url}
━━━━━━━━━━`;
    } else if (event.type === 'PushEvent') {
        const commits = [];
        const repo_name = event.repo.name;
        for (const commit of event.payload.commits) {
            commits.push(`· [${commit.author.name}] ${commit.message}`);
        }
        return `━━━ [新 Push] ━━━
👤 发布人: ${actor}
📂 项目:\n${repo_name}
📑 提交记录:
${commits.join('\n')}

📑 提交数: ${commits.length}
🕒 时间:\n${eventTime}
🔗 链接:\nhttps://github.com/${repo_name}
━━━━━━━━━━`;
    } else if (event.type === 'CommitCommentEvent') {
        let body = event.payload.comment.body;
        if (body && body.length > 100) {
            body = body.slice(0, 100) + "......";
        }
        return `━━━ [新 Comment] ━━━
👤 发布人: ${actor}
💬 评论:\n${body}
🕒 时间:\n${eventTime}
🔗 链接:\n${event.payload.comment.html_url}
━━━━━━━━━━`;
    } else if (event.type === 'ReleaseEvent') {
        let body = event.payload.release.body;
        if (body && body.length > 200) {
            body = body.slice(0, 200) + "......";
        }
        return `━━━ [新 Release] ━━━
👤 发布人: ${actor}
🔖 版本: ${event.payload.release.name}
📝 描述:\n${body}
🕒 时间:\n${eventTime}
🔗 链接:\n${event.payload.release.html_url}
━━━━━━━━━━`;
    }

    return '';
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'gh';
cmd.help = `帮助:
【.gh add <仓库名>】添加仓库订阅
【.gh del <仓库名>】取消仓库订阅
【.gh list】列出已订阅的仓库`;
cmd.solve = (ctx, msg, cmdArgs) => {
    const epId = ctx.endPoint.userId;
    const uid = ctx.player.userId;
    const gid = ctx.group.groupId;
    const id = ctx.isPrivate ? uid : gid;

    const sub = GithubSub.getGithubSub(epId, id);

    const val = cmdArgs.getArgN(1);
    switch (val) {
        case 'add': {
            const val2 = cmdArgs.getArgN(2);
            if (!val2) {
                seal.replyToSender(ctx, msg, '请输入要订阅的仓库');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (sub.subs[val2]) {
                seal.replyToSender(ctx, msg, '该仓库已订阅');
                return seal.ext.newCmdExecuteResult(true);
            }
            sub.addSub(val2).then(s => {
                seal.replyToSender(ctx, msg, s);
                GithubSub.saveGithubSub();
            }).catch(e => {
                seal.replyToSender(ctx, msg, `出错了笨蛋！${e.message}`);
            });
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'del': {
            const val2 = cmdArgs.getArgN(2);
            if (!val2) {
                seal.replyToSender(ctx, msg, '请输入要取消订阅的仓库');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!sub.subs[val2]) {
                seal.replyToSender(ctx, msg, '该仓库未订阅');
                return seal.ext.newCmdExecuteResult(true);
            }
            sub.delSub(val2);
            GithubSub.saveGithubSub();
            seal.replyToSender(ctx, msg, '取消订阅成功');
            return seal.ext.newCmdExecuteResult(true);
        }
        case 'list': {
            const repos = Object.keys(sub.subs);
            if (repos.length === 0) {
                seal.replyToSender(ctx, msg, '未订阅任何仓库');
                return seal.ext.newCmdExecuteResult(true);
            }
            seal.replyToSender(ctx, msg, `已订阅的仓库: ${repos.join('\n')}`);
            return seal.ext.newCmdExecuteResult(true);
        }
        default: {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
    }
};
ext.cmdMap['gh'] = cmd;

let isTaskRunning = false;
seal.ext.registerTask(ext, "cron", "*/2 * * * *", async () => {
    if (isTaskRunning) {
        console.info('定时器任务正在运行，跳过');
        return;
    }

    isTaskRunning = true;
    console.log("定时器任务开始")
    console.log(JSON.stringify(data))
    try {
        for (const epId in data) {
            for (const id in data[epId]) {
                const sub = GithubSub.getGithubSub(epId, id);
                console.log(JSON.stringify(sub))
                const repos = sub.getSubList();
                for (const repo of repos) {
                    const etag = sub.subs[repo].etag;
                    const msgList = await sub.getSubStatus(repo, etag);
                    if (msgList) {
                        if (id.startsWith('QQ-Group:')) {
                            const msg = createMsg('group', '', id);
                            const ctx = createCtx(epId, msg);
                            seal.replyToSender(ctx, msg, msgList.join('\n\n'));
                        } else if (id.startsWith('QQ:')) {
                            const msg = createMsg('private', id, '');
                            const ctx = createCtx(epId, msg);
                            seal.replyToSender(ctx, msg, msgList.join('\n\n'));
                        } else {
                            console.error(`未知的消息类型: ${id}`);
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("定时器任务出错: ", e);
    }

    isTaskRunning = false;
    console.log("定时器任务结束")
})