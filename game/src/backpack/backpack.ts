import { GameManager } from "../game/gameManager";

export class Backpack {
    items: { [key: string]: number };

    constructor() {
        this.items = {};
    }

    static parse(data: any, items: { [key: string]: number }): Backpack {
        const backpack = new Backpack();

        if (
            data === null || typeof data !== 'object' || Array.isArray(data) ||
            data.items === null || typeof data.items !== 'object' || Array.isArray(data.items)
        ) {
            backpack.items = items || {};
            return backpack;
        }

        for (let name of Object.keys(data.items)) {
            const count = data.items[name];
            if (typeof count == 'number') {
                backpack.items[name] = count;
            }
        }

        return backpack;
    }

    addItem(name: string, count: number) {
        if (!this.items.hasOwnProperty(name)) {
            this.items[name] = count;
        } else {
            this.items[name] += count;
        }
    }

    removeItem(name: string, count: number) {
        if (!this.items.hasOwnProperty(name)) {
            return;
        }

        this.items[name] -= count;

        if (this.items[name] <= 0) {
            delete this.items[name];
        }
    }

    removeItemsByTypes(gm: GameManager, ...types: string[]) {
        const propMap = gm.prop.propMap;

        for (let name of Object.keys(this.items)) {
            if (!propMap.hasOwnProperty(name)) {
                continue;
            }

            const type = propMap[name].type;

            if (types.includes(type)) {
                delete this.items[name];
            }
        }
    }

    clear() {
        this.items = {};
    }

    len(): number {
        return Object.keys(this.items).length;
    }

    draw(n: number): Backpack {
        const result = new Backpack();
        let totalCount = this.sum();

        if (totalCount < n) {
            n = totalCount;
        }

        for (let i = 0; i < n; i++) {
            const index = Math.ceil(Math.random() * totalCount);
            const names = Object.keys(this.items);

            let tempCount = 0;
            for (let name of names) {
                tempCount += this.items[name];

                if (tempCount >= index) {
                    result.addItem(name, 1);
                    this.removeItem(name, 1);
                    break;
                }
            }

            totalCount--;

            if (totalCount <= 0) {
                break;
            }
        }

        return result;
    }

    checkExists(name: string, count: number): boolean {
        if (!this.items.hasOwnProperty(name) || this.items[name] < count) {
            return false;
        }

        return true;
    }

    checkTypesExists(gm: GameManager, ...types: string[]): boolean {
        const propMap = gm.prop.propMap;

        for (let name of Object.keys(this.items)) {
            if (!propMap.hasOwnProperty(name)) {
                continue;
            }

            const type = propMap[name].type;

            if (types.includes(type)) {
                return true;
            }
        }

        return false;
    }

    sum(): number {
        let count = 0;

        for (let name of Object.keys(this.items)) {
            count += this.items[name];
        }

        return count;
    }

    sumByTypes(gm: GameManager, ...types: string[]): number {
        const propMap = gm.prop.propMap;
        let count = 0;

        for (let name of Object.keys(this.items)) {
            if (!propMap.hasOwnProperty(name)) {
                continue;
            }

            const type = propMap[name].type;

            if (types.includes(type)) {
                count += this.items[name];
            }
        }

        return count;
    }

    getTypes(gm: GameManager): string[] {
        const propMap = gm.prop.propMap;
        const result = [];

        for (let name of Object.keys(this.items)) {
            if (!propMap.hasOwnProperty(name)) {
                continue;
            }

            const type = propMap[name].type;

            if (!result.includes(type)) {
                result.push(type);
            }
        }

        return result;
    }

    getNames(): string[] {
        return Object.keys(this.items);
    }

    getCount(name: string): number {
        if (!this.items.hasOwnProperty(name)) {
            return 0;
        }

        return this.items[name];
    }

    showBackpack(): string {
        if (this.len() === 0) {
            return '背包为空';
        }

        let s = '';
        
        for (let name of Object.keys(this.items)) {
            s += `【${name}】 x ${this.items[name]}\n`;
        }
        
        s = s.trim();

        return s;
    }

    mergeBackpack(backpack: Backpack) {
        for (let name of Object.keys(backpack.items)) {
            this.addItem(name, backpack.items[name]);
        }
    }

    removeBackpack(backpack: Backpack) {
        for (let name of Object.keys(backpack.items)) {
            this.removeItem(name, backpack.items[name]);
        }
    }

    findByTypes(gm: GameManager, ...types: string[]): string[] {
        const propMap = gm.prop.propMap;
        const result = [];

        for (let name of Object.keys(this.items)) {
            if (!propMap.hasOwnProperty(name)) {
                continue;
            }

            const type = propMap[name].type;

            if (types.includes(type)) {
                result.push(name);
            }
        }

        return result;
    }

    findByCountRange(min: number, max: number): string[] {
        const result = [];

        for (let name of Object.keys(this.items)) {
            if (this.items[name] >= min && this.items[name] <= max) {
                result.push(name);
            }
        }

        return result;
    }
}