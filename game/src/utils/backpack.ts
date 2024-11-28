
export class Backpack {
    props: {
        [key: string]: number
    }

    constructor(backpackData: any, defaultProps: {
        [key: string]: number
    } = {}) {
        if (
            !backpackData.hasOwnProperty('backpack') ||
            backpackData.backpack === null ||
            typeof backpackData.backpack !== 'object' ||
            Array.isArray(backpackData.backpack)
        ) {
            this.props = defaultProps;
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

    static checkType(data: any): boolean {
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

    getTotalCount(): number {
        let count = 0;

        for (let name of Object.keys(this.props)) {
            count += this.props[name];
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
        const result = new Backpack({});
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

    /*
    findByTypes(types: string[]): string[] {
        const result = [];

        for (let name of Object.keys(this.props)) {
            const propInfo = this.props[name];

            if (types.includes(propInfo.type)) {
                result.push(name);
            }
        }

        return result;
    }

    findByCountRange(min: number, max: number): string[] {
        const result = [];

        for (let name of Object.keys(this.props)) {
            const propInfo = this.props[name];

            if (propInfo.count >= min && propInfo.count <= max) {
                result.push(name);
            }
        }

        return result;
    }

    getTotalCountByTypes(types: string[]): number {
        let count = 0;

        for (let name of Object.keys(this.props)) {
            const propInfo = this.props[name];

            if (types.includes(propInfo.type)) {
                count += propInfo.count;
            }
        }

        return count;
    }

    getTypes(): string[] {
        const result = [];

        for (let name of Object.keys(this.props)) {
            const propInfo = this.props[name];

            if (!result.includes(propInfo.type)) {
                result.push(propInfo.type);
            }
        }

        return result;
    }

    changeType(name: string, type: string) {
        if (!this.props.hasOwnProperty(name)) {
            return;
        }

        this.props[name].type = type;
    }
        */
}