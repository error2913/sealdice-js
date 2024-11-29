
export class Backpack {
    gameKey: string;
    playerKey: string;
    props: {
        [key: string]: number
    }

    constructor(gk: string, pk: string, backpackData: any, defaultProps: {
        [key: string]: number
    } = null) {
        this.gameKey = gk;
        this.playerKey = pk;

        if (
            backpackData === null ||
            typeof backpackData !== 'object' ||
            Array.isArray(backpackData) ||
            !Backpack.checkTypeProps(backpackData.props)
        ) {
            this.props = defaultProps || {};
            return;
        }

        const props = backpackData.props;
        this.props = {};

        for (let name of Object.keys(props)) {
            const count = props[name];
            if (typeof count == 'number') {
                this.props[name] = count;
            }
        }
    }

    static checkTypeProps(data: any): boolean {
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

    checkExist(name: string): boolean {
        return this.props.hasOwnProperty(name);
    }

    getTotalCount(): number {
        let count = 0;

        for (let name of Object.keys(this.props)) {
            count += this.props[name];
        }

        return count;
    }

    getTotalCountByTypes(types: string[]): number {
        const propMap = globalThis.game.map[this.gameKey].propMap;
        let count = 0;

        for (let name of Object.keys(this.props)) {
            if (!propMap.hasOwnProperty(name)) {
                continue;
            }

            const type = propMap[name].type;

            if (types.includes(type)) {
                count += this.props[name];
            }
        }

        return count;
    }

    add(name: string, count: number) {
        if (!this.props.hasOwnProperty(name)) {
            this.props[name] = count;
        } else {
            this.props[name] += count;
        }
    }

    remove(name: string, count: number) {
        if (!this.props.hasOwnProperty(name)) {
            return;
        }

        this.props[name] -= count;

        if (this.props[name] <= 0) {
            delete this.props[name];
        }
    }

    clear() {
        this.props = {};
    }

    merge(backpack: Backpack) {
        for (let name of Object.keys(backpack.props)) {
            this.add(name, backpack.props[name]);
        }
    }

    draw(n: number): Backpack {
        const result = new Backpack(this.gameKey, this.playerKey, {});
        let totalCount = this.getTotalCount();

        if (totalCount < n) {
            n = totalCount;
        }

        for (let i = 0; i < n; i++) {
            const index = Math.ceil(Math.random() * totalCount);
            const names = Object.keys(this.props);

            let tempCount = 0;
            for (let name of names) {
                tempCount += this.props[name];

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

        for (let name of Object.keys(this.props)) {
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

        for (let name of Object.keys(this.props)) {
            if (this.props[name] >= min && this.props[name] <= max) {
                result.push(name);
            }
        }

        return result;
    }

    getTypes(): string[] {
        const propMap = globalThis.game.map[this.gameKey].propMap;
        const result = [];

        for (let name of Object.keys(this.props)) {
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