//更新排行榜，积分变动的地方需要调用这个函数

import { Player } from "./player";

export function updateChart(player: Player): void {

    const index = scoreChart.findIndex(item => item[0] === player.id);

    if (index === -1) {
        scoreChart.push([player.id, player.name, player.score]);
    } else {
        scoreChart[index] = [player.id, player.name, player.score];
    }

    scoreChart
        .sort((a, b) => b[2] - a[2])
        .splice(10);
}

/** 排行榜元素为数组：[id, name, 积分数值] */
export const scoreChart: [string, string, number][] = [];