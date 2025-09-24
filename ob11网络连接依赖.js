// ==UserScript==
// @name         ob11网络连接依赖
// @author       错误，白鱼
// @version      2.0.0
// @description  为插件提供统一的ob11网络连接依赖管理，支持HTTP和WebSocket。\n地址请按照自己的登录方案自行配置，支持http和ws协议，支持多个账号，插件会自动识别当前账号使用对应的连接地址。\nWebSocket会保持持久连接并接收事件推送。\n提供指令 .net 可以直接调用\n在其他插件中使用方法: globalThis.net.callApi(epId, method, data=null)\nepId为骰子账号QQ:12345，method为方法，如get_login_info，data为参数。\n方法可参见https://github.com/botuniverse/onebot-11/blob/master/api/public.md#%E5%85%AC%E5%BC%80-api
// @timestamp    1755278205
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/ob11网络连接依赖.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/ob11网络连接依赖.js
// ==/UserScript==

let ext = seal.ext.find('ob11网络连接依赖');
if (!ext) {
    ext = seal.ext.new('ob11网络连接依赖', '错误，白鱼', '2.0.0');
    seal.ext.register(ext);
}

seal.ext.registerTemplateConfig(ext, '网络地址', ['http://127.0.0.1:8084', 'ws://127.0.0.1:8081'], '支持http://、https://、ws://、wss://协议，修改后保存并重载js');
seal.ext.registerTemplateConfig(ext, 'Access Token', ['', ''], '在这里填入你的Access Token，与上面的地址一一对应，如果没有则留空');
seal.ext.registerOptionConfig(ext, "日志打印方式", "简短", ["永不", "简短", "详细"], '修改后保存并重载js');
seal.ext.registerOptionConfig(ext, "事件处理", "记录", ["忽略", "记录"], '设置对WebSocket事件的处理方式');

let urlMap = {};
let wsConnections = {};
let initDone = false;
const logLevel = seal.ext.getOptionConfig(ext, "日志打印方式");
const eventLevel = seal.ext.getOptionConfig(ext, "事件处理");

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

const logger = new Logger('ob11网络连接依赖');

// 判断URL协议类型
function getProtocolType(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith('ws://') || lowerUrl.startsWith('wss://')) {
        return 'websocket';
    } else if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
        return 'http';
    } else {
        return 'http';
    }
}

// HTTP请求函数
async function fetchWithHttp(url, token = '', data = null) {
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
            throw new Error(`HTTP请求失败! 状态码: ${response.status}\n响应体: ${text}`);
        }
        if (!text) {
            logger.info('HTTP响应体为空，但请求成功');
            return {};
        }

        try {
            const responseData = JSON.parse(text);
            logger.info(`HTTP获取数据成功: ${JSON.stringify(responseData.data, null, 2)}`);
            return responseData.data;
        } catch (e) {
            throw new Error(`HTTP解析响应体时出错:${e}\n响应体:${text}`);
        }
    } catch (error) {
        logger.error(`HTTP请求失败: ${error.message}`);
        throw error;
    }
}

// --- 事件分发 ---
const eventListeners = {};
function onEvent(type, handler) {
    if (!eventListeners[type]) eventListeners[type] = [];
    eventListeners[type].push(handler);
}
function emitEvent(type, epId, event) {
    if (eventListeners[type]) {
        for (let fn of eventListeners[type]) {
            try { fn(epId, event); } catch (e) { logger.error(`事件处理错误: ${e.message}`); }
        }
    }
    if (eventListeners["*"]) {
        for (let fn of eventListeners["*"]) {
            try { fn(epId, event); } catch (e) { logger.error(`事件处理错误: ${e.message}`); }
        }
    }
}

/**
 * 获取事件的简要描述信息，便于日志记录和调试
 * @param {object} event OneBot 11 标准事件对象
 * @returns {string} 返回格式化后的事件描述字符串，内容根据事件类型自动拼接
 */
