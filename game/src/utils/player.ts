import { Backpack } from "./backpack";
import { varsInfo, varsManager, varsMap } from "./vars";

export class Player {
    id: string;
    GameKey: string;
    PlayerKey: string;
    backpack: Backpack;
    varsMap: varsMap;

    constructor(id: string, gk: string, pk: string) {
        this.id = id;
        this.backpack = new Backpack(gk, pk, {});
        this.varsMap = {};
    }
}

export class PlayerManager {
    ext: seal.ExtInfo;
    gameKey: string;
    map: {
        [key: string]: varsInfo
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

        this.map[k] = v;
    }

    parse(id: string, data: any, k: string, v: varsInfo): Player {
        if (!data.hasOwnProperty(id)) {
            console.log(`创建新玩家:${id}`);
        }

        const player = new Player(id, this.gameKey, k);

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

    getPlayer(k: string, id: string): Player | undefined {
        if (!this.map.hasOwnProperty(k)) {
            console.error(`获取玩家信息${k}时出现错误:该名字未注册`);
            return undefined;
        }

        let data = {};

        try {
            data = JSON.parse(this.ext.storageGet(`player_${k}_${id}`) || '{}');
        } catch (error) {
            console.error(`从数据库中获取${`player_${k}_${id}`}失败:`, error);
        }

        const v = this.map[k];
        const player = this.parse(id, data, k, v);

        return player;
    }

    save(k: string, id: string, player: Player) {
        this.ext.storageSet(`player_${k}_${id}`, JSON.stringify(player));
    }
}