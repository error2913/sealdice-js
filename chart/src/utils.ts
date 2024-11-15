import { ConfigManager } from "./configManager";

export function getMsg(messageType: "group" | "private", senderId: string, groupId: string = ''): seal.Message {
    let msg = seal.newMessage();

    if (messageType == 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

export function getCtx(epId: string, msg: seal.Message): seal.MsgContext | undefined {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            return seal.createTempCtx(eps[i], msg);
        }
    }

    return undefined;
}

export interface Chart {
    [key: string]: {
        [key: string]: number
    }
}

export function getChart(ext: seal.ExtInfo): Chart {
    let chart: {
        [key: string]: {
            [key: string]: number
        }
    } = {}

    try {
        chart = JSON.parse(ext.storageGet('chart') || '{}');
    } catch (error) {
        console.error('从数据库中获取chart失败:', error);
        chart = {};
    }

    return chart;
}

export function saveChart(ext: seal.ExtInfo, chart: Chart): void {
    ext.storageSet(`chart`, JSON.stringify(chart));
}

export function getChartText(s: string, chart: Chart, configManager: ConfigManager): string {
    const varName = configManager.getVarName(s);
    if (!varName) {
        return `${s}排行榜不存在`
    }

    const arr: [string, number][] = [];

    for (const id in chart) {
        let val = 0;

        if (chart[id].hasOwnProperty(s)) {
            val = chart[id][s];
        }

        if (val === 0) {
            continue;
        }

        arr.push([id, val]);
    }

    if (arr.length === 0) {
        return `${s}排行榜为空`;
    }

    arr.sort((a, b) => b[1] - a[1]);

    let text = `${s}排行榜\n♚`
    for (let i = 0; i < 10 && i < arr.length; i++) {
        const [id, val] = arr[i];
        text += `第${i + 1}名: <${id}>  ${val}\n`
    }

    return text;
}

export function updateVars(ext: seal.ExtInfo, ctx: seal.MsgContext, chart: Chart): Chart {
    const id = ctx.player.userId;
    const varNames = seal.ext.getTemplateConfig(ext, '变量名');
    const names = seal.ext.getTemplateConfig(ext, '变量对应名称');
    let newChart: Chart = {};

    chart[id] = {};
    for (let i = 0; i < names.length; i++) {
        const name = names[i];

        if (i >= varNames.length) {
            console.error(`在getVarName中出错:${name}(${i})找不到对应变量名`);
            continue;
        }

        const varName = varNames[i];

        const [val, exist] = seal.vars.intGet(ctx, varName);

        if (exist) {
            chart[id][name] = val;

            const arr: [string, number][] = [];

            for (const id in chart) {
                let val = 0;

                if (chart[id].hasOwnProperty(name)) {
                    val = chart[id][name];
                }
        
                arr.push([id, val]);
            }
    
            arr.sort((a, b) => b[1] - a[1]);
    
            arr.splice(10);
    
            for (const [id2, _] of arr) {
                if (!newChart[id2] || id2 === id) {
                    newChart[id2] = chart[id2];
                }
            }
        }
    }

    saveChart(ext, newChart);
    return newChart;
}