function getEventDescription(event) {
    const { post_type, time, self_id } = event;
    let eventDesc = `时间:${new Date(time * 1000).toLocaleString()}, 机器人:${self_id}, 事件类型:${post_type}`;
    
    switch (post_type) {
        case 'message':
            const subType = event.message_type;
            eventDesc += `.${subType}`;
            if (subType === 'group') {
                eventDesc += ` (群:${event.group_id}, 用户:${event.user_id})`;
            } else if (subType === 'private') {
                eventDesc += ` (用户:${event.user_id})`;
            }
            if (logLevel === "详细") {
                let msgContent = event.message;
                if (typeof msgContent === 'object') {
                    try {
                        msgContent = JSON.stringify(msgContent);
                    } catch (e) {
                        msgContent = '[无法解析的消息对象]';
                    }
                }
                eventDesc += ` 消息:${msgContent}`;
            }
            break;
        case 'notice':
            const noticeType = event.notice_type;
            eventDesc += `.${noticeType}`;
            if (noticeType === 'group_upload') {
                eventDesc += ` (群:${event.group_id}, 用户:${event.user_id}, 文件:${event.file?.name || '未知'})`;
            } else if (noticeType === 'group_admin') {
                eventDesc += ` (群:${event.group_id}, 用户:${event.user_id}, 操作:${event.sub_type})`;
            } else if (noticeType === 'group_decrease' || noticeType === 'group_increase') {
                eventDesc += ` (群:${event.group_id}, 用户:${event.user_id}, 操作:${event.sub_type})`;
            } else if (noticeType === 'group_ban') {
                eventDesc += ` (群:${event.group_id}, 用户:${event.user_id}, 时长:${event.duration}s)`;
            } else if (noticeType === 'friend_add') {
                eventDesc += ` (用户:${event.user_id})`;
            } else if (noticeType === 'group_recall') {
                eventDesc += ` (群:${event.group_id}, 用户:${event.user_id}, 消息ID:${event.message_id})`;
            } else if (noticeType === 'friend_recall') {
                eventDesc += ` (用户:${event.user_id}, 消息ID:${event.message_id})`;
            } else if (noticeType === 'notify') {
                eventDesc += `.${event.sub_type}`;
                if (event.sub_type === 'poke') {
                    eventDesc += ` (群:${event.group_id || '私聊'}, 戳一戳:${event.user_id}->${event.target_id})`;
                } else if (event.sub_type === 'lucky_king') {
                    eventDesc += ` (群:${event.group_id}, 红包王:${event.target_id})`;
                } else if (event.sub_type === 'honor') {
                    eventDesc += ` (群:${event.group_id}, 群荣誉:${event.honor_type}, 用户:${event.user_id})`;
                }
            }
            break;
        case 'request':
            const requestType = event.request_type;
            eventDesc += `.${requestType}`;
            if (requestType === 'friend') {
                eventDesc += ` (用户:${event.user_id}, 验证消息:"${event.comment}")`;
            } else if (requestType === 'group') {
                eventDesc += `.${event.sub_type} (群:${event.group_id}, 用户:${event.user_id}, 消息:"${event.comment}")`;
            }
            break;
        case 'meta_event':
            const metaType = event.meta_event_type;
            eventDesc += `.${metaType}`;
            if (metaType === 'lifecycle') {
                eventDesc += ` (子类型:${event.sub_type})`;
            } else if (metaType === 'heartbeat') {
                eventDesc += ` (状态:${JSON.stringify(event.status)})`;
            }
            break;
        default:
            eventDesc += ' (未知事件类型)';
    }
    
    return eventDesc;
}

function handleEvent(epId, event) {
    if (eventLevel === "忽略") return;
    
    if (eventLevel === "记录") {
        const eventDesc = getEventDescription(event);
        logger.info(`[${epId}] 收到事件: ${eventDesc}`);
        
        if (logLevel === "详细") {
            logger.info(`[${epId}] 完整事件数据: ${JSON.stringify(event, null, 2)}`);
        }
    }

    const eventType = `${event.post_type}.${event.message_type || event.notice_type || event.request_type || event.meta_event_type || 'unknown'}`;
    
    emitEvent(eventType, epId, event);
    emitEvent(event.post_type, epId, event);
    emitEvent("*", epId, event);
}

/**
 * 创建一个 WebSocket 连接并管理其生命周期。
 * @param {string} epId   端点ID
 * @param {string} wsUrl  WebSocket 服务端地址
 * @param {string} token  Access Token
 * @returns {object}      返回连接信息对象
 */
