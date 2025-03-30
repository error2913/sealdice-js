// ==UserScript==
// @name         斗地主2
// @author       错误
// @version      2.0.0
// @description  指令 .ddz help 获取帮助。仅供娱乐。依赖于错误:team:>=4.0.0
// @timestamp    1730448043
// 2024-11-01 16:00:43
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/fight_with_landlord/dist/斗地主2.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/fight_with_landlord/dist/斗地主2.js
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
    const cards = [
      "大王",
      "小王",
      "2",
      "2",
      "2",
      "2",
      "A",
      "A",
      "A",
      "A",
      "K",
      "K",
      "K",
      "K",
      "Q",
      "Q",
      "Q",
      "Q",
      "J",
      "J",
      "J",
      "J",
      "10",
      "10",
      "10",
      "10",
      "9",
      "9",
      "9",
      "9",
      "8",
      "8",
      "8",
      "8",
      "7",
      "7",
      "7",
      "7",
      "6",
      "6",
      "6",
      "6",
      "5",
      "5",
      "5",
      "5",
      "4",
      "4",
      "4",
      "4",
      "3",
      "3",
      "3",
      "3"
    ];
    const deckMain = new Deck();
    deckMain.name = "主牌堆";
    deckMain.cards = cards;
    deckMap["主牌堆"] = deckMain;
  }

  // src/player.ts
  var Player = class _Player {
    //暗牌
    constructor(id) {
      this.id = id;
      this.info = {
        class: ""
      };
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
  function getCards(s) {
    const rank = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2", "小王", "大王"];
    if (s == "王炸") {
      return [["小王", "大王"], "炸弹", 13];
    }
    if (rank.includes(s)) {
      const index = rank.indexOf(s);
      return [[s], "单", index];
    }
    var match = s.match(/^对(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1]], "对", index];
    }
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1]], "三", index];
    }
    match = s.match(/^炸弹(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[1]], "炸弹", index];
    }
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)带(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[2]], "三带一", index];
    }
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)带对(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[2], match[2]], "三带对", index];
    }
    match = s.match(/^四(3|4|5|6|7|8|9|10|J|Q|K|A|2)带(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[1], match[2], match[3]], "四带一", index];
    }
    match = s.match(/^四(3|4|5|6|7|8|9|10|J|Q|K|A|2)带对(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[1], match[2], match[2], match[3], match[3]], "四带对", index];
    }
    match = s.match(/^(\d+)顺(3|4|5|6|7|8|9|10)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 5 && n <= 12) {
        const index = rank.indexOf(match[2]);
        if (index + n < 13) {
          const cards = [];
          for (let i = 0; i < n; i++) {
            cards.push(rank[index + i]);
          }
          return [cards, "顺", index];
        }
      }
    }
    match = s.match(/^(\d+)连对(3|4|5|6|7|8|9|10|J|Q)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 3 && n <= 10) {
        const index = rank.indexOf(match[2]);
        if (index + n < 13) {
          const cards = [];
          for (let i = 0; i < n; i++) {
            cards.push(rank[index + i], rank[index + i]);
          }
          return [cards, "连对", index];
        }
      }
    }
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 2 && n <= 5) {
        const index = rank.indexOf(match[2]);
        if (index + n < 13) {
          const cards = [];
          for (let i = 0; i < n; i++) {
            cards.push(rank[index + i], rank[index + i], rank[index + i]);
          }
          return [cards, "飞机", index];
        }
      }
    }
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)带(.+)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 2 && n <= 5) {
        const match2 = match[3].match(/3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王/g);
        if (match2 && match2.length == n) {
          const index = rank.indexOf(match[2]);
          if (index + n < 13) {
            const cards = [];
            for (let i = 0; i < n; i++) {
              cards.push(rank[index + i], rank[index + i], rank[index + i]);
            }
            cards.push(...match2);
            return [cards, "飞机带单张", index];
          }
        }
      }
    }
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)带对(.+)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 2 && n <= 5) {
        const match2 = match[3].match(/3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王/g);
        if (match2 && match2.length == n) {
          const index = rank.indexOf(match[2]);
          if (index + n < 13) {
            const cards = [];
            for (let i = 0; i < n; i++) {
              cards.push(rank[index + i], rank[index + i], rank[index + i]);
            }
            cards.push(...match2, ...match2);
            return [cards, "飞机带对子", index];
          }
        }
      }
    }
    return [[], "", 0];
  }

  // src/game.ts
  var cache = {};
  var Game = class _Game {
    //包含所有卡牌的牌组
    constructor(id) {
      this.id = id;
      this.status = false;
      this.players = [];
      this.round = 0;
      this.turn = 0;
      this.info = {
        id: "",
        type: "",
        value: 0,
        deckId: ""
      };
      this.mainDeck = deckMap["主牌堆"].clone();
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
      if (this.players.length !== 3) {
        seal.replyToSender(ctx, msg, `当前队伍成员数量${this.players.length}，玩家数量错误`);
        return;
      }
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
      }
      this.players[0].info.class = "地主";
      this.players[1].info.class = "农民";
      this.players[2].info.class = "农民";
      this.status = true;
      this.mainDeck.shuffle();
      const cards = this.mainDeck.cards.splice(0, 3);
      this.players[0].hand.add(cards);
      seal.replyToSender(ctx, msg, `地主的底牌为：
${cards.join("\n")}`);
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        const cards2 = this.mainDeck.draw(0, 17);
        player.hand.add(cards2);
        const ranks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2", "小王", "大王"];
        player.hand.cards.sort((a, b) => {
          const indexA = ranks.indexOf(a);
          const indexB = ranks.indexOf(b);
          return indexA - indexB;
        });
        replyPrivate(ctx, `您的手牌为:
${player.hand.cards.join("\n")}`, player.id);
      }
      this.info.deckId = this.players[0].id;
      this.info.id = this.players[0].id;
      const name = getName(ctx, this.players[0].id);
      seal.replyToSender(ctx, msg, `游戏开始，从地主${name}开始`);
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
      const name = cmdArgs.getArgN(1).toUpperCase();
      if (ctx.player.userId !== this.info.id) {
        seal.replyToSender(ctx, msg, "不是当前玩家");
        return;
      }
      const index = this.players.findIndex((player2) => player2.id === this.info.id);
      const player = this.players[index];
      const playerName = getName(ctx, this.info.id);
      const anotherIndex = index < this.players.length - 1 ? index + 1 : 0;
      const anotherPlayer = this.players[anotherIndex];
      const anotherName = getName(ctx, anotherPlayer.id);
      if (name == "SKIP" || name == "PASS" || name == "不要" || name == "要不起" || name == "过" || name == "不出") {
        if (this.info.deckId == this.info.id) {
          seal.replyToSender(ctx, msg, "不能跳过");
          return;
        }
        seal.replyToSender(ctx, msg, `${playerName}跳过了，下一位是${anotherName}`);
        this.nextTurn(ctx, msg);
        return;
      }
      const [cards, type, value] = getCards(name);
      if (!type) {
        seal.replyToSender(ctx, msg, "不存在牌型");
        return;
      }
      if (!player.hand.check(cards)) {
        seal.replyToSender(ctx, msg, "手牌不足");
        return;
      }
      if (this.info.deckId !== this.info.id && this.info) {
        if (type !== "炸弹" && type !== this.info.type) {
          seal.replyToSender(ctx, msg, "牌型错误");
          return;
        }
        if (type == this.info.type && value <= this.info.value) {
          seal.replyToSender(ctx, msg, "牌不够大");
          return;
        }
      }
      player.hand.remove(cards);
      this.info = {
        id: this.info.id,
        type,
        value,
        deckId: this.info.id
      };
      if (player.hand.cards.length == 0) {
        seal.replyToSender(ctx, msg, `${player.info.class}${playerName}胜利了`);
        this.end(ctx, msg);
        return;
      }
      replyPrivate(ctx, `您的手牌为:
${player.hand.cards.join("\n")}`, player.id);
      seal.replyToSender(ctx, msg, `${playerName}打出了${name}，还剩${player.hand.cards.length}张牌。下一位是${anotherName}`);
      this.nextTurn(ctx, msg);
      return;
    }
  };

  // src/index.ts
  function main() {
    let ext = seal.ext.find("FightWithLandlord2");
    if (!ext) {
      ext = seal.ext.new("FightWithLandlord2", "错误", "2.0.0");
      seal.ext.register(ext);
    }
    const cmdPlay = seal.ext.newCmdItemInfo();
    cmdPlay.name = "ddz";
    cmdPlay.help = `帮助：
【.ddz start】使用team里的成员创建游戏
【.ddz end】
【.ddz check】查看手牌
【.ddz test 牌型名称】测试牌型是否存在
【.ddz 牌型名称】出牌
【.ddz 不要】跳过
出牌教程：x、y、z都为牌名
王炸、x、对x、三x、炸弹x
三x带y、三x带对y
四x带yz、四x带对yz

牌型连续时，n作为连续部分的长度，x作为起头：
n顺x、n连对x、n飞机x
n飞机x带yz...、n飞机x带对yz...
如：5飞机3带8910AJ就是
3334445556667778910AJ`;
    cmdPlay.disabledInPrivate = true;
    cmdPlay.solve = (ctx, msg, cmdArgs) => {
      if (Object.keys(deckMap).length === 0) {
        console.log("开始加载牌组");
        load();
      }
      let val = cmdArgs.getArgN(1);
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
        case "test": {
          const s = cmdArgs.getRestArgsFrom(2);
          const [cards, type, value] = getCards(s);
          if (type) {
            seal.replyToSender(ctx, msg, `${cards.join("")}存在${type}:${value}`);
            return seal.ext.newCmdExecuteResult(true);
          }
          seal.replyToSender(ctx, msg, "不存在");
          return seal.ext.newCmdExecuteResult(true);
        }
        case "check": {
          const game = Game.getData(ext, id);
          game.check(ctx, msg);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "":
        case "help": {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        default: {
          const game = Game.getData(ext, id);
          game.play(ctx, msg, cmdArgs);
          Game.saveData(ext, id);
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    };
    ext.cmdMap["ddz"] = cmdPlay;
    ext.cmdMap["斗地主"] = cmdPlay;
  }
  main();
})();
