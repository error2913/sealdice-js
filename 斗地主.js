// ==UserScript==
// @name         斗地主
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
        game.currentPlayerId = savedData.currentPlayerId || '';
        game.currentDeckName = savedData.currentDeckName || '';
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

        //按照rank排序
        sort() {
            const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];

            // 使用 sort 方法和比较函数进行排序
            this.cards.sort((a, b) => {
                const indexA = ranks.indexOf(a);
                const indexB = ranks.indexOf(b);
                return indexA - indexB;
            });
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
            this.currentPlayerId = '';//当前需要做出动作的玩家
            this.currentDeckName = '';//当前场上的牌组，进入弃牌堆的缓冲区
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

            if (this.players.length !== 3) {
                seal.replyToSender(ctx, msg, '玩家数量错误');
                return;
            }

            this.status = true;

            //发牌等逻辑
            this.data.landlordId = '';
            this.mainDeck.shuffle();
            for (let i = 0; i < this.players.length; i++) {
                const cards = this.mainDeck.cards.splice(0, 17);
                const player = this.players[i];
                player.hand.add(cards);
                player.hand.sort();

                replyPrivate(ctx, msg, player.hand.cards.join('\n'), player.id);
            }

            const name = getName(ctx, msg, this.players[0].id)
            seal.replyToSender(ctx, msg, `游戏开始，从${name}开始叫地主`);
            this.nextRound(ctx, msg);
        }

        //结束游戏
        end(ctx, msg) {
            seal.replyToSender(ctx, msg, '游戏结束');

            this.status = false;
            this.players = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayerId = '';
            this.currentDeckName = '';
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

        //打出某张牌的方法
        play(ctx, msg, name) {
            if (ctx.player.userId !== this.currentPlayerId) {
                seal.replyToSender(ctx, msg, '不是当前玩家');
                return;
            }

            if (!deckMap[name]) {
                seal.replyToSender(ctx, msg, '未注册牌组');
                return;
            }

            const index = this.players.findIndex(player => player.id === this.currentPlayerId);
            const player = this.players[index];
            const deck = deckMap[name].clone();
            if (!player.hand.check(deck.cards)) {
                seal.replyToSender(ctx, msg, '手牌不足');
                return;
            }

            player.hand.remove(deck.cards);
            this.discardDeck.add(deck.cards);
            this.currentDeckName = deck.name;

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

    //              0    1    2    3    4    5    6    7     8    9   10    11   12    13     14
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];

    function getC(n, selected = [], index = 0) {
        const result = [];
        if (selected.length === n) {
            result.push([...selected]);
        } else {
            for (let i = index; i < ranks.length; i++) {
                selected.push(ranks[i]);
                result.push(...getC(n, selected, i));
                selected.pop();
            }
        }
        return result;
    }

    const cMap = {
        2: getC(2),
        3: getC(3),
        4: getC(4),
        5: getC(5)
    }

    const deckBomb = new Deck(`王炸`);
    deckBomb.type = 'bomb';
    deckBomb.cards = ['大王', '小王'];
    deckBomb.solve = (ctx, msg, game, player) => { }
    deckBomb.data = {
        value: 13
    }
    deckMap[`王炸`] = deckBomb;

    for (let value = 0; value < ranks.length; value++) {
        const card = ranks[value];

        const deck = new Deck(card);
        deck.type = 'single';
        deck.cards = [card];
        deck.solve = (ctx, msg, game, player) => { }
        deck.data = {
            value: value
        }
        deckMap[card] = deck;
        deckMap[`单${card}`] = deck;

        if (value > 12) {
            continue;
        }

        const deckPair = new Deck(`${card}${card}`);
        deckPair.type = 'pair';
        deckPair.cards = [card, card];
        deckPair.solve = (ctx, msg, game, player) => { }
        deckPair.data = {
            value: value
        }
        deckMap[`${card}${card}`] = deckPair;
        deckMap[`对${card}`] = deckPair;

        const deckTriple = new Deck(`${card}${card}${card}`);
        deckTriple.type = 'triple';
        deckTriple.cards = [card, card, card];
        deckTriple.solve = (ctx, msg, game, player) => { }
        deckTriple.data = {
            value: value
        }
        deckMap[`${card}${card}${card}`] = deckTriple;
        deckMap[`三个${card}`] = deckTriple;
        deckMap[`三${card}`] = deckTriple;

        for (let i = 0; i < ranks.length; i++) {
            if (ranks[i] == card) {
                continue;
            }

            const card2 = ranks[i];

            const cards1 = [card, card, card, card2];
            const deck1 = new Deck(cards1.join(''));
            deck1.type = 'triple1';
            deck1.cards = cards1;
            deck1.solve = (ctx, msg, game, player) => { }
            deck1.data = {
                value: value
            }
            deckMap[cards1.join('')] = deck1;
            deckMap[`三${card}带${card2}`] = deck1;

            if (i > 12) {
                continue;
            }

            const cards2 = [card, card, card, card2, card2];
            const deck2 = new Deck(cards2.join(''));
            deck2.type = 'triple2';
            deck2.cards = cards2;
            deck2.solve = (ctx, msg, game, player) => { }
            deck2.data = {
                value: value
            }
            deckMap[cards2.join('')] = deck2;
            deckMap[`三${card}带对${card2}`] = deck2;
        }

        const deckBomb = new Deck(`${card}${card}${card}${card}`);
        deckBomb.type = 'bomb';
        deckBomb.cards = [card, card, card, card];
        deckBomb.solve = (ctx, msg, game, player) => { }
        deckBomb.data = {
            value: value
        }
        deckMap[`${card}${card}${card}${card}`] = deckBomb;
        deckMap[`${card}炸`] = deckBomb;
        deckMap[`四${card}`] = deckBomb;

        const c = cMap[2];
        for (let i = 0; i < c.length; i++) {
            if (
                c[i].includes(card) ||
                (c[i][0] == '大王' && c[i][1] == '大王') ||
                (c[i][0] == '小王' && c[i][1] == '小王')
            ) {
                continue;
            }

            const cards = c[i];

            const cards1 = [card, card, card, card, ...cards]
            const deck1 = new Deck(cards1.join(''));
            deck1.type = 'bomb1';
            deck1.cards = cards1;
            deck1.solve = (ctx, msg, game, player) => { }
            deck1.data = {
                value: value
            }
            deckMap[cards1.join('')] = deck1;
            deckMap[`四${card}带${cards.join('')}`] = deck1;

            if (cards.includes('大王') || cards.includes('小王')) {
                continue;
            }

            const cardsPair = cards.flatMap(card => [card, card])

            const cards2 = [card, card, card, card, ...cardsPair]
            const deck2 = new Deck(cards2.join(''));
            deck2.type = 'bomb2';
            deck2.cards = cards2;
            deck2.solve = (ctx, msg, game, player) => { }
            deck2.data = {
                value: value
            }
            deckMap[cards2.join('')] = deck2;
            deckMap[`四${card}带对${cards[0]}对${cards[1]}`] = deck2;
        }

        for (let i = 5; i < 13; i++) {
            if (value < 13 - i) {
                const cards = [];
                for (let j = 0; j < i; j++) {
                    cards.push(ranks[value + j]);
                }

                const deck = new Deck(cards.join(''));
                deck.type = 'straight' + i;;
                deck.cards = cards;
                deck.solve = (ctx, msg, game, player) => { }
                deck.data = {
                    value: value,
                    length: i
                }
                deckMap[cards.join('')] = deck;
                deckMap[`顺${cards.join('')}`] = deck;
            }
        }

        for (let i = 3; i < 11; i++) {
            if (value < 13 - i) {
                const cards = [];
                for (let j = 0; j < i; j++) {
                    cards.push(ranks[value + j], ranks[value + j]);
                }

                const deck = new Deck(cards.join(''));
                deck.type = 'pairs' + i;
                deck.cards = cards;
                deck.solve = (ctx, msg, game, player) => { }
                deck.data = {
                    value: value,
                    length: i
                }
                deckMap[cards.join('')] = deck;
                deckMap[`连对${cards.join('')}`] = deck;
            }
        }

        for (let i = 2; i < 6; i++) {
            if (value < 13 - i) {
                const cardsPlane = [];
                for (let j = 0; j < i; j++) {
                    cardsPlane.push(ranks[value + j], ranks[value + j], ranks[value + j]);
                }

                const deck = new Deck(cardsPlane.join(''));
                deck.type = 'plane' + i;
                deck.cards = cardsPlane;
                deck.solve = (ctx, msg, game, player) => { }
                deck.data = {
                    value: value
                }
                deckMap[cardsPlane.join('')] = deck;
                deckMap[`飞机${cardsPlane.join('')}`] = deck;

                const c = cMap[i];
                for (let j = 0; j < c.length; j++) {
                    if (
                        c[j].filter(item => item === card).length > 1 ||
                        c[j].filter(item => item === '大王').length > 1 ||
                        c[j].filter(item => item === '小王').length > 1
                    ) {
                        continue;
                    }

                    const cards = c[j];

                    const cards1 = [...cardsPlane, ...cards]
                    const deck1 = new Deck(cards1.join(''));
                    deck1.type = 'plane' + i + '1';
                    deck1.cards = cards1;
                    deck1.solve = (ctx, msg, game, player) => { }
                    deck1.data = {
                        value: value
                    }
                    deckMap[cards1.join('')] = deck1;

                    if (i > 4 || cards.includes('大王') || cards.includes('小王')) {
                        continue;
                    }

                    const cardsPair = cards.flatMap(card => [card, card])

                    const cards2 = [...cardsPlane, ...cardsPair]
                    const deck2 = new Deck(cards2.join(''));
                    deck2.type = 'plane' + i + '2';
                    deck2.cards = cards2;
                    deck2.solve = (ctx, msg, game, player) => { }
                    deck2.data = {
                        value: value
                    }
                    deckMap[cards2.join('')] = deck2;
                }
            }
        }
    }

    const cards = [
        '大王', '小王',
        '2', '2', '2', '2',
        'A', 'A', 'A', 'A',
        'K', 'K', 'K', 'K',
        'Q', 'Q', 'Q', 'Q',
        'J', 'J', 'J', 'J',
        '10', '10', '10', '10',
        '9', '9', '9', '9',
        '8', '8', '8', '8',
        '7', '7', '7', '7',
        '6', '6', '6', '6',
        '5', '5', '5', '5',
        '4', '4', '4', '4',
        '3', '3', '3', '3'
    ]

    //注册主牌堆
    const deckMain = new Deck('主牌堆');
    deckMain.type = 'public';
    deckMain.cards = cards;
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
    cmdPlay.name = 'ddz'; // 指令名字，可用中文
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
            case 'test': {
                const name = cmdArgs.getRestArgsFrom(2);
                if (deckMap[name]) {
                    seal.replyToSender(ctx, msg, '存在' + deckMap[name].type);
                    return;
                } else {
                    seal.replyToSender(ctx, msg, '不存在');
                    return;
                }
            }
            case 'help':
            default: {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
        }
    };
    ext.cmdMap['ddz'] = cmdPlay;

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