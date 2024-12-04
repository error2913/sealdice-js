import { GameManager } from "../game/gameManager";
import { Player } from "../player/player";

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

    putOnSale(player: Player, title: string, content: string, name: string, price: number, count: number): Error {
        if (title.length === 0) {
            return new Error('请输入标题');
        }
        if (title.length > 12) {
            return new Error('标题长度不能超过12个字符');
        }
        if (content.length > 300) {
            return new Error('内容长度不能超过300个字符');
        }
        if (!player.backpack.checkExists(name, count)) {
            return new Error(`背包内【${name}】数量不足`);
        }

        player.backpack.removeItem(name, count);

        const sellInfo = {
            id: this.createNewId(),
            uid: player.uid,
            title: title,
            content: content,
            name: name,
            price: price,
            count: count,
        }

        this.list.push(sellInfo);
        this.saveMarket();
        return null;
    }

    buyGoods(gm: GameManager, player: Player, id: number, count: number = 0): Error {
        const index = this.list.findIndex(si => si.id === id);

        if (index === -1) {
            return new Error('商品不存在');
        }

        const si = this.list[index];

        if (count === 0 || count > si.count) {
            count = si.count;
        }

        const price = si.price * count;
        if (player.money < price) {
            return new Error('货币不足');
        }

        this.list[index].count -= count;
        if (this.list[index].count <= 0) {
            this.list.splice(index, 1);
        }

        player.money -= price;
        player.backpack.addItem(si.name, count);

        const mplayer = gm.player.getPlayer(si.uid, '');
        mplayer.money += price;
        gm.player.savePlayer(si.uid);

        this.saveMarket();
        return null;
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