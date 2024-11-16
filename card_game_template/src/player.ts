import { Deck } from "./deck";

export class Player {
    public id: string;//userId
    public info: {};
    public hand: Deck;//手牌
    public show: Deck;//明牌
    public hide: Deck;//暗牌

    constructor(id: string) {
        this.id = id;
        this.info = {};

        this.hand = new Deck();
        this.hand.name = '手牌';

        this.show = new Deck();
        this.show.name = '明牌';

        this.hide = new Deck();
        this.hide.name = '暗牌';
    }

    //获取并解析player对象的数据
    public static parse(data: any): Player {
        let player: Player;

        if (!data) {
            player = new Player('QQ:114514');
            return player;
        }

        try {
            player = new Player(data.id);
            for (const key in player.info) {
                player.info[key] = data.info[key];
            }
            player.hand = Deck.parse(data.hand);
            player.show = Deck.parse(data.show);
            player.hide = Deck.parse(data.hide);
        } catch (err) {
            console.error(`解析玩家失败:`, err);
            player = new Player('QQ:114514');
        }

        return player;
    }
}