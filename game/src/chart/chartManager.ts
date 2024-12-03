import { Player } from "../player/player";
import { Chart } from "./chart";

export class ChartManager {
    private ext: seal.ExtInfo;
    private map: { [key: string]: (player: Player) => number } // 排行榜名字和变量名的映射
    private cache: { [key: string]: Chart }

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.map = {};
        this.cache = {};
    }

    clearCache() {
        this.cache = {};
    }

    registerChart(name: string, func: (player: Player) => number) {
        if (this.map.hasOwnProperty(name)) {
            console.error(`注册排行榜${name}时出现错误:该名字已注册`);
            return;
        }

        if (Chart.parse(null, func) === undefined) {
            console.error(`注册排行榜${name}时出现错误:计算函数错误`);
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
            this.cache[name] = Chart.parse(data, func);
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

    showAvailableChart(): string {
        return Object.keys(this.map).join('\n');
    }
}