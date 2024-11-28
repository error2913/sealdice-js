
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
    register(k: string, ext: seal.ExtInfo, v: any) {
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
            player: new PlayerManager(ext),
            propMap: {}
        }
    }

    parse(id: string, data: any, v: varsInfo): Game {
        if (!data.hasOwnProperty(id)) {
            console.log(`创建新游戏:${id}`);
        }

        const game = new Game(id);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = varsManager.parse(data.varsMap, v);
        } else {
            game.varsMap = varsManager.parse(null, v);
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
        const game = this.parse(id, data, v);

        return game;
    }

    save(k: string, id: string, game: Game) {
        const ext = this.map[k].ext;
        ext.storageSet(`game_${k}_${id}`, JSON.stringify(game));
    }
}