function createWebSocketConnection(epId, wsUrl, token = '') {
    if (wsConnections[epId]) {
        logger.info(`${epId} 的WebSocket连接已存在，先关闭旧连接`);
        wsConnections[epId].close();
    }

    let connectionUrl = wsUrl;
    if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        connectionUrl = `${wsUrl}${separator}access_token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(connectionUrl);
    const connectionInfo = {
        ws: ws,
        url: wsUrl,
        token: token,
        connected: false,
        apiCallbacks: new Map() 
    };

    ws.onopen = function() {
        connectionInfo.connected = true;
        logger.info(`[${epId}] WebSocket连接成功: ${connectionUrl.replace(/access_token=[^&]*/, 'access_token=***')}`);
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            
            if (data.hasOwnProperty('echo') && connectionInfo.apiCallbacks.has(data.echo)) {
                const callback = connectionInfo.apiCallbacks.get(data.echo);
                connectionInfo.apiCallbacks.delete(data.echo);
                
                if (data.status === 'ok') {
                    callback.resolve(data.data);
                } else {
                    callback.reject(new Error(`API调用失败: ${data.message || data.wording || '未知错误'}`));
                }
            }

            else if (data.hasOwnProperty('post_type')) {
                handleEvent(epId, data);
            }

            else if (data.hasOwnProperty('status')) {
                logger.info(`[${epId}] 收到无echo的API响应: ${JSON.stringify(data)}`);
            } else {
                logger.warning(`[${epId}] 收到未知格式消息: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            logger.error(`[${epId}] 解析WebSocket消息失败: ${e.message}`);
        }
    };

    ws.onerror = function(event) {
        logger.error(`[${epId}] WebSocket错误:`, event.error);
        connectionInfo.connected = false;
    };

    ws.onclose = function(event) {
        connectionInfo.connected = false;
        if (event.code !== 1000) {
            logger.warning(`[${epId}] WebSocket异常关闭: ${event.code} ${event.reason}`);
        } else {
            logger.info(`[${epId}] WebSocket正常关闭`);
        }
        
        connectionInfo.apiCallbacks.forEach(callback => {
            callback.reject(new Error('WebSocket连接已关闭'));
        });
        connectionInfo.apiCallbacks.clear();
    };

    wsConnections[epId] = connectionInfo;
    return connectionInfo;
}

/**
 * 通过WebSocket调用OneBot 11 API。
 * @param {string} epId   端点ID（格式如 QQ:12345）
 * @param {string} action API方法名
 * @param {object} params API参数对象
 * @returns {Promise<object>} 返回API响应的data字段
 */
async function callWebSocketApi(epId, action, params = {}) {
    const connectionInfo = wsConnections[epId];
    if (!connectionInfo || !connectionInfo.connected) {
        throw new Error(`WebSocket连接未建立或已断开: ${epId}`);
    }

    return new Promise((resolve, reject) => {
        const echo = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        connectionInfo.apiCallbacks.set(echo, { resolve, reject });
        
        const requestData = {
            action: action,
            params: params,
            echo: echo
        };

        logger.info(`[${epId}] WebSocket发送API请求: ${JSON.stringify(requestData)}`);
        connectionInfo.ws.send(JSON.stringify(requestData));
        
        setTimeout(() => {
            if (connectionInfo.apiCallbacks.has(echo)) {
                connectionInfo.apiCallbacks.delete(echo);
                reject(new Error('API调用超时'));
            }
        }, 10000);
    });
}

/**
 * 统一的网络请求接口
 * @param {string} url           API 基础地址
 * @param {string} token         Access Token
 * @param {string} methodOrAction API 方法名
 * @param {object|null} data     请求参数对象，GET 时为 null，POST 时为参数对象
 * @returns {Promise<object>}    返回 API 响应的数据部分
 */
async function fetchData(url, token = '', methodOrAction, data = null) {
    const protocolType = getProtocolType(url);
    
    if (protocolType === 'websocket') {
        throw new Error('WebSocket应使用callWebSocketApi函数');
    } else {
        const fullUrl = `${url}/${methodOrAction}`;
        return await fetchWithHttp(fullUrl, token, data);
    }
}

