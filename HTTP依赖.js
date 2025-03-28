// ==UserScript==
// @name         HTTP依赖
// @author       错误
// @version      1.0.1
// @description  为插件提供HTTP依赖管理。\nHTTP端口请按照自己的登录方案自行配置，配置完成后在插件设置填入。插件初始化时会自动获取HTTP地址对应的账号并保存。\n提供指令 .http 可以直接调用\n在其他插件中使用方法: globalThis.http.getData(epId, val, data=null)\nepId为账号QQ:12345，val为方法，如get_login_info。\n方法可参见https://github.com/botuniverse/onebot-11/blob/master/api/public.md#%E5%85%AC%E5%BC%80-api
// @timestamp    1733626761
// 2024-12-08 10:59:21
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/HTTP依赖.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/HTTP依赖.js
// ==/UserScript==

let ext = seal.ext.find('HTTP依赖');
if (!ext) {
    ext = seal.ext.new('HTTP依赖', '错误', '1.0.1');
    seal.ext.register(ext);
}

seal.ext.registerTemplateConfig(ext, 'HTTP端口地址', ['http://127.0.0.1:8084'], '修改后保存并重载js');
seal.ext.registerOptionConfig(ext, "日志打印方式", "简短", ["永不", "简短", "详细"], '修改后保存并重载js');

const urlMap = {};
const logLevel = seal.ext.getOptionConfig(ext, "日志打印方式");

function log(...data) {
    if (logLevel === "永不") {
        return;
    }

    if (logLevel === "简短") {
        const s = data.map(item => `${item}`).join(" ");
        if (s.length > 1000) {
            console.log(s.substring(0, 500), "\n...\n", s.substring(s.length - 500));
            return;
        }
    }

    console.log(...data);
}

async function fetchData(url, data = null) {
    try {
        const response = data === null ? await fetch(url) : await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        const body = await response.json();
        const result = body.data;
        if (result === null) {
            log('获取数据成功: null');
            return null;
        }
        if (result === undefined) {
            log('获取数据成功: undefined');
            return null;
        }
        log(`获取数据成功: ${JSON.stringify(result, null, 2)}`);
        return result;
    } catch (error) {
        console.error(`获取数据失败: ${error.message}`);
        return null;
    }
}

async function init() {
    const ports = seal.ext.getTemplateConfig(ext, 'HTTP端口地址');

    for (let i = 0; i < ports.length; i++) {
        const port = ports[i];
        const url = `${port}/get_login_info`;
        const data = await fetchData(url);
        if (data === null) {
            console.error(`获取登录信息失败: ${port}`);
            continue;
        }
        const epId = `QQ:${data.user_id}`;
        const eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                urlMap[epId] = port;
                log(`找到${epId}端口: ${port}`);
                break;
            }
        }
    }
    log('初始化完成，urlMap: ', JSON.stringify(urlMap, null, 2));
}
init();

class Http {
    constructor(urlMap) {
        this.urlMap = urlMap;
    }

    async getData(epId, val, data = null) {
        if (!urlMap.hasOwnProperty(epId)) {
            console.error(`未找到端口: ${epId}`);
            return null;
        }

        const url = `${urlMap[epId]}/${val}`;
        log('请求地址: ', url);
        const result = await fetchData(url, data);
        return result;
    }
}

globalThis.http = new Http(urlMap);

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'http';
cmd.help = '帮助: .http <方法>。\n示例 .http get_login_info';
cmd.solve = async (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
        seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
        return seal.ext.newCmdExecuteResult(true);
    }
    const epId = ctx.endPoint.userId;
    const val = cmdArgs.getArgN(1);
    if (!val) {
        seal.replyToSender(ctx, msg, '未找到参数1');
        return seal.ext.newCmdExecuteResult(true);
    }
    const data = await globalThis.http.getData(epId, val);
    seal.replyToSender(ctx, msg, JSON.stringify(data, null, 2));
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['http'] = cmd;   