export interface goodsInfo {
    name: string;
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

export interface Goods {
    price: number;
    count: number;
}

export class shop {
    name: string;
    goodsInfoArray: goodsInfo[];
    goods: {
        [key: string]: Goods
    }

    constructor() {

    }

    updateShop() {
        
    }
}

export class shopManager {

}