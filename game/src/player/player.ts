import { Backpack } from "../backpack/backpack";
import { VarsInfo, VarsMap } from "../vars/varsManager";

export class Player {
    uid: string;
    name: string;
    backpack: Backpack;
    varsMap: VarsMap;

    constructor(uid: string, name: string, vi: VarsInfo) {
        this.uid = uid;
        this.name = name;
        this.backpack = new Backpack();
        this.varsMap = globalThis.varsManager.parse(null, vi);
    }

    static parse(data: any, defaultData: { uid: string, name: string, varsInfo: VarsInfo }): Player {
        const uid = defaultData.uid;
        let name = defaultData.name;
        const vi = defaultData.varsInfo;

        if (!data.hasOwnProperty('uid')) {
            console.log(`创建新玩家:${uid}`);
        }

        if (data.hasOwnProperty('name')) {
            name = data.name;
        }

        const player = new Player(uid, name, vi);

        if (data.hasOwnProperty('backpack')) {
            player.backpack = Backpack.parse(data.backpack, null);
        }

        if (data.hasOwnProperty('varsMap')) {
            player.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
        }

        return player;
    }
}