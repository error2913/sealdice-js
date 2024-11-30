import { Player } from "./player";
import { Goods } from "./shop";

export interface SellInfo {
    id: number;
    title: string;
    content: string;
    name: string;
    goods: Goods;
    uid: string;
}

export class MarketManager {
    ext: seal.ExtInfo;
    list: SellInfo[];

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.list = [];

        this.getMarket();
    }

    private parse(data: any): SellInfo[] {
        if (!Array.isArray(data)) {
            return [];
        }

        return data;
    }

    getMarket(): SellInfo[] | undefined {
        if (this.list.length === 0) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`market`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`market`}失败:`, error);
            }

            this.list = this.parse(data);
        }


        return this.list;
    }

    saveMarket() {
        this.ext.storageSet(`market`, JSON.stringify(this.list));
    }

    private createNewId() {
        if (this.list.length === 0) {
            return 1;
        }

        const id = this.list[this.list.length - 1].id;

        return id + 1;
    }

    sell(player: Player, title: string, content: string, name: string, price: number, count: number): boolean {
        if (title.length > 12 || content.length > 300) {
            return false;
        }

        if (player.backpack.checkExist(name, count)) {
            return false;
        }

        const goods = {
            price: price,
            count: count
        }
        const sellInfo = {
            id: this.createNewId(),
            title: title,
            content: content,
            name: name,
            goods: goods,
            uid: player.uid
        }

        player.backpack.remove(name, count);
        this.list.push(sellInfo);
        this.saveMarket();

        return true;
    }

    getSellInfo(id: number): SellInfo | undefined {
        const index = this.list.findIndex(si => si.id === id);

        if (index === -1) {
            return undefined;
        }

        const si = this.list[index];
        return si;
    }

    removeSellInfo(id: number): boolean {
        const index = this.list.findIndex(si => si.id === id);

        if (index === -1) {
            return false;
        }

        this.list.splice(index, 1);
        this.saveMarket();
        return true;
    }

    showSellInfo(): string[] {
        if (this.list.length === 0) {
            return ['市场暂无商品'];
        }

        const pageSize = 10;
        const totalPages = Math.ceil(this.list.length / pageSize);
        const pages = [];

        let arr = [];

        for (let i = 0; i < this.list.length; i++) {
            const item = this.list[i];

            const s = `${item.id}.【${item.title}】`;

            arr.push(s);

            if (i % pageSize === pageSize - 1 || i === this.list.length - 1) {
                const pageNum = i === 0 ? 1 : Math.ceil(i / pageSize);

                const s = arr.join('\n') + `\n第${pageNum}/${totalPages}页`;
                pages.push(s);
                arr = [];
            }
        }

        return pages;
    }
}