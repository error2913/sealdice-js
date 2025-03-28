// ==UserScript==
// @name         UNO
// @author       错误
// @version      1.0.0
// @description  使用.uno获取帮助。依赖于错误:team:>=4.0.0
// @timestamp    1730448043
// 2024-11-01 16:00:43
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/release/UNO.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/release/UNO.js
// @depends 错误:team:>=4.0.0
// ==/UserScript==

(() => {
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

  // src/deck.ts
  var Deck = class _Deck {
    //方法
    constructor() {
      this.name = "";
      this.desc = "";
      this.cards = [];
      this.info = {
        type: "",
        color: ""
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
    const colors = ["红", "黄", "蓝", "绿"];
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      for (let j = 0; j < 10; j++) {
        const card = color + j;
        const deck = new Deck();
        deck.name = card;
        deck.cards = [card];
        deck.info = {
          type: j.toString(),
          color
        };
        deckMap[card] = deck;
      }
      const cardSkip = color + "禁止";
      const deckSkip = new Deck();
      deckSkip.name = cardSkip;
      deckSkip.cards = [cardSkip];
      deckSkip.info = {
        type: "禁止",
        color
      };
      deckSkip.solve = (ctx, msg, ___, game) => {
        const index = game.players.findIndex((player) => player.id === game.info.id);
        const anotherIndex = index < game.players.length - 1 ? index + 1 : 0;
        const anotherPlayer = game.players[anotherIndex];
        const anotherName = getName(ctx, anotherPlayer.id);
        game.info.id = anotherPlayer.id;
        const firstPlayer = game.players.splice(0, 1)[0];
        game.players.push(firstPlayer);
        seal.replyToSender(ctx, msg, `${anotherName}被禁止出牌`);
        return true;
      };
      deckMap[cardSkip] = deckSkip;
      const cardReverse = color + "反转";
      const deckReverse = new Deck();
      deckReverse.name = cardReverse;
      deckReverse.cards = [cardReverse];
      deckReverse.info = {
        type: "反转",
        color
      };
      deckReverse.solve = (_, __, ___, game) => {
        const index = game.players.findIndex((player) => player.id === game.info.id);
        const players1 = game.players.splice(0, index);
        game.players.push(...players1);
        game.players.reverse();
        const players2 = game.players.splice(0, game.players.length - index - 1);
        game.players.push(...players2);
        return true;
      };
      deckMap[cardReverse] = deckReverse;
      const cardTwo = color + "加二";
      const deckTwo = new Deck();
      deckTwo.name = cardTwo;
      deckTwo.cards = [cardTwo];
      deckTwo.info = {
        type: "加二",
        color
      };
      deckTwo.solve = (ctx, msg, ___, game) => {
        const index = game.players.findIndex((player) => player.id === game.info.id);
        const anotherIndex = index < game.players.length - 1 ? index + 1 : 0;
        const anotherPlayer = game.players[anotherIndex];
        const anotherName = getName(ctx, anotherPlayer.id);
        if (game.mainDeck.cards.length < 2) {
          const cards3 = game.discardDeck.cards;
          game.discardDeck.cards = [];
          game.mainDeck.add(cards3);
          game.mainDeck.shuffle();
        }
        const cards2 = game.mainDeck.draw(0, 2);
        anotherPlayer.hand.add(cards2);
        seal.replyToSender(ctx, msg, `${anotherName}摸两张牌并跳过`);
        replyPrivate(ctx, `您摸到了${cards2.join(",")}
您的手牌为:
${anotherPlayer.hand.cards.join("\n")}`, anotherPlayer.id);
        game.info.id = anotherPlayer.id;
        const firstPlayer = game.players.splice(0, 1)[0];
        game.players.push(firstPlayer);
        return true;
      };
      deckMap[cardTwo] = deckTwo;
    }
    const deckWild = new Deck();
    deckWild.name = "万能";
    deckWild.cards = ["万能"];
    deckWild.info = {
      type: "万能",
      color: "wild"
    };
    deckWild.solve = (ctx, msg, cmdArgs, game) => {
      const color = cmdArgs.getArgN(2);
      if (color !== "红" && color !== "黄" && color !== "蓝" && color !== "绿") {
        seal.replyToSender(ctx, msg, `颜色${color}不存在或未指定，使用【.uno <牌名> (指定颜色)】`);
        return false;
      }
      game.info.color = color;
      return true;
    };
    deckMap["万能"] = deckWild;
    const deckFour = new Deck();
    deckFour.name = "加四";
    deckFour.cards = ["加四"];
    deckFour.info = {
      type: "加四",
      color: "wild"
    };
    deckFour.solve = (ctx, msg, cmdArgs, game) => {
      const index = game.players.findIndex((player2) => player2.id === game.info.id);
      const player = game.players[index];
      const handCards = player.hand.cards;
      for (let i = 0; i < handCards.length; i++) {
        const card = handCards[i];
        const deck = deckMap[card];
        if (deck.info.type == "万能" || deck.info.type == game.info.type || deck.info.color == game.info.color) {
          seal.replyToSender(ctx, msg, `你现在不能使用加四牌，你还有能出的牌`);
          return false;
        }
      }
      const color = cmdArgs.getArgN(2);
      if (color !== "红" && color !== "黄" && color !== "蓝" && color !== "绿") {
        seal.replyToSender(ctx, msg, `颜色${color}不存在或未指定，使用【.uno <牌名> (指定颜色)】`);
        return false;
      }
      game.info.color = color;
      const anotherIndex = index < game.players.length - 1 ? index + 1 : 0;
      const anotherPlayer = game.players[anotherIndex];
      const anotherName = getName(ctx, anotherPlayer.id);
      if (game.mainDeck.cards.length < 4) {
        const cards3 = game.discardDeck.cards;
        game.discardDeck.cards = [];
        game.mainDeck.add(cards3);
        game.mainDeck.shuffle();
      }
      const cards2 = game.mainDeck.draw(0, 4);
      anotherPlayer.hand.add(cards2);
      seal.replyToSender(ctx, msg, `${anotherName}摸四张牌并跳过`);
      replyPrivate(ctx, `您摸到了${cards2.join(",")}
您的手牌为:
${anotherPlayer.hand.cards.join("\n")}`, anotherPlayer.id);
      game.info.id = anotherPlayer.id;
      const firstPlayer = game.players.splice(0, 1)[0];
      game.players.push(firstPlayer);
      return true;
    };
    deckMap["加四"] = deckFour;
    const cards = [
      "红0",
      "黄0",
      "蓝0",
      "绿0",
      "红1",
      "黄1",
      "蓝1",
      "绿1",
      "红1",
      "黄1",
      "蓝1",
      "绿1",
      "红2",
      "黄2",
      "蓝2",
      "绿2",
      "红2",
      "黄2",
      "蓝2",
      "绿2",
      "红3",
      "黄3",
      "蓝3",
      "绿3",
      "红3",
      "黄3",
      "蓝3",
      "绿3",
      "红4",
      "黄4",
      "蓝4",
      "绿4",
      "红4",
      "黄4",
      "蓝4",
      "绿4",
      "红5",
      "黄5",
      "蓝5",
      "绿5",
      "红5",
      "黄5",
      "蓝5",
      "绿5",
      "红6",
      "黄6",
      "蓝6",
      "绿6",
      "红6",
      "黄6",
      "蓝6",
      "绿6",
      "红7",
      "黄7",
      "蓝7",
      "绿7",
      "红7",
      "黄7",
      "蓝7",
      "绿7",
      "红8",
      "黄8",
      "蓝8",
      "绿8",
      "红8",
      "黄8",
      "蓝8",
      "绿8",
      "红9",
      "黄9",
      "蓝9",
      "绿9",
      "红9",
      "黄9",
      "蓝9",
      "绿9",
      "红禁止",
      "黄禁止",
      "蓝禁止",
      "绿禁止",
      "红禁止",
      "黄禁止",
      "蓝禁止",
      "绿禁止",
      "红反转",
      "黄反转",
      "蓝反转",
      "绿反转",
      "红反转",
      "黄反转",
      "蓝反转",
      "绿反转",
      "红加二",
      "黄加二",
      "蓝加二",
      "绿加二",
      "红加二",
      "黄加二",
      "蓝加二",
      "绿加二",
      "万能",
      "万能",
      "万能",
      "万能",
      "加四",
      "加四",
      "加四",
      "加四"
    ];
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
        type: "",
        color: "",
        draw: false
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
      if (this.players.length < 2 || this.players.length > 10) {
        seal.replyToSender(ctx, msg, `当前队伍成员数量${this.players.length}，玩家数量错误`);
        return;
      }
      this.status = true;
      this.mainDeck.shuffle();
      const n = 7;
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        const cards = this.mainDeck.draw(0, n);
        player.hand.add(cards);
        replyPrivate(ctx, `您的手牌为:
${player.hand.cards.join("\n")}`, player.id);
      }
      function drawStartCard(game) {
        const startCard = game.mainDeck.draw(0, 1)[0];
        game.discardDeck.add([startCard]);
        if (["禁止", "反转", "加二", "万能", "加四"].includes(deckMap[startCard].info.type)) {
          return drawStartCard(game);
        }
        return deckMap[startCard].clone();
      }
      const startDeck = drawStartCard(this);
      this.info = {
        id: this.players[0].id,
        type: startDeck.info.type,
        color: startDeck.info.color,
        draw: false
      };
      const name = getName(ctx, this.players[0].id);
      seal.replyToSender(ctx, msg, `游戏开始，第一张牌为${startDeck.name}。从${name}开始`);
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
      const name = cmdArgs.getArgN(1);
      if (ctx.player.userId !== this.info.id) {
        seal.replyToSender(ctx, msg, "不是当前玩家");
        return;
      }
      const index = this.players.findIndex((player2) => player2.id === this.info.id);
      const player = this.players[index];
      const playerName = getName(ctx, this.info.id);
      if (name.toUpperCase() === "SKIP") {
        if (this.info.draw) {
          const anotherIndex2 = index < this.players.length - 1 ? index + 1 : 0;
          const anotherPlayer2 = this.players[anotherIndex2];
          const anotherName2 = getName(ctx, anotherPlayer2.id);
          this.info.draw = false;
          seal.replyToSender(ctx, msg, `${playerName}跳过了，下一位是${anotherName2}`);
          this.nextTurn(ctx, msg);
          return;
        }
        if (this.mainDeck.cards.length < 1) {
          const cards2 = this.discardDeck.cards;
          this.discardDeck.cards = [];
          this.mainDeck.add(cards2);
          this.mainDeck.shuffle();
        }
        const cards = this.mainDeck.draw(0, 1);
        player.hand.add(cards);
        replyPrivate(ctx, `您摸到了${cards.join(",")}
您的手牌为:
${player.hand.cards.join("\n")}`);
        seal.replyToSender(ctx, msg, `${playerName}摸了一张牌，还剩${player.hand.cards.length}张牌。请决定是否出牌。`);
        this.info.draw = true;
        return;
      }
      if (!deckMap.hasOwnProperty(name)) {
        seal.replyToSender(ctx, msg, "未注册牌组");
        return;
      }
      const deck = deckMap[name].clone();
      if (!player.hand.check(deck.cards)) {
        seal.replyToSender(ctx, msg, "手牌不足");
        return;
      }
      if (deck.info.type !== this.info.type && this.info.color && deck.info.color !== "wild" && deck.info.color !== this.info.color) {
        seal.replyToSender(ctx, msg, "没有匹配的颜色或符号，请重新出牌");
        return;
      }
      const result = deck.solve(ctx, msg, cmdArgs, this);
      if (!result) {
        return;
      }
      this.info.type = deck.info.type;
      this.info.color = deck.info.color === "wild" ? this.info.color : deck.info.color;
      this.info.draw = false;
      player.hand.remove(deck.cards);
      this.discardDeck.add(deck.cards);
      let prefix = "";
      if (player.hand.cards.length === 1) {
        prefix = "UNO!";
      }
      if (player.hand.cards.length === 0) {
        seal.replyToSender(ctx, msg, `${playerName}胜利！`);
        this.end(ctx, msg);
        return;
      }
      const anotherIndex = index < this.players.length - 1 ? index + 1 : 0;
      const anotherPlayer = this.players[anotherIndex];
      const anotherName = getName(ctx, anotherPlayer.id);
      seal.replyToSender(ctx, msg, prefix + `${playerName}打出了${deck.name}，还剩${player.hand.cards.length}张牌。下一位是${anotherName}`);
      replyPrivate(ctx, `您的手牌为:
${player.hand.cards.join("\n")}`, player.id);
      this.nextTurn(ctx, msg);
      return;
    }
  };

  // src/index.ts
  function main() {
    let ext = seal.ext.find("UNO");
    if (!ext) {
      ext = seal.ext.new("UNO", "错误", "1.0.0");
      seal.ext.register(ext);
    }
    const cmdGame = seal.ext.newCmdItemInfo();
    cmdGame.name = "uno";
    cmdGame.help = `帮助：
【.uno start】使用team里的成员创建游戏
【.uno end】
【.uno check】查看自己的手牌
【.uno skip】跳过这轮
【.uno <牌名> (指定颜色)】
【.uno info】`;
    cmdGame.disabledInPrivate = true;
    cmdGame.solve = (ctx, msg, cmdArgs) => {
      if (Object.keys(deckMap).length === 0) {
        console.log("开始加载牌组");
        load();
      }
      const val = cmdArgs.getArgN(1);
      const id = ctx.group.groupId;
      switch (val) {
        case "":
        case "help": {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
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
        case "info": {
          const game = Game.getData(ext, id);
          if (!game.status) {
            seal.replyToSender(ctx, msg, "游戏未开始");
            return seal.ext.newCmdExecuteResult(true);
          }
          seal.replyToSender(ctx, msg, `当前回合数:${game.round}
当前轮数:${game.turn}
当前玩家:${getName(ctx, game.info.id)}
当前场上牌的信息:${game.info.color}${game.info.type}
当前玩家顺序:${game.players.map((player) => getName(ctx, player.id)).join("->")}`);
          return seal.ext.newCmdExecuteResult(true);
        }
        default: {
          const game = Game.getData(ext, id);
          game.play(ctx, msg, cmdArgs);
          Game.saveData(ext, id);
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    };
    ext.cmdMap["uno"] = cmdGame;
    ext.cmdMap["UNO"] = cmdGame;
  }
  main();
})();
