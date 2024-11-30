import { ChartManager } from "./utils/chart";
import { MarketManager } from "./utils/market";
import { Player, PlayerManager } from "./utils/player";
import { Prop } from "./utils/prop";
import { ShopManager } from "./utils/shop";
import { VarsInfo, VarsMap } from "./utils/vars";

export class Game {
    gid: string;
    varsMap: VarsMap;

    constructor(gid: string, vi: VarsInfo) {
        this.gid = gid;
        this.varsMap = globalThis.varsManager.parse(null, vi);
    }
}

export class GameManager {
    private ext: seal.ExtInfo;
    private varsInfo: VarsInfo;
    player: PlayerManager;
    chart: ChartManager;
    shop: ShopManager;
    market: MarketManager;
    propMap: { [key: string]: Prop };
    private cache: { [key: string]: Game };

    constructor(ext: seal.ExtInfo, gvi: VarsInfo, pvi: VarsInfo) {
        this.ext = ext;
        this.varsInfo = gvi;
        this.player = new PlayerManager(ext, pvi);
        this.chart = new ChartManager(ext);
        this.shop = new ShopManager(ext);
        this.market = new MarketManager(ext);
        this.propMap = {};
        this.cache = {};
    }

    private parse(data: any, gid: string, vi: VarsInfo): Game {
        if (!data.hasOwnProperty(gid)) {
            console.log(`创建新游戏:${gid}`);
        }

        const game = new Game(gid, vi);

        if (data.hasOwnProperty('varsMap')) {
            game.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
        }

        return game;
    }

    clearCache() {
        this.cache = {};
    }

    getGame(gid: string): Game {
        if (!this.cache.hasOwnProperty(gid)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`game_${gid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`game_${gid}`}失败:`, error);
            }
    
            const vi = this.varsInfo;
            this.cache[gid] = this.parse(data, gid, vi);
        }

        return this.cache[gid];
    }

    saveGame(gid: string) {
        if (this.cache.hasOwnProperty(gid)) {
            const game = this.cache[gid];
            this.ext.storageSet(`game_${gid}`, JSON.stringify(game));
        }
    }

    newPropItem(): Prop {
        return new Prop();
    }

    registerProp(prop: Prop) {
        const name = prop.name;

        if (this.propMap.hasOwnProperty(name)) {
            console.error(`注册道具${name}时出现错误:该道具已注册`);
            return;
        }

        this.propMap[name] = prop;
    }

    getProp(name: string): Prop | undefined {
        if (!this.propMap.hasOwnProperty(name)) {
            console.error(`获取道具${name}时出现错误:${name}未注册`);
            return undefined;
        }

        return this.propMap[name];
    }

    useProp(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, player: Player, name: string, count: number = 1, game?: Game): boolean {
        if (!player.backpack.checkExist(name, count)) {
            seal.replyToSender(ctx, msg, `你的背包里【${name}】不足`);
            return false;
        }

        const prop = this.getProp(name);

        if (!prop) {
            seal.replyToSender(ctx, msg, `【${name}】不知道有什么用`);
            return false;
        }

        try {
            prop.solve(ctx, msg, cmdArgs, player, count, game);
        } catch (error) {
            console.error(`使用道具${name}时出现错误:`, error);
            return false;
        }

        if (count === 1) {
            seal.replyToSender(ctx, msg, seal.format(ctx, prop.reply));
        }
        
        player.backpack.remove(name, count);

        return true;
    }
}