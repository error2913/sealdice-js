import { Game } from "./game";

export class Deck {
    public name: string;//名字
    public desc: string;//描述
    public cards: string[];//包含的卡牌
    public info: {
        type: string
    }
    public solve: (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, game: Game) => boolean;//方法

    constructor() {
        this.name = '';//名字
        this.desc = '';//描述
        this.cards = [];//包含的卡牌
        this.info = {
            type: ''
        }
        this.solve = (_, __, ___, ____): boolean => {
            return true;
        }
    }

    public static parse(data: any): Deck {
        const deck = new Deck();

        if (!data) {
            return deck;
        }

        try {
            if (deckMap.hasOwnProperty(data.name)) {
                const deck = deckMap[data.name].clone();
                for (const key in deck.info) {
                    deck.info[key] = data.info[key];
                }
                return deck;
            }

            deck.name = data.name;
            deck.desc = data.desc;
            deck.cards = data.cards;
            for (const key in deck.info) {
                deck.info[key] = data.info[key];
            }
        } catch (err) {
            console.error(`解析牌组失败:`, err);
            deck.name = '未知牌堆';
        }

        return deck;
    }

    //洗牌
    public shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    //从指定位置开始抽n张牌
    public draw(position: number = 0, n: number = 1): string[] {
        return this.cards.splice(position, n);
    }

    //在指定位置插入卡牌
    public add(cards: string[], position: number = 0): void {
        this.cards.splice(position, 0, ...cards);
    }

    //移除指定卡牌
    public remove(cards: string[]): void {
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const index = this.cards.indexOf(card);

            if (index !== -1) {
                this.cards.splice(index, 1);
            }
        }
    }

    //检查是否包含指定卡牌
    public check(cards: string[]): boolean {
        let copy = this.cards.slice();

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const index = copy.indexOf(card);

            if (index == -1) {
                return false;
            }

            copy.splice(index, 1);
        }

        return true;
    }

    //复制这个牌组
    public clone(): Deck {
        const deck = new Deck();
        deck.name = this.name;
        deck.desc = this.desc;
        deck.cards = this.cards.slice();
        deck.info = JSON.parse(JSON.stringify(this.info)); // 深拷贝data对象
        if (typeof this.solve === 'function') {
            deck.solve = this.solve.bind(deck); // 绑定新实例到方法
        }

        return deck;
    }
}

const deckMap: { [key: string]: Deck } = {};

export function load(): void {
    const cards = [
        '大王', '小王',
        '2', '2', '2', '2',
        'A', 'A', 'A', 'A',
        'K', 'K', 'K', 'K',
        'Q', 'Q', 'Q', 'Q',
        'J', 'J', 'J', 'J',
        '10', '10', '10', '10',
        '9', '9', '9', '9',
        '8', '8', '8', '8',
        '7', '7', '7', '7',
        '6', '6', '6', '6',
        '5', '5', '5', '5',
        '4', '4', '4', '4',
        '3', '3', '3', '3'
    ]

    //注册主牌堆
    const deckMain = new Deck();
    deckMain.name = '主牌堆';
    deckMain.cards = cards;
    deckMap['主牌堆'] = deckMain;
}

export { deckMap };