import { Backpack } from "./backpack";
import { varsInfo, varsManager, varsMap } from "./vars";

export class Player {
    uid: string;
    GameKey: string;
    PlayerKey: string;
    backpack: Backpack;
    varsMap: varsMap;

    constructor(uid: string, gk: string, pk: string) {
        this.uid = uid;
        this.backpack = new Backpack(gk, pk, {});
        this.varsMap = {};
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

    constructor(ext: seal.ExtInfo, k: string) {
        this.ext = ext;
        this.gameKey = k;
        this.map = {};
    }

    /**
     * 
     * @param k 键
     * @param v 类型和默认值，例如
     * ```
     * {
     *              "good":['boolean',false],
     *              "nickname":['string','错误'],
     *              "coin":['number',114514],
     *              "bag":['backpack',{
     *                  "炸弹":999,
     *                  "钻石":666
     *              }]
     * }
     * ```
     * @returns 
     */
    register(k: string, v: any) {
        if (this.map.hasOwnProperty(k)) {
            console.error(`注册玩家信息${k}时出现错误:该名字已被占用`);
            return;
        }

        if (!varsManager.checkType(v)) {
            console.error(`注册玩家信息${k}时出现错误:${v}不是合法的类型，或含有不合法类型`);
            return;
        }

        this.map[k] = {
            varsInfo: v,
            cache: {}
        }
    }

    parse(uid: string, data: any, k: string, v: varsInfo): Player {
        if (!data.hasOwnProperty(uid)) {
            console.log(`创建新玩家:${uid}`);
        }

        const player = new Player(uid, this.gameKey, k);

        if (data.hasOwnProperty('backpack')) {
            player.backpack = new Backpack(this.gameKey, k, data.backpack);
        }

        if (data.hasOwnProperty('varsMap')) {
            player.varsMap = varsManager.parse(data.varsMap, this.gameKey, k, v);
        } else {
            player.varsMap = varsManager.parse(null, this.gameKey, k, v);
        }

        return player;
    }

    getPlayer(k: string, uid: string): Player | undefined {
        if (!this.map.hasOwnProperty(k)) {
            console.error(`获取玩家信息${k}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.map[k].cache.hasOwnProperty(uid)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`player_${k}_${uid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`player_${k}_${uid}`}失败:`, error);
            }
    
            const v = this.map[k].varsInfo;
            this.map[k].cache[uid] = this.parse(uid, data, k, v);
        }

        return this.map[k].cache[uid];
    }

    save(k: string, uid: string) {
        if (!this.map.hasOwnProperty(k)) {
            console.error(`保存玩家信息${k}时出现错误:该名字未注册`);
            return;
        }

        if (!this.map[k].cache.hasOwnProperty(uid)) {
            this.getPlayer(k, uid);
        }

        this.ext.storageSet(`player_${k}_${uid}`, JSON.stringify(this.map[k].cache[uid]));
    }
}