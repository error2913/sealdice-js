// ==UserScript==
// @name         HTTP依赖
// @author       错误
// @version      1.1.2
// @description  为插件提供HTTP依赖管理。\nHTTP端口请按照自己的登录方案自行配置，配置完成后在插件设置填入。插件初始化时会自动获取HTTP地址对应的账号并保存。\n提供指令 .http 可以直接调用\n在其他插件中使用方法: globalThis.http.callApi(epId, method, data=null)\nepId为骰子账号QQ:12345，method为方法，如get_login_info，data为参数。\n方法可参见https://github.com/botuniverse/onebot-11/blob/master/api/public.md#%E5%85%AC%E5%BC%80-api
// @timestamp    1755278205
// 2025-08-16 01:16:58
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/HTTP依赖.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/HTTP依赖.js
// ==/UserScript==

let ext = seal.ext.find('HTTP依赖');
if (!ext) {
    ext = seal.ext.new('HTTP依赖', '错误', '1.1.1');
    seal.ext.register(ext);
}

seal.ext.registerTemplateConfig(ext, 'HTTP端口地址', ['http://127.0.0.1:8084'], '修改后保存并重载js');
seal.ext.registerTemplateConfig(ext, 'HTTP Access Token', [''], '在这里填入你的Access Token，与上面的端口地址一一对应，如果没有则留空');
seal.ext.registerOptionConfig(ext, "日志打印方式", "简短", ["永不", "简短", "详细"], '修改后保存并重载js');


const urlMap = {};
const logLevel = seal.ext.getOptionConfig(ext, "日志打印方式");

class Logger {
    constructor(name) {
        this.name = name;
    }

    handleLog(...data) {
        if (logLevel === "永不") {
            return '';
        } else if (logLevel === "简短") {
            const s = data.map(item => `${item}`).join(" ");
            if (s.length > 1000) {
                return s.substring(0, 500) + "\n...\n" + s.substring(s.length - 500);
            } else {
                return s;
            }
        } else if (logLevel === "详细") {
            return data.map(item => `${item}`).join(" ");
        } else {
            return '';
        }
    }

    info(...data) {
        const s = this.handleLog(...data);
        if (!s) {
            return;
        }
        console.log(`【${this.name}】: ${s}`);
    }

    warning(...data) {
        const s = this.handleLog(...data);
        if (!s) {
            return;
        }
        console.warn(`【${this.name}】: ${s}`);
    }

    error(...data) {
        const s = this.handleLog(...data);
        if (!s) {
            return;
        }
        console.error(`【${this.name}】: ${s}`);
    }
}

const logger = new Logger('http');

async function fetchData(url, token = '', data = null) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method: data === null ? 'GET' : 'POST',
            headers: headers,
        };

        if (data !== null) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const text = await response.text();

        if (!response.ok) {
            throw new Error(`请求失败! 状态码: ${response.status}\n响应体: ${text}`);
        }
        if (!text) {
            logger.info('响应体为空，但请求成功');
            return {};
        }

        try {
            const responseData = JSON.parse(text);
            logger.info(`获取数据成功: ${JSON.stringify(responseData.data, null, 2)}`);
            return responseData.data;
        } catch (e) {
            throw new Error(`解析响应体时出错:${e}\n响应体:${text}`);
        }
    } catch (error) {
        logger.error(`获取数据失败: ${error.message}`);
        return null;
    }
}


async function init() {
    const ports = seal.ext.getTemplateConfig(ext, 'HTTP端口地址');
    const tokens = seal.ext.getTemplateConfig(ext, 'HTTP Access Token');

    for (let i = 0; i < ports.length; i++) {
        const port = ports[i];
        const token = tokens[i] || '';
        const url = `${port}/get_login_info`;
        
        const data = await fetchData(url, token); 
        if (data === null) {
            logger.error(`获取登录信息失败: ${port}`);
            continue;
        }
        const epId = `QQ:${data.user_id}`;
        const eps = seal.getEndPoints();
        for (let j = 0; j < eps.length; j++) {
            if (eps[j].userId === epId) {
                urlMap[epId] = { url: port, token: token };
                logger.info(`找到 ${epId} 端口: ${port}`);
                break;
            }
        }
    }
    logger.info('初始化完成，urlMap: ', JSON.stringify(urlMap, null, 2));
}

init();

class Http {
    constructor(urlMap) {
        this.urlMap = urlMap;
    }

    /** 兼容旧版本 */
    async getData(epId, val, data = null) {
        return await this.callApi(epId, val, data);
    }

    /**
     * 调用HTTP接口
     * @param {string} epId 骰子的QQ号
     * @param {string} method 调用的方法名
     * @param {object} data 调用的方法的参数，默认为null
     * @returns 
     */
    async callApi(epId, method, data = null) {
        if (!urlMap.hasOwnProperty(epId)) {
            logger.error(`未找到端口: ${epId}，请检查配置`);
            return null;
        }

        const { url: baseUrl, token } = urlMap[epId]; 
        const url = `${baseUrl}/${method}`;

        logger.info('请求地址: ', url, '\n请求参数: ', JSON.stringify(data));
        
        const result = await fetchData(url, token, data);
        return result;
    }

}

globalThis.http = new Http(urlMap);

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'http';
cmd.help = `帮助:
.http <方法>
--<参数名>=<参数>

示例:
.http get_login_info
.http get_version_info
.http send_group_msg
--group_id=123456
--message=[{"type":"text","data":{"text":"嘿嘿"}}]`;
cmd.solve = (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
        seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
        return seal.ext.newCmdExecuteResult(true);
    }

    const epId = ctx.endPoint.userId;
    const method = cmdArgs.getArgN(1);
    if (!method || method === 'help') {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
    }

    const data = cmdArgs.kwargs.reduce((acc, kwarg) => {
        const { name, value } = kwarg;
        try {
            acc[name] = JSON.parse(`[${value}]`)[0];
        } catch (e) {
            acc[name] = value;
        }
        return acc;
    }, {});

    globalThis.http.callApi(epId, method, data).then(result => {
        seal.replyToSender(ctx, msg, JSON.stringify(result, null, 2));
    });

    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['http'] = cmd;   