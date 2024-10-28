// ==UserScript==
// @name         牌类游戏框架
// @author       错误
// @version      1.0.0
// @description  待完善。依赖于错误:team:>=3.1.1
// @timestamp    1729847396
// 2024-10-25 17:09:56
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @depends 错误:team:>=3.1.1
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('cardFramework');
if (!ext) {
    ext = seal.ext.new('cardFramework', '错误', '1.0.0');
    seal.ext.register(ext);
    const deckMap = {};
    const data = {}

    // 获取并解析game对象的数据
    function getData(id) {
        if (data[id]) {
            return data[id];
        }

        let savedData = {}
        try {
            savedData = JSON.parse(ext.storageGet(`game_${id}`) || '{}');
        } catch (error) {
            console.error(`从数据库中获取game_${id}失败:`, error);
        }

        //获取并解析player对象的数据
        function getPlayerData(player) {
            const newPlayer = new Player(player.id);

            newPlayer.data = player.data || {};
            newPlayer.hand = getDeckData(player.hand);
            newPlayer.show = getDeckData(player.show);
            newPlayer.hide = getDeckData(player.hide);

            return newPlayer
        }

        //获取并解析deck对象的数据
        function getDeckData(deck) {
            let newDeck;
            const name = deck.name || '未知牌堆';

            if (deckMap[name]) {
                newDeck = deckMap[name].clone();
            } else {
                newDeck = new Deck(name, deck.desc || '');
            }

            newDeck.data = deck.data || {};
            newDeck.type = deck.type || '';
            newDeck.cards = deck.cards || [];

            return newDeck;
        }

        const game = new Game(id);
        game.data = savedData.data || {};
        game.status = savedData.status || false;
        game.players = (savedData.players || []).map(player => getPlayerData(player));
        game.round = savedData.round || 0;
        game.turn = savedData.turn || 0;
        game.currentId = savedData.currentId || '';
        game.curDeckName = savedData.curDeckName || '';
        game.mainDeck = savedData.mainDeck ? getDeckData(savedData.mainDeck) : deckMap['主牌堆'].clone();
        game.discardDeck = savedData.discardDeck ? getDeckData(savedData.discardDeck) : deckMap['弃牌堆'].clone();

        data[id] = game;

        return data[id];
    }


    //保存数据
    function saveData(id) {
        if (data[id]) {
            ext.storageSet(`game_${id}`, JSON.stringify(data[id]));
        }
    }

    // 获取一个msg对象
    function getMsg(messageType, senderId, groupId = '', guildId = '') {
        let msg = seal.newMessage();
        if (messageType == 'group') {
            msg.groupId = groupId;
            msg.guildId = guildId;
        }

        msg.messageType = messageType;
        msg.sender.userId = senderId;
        return msg;
    }

    // 获取一个ctx对象
    function getCtx(epId, msg) {
        let eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                return seal.createTempCtx(eps[i], msg);
            }
        }
        return undefined;
    }

    // 获取玩家的名字
    function getName(ctx, msg, id) {
        const mmsg = getMsg('group', id, ctx.group.groupId, msg.guildId);
        const mctx = getCtx(ctx.endPoint.userId, mmsg);
        return mctx.player.name;
    }

    //回复私聊消息
    function replyPrivate(ctx, msg, text, id = '') {
        const mmsg = getMsg('private', id || ctx.player.userId, ctx.group.groupId, msg.guildId);
        const mctx = getCtx(ctx.endPoint.userId, mmsg);
        seal.replyToSender(mctx, mmsg, text);
    }

    class Deck {
        constructor(name, desc = '') {
            this.name = name;//名字
            this.desc = desc;//描述
            this.data = {};//数据
            this.type = '';//种类
            this.cards = [];//包含的卡牌
            this.solve = (ctx, msg, game, player) => { }//方法
        }

        //洗牌
        shuffle() {
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
        }

        //不放回地抽出牌
        draw(position = -1, num = 1) {
            const cards = [];

            for (let i = 0; i < num; i++) {
                if (position === -1) {
                    position = Math.floor(Math.random() * this.cards.length);
                }

                const card = this.cards.splice(position, 1)[0];
                cards.push(card);
            }

            return cards;
        }

        //加入卡牌
        add(cards, position = -1, count = 0) {
            if (position === -1) {
                position = Math.floor(Math.random() * (this.cards.length + 1));
            }

            return this.cards.splice(position, count, ...cards);
        }

        //移除指定卡牌
        remove(cards) {
            if (cards.length === 0 || this.cards.length === 0 || !this.check(cards)) {
                return;
            }

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const index = this.cards.indexOf(card);

                if (index !== -1) {
                    this.cards.splice(index, 1);
                }
            }
        }

        //检查是否包含指定卡牌
        check(cards) {
            let available = this.cards.slice();
            let isValid = true;

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const index = available.indexOf(card);

                if (index !== -1) {
                    available.splice(index, 1);
                } else {
                    isValid = false;
                    break;
                }
            }

            return isValid;
        }

        //复制这个牌组
        clone() {
            const deck = new Deck(this.name, this.desc); // 复制构造函数中的参数
            deck.data = JSON.parse(JSON.stringify(this.data)); // 深拷贝data对象
            deck.type = this.type;
            deck.cards = this.cards.slice(); // 复制cards数组，确保独立副本

            // 如果solve方法依赖于Deck实例的状态，确保正确复制或绑定
            if (typeof this.solve === 'function') {
                deck.solve = this.solve.bind(deck); // 绑定新实例到方法
            }

            return deck;
        }
    }

    class Game {
        constructor(id) {
            this.id = id//一般是群号
            this.data = {};//数据
            this.status = false;//游戏状态
            this.players = [];//玩家对象的数组
            this.round = 0;//回合数
            this.turn = 0;//一个回合内的轮次数
            this.currentId = '';//当前需要做出动作的玩家
            this.curDeckName = '';//当前场上的牌组
            this.mainDeck = deckMap['主牌堆'].clone();//包含所有卡牌的牌组
            this.discardDeck = deckMap['弃牌堆'].clone();//丢弃的卡牌
        }

        //游戏初始化
        start(ctx, msg) {
            if (this.status) {
                seal.replyToSender(ctx, msg, '游戏已开始');
                return;
            }

            //初始化玩家
            const team = globalThis.team.getBindData(this.id);
            this.players = team.members.map(id => new Player(id));

            if (this.players.length < 2 || this.players.length > 4) {
                seal.replyToSender(ctx, msg, '玩家数量错误');
                return;
            }

            this.status = true;

            //发牌等游戏开始前的逻辑

            seal.replyToSender(ctx, msg, '游戏开始');
            this.nextRound(ctx, msg);//开始第一回合
        }

        //结束游戏
        end(ctx, msg) {
            seal.replyToSender(ctx, msg, '游戏结束');

            this.status = false;
            this.players = [];
            this.round = 0;
            this.turn = 0;
            this.currentId = '';
            this.curDeckName = '';
            this.mainDeck = deckMap['主牌堆'].clone();
            this.discardDeck = deckMap['弃牌堆'].clone();
        }

        //进入下一回合
        nextRound(ctx, msg) {
            this.turn = 0;
            this.round++;
            this.nextTurn(ctx, msg);
        }

        //进入下一轮
        nextTurn(ctx, msg) {
            if (this.turn == 0) {
                this.currentId = this.players[0].id;
            } else {
                const index = this.players.findIndex(player => player.id === this.currentId);
                if (index == this.players.length - 1) {
                    this.nextRound(ctx, msg);
                    return;
                }

                this.currentId = this.players[index + 1].id;
            }

            this.turn++;
        }

        //打出某张牌的方法
        play(ctx, msg, name) {
            if (ctx.player.userId !== this.currentId) {
                seal.replyToSender(ctx, msg, '不是当前玩家');
                return;
            }

            if (!deckMap[name]) {
                seal.replyToSender(ctx, msg, '未注册牌组');
                return;
            }

            const index = this.players.findIndex(player => player.id === this.currentId);
            const player = this.players[index];
            const deck = deckMap[name].clone();
            if (!player.hand.check(deck.cards)) {
                seal.replyToSender(ctx, msg, '手牌不足');
                return;
            }

            player.hand.remove(deck.cards);
            this.discardDeck.add(deck.cards);
            this.curDeckName = deck.name;

            deck.solve(ctx, msg, this, player);
            this.nextTurn(ctx, msg);//进入下一轮
            return;
        }
    }

    class Player {
        constructor(id) {
            this.id = id;//一般是QQ号
            this.data = {}//数据
            this.hand = new Deck('手牌');//当前的手牌
            this.show = new Deck('明牌');//展示给别人看的牌
            this.hide = new Deck('暗牌');//自己也不能看的牌
        }
    }

    //注册主牌堆
    const deckMain = new Deck('主牌堆');
    deckMain.type = 'public';
    deckMain.cards = [];
    deckMain.solve = (ctx, msg, game, player) => { }
    deckMap['主牌堆'] = deckMain;

    //注册弃牌堆
    const deckDiscard = new Deck('弃牌堆');
    deckDiscard.type = 'public';
    deckDiscard.cards = [];
    deckDiscard.solve = (ctx, msg, game, player) => { }
    deckMap['弃牌堆'] = deckDiscard;

    //注册指令
    const cmdPlay = seal.ext.newCmdItemInfo();
    cmdPlay.name = 'play'; // 指令名字，可用中文
    cmdPlay.help = `帮助：`;
    cmdPlay.disabledInPrivate = true;// 不允许私聊
    cmdPlay.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        const id = ctx.group.groupId;
        switch (val) {
            case 'start': {
                const game = getData(id);
                game.start(ctx, msg);
                saveData(id);
                return;
            }
            case 'end': {
                const game = getData(id);
                game.end(ctx, msg);
                saveData(id);
                return;
            }
            case 'play': {
                const game = getData(id);
                const name = cmdArgs.getRestArgsFrom(2);
                game.play(ctx, msg, name)
                saveData(id)
                return;
            }
            case 'help':
            default: {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
        }
    };
    ext.cmdMap['play'] = cmdPlay;

    /* 示例模板：
    const deck = new Deck('');
    deck.type = '';
    deck.cards = [];
    deck.solve = (ctx, msg, game, player) => {

    }
    deckMap[''] = deck;

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = ''; // 指令名字，可用中文
    cmd.help = ``;
    cmd.solve = (ctx, msg, cmdArgs) => {
        let val = cmdArgs.getArgN(1);
        switch (val) {
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            default: {
                
                return seal.ext.newCmdExecuteResult(true);
            }
        }
    };
    ext.cmdMap[''] = cmd;
    */

}