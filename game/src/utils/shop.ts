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

export interface Goods {
    price: number;
    count: number;
}

export class Shop {
    private goodsConfig: GoodsConfig;// 基于此数据生成goods
    updateTime: number;
    goods: { [key: string]: Goods }

    constructor(gc: GoodsConfig) {
        this.goodsConfig = gc;
        this.updateTime = 0;
        this.goods = {};
    }

    updateShop(): Shop {
        this.updateTime = Math.floor(Date.now() / 1000);
        this.goods = {};

        for (const name of Object.keys(this.goodsConfig)) {
            const gi = this.goodsConfig[name];

            if (Math.random() < gi.prob) {
                const pb = gi.price.base;
                const pd = gi.price.delta;
                const cb = gi.count.base;
                const cd = gi.count.delta;

                const price = Math.floor(Math.random() * (pd * 2 + 1) + pb - pd);
                const count = Math.floor(Math.random() * (cd * 2 + 1) + cb - cd);

                this.goods[name] = {
                    price: price,
                    count: count
                }
            }
        }

        return this;
    }

    getGoods(name: string): Goods | undefined {
        if (!this.goods.hasOwnProperty(name)) {
            return undefined;
        }

        return this.goods[name];
    }

    addGoods(name: string, price: number, count: number) {
        if (this.goods.hasOwnProperty(name)) {
            return;
        }

        this.goods[name] = {
            price: price,
            count: count
        }
    }

    supplyGoods(name: string, count: number) {
        if (!this.goods.hasOwnProperty(name)) {
            return;
        }

        this.goods[name].count += count;
    }

    buyGoods(name: string, count: number): boolean {
        if (!this.goods.hasOwnProperty(name)) {
            return false;
        }

        if (this.goods[name].count < count || count <= 0) {
            return false;
        }

        this.goods[name].count -= count;

        return true;
    }

    removeGoods(name: string): boolean {
        if (!this.goods.hasOwnProperty(name)) {
            return false;
        }

        delete this.goods[name];
        return true;
    }
}

export class ShopManager {
    private ext: seal.ExtInfo;
    private map: { [key: string]: GoodsConfig } // 基于此数据生成shop
    private cache: { [key: string]: Shop }

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.map = {};
        this.cache = {};
    }

    private parse(data: any, gc: GoodsConfig): Shop {
        const shop = new Shop(gc);

        if (data.hasOwnProperty('updateTime') && typeof data.updateTime === 'number') {
            shop.updateTime = data.updateTime;
        }

        if (data.hasOwnProperty('goods') && typeof data.goods === 'object') {
            for (const name of Object.keys(data.goods)) {
                const g = data.goods[name];

                if (
                    g.hasOwnProperty('price') && typeof g.price === 'number' &&
                    g.hasOwnProperty('count') && typeof g.count === 'number'
                ) {
                    shop.goods[name] = {
                        price: g.price,
                        count: g.count
                    }
                }
            }
        }

        return shop;
    }

    registerShop(name: string, gc: GoodsConfig) {
        if (this.map.hasOwnProperty(name)) {
            console.error(`注册商店${name}时出现错误:该名字已注册`);
            return;
        }

        if (gc === null || typeof gc !== 'object' || Array.isArray(gc)) {
            console.error(`注册商店${name}时出现错误:配置数据错误`);
            return;
        }

        for (const name of Object.keys(gc)) {
            const gi = gc[name];

            if (
                !gi.hasOwnProperty('price') || typeof gi.price !== 'object' ||
                !gi.price.hasOwnProperty('base') || typeof gi.price.base !== 'number' ||
                !gi.price.hasOwnProperty('delta') || typeof gi.price.delta !== 'number' ||

                !gi.hasOwnProperty('count') || typeof gi.count !== 'object' ||
                !gi.count.hasOwnProperty('base') || typeof gi.count.base !== 'number' ||
                !gi.count.hasOwnProperty('delta') || typeof gi.count.delta !== 'number' ||

                !gi.hasOwnProperty('prob') || typeof gi.prob !== 'number'
            ) {
                console.error(`注册商店${name}时出现错误:配置数据错误`);
                return;
            }
        }

        this.map[name] = gc;
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

            const gc = this.map[name];
            this.cache[name] = this.parse(data, gc);
        }

        if (this.cache[name].updateTime === 0) {
            this.updateShop(name);
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