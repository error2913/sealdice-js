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
                newDeck = deckMap[name];
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
        game.order = (savedData.order || []).map(player => getPlayerData(player));
        game.round = savedData.round || 0;
        game.turn = savedData.turn || 0;
        game.currentPlayer = savedData.currentPlayer ? getPlayerData(savedData.currentPlayer) : null;
        game.currentDeck = savedData.currentDeck ? getDeckData(savedData.currentDeck) : null;
        game.mainDeck = savedData.mainDeck ? getDeckData(savedData.mainDeck) : deckMap['主牌堆'];
        game.discardDeck = savedData.discardDeck ? getDeckData(savedData.discardDeck) : deckMap['弃牌堆'];

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

    function replyPrivate(ctx, msg, text) {
        const mmsg = getMsg('private', ctx.player.userId, ctx.group.groupId, msg.guildId);
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

            return this.cards.splice(position, count, cards);
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
    }

    class Game {
        constructor(id) {
            this.id = id
            this.data = {};
            this.status = false;
            this.players = [];
            this.order = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayer = null;
            this.currentDeck = null;
            this.mainDeck = deckMap['主牌堆'];
            this.discardDeck = deckMap['弃牌堆'];
        }

        start() {
            this.end();
            this.status = true;
            const team = globalThis.team.getBindData(this.id);
            this.players = team.members.map(id => new Player(id));

            //发牌等逻辑

            this.startRound();
        }

        end() {
            this.status = false;
            this.players = [];
            this.order = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayer = null;
            this.currentDeck = null;
            this.mainDeck = deckMap['主牌堆'];
            this.discardDeck = deckMap['弃牌堆'];
        }

        startRound() {
            this.round++;
            this.order = this.players.slice();
            this.startTurn();
        }

        endRound() {
            this.order = [];
            this.turn = 0;
            this.currentPlayer = null;
            this.startRound();
        }

        startTurn() {
            if (this.order.length === 0) {
                this.endRound();
            }

            this.turn++;
            this.currentPlayer = this.order.splice(0, 1);
        }

        endTurn() {
            this.startTurn();
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

            const deck = deckMap[name];
            if (!this.currentPlayer.hand.check(deck.cards)) {
                seal.replyToSender(ctx, msg, '手牌不足');
                return;
            }
            
            this.currentDeck = deck;
            deck.solve(ctx, msg, this, this.currentPlayer);
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
                game.start();
                seal.replyToSender(ctx, msg, '游戏开始');
                saveData(id);
                return;
            }
            case 'end': {
                const game = getData(id);
                game.end();
                seal.replyToSender(ctx, msg, '游戏结束');
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