async function init() {
    urlMap = {};
    
    Object.keys(wsConnections).forEach(epId => {
        if (wsConnections[epId]) {
            wsConnections[epId].ws.close();
            delete wsConnections[epId];
        }
    });

    const urls = seal.ext.getTemplateConfig(ext, '网络地址');
    const tokens = seal.ext.getTemplateConfig(ext, 'Access Token');

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const token = tokens[i] || '';
        const protocolType = getProtocolType(url);

        try {
            logger.info(`尝试连接: ${url} (${protocolType})`);
            let data;
            
            if (protocolType === 'websocket') {
                const tempWs = new WebSocket(token ? 
                    `${url}${url.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}` : 
                    url
                );
                
                data = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        tempWs.close();
                        reject(new Error('WebSocket连接超时'));
                    }, 5000);

                    tempWs.onopen = function() {
                        const requestData = {
                            action: 'get_login_info',
                            params: {},
                            echo: 'init_test'
                        };
                        tempWs.send(JSON.stringify(requestData));
                    };

                    tempWs.onmessage = function(event) {
                        try {
                            const response = JSON.parse(event.data);
                            if (response.echo === 'init_test' && response.status === 'ok') {
                                clearTimeout(timeout);
                                tempWs.close();
                                resolve(response.data);
                            }
                        } catch (e) {
                        }
                    };

                    tempWs.onerror = function(event) {
                        clearTimeout(timeout);
                        tempWs.close();
                        reject(new Error(`WebSocket连接错误: ${event.error || '未知错误'}`));
                    };
                });
            } else {
                data = await fetchData(url, token, 'get_login_info', null);
            }
            
            if (data === null || data === undefined) {
                logger.error(`获取登录信息失败: ${url}`);
                continue;
            }
            
            const epId = `QQ:${data.user_id}`;
            const eps = seal.getEndPoints();
            let found = false;
            
            for (let j = 0; j < eps.length; j++) {
                if (eps[j].userId === epId) {
                    urlMap[epId] = { 
                        url: url, 
                        token: token,
                        type: protocolType
                    };
                    
                    if (protocolType === 'websocket') {
                        createWebSocketConnection(epId, url, token);
                    }
                    
                    logger.info(`找到 ${epId} 地址: ${url} (${protocolType})`);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                logger.warning(`未找到对应的端点: ${epId}`);
            }
        } catch (error) {
            logger.error(`获取登录信息失败: ${url}, 错误: ${error.message}`);
            continue;
        }
    }

    logger.info('初始化完成，urlMap: ', JSON.stringify(urlMap, null, 2));
    initDone = true;
}

class NetworkClient {
    constructor(urlMap) {
        this.urlMap = urlMap;
    }

    /** 兼容旧版本HTTP依赖 */
    async getData(epId, val, data = null) {
        return await this.callApi(epId, val, data);
    }

