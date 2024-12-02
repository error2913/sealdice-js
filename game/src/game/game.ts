import { VarsMap, VarsInfo } from "../vars/varsManager";

export class Game {
    gid: string;
    varsMap: VarsMap;

    constructor(gid: string, vi: VarsInfo) {
        this.gid = gid;
        this.varsMap = globalThis.varsManager.parse(null, vi);
    }

    static parse(data: any, defaultData: { gid: string, varsInfo: VarsInfo }): Game {
        const gid = defaultData.gid;
        const vi = defaultData.varsInfo;

        if (!data.hasOwnProperty('gid')) {
            console.log(`创建新游戏:${gid}`);
        }

        const game = new Game(gid, vi);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
        }

        return game;
    }
}