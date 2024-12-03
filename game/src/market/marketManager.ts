export interface SellInfo {
    id: number;
    uid: string;
    title: string;
    content: string;
    name: string;
    price: number;
    count: number;
}

export class MarketManager {
    ext: seal.ExtInfo;
    list: SellInfo[];

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.list = [];

        this.getMarket();
    }

    parse(data: any): SellInfo[] {
        if (!Array.isArray(data)) {
            return [];
        }

        const list = [];

        for (let i = 0; i < data.length; i++) {
            const si = data[i];

            if (
                !si.hasOwnProperty('id') || typeof si.id !== 'number' ||
                !si.hasOwnProperty('uid') || typeof si.uid !== 'string' ||
                !si.hasOwnProperty('title') || typeof si.title !== 'string' ||
                !si.hasOwnProperty('content') || typeof si.content !== 'string' ||
                !si.hasOwnProperty('name') || typeof si.name !== 'string' ||
                !si.hasOwnProperty('price') || typeof si.price !== 'number' ||
                !si.hasOwnProperty('count') || typeof si.count !== 'number'
            ) {
                return [];
            }

            list.push(si);
        }

        return list;
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

    putOnSale(uid: string, title: string, content: string, name: string, price: number, count: number) {
        const sellInfo = {
            id: this.createNewId(),
            uid: uid,
            title: title,
            content: content,
            name: name,
            price: price,
            count: count,
        }

        this.list.push(sellInfo);
        this.saveMarket();
    }

    buyGoods(id: number, count: number = 0) {
        const index = this.list.findIndex(si => si.id === id);

        if (index !== -1) {
            const si = this.list[index];

            if (count === 0 || count > si.count) {
                count = si.count;
            }

            this.list[index].count -= count;

            if (this.list[index].count <= 0) {
                this.list.splice(index, 1);
            }

            this.saveMarket();
        }
    }

    getSellInfo(id: number): SellInfo {
        const index = this.list.findIndex(si => si.id === id);

        if (index === -1) {
            return {
                id: 0,
                uid: '',
                title: '',
                content: '',
                name: '',
                price: 0,
                count: 0
            }
        }

        return this.list[index];
    }

    removeSellInfo(id: number) {
        const index = this.list.findIndex(si => si.id === id);

        if (index !== -1) {
            this.list.splice(index, 1);
            this.saveMarket();
        }
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