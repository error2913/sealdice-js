import { Shop } from "./shop"

export interface GoodsInfo {
    price: {
        base: number,
        delta: number
    }
    count: {
        base: number,
        delta: number
    }
    prob: number
}

export interface GoodsConfig {
    [key: string]: GoodsInfo
}

export class ShopManager {
    private ext: seal.ExtInfo;
    private map: { [key: string]: { goodsConfig: GoodsConfig, interval: number } } // 基于此数据生成shop
    private cache: { [key: string]: Shop }

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.map = {};
        this.cache = {};
    }

    registerShop(name: string, gc: GoodsConfig, interval: number) {
        if (this.map.hasOwnProperty(name)) {
            console.error(`注册商店${name}时出现错误:该名字已注册`);
            return;
        }

        this.map[name] = {
            goodsConfig: gc,
            interval: interval
        }
    }

    getShop(name: string): Shop | undefined {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`获取商店${name}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.cache.hasOwnProperty(name)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`shop_${name}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`shop_${name}`}失败:`, error);
            }

            const gc = this.map[name].goodsConfig;
            this.cache[name] = Shop.parse(data, gc);
        }

        const now = Math.floor(Date.now() / 1000);
        const updateTime = this.cache[name].updateTime;
        const interval = this.map[name].interval;
        const dateDiff = Math.ceil((now - updateTime) / 24 * 60 * 60);
        if (interval !== 0 && dateDiff >= interval) {
            this.cache[name].updateShop();
            this.saveShop(name);
        }

        return this.cache[name];
    }

    saveShop(name: string) {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`保存商店${name}时出现错误:该名字未注册`);
            return;
        }

        if (this.cache.hasOwnProperty(name)) {
            const shop = this.cache[name];
            this.ext.storageSet(`shop_${name}`, JSON.stringify(shop));
        }
    }

    setGoodsInfo(name: string, goodsName: string, gi: GoodsInfo) {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`获取商店${name}时出现错误:该名字未注册`);
            return undefined;
        }

        this.map[name][goodsName] = gi;

        if (this.cache.hasOwnProperty(name)) {
            delete this.cache[name];
            this.getShop(name);
            this.saveShop(name);
        }
    }

    getGoodsInfo(name: string, goodsName: string): GoodsInfo | undefined {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`获取商店${name}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.map[name].hasOwnProperty(goodsName)) {
            console.error(`获取商店${name}时出现错误:该商品信息未注册`);
            return undefined;
        }

        return this.map[name][goodsName];
    }

    updateShop(name: string): Shop | undefined {
        if (!this.map.hasOwnProperty(name)) {
            console.error(`更新商店${name}时出现错误:该名字未注册`);
            return undefined;
        }

        const shop = this.getShop(name);

        if (!shop) {
            return undefined;
        }

        shop.updateShop();
        this.saveShop(name);
        return shop;
    }
}