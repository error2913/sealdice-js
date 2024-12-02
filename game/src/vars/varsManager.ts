import { Backpack } from "../backpack/backpack"
import { Player } from "../utils/player"

export interface VarsMap {
    [key: string]: any
}

export interface VarsInfo {
    [key: string]: [string, any]// 类型和默认值
}

export class VarsManager {
    private typeMap: {
        [key: string]: {
            parse: (data: any, defaultData: any) => any
        }
    }

    constructor() {
        this.typeMap = {};

        this.registerVarsType('boolean', (data: any, defaultData: any) => {
            return typeof data === 'boolean' ? data : defaultData;
        });

        this.registerVarsType('string', (data: any, defaultData: any) => {
            return typeof data === 'string' ? data : defaultData;
        });

        this.registerVarsType('number', (data: any, defaultData: any) => {
            return typeof data === 'number' ? data : defaultData;
        });

        this.registerVarsType('backpack', Backpack.parse);
        this.registerVarsType('player', Player.parse);
    }

    registerVarsType(
        type: string,
        parseFunc: (data: any, defaultData: any) => any
    ) {
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
            const defaultData = vi[key][1];

            if (!this.typeMap.hasOwnProperty(type)) {
                continue;
            }

            if (!data.hasOwnProperty(key)) {
                data[key] = null;
            }

            result[key] = this.typeMap[type].parse(data[key], defaultData);
        }

        return result;
    }
}