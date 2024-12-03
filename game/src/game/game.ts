import { VarsMap, VarsInfo } from "../vars/varsManager";

export class Game {
    gid: string;
    varsMap: VarsMap;

    constructor(gid: string, vi: VarsInfo) {
        this.gid = gid;
        this.varsMap = globalThis.varsManager.parse(null, vi);
    }

    static parse(data: any, gid: string, vi: VarsInfo): Game {
        if (data === null || typeof data!== 'object' || Array.isArray(data)) {
            data = {};
        }

        const game = new Game(gid, vi);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
        }

        return game;
    }
}