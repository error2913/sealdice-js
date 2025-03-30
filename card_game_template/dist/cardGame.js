// ==UserScript==
// @name         牌类游戏模板
// @author       错误
// @version      1.0.0
// @description  待完善。依赖于错误:team:>=4.0.0
// @timestamp    1730448043
// 2024-11-01 16:00:43
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/xxx/dist/xxx.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/xxx/dist/xxx.js
// @depends 错误:team:>=4.0.0
// ==/UserScript==

(() => {
  // src/deck.ts
  var Deck = class _Deck {
    //方法
    constructor() {
      this.name = "";
      this.desc = "";
      this.cards = [];
      this.info = {
        type: ""
      };
      this.solve = (_, __, ___, ____) => {
        return true;
      };
    }
    static parse(data) {
      const deck = new _Deck();
      if (!data) {
        return deck;
      }
      try {
        if (deckMap.hasOwnProperty(data.name)) {
          const deck2 = deckMap[data.name].clone();
          for (const key in deck2.info) {
            deck2.info[key] = data.info[key];
          }
          return deck2;
        }
        deck.name = data.name;
        deck.desc = data.desc;
        deck.cards = data.cards;
        for (const key in deck.info) {
          deck.info[key] = data.info[key];
        }
      } catch (err) {
        console.error(`解析牌组失败:`, err);
        deck.name = "未知牌堆";
      }
      return deck;
    }
    //洗牌
    shuffle() {
      for (let i = this.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
    }
    //从指定位置开始抽n张牌
    draw(position = 0, n = 1) {
      return this.cards.splice(position, n);
    }
    //在指定位置插入卡牌
    add(cards, position = 0) {
      this.cards.splice(position, 0, ...cards);
    }
    //移除指定卡牌
    remove(cards) {
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
    clone() {
      const deck = new _Deck();
      deck.name = this.name;
      deck.desc = this.desc;
      deck.cards = this.cards.slice();
      deck.info = JSON.parse(JSON.stringify(this.info));
      if (typeof this.solve === "function") {
        deck.solve = this.solve.bind(deck);
      }
      return deck;
    }
  };
  var deckMap = {};
  function load() {
    const cards = ["A", "B", "C"];
    const deckMain = new Deck();
    deckMain.name = "主牌堆";
    deckMain.cards = cards;
    deckMap["主牌堆"] = deckMain;
    const deckDiscard = new Deck();
    deckDiscard.name = "弃牌堆";
    deckDiscard.cards = [];
    deckMap["弃牌堆"] = deckDiscard;
  }

  // src/player.ts
  var Player = class _Player {
    //暗牌
    constructor(id) {
      this.id = id;
      this.info = {};
      this.hand = new Deck();
      this.hand.name = "手牌";
      this.show = new Deck();
      this.show.name = "明牌";
      this.hide = new Deck();
      this.hide.name = "暗牌";
    }
    //获取并解析player对象的数据
    static parse(data) {
      let player;
      if (!data) {
        player = new _Player("QQ:114514");
        return player;
      }
      try {
        player = new _Player(data.id);
        for (const key in player.info) {
          player.info[key] = data.info[key];
        }
        player.hand = Deck.parse(data.hand);
        player.show = Deck.parse(data.show);
        player.hide = Deck.parse(data.hide);
      } catch (err) {
        console.error(`解析玩家失败:`, err);
        player = new _Player("QQ:114514");
      }
      return player;
    }
  };

  // src/utils.ts
  function getMsg(messageType, senderId, groupId = "") {
    let msg = seal.newMessage();
    if (messageType == "group") {
      msg.groupId = groupId;
      msg.guildId = "";
    }
    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
  }
  function getCtx(epId, msg) {
    const eps = seal.getEndPoints();
    for (let i = 0; i < eps.length; i++) {
      if (eps[i].userId === epId) {
        return seal.createTempCtx(eps[i], msg);
      }
    }
    return void 0;
  }
  function getName(ctx, id) {
    const mmsg = getMsg("group", id, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    return mctx.player.name;
  }
  function replyPrivate(ctx, s, id = "") {
    const mmsg = getMsg("private", id || ctx.player.userId, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    seal.replyToSender(mctx, mmsg, s);
  }

  // src/game.ts
  var cache = {};
  var Game = class _Game {
    //丢弃的卡牌
    constructor(id) {
      this.id = id;
      this.status = false;
      this.players = [];
      this.round = 0;
      this.turn = 0;
      this.info = {
        id: "",
        type: ""
      };
      this.mainDeck = deckMap["主牌堆"].clone();
      this.discardDeck = deckMap["弃牌堆"].clone();
    }
    static getData(ext, id) {
      if (!cache.hasOwnProperty(id)) {
        let data = {};
        try {
          data = JSON.parse(ext.storageGet(`game_${id}`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取game_${id}失败:`, error);
        }
        const game = this.parse(id, data);
        cache[id] = game;
      }
      return cache[id];
    }
    //保存数据
    static saveData(ext, id) {
      if (cache.hasOwnProperty(id)) {
        ext.storageSet(`game_${id}`, JSON.stringify(cache[id]));
      }
    }
    static parse(id, data) {
      const game = new _Game(id);
      if (!data) {
        return game;
      }
      try {
        game.status = data.status;
        game.players = data.players.map((player) => Player.parse(player));
        game.round = data.round;
        game.turn = data.turn;
        for (const key in game.info) {
          game.info[key] = data.info[key];
        }
        game.mainDeck = Deck.parse(data.mainDeck);
        game.discardDeck = Deck.parse(data.discardDeck);
      } catch (err) {
        console.error("解析游戏数据失败:", err);
      }
      return game;
    }
    check(ctx, msg) {
      const index = this.players.findIndex((player) => player.id == ctx.player.userId);
      if (index == -1) {
        seal.replyToSender(ctx, msg, "没有你的信息");
        return;
      }
      replyPrivate(ctx, `您的手牌为:
${this.players[index].hand.cards.join("\n")}`);
    }
    //游戏初始化
    start(ctx, msg) {
      if (this.status) {
        seal.replyToSender(ctx, msg, "游戏已开始");
        return;
      }
      const teamList = globalThis.teamManager.getTeamList(this.id);
      this.players = teamList[0].members.map((id) => new Player(id));
      if (this.players.length < 2 || this.players.length > 4) {
        seal.replyToSender(ctx, msg, `当前队伍成员数量${this.players.length}，玩家数量错误`);
        return;
      }
      this.status = true;
      this.mainDeck.shuffle();
      const n = Math.floor(this.mainDeck.cards.length / this.players.length);
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        const cards = this.mainDeck.draw(0, n);
        player.hand.add(cards);
        replyPrivate(ctx, `您的手牌为:
${player.hand.cards.join("\n")}`, player.id);
      }
      seal.replyToSender(ctx, msg, "游戏开始");
      this.nextRound(ctx, msg);
    }
    //结束游戏
    end(ctx, msg) {
      seal.replyToSender(ctx, msg, `游戏结束:回合数${this.round}`);
      cache[this.id] = new _Game(this.id);
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
        this.info.id = this.players[0].id;
      } else {
        const index = this.players.findIndex((player) => player.id === this.info.id);
        if (index == this.players.length - 1) {
          this.nextRound(ctx, msg);
          return;
        }
        this.info.id = this.players[index + 1].id;
      }
      this.turn++;
    }
    play(ctx, msg, cmdArgs) {
      const name = cmdArgs.getArgN(2);
      if (ctx.player.userId !== this.info.id) {
        seal.replyToSender(ctx, msg, "不是当前玩家");
        return;
      }
      if (!deckMap.hasOwnProperty(name)) {
        seal.replyToSender(ctx, msg, "未注册牌组");
        return;
      }
      const index = this.players.findIndex((player2) => player2.id === this.info.id);
      const player = this.players[index];
      const playerName = getName(ctx, this.info.id);
      const anotherIndex = index < this.players.length - 1 ? index + 1 : 0;
      const anotherPlayer = this.players[anotherIndex];
      const anotherName = getName(ctx, anotherPlayer.id);
      const deck = deckMap[name].clone();
      if (!player.hand.check(deck.cards)) {
        seal.replyToSender(ctx, msg, "手牌不足");
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
      this.nextTurn(ctx, msg);
      return;
    }
  };

  // src/index.ts
  function main() {
    let ext = seal.ext.find("cardGameTemplate");
    if (!ext) {
      ext = seal.ext.new("cardGameTemplate", "错误", "1.0.0");
      seal.ext.register(ext);
    }
    const cmdGame = seal.ext.newCmdItemInfo();
    cmdGame.name = "game";
    cmdGame.help = `帮助：TODO`;
    cmdGame.disabledInPrivate = true;
    cmdGame.solve = (ctx, msg, cmdArgs) => {
      if (Object.keys(deckMap).length === 0) {
        console.log("开始加载牌组");
        load();
      }
      const val = cmdArgs.getArgN(1);
      const id = ctx.group.groupId;
      switch (val) {
        case "start": {
          const game = Game.getData(ext, id);
          game.start(ctx, msg);
          Game.saveData(ext, id);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "end": {
          const game = Game.getData(ext, id);
          game.end(ctx, msg);
          Game.saveData(ext, id);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "check": {
          const game = Game.getData(ext, id);
          game.check(ctx, msg);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "play": {
          const game = Game.getData(ext, id);
          game.play(ctx, msg, cmdArgs);
          Game.saveData(ext, id);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "help":
        default: {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
      }
    };
    ext.cmdMap["game"] = cmdGame;
  }
  main();
})();
