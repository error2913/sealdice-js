import { Player } from "../player/player";

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

    static parse(data: any, func: (player: Player) => number): Chart {
        const chart = new Chart(func);

        if (data.hasOwnProperty('list') && Array.isArray(data.list)) {
            chart.list = data.list;
        }

        return chart;
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