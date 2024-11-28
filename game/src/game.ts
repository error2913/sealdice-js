
import { PlayerManager } from "./utils/player";
import { Prop } from "./utils/prop";
import { varsInfo, varsManager, varsMap } from "./utils/vars";

export class Game {
    gid: string;
    GameKey: string;
    varsMap: varsMap;

    constructor(gid: string, gk: string) {
        this.gid = gid;
        this.GameKey = gk;
        this.varsMap = {};
    }
}

export class GameManager {
    vars: varsManager;
    map: {
        [key: string]: {
            ext: seal.ExtInfo,
            varsInfo: varsInfo,
            player: PlayerManager,
            propMap: {
                [key: string]: Prop
            }
            cache: {
                [key: string]: Game
            }
        }
    }

    constructor() {
        this.vars = varsManager;
        this.map = {};
    }

    /**
     * 
     * @param k 键
     * @param v 类型和默认值
     * @returns 
     */
    register(ext: seal.ExtInfo, k: string, v: any) {
        if (this.map.hasOwnProperty(k)) {
            console.error(`注册游戏信息${k}时出现错误:该名字已被占用`);
            return;
        }

        if (!varsManager.checkType(v)) {
            console.error(`注册游戏信息${k}时出现错误:${v}不是合法的类型，或含有不合法类型`);
            return;
        }

        this.map[k] = {
            ext: ext,
            varsInfo: v,
            player: new PlayerManager(ext, k),
            propMap: {},
            cache: {}
        }
    }

    registerPlayer(gk: string, pk: string, v: varsInfo) {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`注册玩家信息${pk}时出现错误:${gk}未注册`);
            return;
        }

        this.map[gk].player.register(pk, v);
    }

    newPropItem() {
        return new Prop();
    }

    registerProp(k: string, prop: Prop) {
        if (this.map.hasOwnProperty(k)) {
            console.error(`注册道具${prop.name}时出现错误:${k}未注册`);
            return;
        }

        this.map[k].propMap[prop.name] = prop;
    }

    parse(gid: string, data: any, k: string, v: varsInfo): Game {
        if (!data.hasOwnProperty(gid)) {
            console.log(`创建新游戏:${gid}`);
        }

        const game = new Game(gid, k);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = varsManager.parse(k, '', data.varsMap, v);
        } else {
            game.varsMap = varsManager.parse(k, '', null, v);
        }

        return game;
    }

    getGame(k: string, gid: string): Game | undefined {
        if (!this.map.hasOwnProperty(k)) {
            console.error(`获取游戏信息${k}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.map.cache.hasOwnProperty(gid)) {
            let data = {};

            try {
                const ext = this.map[k].ext;
                data = JSON.parse(ext.storageGet(`game_${k}_${gid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`game_${k}_${gid}`}失败:`, error);
            }
    
            const v = this.map[k].varsInfo;
            this.map[k].cache[gid] = this.parse(gid, data, k, v);
        }

        return this.map[k].cache[gid];
    }

    save(k: string, gid: string) {
        if (!this.map.hasOwnProperty(k)) {
            console.error(`保存游戏信息${k}时出现错误:该名字未注册`);
            return;
        }

        if (!this.map.cache.hasOwnProperty(gid)) {
            this.getGame(k, gid);
        }

        const ext = this.map[k].ext;
        ext.storageSet(`game_${k}_${gid}`, JSON.stringify(this.map[k].cache[gid]));
    }
}