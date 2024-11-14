export interface GoodInfo {
    price: number;
    count: number;
    receipt: string;
    usage: number;
}

export interface Goods {
    [key: string]: GoodInfo;
}

export class Shop {
    static date: string;
    static goods: Goods;

    static update() {

    }

    static getShop() {

    }
}