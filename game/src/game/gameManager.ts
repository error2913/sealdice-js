import { ChartManager } from "../chart/chartManager";
import { MarketManager } from "../market/marketManager";
import { PlayerManager } from "../player/playerManager";
import { PropManager } from "../prop/propManager";
import { ShopManager } from "../shop/shopManager";
import { VarsInfo } from "../vars/varsManager";
import { Game } from "./game";

export class GameManager {
    private ext: seal.ExtInfo;
    private varsInfo: VarsInfo;
    prop: PropManager;
    player: PlayerManager;
    chart: ChartManager;
    shop: ShopManager;
    market: MarketManager;
    private cache: { [key: string]: Game };

    constructor(ext: seal.ExtInfo, gvi: VarsInfo, pvi: VarsInfo) {
        this.ext = ext;
        this.varsInfo = gvi;
        this.prop = new PropManager();
        this.player = new PlayerManager(ext, pvi);
        this.chart = new ChartManager(ext);
        this.shop = new ShopManager(ext);
        this.market = new MarketManager(ext);
        this.cache = {};
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

            const defaultData = {
                gid: gid,
                varsInfo: this.varsInfo
            }

            this.cache[gid] = Game.parse(data, defaultData);
        }

        return this.cache[gid];
    }

    saveGame(gid: string) {
        if (this.cache.hasOwnProperty(gid)) {
            const game = this.cache[gid];
            this.ext.storageSet(`game_${gid}`, JSON.stringify(game));
        }
    }
}