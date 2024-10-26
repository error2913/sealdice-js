// ==UserScript==
// @name         牌类游戏框架
// @author       错误
// @version      1.0.0
// @description  待完善
// @timestamp    1729847396
// 2024-10-25 17:09:56
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// @depends 错误:team:>=3.1.1
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('cardFramework');
if (!ext) {
    ext = seal.ext.new('cardFramework', '错误', '1.0.0');
    seal.ext.register(ext);
    const deckMap = {};
    const data = {}

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

        function getPlayerData(player) {
            const newPlayer = new Player(player.id);

            newPlayer.data = player.data || {};
            newPlayer.hand = getDeckData(player.hand);
            newPlayer.show = getDeckData(player.show);
            newPlayer.hide = getDeckData(player.hide);

            return newPlayer
        }

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
        game.currentPlayer = savedData.currentPlayer ? getPlayerData(savedData.currentPlayer) : null;
        game.currentDeck = savedData.currentDeck ? getDeckData(savedData.currentDeck) : null;
        game.mainDeck = savedData.mainDeck ? getDeckData(savedData.mainDeck) : deckMap['主牌堆'].clone();
        game.discardDeck = savedData.discardDeck ? getDeckData(savedData.discardDeck) : deckMap['弃牌堆'].clone();

        data[id] = game;

        return data[id];
    }

    function saveData(id) {
        if (data[id]) {
            ext.storageSet(`game_${id}`, JSON.stringify(data[id]));
        }
    }

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

    function getCtx(epId, msg) {
        let eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                return seal.createTempCtx(eps[i], msg);
            }
        }
        return undefined;
    }

    function getName(ctx, msg, id) {
        const mctx = getCtx(ctx.endPoint.userId, msg);
        return mctx.player.name;
    }

    function replyPrivate(ctx, msg, text, id = '') {
        const mmsg = getMsg('private', id || ctx.player.userId, ctx.group.groupId, msg.guildId);
        const mctx = getCtx(ctx.endPoint.userId, mmsg);
        seal.replyToSender(mctx, mmsg, text);
    }

    class Deck {
        constructor(name, desc = '') {
            this.name = name;
            this.desc = desc;
            this.data = {};
            this.type = '';
            this.cards = [];
            this.solve = (ctx, msg, game, player) => { }
        }

        shuffle() {
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
        }

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

        add(cards, position = -1, count = 0) {
            if (position === -1) {
                position = Math.floor(Math.random() * (this.cards.length + 1));
            }

            return this.cards.splice(position, count, ...cards);
        }

        remove(cards) {
            if (cards.length === 0 || this.cards.length === 0 || !this.check(cards)) {
                return;
            }

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const index = this.cards.indexOf(card);

                if (index!== -1) {
                    this.cards.splice(index, 1);
                }
            }
        }

        check(cards) {
            let available = this.cards.slice();
            let isValid = true;

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const index = available.indexOf(card);

                if (index!== -1) {
                    available.splice(index, 1);
                } else {
                    isValid = false;
                    break;
                }
            }

            return isValid;
        }

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
            this.id = id
            this.data = {};
            this.status = false;
            this.players = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayer = null;
            this.currentDeck = null;
            this.mainDeck = deckMap['主牌堆'].clone();
            this.discardDeck = deckMap['弃牌堆'].clone();
        }

        start(ctx, msg) {
            if (this.status) {
                seal.replyToSender(ctx, msg, '游戏已开始');
                return;
            }

            const team = globalThis.team.getBindData(this.id);
            this.players = team.members.map(id => new Player(id));

            if (this.players.length < 2 || this.players.length > 4) {
                seal.replyToSender(ctx, msg, '玩家数量错误');
                return;
            }

            this.status = true;

            //发牌等逻辑

            seal.replyToSender(ctx, msg, '游戏开始');
            this.nextRound(ctx, msg);
        }

        end(ctx, msg) {
            seal.replyToSender(ctx, msg, '游戏结束');
            
            this.status = false;
            this.players = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayer = null;
            this.currentDeck = null;
            this.mainDeck = deckMap['主牌堆'].clone();
            this.discardDeck = deckMap['弃牌堆'].clone();
        }

        nextRound(ctx, msg) {
            this.turn = 0;
            this.round++;
            this.nextTurn(ctx, msg);
        }

        nextTurn(ctx, msg) {
            if (this.turn == 0) {
                this.currentPlayer = this.players[0];
            } else {
                const index = this.players.findIndex(player => player.id === this.currentPlayer.id);
                if (index == this.players.length - 1) {
                    this.nextRound(ctx, msg);
                    return;
                }

                this.currentPlayer = this.players[index + 1];
            }
            
            this.turn++;
        }

        play(ctx, msg, name) {
            if (ctx.player.uerId !== this.currentPlayer.id) {
                seal.replyToSender(ctx, msg, '不是当前玩家');
                return;
            }

            if (!deckMap[name]) {
                seal.replyToSender(ctx, msg, '未注册牌组');
                return;
            }

            const deck = deckMap[name].clone();
            if (!this.currentPlayer.hand.check(deck.cards)) {
                seal.replyToSender(ctx, msg, '手牌不足');
                return;
            }

            this.currentPlayer.hand.remove(deck.cards);
            this.discardDeck.add(this.currentDeck.cards);
            this.currentDeck = deck;
            deck.solve(ctx, msg, this, this.currentPlayer);
            this.nextTurn(ctx, msg);
        }
    }

    class Player {
        constructor(id) {
            this.id = id;
            this.data = {}
            this.hand = new Deck('手牌');
            this.show = new Deck('明牌');
            this.hide = new Deck('暗牌');
        }
    }

    const deckMain = new Deck('主牌堆');
    deckMain.type = 'public';
    deckMain.cards = [];
    deckMain.solve = (ctx, msg, game, player) => {

    }
    deckMap['主牌堆'] = deckMain;

    const deckDiscard = new Deck('弃牌堆');
    deckDiscard.type = 'public';
    deckDiscard.cards = [];
    deckDiscard.solve = (ctx, msg, game, player) => {

    }
    deckMap['弃牌堆'] = deckDiscard;

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