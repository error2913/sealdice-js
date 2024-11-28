import { Prop, PropInfo } from "./prop";

export class Backpack {
    backpack: {
        [key: string]: PropInfo
    }

    constructor(backpackData: any, defaultData: {
        [key: string]: PropInfo
    } = {}) {
        if (
            !backpackData.hasOwnProperty('backpack') ||
            backpackData.backpack === null ||
            typeof backpackData.backpack !== 'object' ||
            Array.isArray(backpackData.backpack)
        ) {
            this.backpack = defaultData;
            return;
        }

        const backpack = backpackData.backpack;
        this.backpack = {};

        for (let name of Object.keys(backpack)) {
            const propInfo = Prop.parseInfo(backpack[name]);

            if (!propInfo) {
                continue;
            }

            this.backpack[name] = propInfo;
        }
    }

    static checkType(data: any): boolean {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            return false;
        }

        for (let name of Object.keys(data)) {
            const propInfo = Prop.parseInfo(data[name]);

            if (!propInfo) {
                return false;
            }
        }

        return true;
    }

    findByTypes(types: string[]): string[] {
        const result = [];

        for (let name of Object.keys(this.backpack)) {
            const propInfo = this.backpack[name];

            if (types.includes(propInfo.type)) {
                result.push(name);
            }
        }

        return result;
    }

    findByCountRange(min: number, max: number): string[] {
        const result = [];

        for (let name of Object.keys(this.backpack)) {
            const propInfo = this.backpack[name];

            if (propInfo.count >= min && propInfo.count <= max) {
                result.push(name);
            }
        }

        return result;
    }

    getTotalCount(): number {
        let count = 0;

        for (let name of Object.keys(this.backpack)) {
            count += this.backpack[name].count;
        }

        return count;
    }

    getTotalCountByTypes(types: string[]): number {
        let count = 0;

        for (let name of Object.keys(this.backpack)) {
            const propInfo = this.backpack[name];

            if (types.includes(propInfo.type)) {
                count += propInfo.count;
            }
        }

        return count;
    }

    getTypes(): string[] {
        const result = [];

        for (let name of Object.keys(this.backpack)) {
            const propInfo = this.backpack[name];

            if (!result.includes(propInfo.type)) {
                result.push(propInfo.type);
            }
        }

        return result;
    }

    add(name: string, count: number, type: string = 'unknown') {
        if (!this.backpack.hasOwnProperty(name)) {
            this.backpack[name] = {
                type: type,
                count: count
            };
        } else {
            this.backpack[name].count += count;
        }
    }

    remove(name: string, count: number) {
        if (!this.backpack.hasOwnProperty(name)) {
            return;
        }

        this.backpack[name].count -= count;

        if (this.backpack[name].count <= 0) {
            delete this.backpack[name];
        }
    }

    changeType(name: string, type: string) {
        if (!this.backpack.hasOwnProperty(name)) {
            return;
        }

        this.backpack[name].type = type;
    }

    clear() {
        this.backpack = {};
    }

    merge(backpack: Backpack) {
        for (let name of Object.keys(backpack.backpack)) {
            const count = backpack.backpack[name].count;
            const type = backpack.backpack[name].type;
            this.add(name, count, type);
        }
    }

    draw(n: number): Backpack {
        const result = new Backpack({});
        let totalCount = this.getTotalCount();

        if (totalCount < n) {
            n = totalCount;
        }

        for (let i = 0; i < n; i++) {
            const index = Math.ceil(Math.random() * totalCount);
            const names = Object.keys(this.backpack);

            let tempCount = 0;
            for (let name of names) {
                tempCount += this.backpack[name].count;

                if (tempCount >= index) {
                    const type = this.backpack[name].type;
                    result.add(name, 1, type);
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
}