import { Deck } from "./deck";

export class Player {
    public id: string;
    public data: { [key: string]: any };
    public hand: Deck;
    public show: Deck;
    public hide: Deck;

    constructor(id: string) {
        this.id = id;
        this.data = {};

        this.hand = new Deck();
        this.hand.name = '手牌';

        this.show = new Deck();
        this.show.name = '明牌';

        this.hide = new Deck();
        this.hide.name = '暗牌';
    }

    //获取并解析player对象的数据
    public static parsePlayer(data: any): Player {
        const id = data.id || 'QQ:114514';
        const player = new Player(id);

        player.data = data.data || {};
        player.hand = Deck.parseDeck(data.hand);
        player.show = Deck.parseDeck(data.show);
        player.hide = Deck.parseDeck(data.hide);

        return player
    }
}