import { Backpack } from "./backpack";
import { varsInfo, varsMap } from "./vars";

export class Player {
    uid: string;
    name: string;
    backpack: Backpack;
    varsMap: varsMap;
    gameKey: string;
    playerKey: string;

    constructor(uid: string, name: string, v: varsInfo, gk: string, pk: string) {
        this.uid = uid;
        this.name = name;
        this.backpack = new Backpack(gk);
        this.varsMap = globalThis.game.vars.parse(null, gk, v);
        this.gameKey = gk;
        this.playerKey = pk;
    }
}

export class PlayerManager {
    ext: seal.ExtInfo;
    gameKey: string;
    map: {
        [key: string]: {
            varsInfo:varsInfo,
            cache: {
                [key: string]: Player
            }
        }
    }

    constructor(ext: seal.ExtInfo, gk: string) {
        this.ext = ext;
        this.gameKey = gk;
        this.map = {};
    }

    private parse(data: any, uid: string, name: string, pk: string, v: varsInfo): Player {
        if (!data.hasOwnProperty(uid)) {
            console.log(`创建新玩家:${uid}`);
        }

        if (data.hasOwnProperty('name')) {
            name = data.name;
        }

        const gk = this.gameKey;
        const player = new Player(uid, name, v, gk, pk);

        if (data.hasOwnProperty('backpack')) {
            player.backpack = Backpack.parse(data.backpack, null, gk);
        }

        if (data.hasOwnProperty('varsMap')) {
            player.varsMap = globalThis.game.vars.parse(data.varsMap, gk, v);
        }

        return player;
    }

    clearCache(pk: string) {
        if (!this.map.hasOwnProperty(pk)) {
            console.error(`清除玩家缓存时出现错误:${pk}未注册`);
            return;
        }

        this.map[pk].cache = {};
    }

    clearAllCache() {
        for (const pk in this.map) {
            this.map[pk].cache = {};
        }
    }

    /**
     * 
     * @param pk 键
     * @param v 类型和默认值的varsInfo
     * @returns 
     */
    registerPlayer(pk: string, v: any) {
        if (this.map.hasOwnProperty(pk)) {
            console.error(`注册玩家信息${pk}时出现错误:该名字已被占用`);
            return;
        }

        if (!globalThis.game.vars.checkTypeVarsInfo(v)) {
            console.error(`注册玩家信息${pk}时出现错误:${v}不是合法的类型，或含有不合法类型`);
            return;
        }

        this.map[pk] = {
            varsInfo: v,
            cache: {}
        }
    }

    getPlayer(pk: string, uid: string, name: string): Player | undefined {
        if (!this.map.hasOwnProperty(pk)) {
            console.error(`获取玩家信息${pk}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.map[pk].cache.hasOwnProperty(uid)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`player_${pk}_${uid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`player_${pk}_${uid}`}失败:`, error);
            }
    
            const v = this.map[pk].varsInfo;
            this.map[pk].cache[uid] = this.parse(data, uid, name, pk, v);
        }

        return this.map[pk].cache[uid];
    }

    savePlayer(pk: string, uid: string, name: string) {
        if (!this.map.hasOwnProperty(pk)) {
            console.error(`保存玩家信息${pk}时出现错误:该名字未注册`);
            return;
        }

        if (!this.map[pk].cache.hasOwnProperty(uid)) {
            this.getPlayer(pk, uid, name);
        }

        this.ext.storageSet(`player_${pk}_${uid}`, JSON.stringify(this.map[pk].cache[uid]));
    }
}