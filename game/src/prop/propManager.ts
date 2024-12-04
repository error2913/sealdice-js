import { Player } from "../player/player";
import { Prop } from "./prop";

export class PropManager {
    propMap: { [key: string]: Prop };

    constructor() {
        this.propMap = {};
    }

    clear() {
        this.propMap = {};
    }

    registerProp(prop: Prop) {
        const name = prop.name;
        this.propMap[name] = prop;
    }

    removeProp(name: string) {
        if (this.propMap.hasOwnProperty(name)) {
            delete this.propMap[name];
        }
    }

    getProp(name: string = ''): Prop {
        if (!name || !this.propMap.hasOwnProperty(name)) {
            return new Prop();
        }

        return this.propMap[name];
    }

    useProp(name: string, player: Player, count: number, ...args: any[]): { result: any, err: Error } {
        if (!player.backpack.checkExists(name, count)) {
            const err = new Error(`背包内【${name}】数量不足`);
            return { result: null, err: err };
        }

        const prop = this.getProp(name);
        if (prop.name === '') {
            const err = new Error(`【${name}】不知道有什么用`);
            return { result: null, err: err };
        }

        try {
            const { result, err } = prop.solve(player, count, ...args);
            if (err !== null) {
                return { result: null, err: err };
            }

            player.backpack.removeItem(name, count);

            return { result: result, err: null };
        } catch (err) {
            err.message = `【${prop.name}】出现错误:${err.message}`;
            return { result: null, err: err };
        }
    }

    showPropList(): string {
        return Object.keys(this.propMap).join('\n');
    }
}