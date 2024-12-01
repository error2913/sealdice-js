import { GameManager } from "../game";

export class Backpack {
    items: { [key: string]: number };

    constructor() {
        this.items = {};
    }

    static parse(data: any, defaultData: { [key: string]: number }): Backpack | undefined {
        // 检查defaultData部分
        if (defaultData === null || typeof defaultData !== 'object' || Array.isArray(defaultData)) {
            return undefined;
        }

        for (let name of Object.keys(defaultData)) {
            const count = defaultData[name];
            if (typeof count !== 'number') {
                return undefined;
            }
        }

        // 解析data部分
        const backpack = new Backpack();

        if (
            data === null || typeof data !== 'object' || Array.isArray(data) ||
            data.items === null || typeof data.items !== 'object' || Array.isArray(data.items)
        ) {
            backpack.items = defaultData || {};
            return backpack;
        }

        const items = data.items;

        for (let name of Object.keys(items)) {
            const count = items[name];
            if (typeof count == 'number') {
                backpack.items[name] = count;
            }
        }

        return backpack;
    }

    checkExist(name: string, count: number): boolean {
        if (!this.items.hasOwnProperty(name) || this.items[name] < count) {
            return false;
        }

        return true;
    }

    checkTypesExist(gm: GameManager, types: string[]): boolean {
        const propMap = gm.propMap;

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

    getTotalCount(): number {
        let count = 0;

        for (let name of Object.keys(this.items)) {
            count += this.items[name];
        }

        return count;
    }

    getTotalCountByTypes(gm: GameManager, types: string[]): number {
        const propMap = gm.propMap;
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
        const propMap = gm.propMap;
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

    len(): number {
        return Object.keys(this.items).length;
    }

    add(name: string, count: number) {
        if (!this.items.hasOwnProperty(name)) {
            this.items[name] = count;
        } else {
            this.items[name] += count;
        }
    }

    remove(name: string, count: number) {
        if (!this.items.hasOwnProperty(name)) {
            return;
        }

        this.items[name] -= count;

        if (this.items[name] <= 0) {
            delete this.items[name];
        }
    }

    removeByTypes(gm: GameManager, types: string[]) {
        const propMap = gm.propMap;

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

    merge(backpack: Backpack) {
        for (let name of Object.keys(backpack.items)) {
            this.add(name, backpack.items[name]);
        }
    }

    removeBackpack(backpack: Backpack) {
        for (let name of Object.keys(backpack.items)) {
            this.remove(name, backpack.items[name]);
        }
    }

    draw(n: number): Backpack {
        const result = new Backpack();
        let totalCount = this.getTotalCount();

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
                    result.add(name, 1);
                    this.remove(name, 1);
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

    findByTypes(gm: GameManager, types: string[]): string[] {
        const propMap = gm.propMap;
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