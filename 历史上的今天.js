// ==UserScript==
// @name         历史上的今天
// @author       错误
// @version      1.0.0
// @description  发送‘历史上的今天’，获取历史上的今天的事件 
// @timestamp    1725522223
// 2024-09-05 15:43:43
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E5%8E%86%E5%8F%B2%E4%B8%8A%E7%9A%84%E4%BB%8A%E5%A4%A9.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('historytoday');
if (!ext) {
    ext = seal.ext.new('historytoday', '错误', '1.0.0');
    seal.ext.register(ext);

    const apiUrl = 'https://tenapi.cn/v2/history';
    const cache = {date:'' ,eventlist: []}

    ext.onNotCommandReceived = async (ctx, msg) => {
        if (msg.message == '历史上的今天') {
            let eventList = []
            let date = seal.format(ctx, `{$tDate}`)
            if (date == cache.date) eventList = cache.eventlist
            else {
                try {
                    // 使用fetch发送GET请求
                    const response = await fetch(apiUrl);
                    // 检查响应是否成功
                    if (!response.ok) {
                        throw new Error('网络响应失败');
                    }
                    // 将响应转换为JSON
                    const data = await response.json();

                    eventList = data.data.list
                    cache.date = date
                    cache.eventlist = eventList
                } catch (error) {
                    // 处理错误
                    console.error('请求失败:', error);
                }
            }
            if (eventList.length > 0) {
                let event = eventList[Math.floor(Math.random() * eventList.length)]
                seal.replyToSender(ctx, msg, `${event.title}(${event.year})`)
            }
            return;
        }
    }
}
