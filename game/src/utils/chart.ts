import { Player } from "./player";

export interface PlayerInfo {
    uid: string,
    name: string,
    value: number
}

export class Chart {
    func: (player: Player) => number;
    list: PlayerInfo[];

    constructor(func: (player: Player) => number) {
        this.func = func;
        this.list = [];
    }

    updateChart(player: Player) {
        const value = this.func(player);

        if (typeof value!== 'number') {
            console.error(`更新排行榜时出现错误:返回值不是数字`);
            return;
        }

        const index = this.list.findIndex(pi => pi.uid === player.uid);

        if (index === -1) {
            const pi = {
                uid: player.uid,
                name: player.name,
                value: value
            }

            this.list.push(pi);
        } else {
            this.list[index].name = player.name;
            this.list[index].value = value;
        }

        this.list.sort((a, b) => {
            return b.value - a.value;
        });

        this.list = this.list.slice(0, 10);
    }
}

export class ChartManager {
    private ext: seal.ExtInfo;
    private map: { [key: string]: (player: Player) => number } // 排行榜名字和变量名的映射
    private cache: { [key: string]: Chart }

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.map = {};
        this.cache = {};
    }

    parse(data: any, func: (player: Player) => number): Chart | undefined {
        if (typeof func !== 'function') {
            return undefined;
        }

        const chart = new Chart(func);

        if (data.hasOwnProperty('list') && Array.isArray(data.list)) {
            chart.list = data.list;
        }

        return chart;
    }

    clearCache() {
        this.cache = {};
    }

    registerChart(name: string, func: (player: Player) => number) {
        if (this.map.hasOwnProperty(name)) {
            console.error(`注册排行榜${name}时出现错误:该名字已注册`);
            return;
        }

        this.map[name] = func;
    }

    getChart(name: string): Chart | undefined {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`获取排行榜${name}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.cache.hasOwnProperty(name)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`chart_${name}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`chart_${name}`}失败:`, error);
            }

            const func = this.map[name];
            this.cache[name] = this.parse(data, func);
        }


        return this.cache[name];
    }

    saveChart(name: string) {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`保存排行榜${name}时出现错误:该名字未注册`);
            return;
        }

        if (this.cache.hasOwnProperty(name)) {
            const chart = this.cache[name];
            this.ext.storageSet(`chart_${name}`, JSON.stringify(chart));
        }
    }

    updateChart(name: string, player: Player) {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`更新排行榜${name}时出现错误:该名字未注册`);
            return;
        }

        const chart = this.getChart(name);

        if (!chart) {
            return;
        }

        chart.updateChart(player);
        this.saveChart(name);
    }

    updateAllChart(player: Player) {
        for (const name of Object.keys(this.map)) {
            this.updateChart(name, player);
        }
    }
}