import { Backpack } from "../backpack/backpack"
import { Team } from "../team/team"

export interface VarsMap {
    [key: string]: any
}

export interface VarsInfo {
    [key: string]: [string, ...any]
}

export class VarsManager {
    private typeMap: {
        [key: string]: {
            parse: (data: any, ...args: any[]) => any
        }
    }

    constructor() {
        this.typeMap = {};

        this.registerVarsType('boolean', (data: any, bool: boolean) => {
            return typeof data === 'boolean' ? data : bool;
        });

        this.registerVarsType('string', (data: any, s: string) => {
            return typeof data === 'string' ? data : s;
        });

        this.registerVarsType('number', (data: any, n: number) => {
            return typeof data === 'number' ? data : n;
        });

        this.registerVarsType('backpack', Backpack.parse);
        this.registerVarsType('team', Team.parse);
    }

    registerVarsType(type: string, parseFunc: (data: any, ...args: any[]) => any) {
        if (this.typeMap.hasOwnProperty(type)) {
            console.error(`注册变量解析器${type}时出现错误:该名字已注册`);
            return;
        }

        this.typeMap[type] = {
            parse: parseFunc
        }
    }

    parse(data: any, vi: VarsInfo): VarsMap {
        const result: VarsMap = {};

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        for (let key of Object.keys(vi)) {
            const type = vi[key][0];
            if (!this.typeMap.hasOwnProperty(type)) {
                continue;
            }

            if (!data.hasOwnProperty(key)) {
                data[key] = null;
            }

            const args = vi[key].slice(1);
            result[key] = this.typeMap[type].parse(data[key], ...args);
        }

        return result;
    }

    getParseFunc(type: string): ((data: any,...args: any[]) => any) | null {
        if (!this.typeMap.hasOwnProperty(type)) {
            return null;
        }
        
        return this.typeMap[type].parse;
    }
}