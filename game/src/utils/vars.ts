import { Backpack } from "./backpack"

export interface VarsMap {
    [key: string]: any
}

export interface VarsInfo {
    [key: string]: [string, any]// 类型和默认值
}

export class VarsManager {
    private map: {
        [key: string]: {
            parse: (data: any, defaultData: any) => any | undefined
        }
    }

    constructor() {
        this.map = {};

        this.registerVarsType(
            'boolean',
            (data: any, defaultData: any) => {
                if (typeof defaultData !== 'boolean') {
                    return undefined;
                }

                return typeof data === 'boolean' ? data: defaultData;
            }
        );

        this.registerVarsType(
            'string',
            (data: any, defaultData: any) => {
                if (typeof defaultData!== 'string') {
                    return undefined;
                }

                return typeof data === 'string'? data: defaultData;
            }
        );

        this.registerVarsType(
            'number',
            (data: any, defaultData: any) => {
                if (typeof defaultData!== 'number') {
                    return undefined;
                }

                return typeof data === 'number'? data: defaultData;
            }
        );

        this.registerVarsType(
            'backpack',
            Backpack.parse
        );
    }

    registerVarsType(
        type: string,
        parseFunc: (data: any, defaultData: any) => any | undefined
    ) {
        if (this.map.hasOwnProperty(type)) {
            console.error(`注册变量解析器${type}时出现错误:该名字已注册`);
            return;
        }

        this.map[type] = {
            parse: parseFunc
        }
    }

    parse(data: any, vi: VarsInfo): VarsMap | undefined {
        if (vi === null || typeof vi !== 'object' || Array.isArray(vi)) {
            return undefined;
        }

        const result: VarsMap = {};

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        for (let key of Object.keys(vi)) {
            if (!Array.isArray(vi[key]) || vi[key].length !== 2 || typeof vi[key][0]== 'string') {
                return undefined;
            }

            const type = vi[key][0];
            const defaultData = vi[key][1];

            if (!this.map.hasOwnProperty(type)) {
                console.error(`解析变量${key}时出现错误:未注册${type}类型的解析器`);
                return undefined;
            }
            
            if (!data.hasOwnProperty(key)) {
                data[key] = null;
            }
            
            result[key] = this.map[type].parse(data[key], defaultData);

            if (result[key] === undefined) {
                console.error(`解析变量${key}时出现错误:默认值错误`);
                return undefined;
            }
        }

        return result;
    }
}