    /**
     * 调用网络API（统一接口）
     * @param {string} epId 骰子的QQ号，格式如 QQ:12345
     * @param {string} method 调用的方法名，如 get_login_info
     * @param {object} data 调用的方法的参数，默认为null
     * @returns {Promise} 返回API调用结果
     */
    async callApi(epId, method, data = null) {
        // 兼容http get调用写法
        if (method.indexOf("?") !== -1) {
            const parts = method.split("?");
            method = parts[0]; 
            const query = parts[1];
            const queryParams = {};
            
            const pairs = query.split("&");
            for (let i = 0; i < pairs.length; i++) {
                const kv = pairs[i].split("=");
                const key = kv[0];
                const value = kv.length > 1 ? kv[1] : "";
                queryParams[key] = value;
            }

            if (data === null) {
                data = queryParams;
            } else {
                for (let k in queryParams) {
                    data[k] = queryParams[k];
                }
            }
        }

        if (!initDone) {
            await init();
        }

        if (!urlMap.hasOwnProperty(epId)) {
            logger.error(`未找到网络地址: ${epId}，请检查配置`);
            logger.info(`当前可用的端点: ${Object.keys(urlMap).join(', ')}`);
            throw new Error(`未找到网络地址: ${epId}，请检查配置`);
        }

        const { url, token, type } = urlMap[epId];
        
        let logUrl = url;
        if (token && type === 'websocket') {
            const separator = url.includes('?') ? '&' : '?';
            logUrl = `${url}${separator}access_token=***`;
        }
        
        logger.info(`请求地址: ${logUrl} (${type})`);
        logger.info(`请求方法: ${method}`);
        logger.info(`请求参数: ${JSON.stringify(data)}`);

        try {
            let result;
            if (type === 'websocket') {
                result = await callWebSocketApi(epId, method, data || {});
            } else {
                result = await fetchData(url, token, method, data);
            }
            return result;
        } catch (error) {
            logger.error(`网络API调用失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 关闭WebSocket连接
     * @param {string} epId 骰子的QQ号，如果不提供则关闭所有连接
     */
    closeWebSocket(epId) {
        if (epId) {
            if (wsConnections[epId]) {
                wsConnections[epId].ws.close();
                delete wsConnections[epId];
                logger.info(`已关闭 ${epId} 的WebSocket连接`);
                return 1;
            } else {
                logger.warning(`${epId} 没有WebSocket连接`);
                return 0;
            }
        } else {
            let count = 0;
            Object.keys(wsConnections).forEach(id => {
                wsConnections[id].ws.close();
                delete wsConnections[id];
                count++;
            });
            logger.info(`已关闭 ${count} 个WebSocket连接`);
            return count;
        }
    }

    /**
     * 获取WebSocket连接状态
     */
    getWebSocketStatus() {
        const status = {};
        Object.keys(wsConnections).forEach(epId => {
            const conn = wsConnections[epId];
            status[epId] = {
                connected: conn.connected,
                url: conn.url,
                readyState: conn.ws.readyState
            };
        });
        return status;
    }

    /**
     * 发送群消息的便捷方法
     */
    async sendGroupMsg(epId, groupId, message) {
        return await this.callApi(epId, 'send_group_msg', {
            group_id: groupId,
            message: message
        });
    }

    /**
     * 发送私聊消息的便捷方法
     */
    async sendPrivateMsg(epId, userId, message) {
        return await this.callApi(epId, 'send_private_msg', {
            user_id: userId,
            message: message
        });
    }

    /**
     * 禁言群成员的便捷方法
     */
    async setGroupBan(epId, groupId, userId, duration) {
        return await this.callApi(epId, 'set_group_ban', {
            group_id: groupId,
            user_id: userId,
            duration: duration
        });
    }

    /**
     * 踢出群成员的便捷方法
     */
    async setGroupKick(epId, groupId, userId, rejectAddRequest = false) {
        return await this.callApi(epId, 'set_group_kick', {
            group_id: groupId,
            user_id: userId,
            reject_add_request: rejectAddRequest
        });
    }

    /**
     * 获取群成员信息的便捷方法
     */
    async getGroupMemberInfo(epId, groupId, userId, noCache = false) {
        return await this.callApi(epId, 'get_group_member_info', {
            group_id: groupId,
            user_id: userId,
            no_cache: noCache
        });
    }

    /**
     * 获取群信息的便捷方法
     */
    async getGroupInfo(epId, groupId, noCache = false) {
        return await this.callApi(epId, 'get_group_info', {
            group_id: groupId,
            no_cache: noCache
        });
    }
}

globalThis.net = new NetworkClient(urlMap);
globalThis.net.onEvent = onEvent;
globalThis.net.emitEvent = emitEvent; 

// 兼容
globalThis.http = globalThis.net;
globalThis.ws = globalThis.net;

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'net';
cmd.help = `ob11网络连接依赖帮助:
.net init 初始化ob11网络连接依赖
.net close [epId] 关闭WebSocket连接，不指定epId则关闭所有
.net status 查看WebSocket连接状态
.net <方法>
--<参数名>=<参数>

示例:
.net get_login_info
.net send_group_msg --group_id=123456 --message=测试消息
.net close QQ:12345
.net close
.net status`;

cmd.solve = (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
        seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
        return seal.ext.newCmdExecuteResult(true);
    }

    const epId = ctx.endPoint.userId;
    const ret = seal.ext.newCmdExecuteResult(true);
    const method = cmdArgs.getArgN(1);
    
    switch (method) {
        case 'init': {
            init().then(() => {
                seal.replyToSender(ctx, msg, 'ob11网络连接依赖初始化完成');
            }).catch(error => {
                seal.replyToSender(ctx, msg, `初始化失败: ${error.message}`);
            });
            return ret;
        }
        case 'close': {
            const targetEpId = cmdArgs.getArgN(2);
            const count = globalThis.net.closeWebSocket(targetEpId);
            if (targetEpId) {
                seal.replyToSender(ctx, msg, count > 0 ? `已关闭 ${targetEpId} 的连接` : `${targetEpId} 没有连接`);
            } else {
                seal.replyToSender(ctx, msg, `已关闭 ${count} 个WebSocket连接`);
            }
            return ret;
        }
        case 'status': {
            const status = globalThis.net.getWebSocketStatus();
            const statusText = Object.keys(status).length > 0 ? 
                JSON.stringify(status, null, 2) : '没有WebSocket连接';
            seal.replyToSender(ctx, msg, `WebSocket连接状态:\n${statusText}`);
            return ret;
        }
        case '':
        case 'help': {
            ret.showHelp = true;
            return ret;
        }
        default: {
            const data = cmdArgs.kwargs.reduce((acc, kwarg) => {
                const { name, value } = kwarg;
                try {
                    acc[name] = JSON.parse(`[${value}]`)[0];
                } catch (e) {
                    acc[name] = value;
                }
                return acc;
            }, {});

            globalThis.net.callApi(epId, method, data).then(result => {
                seal.replyToSender(ctx, msg, JSON.stringify(result, null, 2));
            }).catch(error => {
                seal.replyToSender(ctx, msg, `调用失败: ${error.message}`);
            });

            return ret;
        }
    }
};

ext.cmdMap['net'] = cmd;