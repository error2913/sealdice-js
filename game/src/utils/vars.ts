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
            check: (defaultData: any) => boolean,
            parse: (data: any, defaultData: any) => any
        }
    }

    constructor() {
        this.map = {};

        this.registerVarsType(
            'boolean',
            (defaultData: any) => {
            return typeof defaultData === 'boolean';
            }, 
            (data: any, defaultData: any) => {
            if (typeof data === 'boolean') {
                return data;
            }

            return defaultData;
            }
        );

        this.registerVarsType(
            'string',
            (defaultData: any) => {
                return typeof defaultData === 'string';
            }, 
            (data: any, defaultData: any) => {
                if (typeof data === 'string') {
                    return data;
                }

                return defaultData;
            }
        );

        this.registerVarsType(
            'number',
            (defaultData: any) => {
                return typeof defaultData === 'number';
            },
            (data: any, defaultData: any) => {
                if (typeof data === 'number') {
                    return data;
                }

                return defaultData;
            }
        );

        this.registerVarsType(
            'backpack',
            (defaultData: any) => {
                return Backpack.check(defaultData);
            },
            (data: any, defaultData: any) => {
                return Backpack.parse(data, defaultData);
            }
        );
    }

    registerVarsType(
        type: string,
        checkFunc: (defaultData: any) => boolean,
        parseFunc: (data: any, defaultData: any) => any
    ) {
        if (this.map.hasOwnProperty(type)) {
            console.error(`注册变量解析器${type}时出现错误:该名字已注册`);
            return;
        }

        this.map[type] = {
            check: checkFunc,
            parse: parseFunc
        }
    }
    
    checkTypeVarsInfo(data: any): boolean {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            return false;
        }

        for (let key of Object.keys(data)) {
            const type = data[key][0];
            const defaultData = data[key][1];

            if (this.map.hasOwnProperty(type) && this.map[type].check(defaultData)) {
                continue;
            }

            return false;
        }

        return true;
    }

    parse(data: any, vi: VarsInfo): VarsMap {
        const result: VarsMap = {};

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        for (let key of Object.keys(vi)) {
            const type = vi[key][0];
            const defaultData = vi[key][1];

            if (!this.map.hasOwnProperty(type)) {
                console.error(`解析变量${key}时出现错误:未注册${type}类型的解析器`);
                continue;
            }
            
            if (!data.hasOwnProperty(key)) {
                data[key] = null;
            }
            
            result[key] = this.map[type].parse(data[key], defaultData);
        }

        return result;
    }
}