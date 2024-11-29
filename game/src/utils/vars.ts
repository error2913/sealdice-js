import { Backpack } from "./backpack"

export interface varsMap {
    [key: string]: any
}

export interface varsInfo {
    [key: string]: [string, any]// 类型和默认值
}

export class varsManager {
    map: {
        [key: string]: {
            check: (data: any) => boolean,
            parse: (data: any, defaultData: any, gk: string) => any
        }
    }

    constructor() {
        this.map = {};

        this.registerVarsType('boolean', (data: any) => {
            return typeof data === 'boolean';
        }, (data: any, defaultData: any, _: string) => {
            if (typeof data === 'boolean') {
                return data;
            }

            return defaultData;
        });

        this.registerVarsType('string', (data: any) => {
            return typeof data === 'string';
        }, (data: any, defaultData: any, _: string) => {
            if (typeof data === 'string') {
                return data;
            }

            return defaultData;
        });

        this.registerVarsType('number', (data: any) => {
            return typeof data === 'number';
        }, (data: any, defaultData: any, _: string) => {
            if (typeof data === 'number') {
                return data;
            }

            return defaultData;
        });

        this.registerVarsType('backpack', (data: any) => {
            return Backpack.checkTypeItems(data);
        }, (data: any, defaultData: any, gk: string) => {
            return Backpack.parse(data, defaultData, gk);
        });
    }

    registerVarsType(
        type: string,
        checkFunc: (data: any) => boolean,
        parseFunc: (data: any, defaultData: any, gk: string) => any
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

    parse(data: any, gk: string, v: varsInfo): varsMap {
        const result: varsMap = {};

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        for (let key of Object.keys(v)) {
            const type = v[key][0];
            const defaultData = v[key][1];

            if (this.map.hasOwnProperty(type)) {
                if (data.hasOwnProperty(key)) {
                    result[key] = this.map[type].parse(data[key], defaultData, gk);
                } else {
                    result[key] = this.map[type].parse(null, defaultData, gk);
                }
            } else {
                console.error(`解析变量${key}时出现错误:未注册${type}类型的解析器`);
            }
        }

        return result;
    }
}