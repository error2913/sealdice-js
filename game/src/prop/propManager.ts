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

    useProp(name: string, player: Player, count: number, ...args: any[]): { result: any, err: string } {
        if (!player.backpack.checkExists(name, count)) {
            return { result: null, err: `背包内【${name}】数量不足` };
        }

        const prop = this.getProp(name);
        if (prop.name === '') {
            return { result: null, err: `【${name}】不知道有什么用` };
        }

        try {
            const { result, err } = prop.solve(player, count, ...args);
            if (err !== '') {
                return { result: null, err: err };
            }

            player.backpack.removeItem(name, count);

            return { result: result, err: '' };
        } catch (err) {
            return { result: null, err: `【${prop.name}】出现错误:${err}` };
        }
    }

    showPropList(): string {
        return Object.keys(this.propMap).join('\n');
    }
}