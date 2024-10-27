// ==UserScript==
// @name         抽乌龟
// @author       错误
// @version      1.0.0
// @description  指令.turtle/tl
// @timestamp    1729847396
// 2024-10-25 17:09:56
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// @depends 错误:team:>=3.1.1
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('turtle');
if (!ext) {
    ext = seal.ext.new('turtle', '错误', '1.0.0');
    seal.ext.register(ext);
    const deckMap = {};
    const data = {}

    function getPairs(cards) {
        const countMap = {}
        const pairs = [];

        // 计算每个值的出现次数
        for (const card of cards) {
            const value = deckMap[card].data.value;
            if (!countMap[value]) {
                countMap[value] = [];
            }

            countMap[value].push(card);
        }

        // 找出所有成对的卡片
        for (const value in countMap) {
            while (countMap[value].length >= 2) {
                pairs.push(countMap[value].splice(0, 2));
            }
        }

        return pairs;
    }

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
        game.currentPlayerId = savedData.currentPlayerId || '';
        game.currentDeckName = savedData.currentDeckName || '';
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
        const mmsg = getMsg('group', id, ctx.group.groupId, msg.guildId);
        const mctx = getCtx(ctx.endPoint.userId, mmsg);
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

                if (index !== -1) {
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

                if (index !== -1) {
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
            this.currentPlayerId = '';//当前需要做出动作的玩家
            this.currentDeckName = '';//当前场上的牌组，进入弃牌堆的缓冲区
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

            if (this.players.length < 2 || this.players.length > 6) {
                seal.replyToSender(ctx, msg, '玩家数量错误');
                return;
            }

            this.status = true;

            //发牌等逻辑
            this.mainDeck.shuffle();
            let num = Math.floor(this.mainDeck.cards.length / this.players.length);
            for (let i = 0; i < this.players.length; i++) {
                if (i == this.players.length - 1) {
                    num = this.mainDeck.cards.length
                }

                const cards = this.mainDeck.cards.splice(0, num);
                const player = this.players[i];
                player.hand.add(cards);
                const pairs = getPairs(cards);
                if (pairs.length !== 0) {
                    pairs.forEach(pair => {
                        player.hand.remove(pair);
                    });
                }
                replyPrivate(ctx, msg, player.hand.cards.join('\n'), player.id);
            }

            const name = getName(ctx, msg, this.players[0].id)
            seal.replyToSender(ctx, msg, `游戏开始，从${name}开始`);
            this.nextRound(ctx, msg);
        }

        end(ctx, msg) {
            seal.replyToSender(ctx, msg, `游戏结束:回合数${this.round}`);

            this.status = false;
            this.players = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayerId = '';
            this.currentDeckName = '';
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
                this.currentPlayerId = this.players[0].id;
            } else {
                const index = this.players.findIndex(player => player.id === this.currentPlayerId);
                if (index == this.players.length - 1) {
                    this.nextRound(ctx, msg);
                    return;
                }

                this.currentPlayerId = this.players[index + 1].id;
            }
            
            this.turn++;
        }

        play(ctx, msg, position = -1) {
            if (ctx.player.userId !== this.currentPlayerId) {
                seal.replyToSender(ctx, msg, '不是当前玩家');
                return;
            }

            const index = this.players.findIndex(player => player.id === this.currentPlayerId);
            const player = this.players[index];
            const name = getName(ctx, msg, player.id)

            let anotherIndex = index < this.players.length - 1 ? (index + 1) : 0;
            let anotherPlayer = this.players[anotherIndex];
            let anotherName = getName(ctx, msg, anotherPlayer.id);

            let text = `${name}(${player.hand.cards.length})抽了${anotherName}(${anotherPlayer.hand.cards.length})一张牌\n`
            const cards = anotherPlayer.hand.draw(position);
            const card1 = cards[0];
            replyPrivate(ctx, msg, `你抽到了${card1}`);
            replyPrivate(ctx, msg, `你被抽走了${card1}`, anotherPlayer.id);

            if (anotherPlayer.hand.cards.length === 0) {
                this.players.splice(anotherIndex, 1);

                text += `${anotherName}没有牌了，退出游戏\n`

                anotherIndex = anotherIndex < this.players.length - 1 ? (anotherIndex + 1) : 0;
                anotherPlayer = this.players[anotherIndex];
                anotherName = getName(ctx, msg, anotherPlayer.id);
            }

            const cardIndex = player.hand.cards.findIndex(item => deckMap[item].data.value === deckMap[card1].data.value);
            if (cardIndex === -1) {
                player.hand.add(cards);
                text += `什么都没发生\n`;
            } else {
                const card2 = player.hand.cards.splice(cardIndex, 1)[0];
                text += `${name}打出了${card1}、${card2}\n`

                if (player.hand.cards.length === 0) {
                    this.players.splice(index, 1);
                    text += `${name}没有牌了，退出游戏\n`
                }
            }

            if (this.players.length === 1) {
                const name = getName(ctx, msg, this.players[0].id)
                text += `没有玩家了！${name}是乌龟！`
                seal.replyToSender(ctx, msg, text);
                this.end(ctx, msg)
                return;
            }

            text += `下一位是${anotherName}`

            seal.replyToSender(ctx, msg, text);
            this.nextTurn(ctx, msg);
            return;
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


    const suits = ['♠', '♥', '♣', '♦'];
    const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

    suits.forEach(suit => {
        values.forEach(value => {
            const card = suit + value
            const deck = new Deck(card);
            deck.type = 'single';
            deck.cards = [card];
            deck.solve = (ctx, msg, game, player) => {}
            deck.data = {
                suit: suit,
                value: value
            }
            deckMap[card] = deck;
        })
    })

    const deckTurtle = new Deck('乌龟');
    deckTurtle.type = 'single';
    deckTurtle.cards = ['乌龟'];
    deckTurtle.solve = (ctx, msg, game, player) => {}
    deckTurtle.data = {
        suit: '乌龟',
        value: '乌龟'
    }
    deckMap['乌龟'] = deckTurtle;

    const cards = [
        '乌龟',
        '♠A', '♥A', '♣A', '♦A',
        '♠K', '♥K', '♣K', '♦K',
        '♠Q', '♥Q', '♣Q', '♦Q',
        '♠J', '♥J', '♣J', '♦J',
        '♠10', '♥10', '♣10', '♦10',
        '♠9', '♥9', '♣9', '♦9',
        '♠8', '♥8', '♣8', '♦8',
        '♠7', '♥7', '♣7', '♦7',
        '♠6', '♥6', '♣6', '♦6',
        '♠5', '♥5', '♣5', '♦5',
        '♠4', '♥4', '♣4', '♦4',
        '♠3', '♥3', '♣3', '♦3',
        '♠2', '♥2', '♣2', '♦2'
    ]

    const deckMain = new Deck('主牌堆');
    deckMain.type = 'public';
    deckMain.cards = cards;
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
    cmdPlay.name = 'turtle'; // 指令名字，可用中文
    cmdPlay.help = `帮助：指令.tl
start
end
play
check`;
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
            case 'check': {
                const game = getData(id);
                const index = game.players.findIndex(player => player.id == ctx.player.userId);
                if (index == -1) {
                    seal.replyToSender(ctx, msg, '没有你的信息');
                    return;
                }

                replyPrivate(ctx, msg, game.players[index].hand.cards.join('\n'));
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
    ext.cmdMap['turtle'] = cmdPlay;
    ext.cmdMap['tl'] = cmdPlay;

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