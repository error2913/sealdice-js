

export class Backpack {
    items: {
        [key: string]: number
    }
    gameKey: string;

    constructor(gk: string) {
        this.items = {};
        this.gameKey = gk;
    }

    static checkTypeItems(data: any): boolean {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            return false;
        }

        for (let name of Object.keys(data)) {
            const count = data[name];
            if (typeof count == 'number') {
                continue;
            }
            return false;
        }

        return true;
    }

    static parse(
        data: any,
        defaultData: {
            [key: string]: number
        },
        gk: string
    ): Backpack {
        const backpack = new Backpack(gk);

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

    checkExist(name: string): boolean {
        return this.items.hasOwnProperty(name);
    }

    getTotalCount(): number {
        let count = 0;

        for (let name of Object.keys(this.items)) {
            count += this.items[name];
        }

        return count;
    }

    getTotalCountByTypes(types: string[]): number {
        const propMap = globalThis.game.map[this.gameKey].propMap;
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

    clear() {
        this.items = {};
    }

    merge(backpack: Backpack) {
        for (let name of Object.keys(backpack.items)) {
            this.add(name, backpack.items[name]);
        }
    }

    draw(n: number): Backpack {
        const result = new Backpack(this.gameKey);
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

    findByTypes(types: string[]): string[] {
        const propMap = globalThis.game.map[this.gameKey].propMap;
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

    getTypes(): string[] {
        const propMap = globalThis.game.map[this.gameKey].propMap;
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
}