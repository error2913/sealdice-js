import { Game } from "./game";
import { getName, replyPrivate } from "./utils";

export class Deck {
    public name: string;//名字
    public desc: string;//描述
    public type: string;//种类
    public cards: string[];//包含的卡牌
    public data: [string];//数据color
    public solve: (ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs, game: Game) => boolean;//方法

    constructor() {
        this.name = '';//名字
        this.desc = '';//描述
        this.type = '';//种类
        this.cards = [];//包含的卡牌
        this.data = [''];//数据
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

export function load(): void {
    const colors = ['红', '黄', '蓝', '绿'];

    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
    
        for (let j = 0; j < 10; j++) {
            const card = color + j;
            const deck = new Deck();
            deck.name = card;
            deck.type = 'number';
            deck.cards = [card];
            deck.data = [color];
            deckMap[card] = deck;
        }
    
        const cardSkip = color + '禁止';
        const deckSkip = new Deck();
        deckSkip.name = cardSkip;
        deckSkip.type = 'skip';
        deckSkip.cards = [cardSkip];
        deckSkip.data = [color];
        deckSkip.solve = (ctx, msg, cmdArgs, game) => {
            const name = cmdArgs.getArgN(1);
            const deck = deckMap[name].clone();

            const index = game.players.findIndex(player => player.id === game.curPlayerId);
            const player = game.players[index];
            const playerName = getName(ctx, game.curPlayerId);
    
            const anotherIndex = index < game.players.length - 1 ? (index + 1) : 0;
            const anotherPlayer = game.players[anotherIndex];
            const anotherName = getName(ctx, anotherPlayer.id);
            game.curPlayerId = anotherPlayer.id;

            const anotheranotherIndex = anotherIndex < game.players.length - 1 ? (anotherIndex + 1) : 0;
            const anotheranotherPlayer = game.players[anotheranotherIndex];
            const anotheranotherName = getName(ctx, anotheranotherPlayer.id);

            seal.replyToSender(ctx, msg, `${playerName}打出了${deck.name}，还剩${player.hand.cards.length}张牌。${anotherName}跳过了，下一位是${anotheranotherName}`);
            game.nextTurn(ctx, msg);//进入下一轮
            return false;
        }
        deckMap[cardSkip] = deckSkip;
    
        const cardReverse = color + '反转';
        const deckReverse = new Deck();
        deckReverse.name = cardReverse;
        deckReverse.type = 'reverse';
        deckReverse.cards = [cardReverse];
        deckReverse.data = [color];
        deckReverse.solve = (ctx, msg, cmdArgs, game) => {
            const name = cmdArgs.getArgN(1);
            const deck = deckMap[name].clone();

            game.players.reverse();

            const index = game.players.findIndex(player => player.id === game.curPlayerId);
            const player = game.players[index];
            const playerName = getName(ctx, game.curPlayerId);

            const anotherIndex = index < game.players.length - 1 ? (index + 1) : 0;
            const anotherPlayer = game.players[anotherIndex];
            const anotherName = getName(ctx, anotherPlayer.id);
            
            seal.replyToSender(ctx, msg, `${playerName}打出了${deck.name}，还剩${player.hand.cards.length}张牌。下一位是${anotherName}`);
            game.nextTurn(ctx, msg);//进入下一轮
            return false;
        }
        deckMap[cardReverse] = deckReverse;
    
        const cardTwo = color + '加二';
        const deckTwo = new Deck();
        deckTwo.name = cardTwo;
        deckTwo.type = 'two';
        deckTwo.cards = [cardTwo];
        deckTwo.data = [color];
        deckTwo.solve = (ctx, msg, cmdArgs, game) => {
            const name = cmdArgs.getArgN(1);
            const deck = deckMap[name].clone();

            const index = game.players.findIndex(player => player.id === game.curPlayerId);
            const player = game.players[index];
            const playerName = getName(ctx, game.curPlayerId);
    
            const anotherIndex = index < game.players.length - 1 ? (index + 1) : 0;
            const anotherPlayer = game.players[anotherIndex];
            game.curPlayerId = anotherPlayer.id;

            if (game.mainDeck.cards.length < 2) {
                const cards= game.discardDeck.cards;
                game.discardDeck.cards = [];
                game.mainDeck.add(cards);
                game.mainDeck.shuffle();
            }
            const cards = game.mainDeck.draw(0, 2);
            anotherPlayer.hand.add(cards);
            replyPrivate(ctx, `您摸到了${cards.join(',')}\n您的手牌为:\n${anotherPlayer.hand.cards.join('\n')}`, anotherPlayer.id);

            const anotheranotherIndex = anotherIndex < game.players.length - 1 ? (anotherIndex + 1) : 0;
            const anotheranotherPlayer = game.players[anotheranotherIndex];
            const anotheranotherName = getName(ctx, anotheranotherPlayer.id);

            seal.replyToSender(ctx, msg, `${playerName}打出了${deck.name}，还剩${player.hand.cards.length}张牌。下一位是${anotheranotherName}`);
            game.nextTurn(ctx, msg);//进入下一轮
            return false;
        }
        deckMap[cardTwo] = deckTwo;
    }
    
    const deckWild = new Deck();
    deckWild.name = '万能';
    deckWild.type = 'wild';
    deckWild.cards = ['万能'];
    deckWild.data = ['wild'];
    deckWild.solve = (ctx, msg, cmdArgs, game) => {
        const color = cmdArgs.getArgN(2);
        if (!colors.includes(color)) {
            seal.replyToSender(ctx, msg, `颜色${color}不存在或未指定`);
            return false;
        }

        game.curDeckInfo = [color, '', 0];
        return true;
    }
    deckMap['万能'] = deckWild;
    
    const deckFour = new Deck();
    deckFour.name = '加四';
    deckFour.type = 'four';
    deckFour.cards = ['加四'];
    deckFour.data = ['wild'];
    deckFour.solve = (ctx, msg, cmdArgs, game) => {
        const color = cmdArgs.getArgN(2);
        if (!colors.includes(color)) {
            seal.replyToSender(ctx, msg, `颜色${color}不存在或未指定`);
            return false;
        }

        game.curDeckInfo = [color, '', 0];

        const name = cmdArgs.getArgN(1);
        const deck = deckMap[name].clone();

        const index = game.players.findIndex(player => player.id === game.curPlayerId);
        const player = game.players[index];
        const playerName = getName(ctx, game.curPlayerId);

        const anotherIndex = index < game.players.length - 1 ? (index + 1) : 0;
        const anotherPlayer = game.players[anotherIndex];
        game.curPlayerId = anotherPlayer.id;

        if (game.mainDeck.cards.length < 4) {
            const cards= game.discardDeck.cards;
            game.discardDeck.cards = [];
            game.mainDeck.add(cards);
            game.mainDeck.shuffle();
        }
        const cards = game.mainDeck.draw(0, 4);
        anotherPlayer.hand.add(cards);
        replyPrivate(ctx, `您摸到了${cards.join(',')}\n您的手牌为:\n${anotherPlayer.hand.cards.join('\n')}`, anotherPlayer.id);

        const anotheranotherIndex = anotherIndex < game.players.length - 1 ? (anotherIndex + 1) : 0;
        const anotheranotherPlayer = game.players[anotheranotherIndex];
        const anotheranotherName = getName(ctx, anotheranotherPlayer.id);

        seal.replyToSender(ctx, msg, `${playerName}打出了${deck.name}，还剩${player.hand.cards.length}张牌。下一位是${anotheranotherName}`);
        game.nextTurn(ctx, msg);//进入下一轮
        return false;
    }
    deckMap['加四'] = deckFour;
    
    
    const cards = [
        '红0', '黄0', '蓝0', '绿0',
        '红1', '黄1', '蓝1', '绿1', '红1', '黄1', '蓝1', '绿1',
        '红2', '黄2', '蓝2', '绿2', '红2', '黄2', '蓝2', '绿2',
        '红3', '黄3', '蓝3', '绿3', '红3', '黄3', '蓝3', '绿3',
        '红4', '黄4', '蓝4', '绿4', '红4', '黄4', '蓝4', '绿4',
        '红5', '黄5', '蓝5', '绿5', '红5', '黄5', '蓝5', '绿5',
        '红6', '黄6', '蓝6', '绿6', '红6', '黄6', '蓝6', '绿6',
        '红7', '黄7', '蓝7', '绿7', '红7', '黄7', '蓝7', '绿7',
        '红8', '黄8', '蓝8', '绿8', '红8', '黄8', '蓝8', '绿8',
        '红9', '黄9', '蓝9', '绿9', '红9', '黄9', '蓝9', '绿9',
        '红禁止', '黄禁止', '蓝禁止', '绿禁止', '红禁止', '黄禁止', '蓝禁止', '绿禁止',
        '红反转', '黄反转', '蓝反转', '绿反转', '红反转', '黄反转', '蓝反转', '绿反转',
        '红加二', '黄加二', '蓝加二', '绿加二', '红加二', '黄加二', '蓝加二', '绿加二',
        '万能', '万能', '万能', '万能',
        '加四', '加四', '加四', '加四'
    ];
    
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
}

export { deckMap };