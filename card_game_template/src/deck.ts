import { Player } from "./player";
import { Game } from "./game";
import { deckMap } from "./registerDeck";

export class Deck {
    public name: string;//名字
    public desc: string;//描述
    public type: string;//种类
    public cards: string[];//包含的卡牌
    public data: { [key: string]: any };//数据
    public solve: (ctx: seal.MsgContext, msg: seal.Message, game: Game, player: Player) => void;//方法

    constructor() {
        this.name = '';//名字
        this.desc = '';//描述
        this.type = '';//种类
        this.cards = [];//包含的卡牌
        this.data = {};//数据
        this.solve = () => {}//方法
    }

    public static parseDeck(data: any): Deck {
        const name = data.name || '未知牌堆';

        if (deckMap.hasOwnProperty(name)) {
            const deck = deckMap[name].clone();
            deck.data = data.data || {};
            return deck;
        }

        const deck = new Deck();
        deck.name = name;
        deck.desc = data.desc || '';
        deck.type = data.type || '';
        deck.cards = data.cards || [];
        deck.data = data.data || {};

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
        deck.type = this.type;
        deck.cards = this.cards.slice(); 
        deck.data = JSON.parse(JSON.stringify(this.data)); // 深拷贝data对象
        if (typeof this.solve === 'function') {
            deck.solve = this.solve.bind(deck); // 绑定新实例到方法
        }

        return deck;
    }
}