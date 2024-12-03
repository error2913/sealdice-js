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

    useProp(prop: Prop, count: number, ...args: any[]) {
        try {
            prop.solve(count, ...args);
        } catch (error) {
            console.error(`使用道具${prop.name}时出现错误:`, error);
        }
    }
}