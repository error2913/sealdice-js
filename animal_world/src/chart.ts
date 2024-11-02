//更新排行榜，积分变动的地方需要调用这个函数

import { Player } from "./player";

/** 排行榜元素为数组：[id, name, 积分数值] */
const scoreChart: [string, string, number][] = [];

export function getScoreChart(ext: seal.ExtInfo): [string, string, number][] {
    if (scoreChart.length == 0) {
        let data = [];

        try {
            data = JSON.parse(ext.storageGet(`scoreChart`) || '[]');
        } catch (error) {
            console.error(`从数据库中获取scoreChart失败:`, error);
        }
    
        if (data && Array.isArray(data) && data.length > 0) {
            scoreChart.push(...data);
        }
    }

    return scoreChart;
}

/** 如果有指令造成积分变动则使用这个 */
export function updateScoreChart(ext: seal.ExtInfo, player: Player): void {
    if (scoreChart.length == 0) {
        getScoreChart(ext);
    }

    const index = scoreChart.findIndex(item => item[0] === player.id);

    if (index === -1) {
        scoreChart.push([player.id, player.name, player.score]);
    } else {
        scoreChart[index] = [player.id, player.name, player.score];
    }

    scoreChart.sort((a, b) => b[2] - a[2]);

    ext.storageSet(`scoreChart`, JSON.stringify(scoreChart));
}