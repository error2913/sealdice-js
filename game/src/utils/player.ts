import { Backpack } from "./backpack";
import { varsInfo, varsManager } from "./vars";

export class Player {
    id: string;
    backpack: Backpack;
    varsMap: {
        [key: string]: boolean | string | number | Backpack
    }

    constructor(id: string) {
        this.id = id;
        this.backpack = new Backpack({});
        this.varsMap = {};
    }
}

export class PlayerManager {
    ext: seal.ExtInfo;
    map: {
        [key: string]: varsInfo
    }

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
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
     *                  "炸弹":['道具',999],
     *                  "钻石":['宝石',666]
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

    parse(k: string, id: string, data: any): Player {
        if (!data.hasOwnProperty(id)) {
            console.log(`创建新玩家:${k}_${id}`);
        }

        const player = new Player(id);

        if (data.hasOwnProperty('backpack')) {
            player.backpack = new Backpack(data.backpack);
        }

        const v = this.map[k];
        if (data.hasOwnProperty('varsMap')) {
            player.varsMap = varsManager.parse(data.varsMap, v);
        } else {
            player.varsMap = varsManager.parse(null, v);
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
            data = JSON.parse(this.ext.storageGet(`${k}_${id}`) || '{}');
        } catch (error) {
            console.error(`从数据库中获取${`${k}_${id}`}失败:`, error);
        }

        const player = this.parse(k, id, data);

        return player;
    }

    save(k: string, id: string, player: Player) {
        this.ext.storageSet(`${k}_${id}`, JSON.stringify(player));
    }
}