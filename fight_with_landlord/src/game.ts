import { Deck } from "./deck";
import { Player } from "./player";
import { deckMap } from "./registerDeck";
import { getCtx, getMsg, getName, getType, parseCards } from "./utils";

const cache: { [key: string]: Game } = {};

export class Game {
    private id: string;//id
    private data: { [key: string]: any };
    private status: boolean;//游戏状态
    private players: Player[];//玩家对象的数组
    private round: number;//回合数
    private turn: number;//一个回合内的轮次数
    private curPlayerId: string;//当前需要做出动作的玩家
    private curDeck: [string, number];//当前场上的牌组
    private mainDeck: Deck;//包含所有卡牌的牌组
    private discardDeck: Deck;//丢弃的卡牌

    constructor(id: string) {
        this.id = id//一般是群号
        this.data = {};//数据
        this.status = false;//游戏状态
        this.players = [];//玩家对象的数组
        this.round = 0;//回合数
        this.turn = 0;//一个回合内的轮次数
        this.curPlayerId = '';//当前需要做出动作的玩家
        this.curDeck = ['', 0];//当前场上的牌组
        this.mainDeck = deckMap['主牌堆'].clone();//包含所有卡牌的牌组
        this.discardDeck = deckMap['弃牌堆'].clone();//丢弃的卡牌
    }

    public static getData(ext: seal.ExtInfo, id: string): Game {
        if (!cache.hasOwnProperty(id)) {
            let data = {};

            try {
                data = JSON.parse(ext.storageGet(`game_${id}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取game_${id}失败:`, error);
            }

            const game = this.parse(id, data);

            cache[id] = game;
        }

        return cache[id];
    }


    //保存数据
    public static saveData(ext: seal.ExtInfo, id: string): void {
        if (cache.hasOwnProperty(id)) {
            ext.storageSet(`game_${id}`, JSON.stringify(cache[id]));
        }
    }

    private static parse(id: string, data: any): Game {
        const game = new Game(id);

        try {
            game.data = data.data;
            game.status = data.status;
            game.players = data.players.map(player => Player.parse(player));
            game.round = data.round;
            game.turn = data.turn;
            game.curPlayerId = data.curPlayerId;
            game.curDeck = data.curDeck;
            game.mainDeck = Deck.parse(data.mainDeck);
            game.discardDeck = Deck.parse(data.discardDeck);
        } catch (err) {
            console.error('解析游戏数据失败:', err);
        }

        return game;
    }

    public check(ctx: seal.MsgContext, msg: seal.Message): void {
        const index = this.players.findIndex(player => player.id == ctx.player.userId);
        if (index == -1) {
          seal.replyToSender(ctx, msg, '没有你的信息');
          return;
        }

        seal.replyPerson(ctx, msg, this.players[index].hand.cards.join('\n'));
    }

    //游戏初始化
    public start(ctx: seal.MsgContext, msg: seal.Message): void {
        if (this.status) {
            seal.replyToSender(ctx, msg, '游戏已开始');
            return;
        }

        //初始化玩家
        const teamList = globalThis.teamManager.getTeamList(this.id);
        this.players = teamList[0].members.map(id => new Player(id));

        //检查玩家数量
        if (this.players.length !== 3) {
            seal.replyToSender(ctx, msg, '玩家数量错误');
            return;
        }

        //决定地主
        for (let i = 2; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
        }

        this.players[0].data.class = '地主';
        this.players[1].data.class = '农民';
        this.players[2].data.class = '农民';

        this.status = true;

        //发牌等游戏开始前的逻辑
        this.data.curDeckPlayerId = this.players[0].id;
        this.mainDeck.shuffle();

        const cards = this.mainDeck.cards.splice(0, 3);
        this.players[0].hand.add(cards);
        seal.replyToSender(ctx, msg, `地主的底牌为：\n${cards.join('\n')}`);

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const cards = this.mainDeck.draw(0, 17);
            player.hand.add(cards);

            //排序
            const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];
            player.hand.cards.sort((a, b) => {
                const indexA = ranks.indexOf(a);
                const indexB = ranks.indexOf(b);
                return indexA - indexB;
            });

            const mmsg = getMsg("private", player.id);
            const mctx = getCtx(ctx.endPoint.userId, mmsg);
            seal.replyPerson(mctx, mmsg, `您的手牌为: ${player.hand.cards.join('\n')}`);
        }

