import { VarsInfo } from "../vars/varsManager";
import { Player } from "./player";

export class PlayerManager {
    private ext: seal.ExtInfo;
    private varsInfo: VarsInfo;
    private cache: { [key: string]: Player };

    constructor(ext: seal.ExtInfo, vi: VarsInfo) {
        this.ext = ext;
        this.varsInfo = vi;
        this.cache = {};
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

            const defaultData = {
                uid: uid,
                name: name,
                varsInfo: this.varsInfo
            }

            this.cache[uid] = Player.parse(data, defaultData);
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