import { ConfigManager } from "./configManager";
import { Goods } from "./shop";
import { parseGoods } from "./utils";

export class Player {
    id: string;
    favor: number;
    coin: number;
    backpack: Goods;

    static ext: seal.ExtInfo;
    static chart: {
        [key: string]: {
            favor: number;
            coin: number;
        }
    } = {};

    constructor(id: string) {
        this.id = id;
        this.favor = 0;
        this.coin = 0;
        this.backpack = {};
    }

    static getPlayer(id: string): Player {
        let data: any;

        try {
            data = JSON.parse(Player.ext.storageGet(`player_${id}`) || '{}');
        } catch (error) {
            console.error(`从数据库中获取player_${id}失败:`, error);
            data = {};
        }

        return Player.parse(data, id);
    }

    static savePlayer(player: Player): void {
        Player.ext.storageSet(`player_${player.id}`, JSON.stringify(player));
    }

    static parse(data: any, id: string): Player {
        let player: Player;

        if (!data) {
            return new Player(id);
        }

        try {
            player = new Player(data.id);

            player.favor = data.favor;
            player.coin = data.coin;
            player.backpack = parseGoods(data.backpack);
        } catch (err) {
            console.error(`解析玩家失败:`, err);
            player = new Player(id);
        }

        return player;
    }

    static getChart(ext: seal.ExtInfo): void {
        Player.ext = ext;

        if (!Player.chart) {
            try {
                Player.chart = JSON.parse(Player.ext.storageGet('chart') || '{}');
            } catch (error) {
                console.error('从数据库中获取chart失败:', error);
                Player.chart = {};
            }
        }
    }

    static saveChart(): void {
        Player.ext.storageSet(`chart`, JSON.stringify(Player.chart));
    }

    static getChartText(s: string): string {
        const arr: [string, number][] = [];

        for (const id in Player.chart) {
            arr.push([id, Player.chart[id][s]]);
        }

        arr.sort((a, b) => b[1] - a[1]);

        let text = `排行榜\n♚`
        for (let i = 0; i < 10 && i < arr.length; i++) {
          const [name, val] = arr[i];
          text += `第${i + 1}名: <${name}>  ${val}\n`
        }

        return text;
    }


    updateVars(ctx: seal.MsgContext): void {
        this.favor = seal.vars.intGet(ctx, ConfigManager.getVarName(0))[0];
        this.coin = seal.vars.intGet(ctx, ConfigManager.getVarName(1))[0];

        Player.chart[this.id] = {
            favor: this.favor,
            coin: this.coin
        }

        const vars = ['favor', 'coin'];
        const chart: {
            [key: string]: {
                favor: number;
                coin: number;
            }
        } = {};

        for (const s of vars) {
            const arr: [string, number][] = [];

            for (const id in Player.chart) {
                arr.push([id, Player.chart[id][s]]);
            }
    
            arr.sort((a, b) => b[1] - a[1]);

            arr.splice(10);

            for (const [id, _] of arr) {
                if (!chart[id]) {
                    chart[id] = Player.chart[id];
                }
            }
        }

        Player.chart = chart;
        Player.saveChart();
    }

    buy() {

    }

    use() {

    }

    throw() {
        
    }
}