import { Deck } from "./deck";
import { Player } from "./player";
import { deckMap } from "./deck";
import { getName, replyPrivate } from "./utils";

const cache: { [key: string]: Game } = {};

export class Game {
    id: string;//id
    status: boolean;//游戏状态
    players: Player[];//玩家对象的数组
    round: number;//回合数
    turn: number;//一个回合内的轮次数
    info: {
        id: string,
        type: string
    };
    mainDeck: Deck;//包含所有卡牌的牌组
    discardDeck: Deck;//丢弃的卡牌

    constructor(id: string) {
        this.id = id//一般是群号
        this.status = false;//游戏状态
        this.players = [];//玩家对象的数组
        this.round = 0;//回合数
        this.turn = 0;//一个回合内的轮次数
        this.info = {
            id: '',
            type: ''
        }
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

        if (!data) {
            return game;
        }

        try {
            game.status = data.status;
            game.players = data.players.map(player => Player.parse(player));
            game.round = data.round;
            game.turn = data.turn;
            for (const key in game.info) {
                game.info[key] = data.info[key];
            }
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

        replyPrivate(ctx, `您的手牌为:\n${this.players[index].hand.cards.join('\n')}`);
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
        if (this.players.length < 2 || this.players.length > 4) {
            seal.replyToSender(ctx, msg, `当前队伍成员数量${this.players.length}，玩家数量错误`);
            return;
        }

        this.status = true;

        //发牌等游戏开始前的逻辑
        this.mainDeck.shuffle();
        const n = Math.floor(this.mainDeck.cards.length / this.players.length);
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const cards = this.mainDeck.draw(0, n);
            player.hand.add(cards);

            replyPrivate(ctx, `您的手牌为:\n${player.hand.cards.join('\n')}`, player.id);
        }

        seal.replyToSender(ctx, msg, '游戏开始');
        this.nextRound(ctx, msg);//开始第一回合
    }

    //结束游戏
    public end(ctx: seal.MsgContext, msg: seal.Message): void {
        seal.replyToSender(ctx, msg, `游戏结束:回合数${this.round}`);
        cache[this.id] = new Game(this.id);
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
            this.info.id = this.players[0].id;
        } else {
            const index = this.players.findIndex(player => player.id === this.info.id);
            if (index == this.players.length - 1) {
                this.nextRound(ctx, msg);
                return;
            }

            this.info.id = this.players[index + 1].id;
        }

        this.turn++;
    }

    public play(ctx: seal.MsgContext, msg: seal.Message, cmdArgs: seal.CmdArgs): void {
        const name = cmdArgs.getArgN(2);

        if (ctx.player.userId !== this.info.id) {
            seal.replyToSender(ctx, msg, '不是当前玩家');
            return;
        }

        if (!deckMap.hasOwnProperty(name)) {
            seal.replyToSender(ctx, msg, '未注册牌组');
            return;
        }

        const index = this.players.findIndex(player => player.id === this.info.id);
        const player = this.players[index];
        const playerName = getName(ctx, this.info.id);

        const anotherIndex = index < this.players.length - 1 ? (index + 1) : 0;
        const anotherPlayer = this.players[anotherIndex];
        const anotherName = getName(ctx, anotherPlayer.id);

        const deck = deckMap[name].clone();
        if (!player.hand.check(deck.cards)) {
            seal.replyToSender(ctx, msg, '手牌不足');
            return;
        }

        const result = deck.solve(ctx, msg, cmdArgs, this);
        if (!result) {
            return;
        }

        player.hand.remove(deck.cards);
        this.discardDeck.add(deck.cards);
        this.info.type = deck.info.type;
        
        seal.replyToSender(ctx, msg, `${playerName}打出了${deck.name}，还剩${player.hand.cards.length}张牌。下一位是${anotherName}`);
        this.nextTurn(ctx, msg);//进入下一轮
        return;
    }
}