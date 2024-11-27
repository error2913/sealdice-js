import { Backpack } from "./backpack";

export interface Player {
    id: string,
    [key: string]: boolean | string | number | Backpack
}

export class PlayerManager {
    ext: seal.ExtInfo;
    map: {
        [key: string]: {
            [key: string]: ['boolean', boolean] | ['string', string] | ['number', number] | ['backpack', Backpack]
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
    register(k: string, v: {
        [key: string]: ['boolean', boolean] | ['string', string] | ['number', number] | ['backpack', Backpack]
    }) {
        if (this.map.hasOwnProperty(k)) {
            console.error(`注册玩家信息${k}时出现错误:该名字已被占用`);
            return;
        }

        for (let key in v) {
            if (
                (v[key][0] == 'boolean' && typeof v[key][1] == 'boolean') ||
                (v[key][0] =='string' && typeof v[key][1] =='string') ||
                (v[key][0] =='number' && typeof v[key][1] =='number')
            ) {
                continue;
            }

            if (v[key][0] == 'backpack' || typeof v[key][1] == 'object') {
                let flag = true;

                for (let i in v[key][1]) {
                    const prop = v[key][1][i];

                    if (typeof prop[0] =='string' && typeof prop[1] == 'number') {
                        continue;
                    }
                    
                    flag = false;
                    break;
                }

                if (flag) {
                    continue;
                }
            }

            console.error(`注册玩家信息${k}时出现错误:${v[key]}不是合法的类型，或者值的类型出错`);
            return;
        }

        this.map[k] = v;
    }

    parse(k: string, id: string, data: any): Player {
        if (!data.hasOwnProperty(id)) {
            console.log(`创建新玩家:${k}`);
        }

        const v = this.map[k];
        const player = {
            id: id
        }

        for (let key in v) {
            if (
                v[key][0] == 'boolean' ||
                v[key][0] =='string' ||
                v[key][0] =='number'
            ) {
                if (data.hasOwnProperty(key) && typeof data[key] == v[key][0]) {
                    player[key] = data[key];
                } else {
                    player[key] = v[key][1];
                }
            }

            if (v[key][0] == 'backpack') {
                if (data.hasOwnProperty(key) && typeof data[key] == 'object') {
                    player[key] = {};

                    for (let i in data[key]) {
                        const prop = data[key][i];
    
                        if (typeof prop[0] =='string' && typeof prop[1] == 'number') {
                            player[key][i] = prop;
                        }
                    }
                } else {
                    player[key] = v[key][1];
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

        const s = `${k}_${id}`;

        let data = {};

        try {
            data = JSON.parse(this.ext.storageGet(s) || '{}');
        } catch (error) {
            console.error(`从数据库中获取${s}失败:`, error);
        }

        const player = this.parse(k, id, data);

        return player;
    }

    save(k: string, id: string, player: Player) {
        const s = `${k}_${id}`;
        this.ext.storageSet(s, JSON.stringify(player));
    }
}