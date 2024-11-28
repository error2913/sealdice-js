import { Backpack } from "./utils/backpack";
import { PlayerManager } from "./utils/player";
import { varsManager } from "./utils/vars";

export class Game {
    id: string;
    varsMap: {
        [key: string]: boolean | string | number | Backpack
    }
}

export class GameManager {
    ext: seal.ExtInfo;
    player: PlayerManager;
    vars: varsManager;

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.player = new PlayerManager(ext);
        this.vars = varsManager;
    }
}