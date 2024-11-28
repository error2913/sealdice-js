
import { PlayerManager } from "./utils/player";
import { Prop } from "./utils/prop";
import { varsInfo, varsManager, varsMap } from "./utils/vars";

export class Game {
    id: string;
    varsMap: varsMap;

    constructor(id: string) {
        this.id = id;
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
            propMap: {}
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

    parse(id: string, data: any, k: string, v: varsInfo): Game {
        if (!data.hasOwnProperty(id)) {
            console.log(`创建新游戏:${id}`);
        }

        const game = new Game(id);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = varsManager.parse(k, '', data.varsMap, v);
        } else {
            game.varsMap = varsManager.parse(k, '', null, v);
        }

        return game;
    }

    getGame(k: string, id: string): Game | undefined {
        if (!this.map.hasOwnProperty(k)) {
            console.error(`获取游戏信息${k}时出现错误:该名字未注册`);
            return undefined;
        }

        let data = {};

        try {
            const ext = this.map[k].ext;
            data = JSON.parse(ext.storageGet(`game_${k}_${id}`) || '{}');
        } catch (error) {
            console.error(`从数据库中获取${`game_${k}_${id}`}失败:`, error);
        }

        const v = this.map[k].varsInfo;
        const game = this.parse(id, data, k, v);

        return game;
    }

    save(k: string, id: string, game: Game) {
        const ext = this.map[k].ext;
        ext.storageSet(`game_${k}_${id}`, JSON.stringify(game));
    }
}