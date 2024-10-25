// ==UserScript==
// @name         牌类游戏框架
// @author       错误
// @version      1.0.0
// @description  待完善
// @timestamp    1729847396
// 2024-10-25 17:09:56
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('cardFramework');
if (!ext) {
    ext = seal.ext.new('cardFramework', '错误', '1.0.0');
    seal.ext.register(ext);
    const deckMap = {};

    class Deck {
        constructor(name, description = '') {
            this.name = name;
            this.description = description;
            this.data = {}
            this.cards = [];
            this.solve = (ctx, msg, game, player) => {}
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
    }

    class Game {
        constructor(id) {
            this.id = id
            this.players = [];
            this.order = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayer = null;
            this.mainDeck = deckMap['主牌堆'];
            this.discardDeck = deckMap['弃牌堆'];
        }

        start() {
            this.end();
            this.startRound();
        }

        end() {
            this.order = [];
            this.round = 0;
            this.turn = 0;
            this.currentPlayer = null;
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
                return;
            }

            if (deckMap[name]) {
                const deck = deckMap[name]
                deck.solve(ctx, msg, this, this.currentPlayer)
            }
        }
    }

    class Player {
        constructor(id) {
            this.id = id;
            this.data = {}
            this.hand = new Deck('手牌');
            this.show = new Deck('明牌');
        }
    }

    const deckMain = new Deck('主牌堆')
    deckMain.cards = []
    deckMain.solve = (ctx, msg, game, player) => {

    }
    deckMap['主牌堆'] = deckMain;

    const deckDiscard = new Deck('弃牌堆')
    deckDiscard.cards = []
    deckDiscard.solve = (ctx, msg, game, player) => {

    }
    deckMap['弃牌堆'] = deckDiscard;

    /* 示例：
    const deck = new Deck('')
    deck.cards = []
    deck.solve = (ctx, msg, game, player) => {

    }
    deckMap[''] = deck;

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = ''; // 指令名字，可用中文
    cmd.help = '';
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