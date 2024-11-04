import { Player } from "./player";
import { Game } from "./game";

export class Deck {
    public name: string;//名字
    public desc: string;//描述
    public type: string;//种类
    public cards: string[];//包含的卡牌
    public data: [string];//数据color
    public solve: (ctx: seal.MsgContext, msg: seal.Message, game: Game, player: Player) => void;//方法

    constructor() {
        this.name = '';//名字
        this.desc = '';//描述
        this.type = '';//种类
        this.cards = [];//包含的卡牌
        this.data = [''];//数据
        this.solve = (_, __, ___, ____) => { }//方法
    }

    public static parse(data: any): Deck {
        const deck = new Deck();

        try {
            if (deckMap.hasOwnProperty(data.name)) {
                const deck = deckMap[data.name].clone();
                deck.data = data.data || [];
                return deck;
            }

            deck.name = data.name;
            deck.desc = data.desc;
            deck.type = data.type;
            deck.cards = data.cards;
            deck.data = data.data;
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
        deck.type = this.type;
        deck.cards = this.cards.slice();
        deck.data = JSON.parse(JSON.stringify(this.data)); // 深拷贝data对象
        if (typeof this.solve === 'function') {
            deck.solve = this.solve.bind(deck); // 绑定新实例到方法
        }

        return deck;
    }
}

const deckMap: { [key: string]: Deck } = {};

const colors = ['红', '黄', '蓝', '绿'];

const normalCards = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

for (let i = 0; i < colors.length; i++) {
    const color = colors[i];

    for (let j = 0; j < normalCards.length; j++) {
        const card = color + normalCards[j];
        const deck = new Deck();
        deck.name = card;
        deck.type = normalCards[j];
        deck.cards = [card];
        deck.data = [color];
        deck.solve = (_, __, ___, ____) => {
            //TODO
        }
        deckMap[card] = deck;
    }

    const cardBan = color + '禁止';
    const deckBan = new Deck();
    deckBan.name = cardBan;
    deckBan.type = 'ban';
    deckBan.cards = [cardBan];
    deckBan.data = [color];
    deckBan.solve = (_, __, ___, ____) => {
        //TODO
    }
    deckMap[cardBan] = deckBan;

    const cardChange = color + '换向';
    const deckChange = new Deck();
    deckChange.name = cardChange;
    deckChange.type = 'change';
    deckChange.cards = [cardChange];
    deckChange.data = [color];
    deckChange.solve = (_, __, ___, ____) => {
        //TODO
    }
    deckMap[cardChange] = deckChange;

    const cardTwo = color + '加二';
    const deckTwo = new Deck();
    deckTwo.name = cardTwo;
    deckTwo.type = 'two';
    deckTwo.cards = [cardTwo];
    deckTwo.data = [color];
    deckTwo.solve = (_, __, ___, ____) => {
        //TODO
    }
    deckMap[cardTwo] = deckTwo;
}

const deckAll = new Deck();
deckAll.name = '万能';
deckAll.type = 'all';
deckAll.cards = ['万能'];
deckAll.data = ['all'];
deckAll.solve = (_, __, ___, ____) => {
    //TODO
}
deckMap['万能'] = deckAll;

const deckFour = new Deck();
deckFour.name = '加四';
deckFour.type = 'four';
deckFour.cards = ['加四'];
deckFour.data = ['all'];
deckFour.solve = (_, __, ___, ____) => {
    //TODO
}
deckMap['加四'] = deckFour;


const cards = ['A', 'B', 'C'];

//注册主牌堆
const deckMain = new Deck();
deckMain.name = '主牌堆';
deckMain.type = 'public';
deckMain.cards = cards;
deckMap['主牌堆'] = deckMain;

//注册弃牌堆
const deckDiscard = new Deck();
deckDiscard.name = '弃牌堆';
deckDiscard.type = 'public';
deckDiscard.cards = [];
deckMap['弃牌堆'] = deckDiscard;

export { deckMap };