        const name = getName(ctx, this.players[0].id)
        seal.replyToSender(ctx, msg, `游戏开始，从地主${name}开始`);
        this.nextRound(ctx, msg);//开始第一回合
    }

    //结束游戏
    public end(ctx: seal.MsgContext, msg: seal.Message): void {
        seal.replyToSender(ctx, msg, `游戏结束:回合数${this.round}`);

        this.status = false;
        this.players = [];
        this.round = 0;
        this.turn = 0;
        this.curPlayerId = '';
        this.curDeck = ['', 0];
        this.mainDeck = deckMap['主牌堆'].clone();
        this.discardDeck = deckMap['弃牌堆'].clone();
    }

    //进入下一回合
    private nextRound(ctx: seal.MsgContext, msg: seal.Message): void {
        this.turn = 0;
        this.round++;
        this.nextTurn(ctx, msg);
    }

    //进入下一轮
    private nextTurn(ctx: seal.MsgContext, msg: seal.Message): void {
        if (this.turn == 0) {
            this.curPlayerId = this.players[0].id;
        } else {
            const index = this.players.findIndex(player => player.id === this.curPlayerId);
            if (index == this.players.length - 1) {
                this.nextRound(ctx, msg);
                return;
            }

            this.curPlayerId = this.players[index + 1].id;
        }

        this.turn++;
    }

    public play(ctx: seal.MsgContext, msg: seal.Message, name: string): void {
        if (ctx.player.userId !== this.curPlayerId) {
            seal.replyToSender(ctx, msg, '不是当前玩家');
            return;
        }

        if (!deckMap.hasOwnProperty(name)) {
            seal.replyToSender(ctx, msg, '未注册牌组');
            return;
        }

        const index = this.players.findIndex(player => player.id === this.curPlayerId);
        const player = this.players[index];
        const playerName = getName(ctx, this.curPlayerId);

        const anotherIndex = index < this.players.length - 1 ? (index + 1) : 0;
        const anotherPlayer = this.players[anotherIndex];
        const anotherName = getName(ctx, anotherPlayer.id);

        if (name == 'SKIP' || name == 'PASS' || name == '不要' || name == '要不起' || name == '过' || name == '不出') {
            if (this.data.curDeckPlayerId == this.curPlayerId) {
                seal.replyToSender(ctx, msg, '不能跳过');
                return;
            }
            seal.replyToSender(ctx, msg, `${playerName}跳过了，下一位是${anotherName}`);
            this.nextTurn(ctx, msg);//进入下一轮
            return;
        }

        const cards = parseCards(name);

        const [type, value] = getType(cards);

        if (!type) {
            seal.replyToSender(ctx, msg, '未注册牌型');
            return;
        }

        if (!player.hand.check(cards)) {
            seal.replyToSender(ctx, msg, '手牌不足');
            return;
        }

        if (this.data.curDeckPlayerId !== this.curPlayerId && this.curDeck) {
            if (
                type !== '炸弹' &&
                type !== this.curDeck[0]
            ) {
                seal.replyToSender(ctx, msg, '牌型错误');
                return;
            }

            if (
                type == this.curDeck[0] &&
                value <= this.curDeck[1]
            ) {
                seal.replyToSender(ctx, msg, '牌不够大');
                return;
            }
        }

        player.hand.remove(cards);
        this.curDeck = [type, value];
        this.data.curDeckPlayerId = this.curPlayerId;

        if (player.hand.cards.length == 0) {
            seal.replyToSender(ctx, msg, `${player.data.class}${playerName}胜利了`);
            this.end(ctx, msg);
            return;
        }

        seal.replyPerson(ctx, msg, `您的手牌为: ${player.hand.cards.join('\n')}`);
        seal.replyToSender(ctx, msg, `${playerName}打出了${name}，还剩${player.hand.cards.length}张牌。下一位是${anotherName}`);
        this.nextTurn(ctx, msg);//进入下一轮
        return;
    }
}