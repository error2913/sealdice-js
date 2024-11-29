
import { Player, PlayerManager } from "./utils/player";
import { Prop } from "./utils/prop";
import { varsInfo, varsManager, varsMap } from "./utils/vars";

export class Game {
    gid: string;
    gameKey: string;
    varsMap: varsMap;

    constructor(gid: string, gk: string, v: varsInfo) {
        this.gid = gid;
        this.gameKey = gk;
        this.varsMap = varsManager.parse(null, gk, '', v);
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

    parse(gid: string, data: any, gk: string, v: varsInfo): Game {
        if (!data.hasOwnProperty(gid)) {
            console.log(`创建新游戏:${gid}`);
        }

        const game = new Game(gid, gk, v);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = varsManager.parse(data.varsMap, gk, '', v);
        }

        return game;
    }

    /**
     * 
     * @param gk 键
     * @param v 类型和默认值的varsInfo
     * @returns 
     */
    registerGame(ext: seal.ExtInfo, gk: string, v: any) {
        if (this.map.hasOwnProperty(gk)) {
            console.error(`注册游戏信息${gk}时出现错误:该名字已被占用`);
            return;
        }

        if (!varsManager.checkTypeVarsInfo(v)) {
            console.error(`注册游戏信息${gk}时出现错误:${v}不是合法的类型，或含有不合法类型`);
            return;
        }

        this.map[gk] = {
            ext: ext,
            varsInfo: v,
            player: new PlayerManager(ext, gk),
            propMap: {},
            cache: {}
        }
    }

    getGame(gk: string, gid: string): Game | undefined {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`获取游戏信息${gk}时出现错误:该名字未注册`);
            return undefined;
        }

        if (gid === '') {
            const v = this.map[gk].varsInfo;
            const game = new Game(gid, gk, v);
            return game;
        }

        if (!this.map.cache.hasOwnProperty(gid)) {
            let data = {};

            try {
                const ext = this.map[gk].ext;
                data = JSON.parse(ext.storageGet(`game_${gk}_${gid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`game_${gk}_${gid}`}失败:`, error);
            }
    
            const v = this.map[gk].varsInfo;
            this.map[gk].cache[gid] = this.parse(gid, data, gk, v);
        }

        return this.map[gk].cache[gid];
    }

    saveGame(k: string, gid: string) {
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

    registerPlayer(gk: string, pk: string, v: varsInfo) {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`注册玩家信息${pk}时出现错误:${gk}未注册`);
            return;
        }

        this.map[gk].player.registerPlayer(pk, v);
    }

    getPlayer(gk: string, pk: string, uid: string): Player | undefined {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`获取玩家信息${pk}时出现错误:${gk}未注册`);
            return undefined;
        }

        return this.map[gk].player.getPlayer(pk, uid);
    }

    savePlayer(gk: string, pk: string, uid: string) {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`保存玩家信息${pk}时出现错误:${gk}未注册`);
            return;
        }

        this.map[gk].player.savePlayer(pk, uid);
    }

    newPropItem(gk: string) {
        return new Prop(gk);
    }

    registerProp(gk: string, prop: Prop) {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`注册道具${prop.name}时出现错误:${gk}未注册`);
            return;
        }

        this.map[gk].propMap[prop.name] = prop;
    }

    getProp(gk: string, name: string): Prop | undefined {
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`获取道具${name}时出现错误:${gk}未注册`);
            return undefined;
        }

        if (!this.map[gk].propMap.hasOwnProperty(name)) {
            console.error(`获取道具${name}时出现错误:${name}未注册`);
            return undefined;
        }

        return this.map[gk].propMap[name];
    }

    useProp(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, player: Player, game: Game, name: string): boolean {
        const gk = game.gameKey;
        if (!this.map.hasOwnProperty(gk)) {
            console.error(`使用道具${name}时出现错误:${gk}未注册`);
            return false;
        }

        if (!player.backpack.checkExist(name)) {
            seal.replyToSender(ctx, msg, `你的背包里没有【${name}】`);
            return false;
        }

        const prop = this.getProp(gk, name);

        if (!prop) {
            seal.replyToSender(ctx, msg, `【${name}】不知道有什么用`);
            return false;
        }

        try {
            prop.solve(ctx, msg, cmdArgs, player, game);
        } catch (error) {
            console.error(`使用道具${name}时出现错误:`, error);
            return false;
        }

        seal.replyToSender(ctx, msg, seal.format(ctx, prop.reply));
        player.backpack.remove(name, 1);

        return true;
    }
}