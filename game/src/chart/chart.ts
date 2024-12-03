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

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        if (data.hasOwnProperty('list') && Array.isArray(data.list)) {
            for (let pi of data.list) {
                if (pi === null || typeof pi !== 'object' || Array.isArray(pi)) {
                    continue;
                }

                if (
                    pi.hasOwnProperty('uid') && typeof pi.uid === 'string' &&
                    pi.hasOwnProperty('name') && typeof pi.name === 'string' &&
                    pi.hasOwnProperty('value') && typeof pi.value === 'number'
                ) {
                    chart.list.push(pi);
                }
            }
        }

        return chart;
    }

    updateChart(player: Player) {
        const value = this.func(player);

        if (typeof value !== 'number') {
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

    showChart(): string {
        if (this.list.length === 0) {
            return '排行榜为空';
        }

        let s = ''
        
        for (let i = 0; i < this.list.length; i++) {
            const pi = this.list[i];

            s += `第${i + 1}名： <${pi.name}>(${pi.value})\n`;
        }

        s = s.trim();

        return s;
    }
}