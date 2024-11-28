import { Backpack } from "./backpack";
import { PropInfo } from "./prop";

export class Player {
    id: string;
    backpack: Backpack;
    attr: {
        [key: string]: boolean | string | number | Backpack
    }

    constructor(id: string) {
        this.id = id;
        this.backpack = new Backpack({});
        this.attr = {};
    }
}

export class PlayerManager {
    ext: seal.ExtInfo;
    map: {
        [key: string]: {
            [key: string]: ['boolean', boolean] | ['string', string] | ['number', number] | ['backpack', {
                [key: string]: PropInfo
            }]
        }
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

        if (v === null || typeof v !== 'object' || Array.isArray(v)) {
            console.error(`注册玩家信息${k}时出现错误:${v}不是合法的类型`);
            return;
        }

        for (let key of Object.keys(v)) {
            if (
                (v[key][0] == 'boolean' && typeof v[key][1] == 'boolean') ||
                (v[key][0] == 'string' && typeof v[key][1] == 'string') ||
                (v[key][0] == 'number' && typeof v[key][1] == 'number') ||
                v[key][0] == 'backpack' && Backpack.checkType(v[key][1])
            ) {
                continue;
            }

            console.error(`注册玩家信息${k}时出现错误:${v[key]}不是合法的类型，或者值的类型出错`);
            return;
        }

        this.map[k] = v;
    }

    parse(k: string, id: string, data: any): Player {
        if (!data.hasOwnProperty(id)) {
            console.log(`创建新玩家:${k}_${id}`);
        }

        const v = this.map[k];
        const player = new Player(id);

        if (data.hasOwnProperty('backpack')) {
            player.backpack = new Backpack(data.backpack);
        }

        for (let key of Object.keys(v)) {
            if (
                v[key][0] == 'boolean' ||
                v[key][0] == 'string' ||
                v[key][0] == 'number'
            ) {
                if (data.hasOwnProperty(key) && typeof data[key] == v[key][0]) {
                    player.attr[key] = data[key];
                } else {
                    player.attr[key] = v[key][1];
                }
            }

            if (v[key][0] == 'backpack') {
                if (data.hasOwnProperty(key)) {
                    player.attr[key] = new Backpack(data[key], v[key][1]);
                } else {
                    player.attr[key] = new Backpack(null, v[key][1]);
                }
            }
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