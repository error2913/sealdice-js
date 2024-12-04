import { Player } from "../player/player";
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

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        if (data.hasOwnProperty('updateTime') && typeof data.updateTime === 'number') {
            shop.updateTime = data.updateTime;
        }

        if (data.hasOwnProperty('goods') && typeof data.goods === 'object' && !Array.isArray(data.goods)) {
            for (const name of Object.keys(data.goods)) {
                const g = data.goods[name];

                if (
                    g.hasOwnProperty('price') && typeof g.price === 'number' &&
                    g.hasOwnProperty('count') && typeof g.count === 'number'
                ) {
                    shop.goods[name] = g;
                }
            }
        }

        return shop;
    }

    showShop(): string {
        if (Object.keys(this.goods).length === 0) {
            return '商店里什么都没有';
        }

        let s = '';

        for (const name of Object.keys(this.goods)) {
            const g = this.goods[name];
            s += `【${name}】: 价格${g.price} 数量${g.count}\n`;
        }

        s = s.trim();

        return s;
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

    getGoods(name: string): Goods {
        if (!this.goods.hasOwnProperty(name)) {
            return { price: 0, count: 0 }
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

    buyGoods(player: Player, name: string, count: number): Error {
        if (!this.goods.hasOwnProperty(name)) {
            return new Error('没有这个商品');
        }

        if (this.goods[name].count < count) {
            return new Error('商品数量不足');
        }

        if (count <= 0) {
            return new Error('购买数量小于1');
        }

        const price = this.goods[name].price * count;
        if (player.money < price) {
            return new Error('货币不足');
        }

        this.goods[name].count -= count;

        player.money -= price;
        player.backpack.addItem(name, count);

        return null;
    }

    removeGoods(name: string) {
        if (this.goods.hasOwnProperty(name)) {
            delete this.goods[name];
        }
    }
}