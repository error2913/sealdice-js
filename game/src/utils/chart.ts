import { Player } from "./player";

export interface PlayerInfo {
    uid: string,
    name: string,
    value: number
}

export class Chart {
    name: string;
    varName: string;
    list: PlayerInfo[];
    gameKey: string;

    constructor(name: string, vn: string, gk: string) {
        this.name = name;
        this.varName = vn;
        this.list = [];
        this.gameKey = gk;
    }

    updateChart(player: Player) {
        const vn = this.varName;
        if (!player.varsMap.hasOwnProperty(vn)) {
            console.error(`更新排行榜${this.name}时出现错误:变量${vn}未注册`);
            return;
        }

        const index = this.list.findIndex(pi => pi.uid === player.uid);

        if (index === -1) {
            const pi = {
                uid: player.uid,
                name: player.name,
                value: player.varsMap[vn]
            }
    
            this.list.push(pi);
        } else {
            this.list[index].name = player.name;
            this.list[index].value = player.varsMap[vn];
        }

        this.list.sort((a, b) => {
            return b.value - a.value;
        });

        this.list = this.list.slice(0, 10);
    }
}

export class ChartManager {
    ext: seal.ExtInfo;
    gameKey: string;
    map: {
        [key: string]: string// 变量名
    }

    constructor(ext: seal.ExtInfo, gk: string) {
        this.ext = ext;
        this.gameKey = gk;
        this.map = {};
    }

    private parse(data: any, name: string, vn: string): Chart {
        if (!data.hasOwnProperty(name)) {
            console.log(`创建新排行榜:${name}`);
        }

        const gk = this.gameKey;
        const chart = new Chart(name, vn, gk);

        if (data.hasOwnProperty('list') && Array.isArray(data.list)) {
            chart.list = data.list;
        }

        return chart;
    }

    registerChart(name: string, vn: string) {
        if (this.map.hasOwnProperty(name)) {
            console.error(`注册排行榜${name}时出现错误:该名字已注册`);
            return;
        }

        this.map[name] = vn;
    }

    getChart(name: string): Chart | undefined  {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`获取排行榜${name}时出现错误:该名字未注册`);
            return undefined;
        }

        let data = {};

        try {
            data = JSON.parse(this.ext.storageGet(`chart_${name}`) || '{}');
        } catch (error) {
            console.error(`从数据库中获取${`chart_${name}`}失败:`, error);
        }

        const vn = this.map[name];
        const chart = this.parse(data, name, vn);

        return chart;
    }

    saveChart(name: string, chart: Chart) {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`保存排行榜${name}时出现错误:该名字未注册`);
            return;
        }

        if (name !== chart.name) {
            console.error(`保存排行榜${name}时出现错误:排行榜名字不匹配`);
            return;
        }

        this.ext.storageSet(`chart_${name}`, JSON.stringify(chart));
    }

    updateChart(name: string, player: Player) {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`更新排行榜${name}时出现错误:该名字未注册`);
            return;
        }

        const chart = this.getChart(name);
        chart.updateChart(player);
        this.saveChart(name, chart);
    }

    updateAllChart(player: Player) {
        for (const name of Object.keys(this.map)) {
            const chart = this.getChart(name);
            chart.updateChart(player);
        }
    }
}