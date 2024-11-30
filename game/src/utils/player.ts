import { Backpack } from "./backpack";
import { VarsInfo, VarsMap } from "./vars";

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
}

export class PlayerManager {
    ext: seal.ExtInfo;
    varsInfo:VarsInfo;
    cache: { [key: string]: Player };

    constructor(ext: seal.ExtInfo, vi: VarsInfo) {
        this.ext = ext;
        this.varsInfo = vi;
        this.cache = {};
    }

    parse(data: any, uid: string, name: string, vi: VarsInfo): Player {
        if (!data.hasOwnProperty(uid)) {
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

    clearCache() {
        this.cache = {};
    }

    getPlayer(uid: string, name: string): Player {
        if (!this.cache.hasOwnProperty(uid)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`player_${uid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`player_${uid}`}失败:`, error);
            }
    
            const vi = this.varsInfo;
            this.cache[uid] = this.parse(data, uid, name, vi);
        }

        return this.cache[uid];
    }

    savePlayer(uid: string) {
        if (this.cache.hasOwnProperty(uid)) {
            const player = this.cache[uid];
            this.ext.storageSet(`player_${uid}`, JSON.stringify(player));
        }
    }
}