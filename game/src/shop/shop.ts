import { GoodsConfig } from "./shopManager";

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

    static parse(data: any, gc: GoodsConfig): Shop {
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