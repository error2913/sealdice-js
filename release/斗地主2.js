// ==UserScript==
// @name         斗地主2
// @author       错误
// @version      2.0.0
// @description  指令 .ddz help 获取帮助。仅供娱乐。依赖于错误:team:>=4.0.0
// @timestamp    1730448043
// 2024-11-01 16:00:43
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/release/斗地主2.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/release/斗地主2.js
// @depends 错误:team:>=4.0.0
// ==/UserScript==

(() => {
  // src/deck.ts
  var Deck = class _Deck {
    //方法
    constructor() {
      this.name = "";
      this.desc = "";
      this.type = "";
      this.cards = [];
      this.data = [];
      this.solve = (_, __, ___, ____) => {
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
          deck2.data = data.data || [];
          return deck2;
        }
        deck.name = data.name;
        deck.desc = data.desc;
        deck.type = data.type;
        deck.cards = data.cards;
        deck.data = data.data;
      } catch (err) {
        console.error(`\u89E3\u6790\u724C\u7EC4\u5931\u8D25:`, err);
        deck.name = "\u672A\u77E5\u724C\u5806";
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
    add(cards2, position = 0) {
      this.cards.splice(position, 0, ...cards2);
    }
    //移除指定卡牌
    remove(cards2) {
      for (let i = 0; i < cards2.length; i++) {
        const card = cards2[i];
        const index = this.cards.indexOf(card);
        if (index !== -1) {
          this.cards.splice(index, 1);
        }
      }
    }
    //检查是否包含指定卡牌
    check(cards2) {
      let copy = this.cards.slice();
      for (let i = 0; i < cards2.length; i++) {
        const card = cards2[i];
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
      deck.type = this.type;
      deck.cards = this.cards.slice();
      deck.data = JSON.parse(JSON.stringify(this.data));
      if (typeof this.solve === "function") {
        deck.solve = this.solve.bind(deck);
      }
      return deck;
    }
  };
  var deckMap = {};
  var cards = [
    "\u5927\u738B",
    "\u5C0F\u738B",
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
  var deckMain = new Deck();
  deckMain.name = "\u4E3B\u724C\u5806";
  deckMain.type = "public";
  deckMain.cards = cards;
  deckMap["\u4E3B\u724C\u5806"] = deckMain;
  var deckDiscard = new Deck();
  deckDiscard.name = "\u5F03\u724C\u5806";
  deckDiscard.type = "public";
  deckDiscard.cards = [];
  deckMap["\u5F03\u724C\u5806"] = deckDiscard;

  // src/player.ts
  var Player = class _Player {
    //暗牌
    constructor(id) {
      this.id = id;
      this.data = [""];
      this.hand = new Deck();
      this.hand.name = "\u624B\u724C";
      this.show = new Deck();
      this.show.name = "\u660E\u724C";
      this.hide = new Deck();
      this.hide.name = "\u6697\u724C";
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
        player.data = data.data;
        player.hand = Deck.parse(data.hand);
        player.show = Deck.parse(data.show);
        player.hide = Deck.parse(data.hide);
      } catch (err) {
        console.error(`\u89E3\u6790\u73A9\u5BB6\u5931\u8D25:`, err);
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
    const rank = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2", "\u5C0F\u738B", "\u5927\u738B"];
    if (s == "\u738B\u70B8") {
      return [["\u5C0F\u738B", "\u5927\u738B"], "\u70B8\u5F39", 13];
    }
    if (rank.includes(s)) {
      const index = rank.indexOf(s);
      return [[s], "\u5355", index];
    }
    var match = s.match(/^对(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1]], "\u5BF9", index];
    }
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1]], "\u4E09", index];
    }
    match = s.match(/^炸弹(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[1]], "\u70B8\u5F39", index];
    }
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)带(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[2]], "\u4E09\u5E26\u4E00", index];
    }
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)带对(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[2], match[2]], "\u4E09\u5E26\u5BF9", index];
    }
    match = s.match(/^四(3|4|5|6|7|8|9|10|J|Q|K|A|2)带(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[1], match[2], match[3]], "\u56DB\u5E26\u4E00", index];
    }
    match = s.match(/^四(3|4|5|6|7|8|9|10|J|Q|K|A|2)带对(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
      const index = rank.indexOf(match[1]);
      return [[match[1], match[1], match[1], match[1], match[2], match[2], match[3], match[3]], "\u56DB\u5E26\u5BF9", index];
    }
    match = s.match(/^(\d+)顺(3|4|5|6|7|8|9|10)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 5 && n <= 12) {
        const index = rank.indexOf(match[2]);
        if (index + n < 13) {
          const cards2 = [];
          for (let i = 0; i < n; i++) {
            cards2.push(rank[index + i]);
          }
          return [cards2, "\u987A", index];
        }
      }
    }
    match = s.match(/^(\d+)连对(3|4|5|6|7|8|9|10|J|Q)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 3 && n <= 10) {
        const index = rank.indexOf(match[2]);
        if (index + n < 13) {
          const cards2 = [];
          for (let i = 0; i < n; i++) {
            cards2.push(rank[index + i], rank[index + i]);
          }
          return [cards2, "\u8FDE\u5BF9", index];
        }
      }
    }
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)$/);
    if (match) {
      const n = parseInt(match[1]);
      if (n >= 2 && n <= 5) {
        const index = rank.indexOf(match[2]);
        if (index + n < 13) {
          const cards2 = [];
          for (let i = 0; i < n; i++) {
            cards2.push(rank[index + i], rank[index + i], rank[index + i]);
          }
          return [cards2, "\u98DE\u673A", index];
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
            const cards2 = [];
            for (let i = 0; i < n; i++) {
              cards2.push(rank[index + i], rank[index + i], rank[index + i]);
            }
            cards2.push(...match2);
            return [cards2, "\u98DE\u673A\u5E26\u5355\u5F20", index];
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
            const cards2 = [];
            for (let i = 0; i < n; i++) {
              cards2.push(rank[index + i], rank[index + i], rank[index + i]);
            }
            cards2.push(...match2, ...match2);
            return [cards2, "\u98DE\u673A\u5E26\u5BF9\u5B50", index];
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
      this.curPlayerId = "";
      this.curDeckInfo = ["", 0, ""];
      this.mainDeck = deckMap["\u4E3B\u724C\u5806"].clone();
    }
    static getData(ext, id) {
      if (!cache.hasOwnProperty(id)) {
        let data = {};
        try {
          data = JSON.parse(ext.storageGet(`game_${id}`) || "{}");
        } catch (error) {
          console.error(`\u4ECE\u6570\u636E\u5E93\u4E2D\u83B7\u53D6game_${id}\u5931\u8D25:`, error);
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
        game.curPlayerId = data.curPlayerId;
        game.curDeckInfo = data.curDeckInfo;
        game.mainDeck = Deck.parse(data.mainDeck);
      } catch (err) {
        console.error("\u89E3\u6790\u6E38\u620F\u6570\u636E\u5931\u8D25:", err);
      }
      return game;
    }
    check(ctx, msg) {
      const index = this.players.findIndex((player) => player.id == ctx.player.userId);
      if (index == -1) {
        seal.replyToSender(ctx, msg, "\u6CA1\u6709\u4F60\u7684\u4FE1\u606F");
        return;
      }
      replyPrivate(ctx, `\u60A8\u7684\u624B\u724C\u4E3A:
${this.players[index].hand.cards.join("\n")}`);
    }
    //游戏初始化
    start(ctx, msg) {
      if (this.status) {
        seal.replyToSender(ctx, msg, "\u6E38\u620F\u5DF2\u5F00\u59CB");
        return;
      }
      const teamList = globalThis.teamManager.getTeamList(this.id);
      this.players = teamList[0].members.map((id) => new Player(id));
      if (this.players.length !== 3) {
        seal.replyToSender(ctx, msg, `\u5F53\u524D\u961F\u4F0D\u6210\u5458\u6570\u91CF${this.players.length}\uFF0C\u73A9\u5BB6\u6570\u91CF\u9519\u8BEF`);
        return;
      }
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
      }
      this.players[0].data[0] = "\u5730\u4E3B";
      this.players[1].data[0] = "\u519C\u6C11";
      this.players[2].data[0] = "\u519C\u6C11";
      this.status = true;
      this.curDeckInfo[2] = this.players[0].id;
      this.mainDeck.shuffle();
      const cards2 = this.mainDeck.cards.splice(0, 3);
      this.players[0].hand.add(cards2);
      seal.replyToSender(ctx, msg, `\u5730\u4E3B\u7684\u5E95\u724C\u4E3A\uFF1A
${cards2.join("\n")}`);
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        const cards3 = this.mainDeck.draw(0, 17);
        player.hand.add(cards3);
        const ranks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2", "\u5C0F\u738B", "\u5927\u738B"];
        player.hand.cards.sort((a, b) => {
          const indexA = ranks.indexOf(a);
          const indexB = ranks.indexOf(b);
          return indexA - indexB;
        });
        replyPrivate(ctx, `\u60A8\u7684\u624B\u724C\u4E3A:
${player.hand.cards.join("\n")}`, player.id);
      }
      const name = getName(ctx, this.players[0].id);
      seal.replyToSender(ctx, msg, `\u6E38\u620F\u5F00\u59CB\uFF0C\u4ECE\u5730\u4E3B${name}\u5F00\u59CB`);
      this.nextRound(ctx, msg);
    }
    //结束游戏
    end(ctx, msg) {
      seal.replyToSender(ctx, msg, `\u6E38\u620F\u7ED3\u675F:\u56DE\u5408\u6570${this.round}`);
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
        this.curPlayerId = this.players[0].id;
      } else {
        const index = this.players.findIndex((player) => player.id === this.curPlayerId);
        if (index == this.players.length - 1) {
          this.nextRound(ctx, msg);
          return;
        }
        this.curPlayerId = this.players[index + 1].id;
      }
      this.turn++;
    }
    play(ctx, msg, name) {
      if (ctx.player.userId !== this.curPlayerId) {
        seal.replyToSender(ctx, msg, "\u4E0D\u662F\u5F53\u524D\u73A9\u5BB6");
        return;
      }
      const index = this.players.findIndex((player2) => player2.id === this.curPlayerId);
      const player = this.players[index];
      const playerName = getName(ctx, this.curPlayerId);
      const anotherIndex = index < this.players.length - 1 ? index + 1 : 0;
      const anotherPlayer = this.players[anotherIndex];
      const anotherName = getName(ctx, anotherPlayer.id);
      if (name == "SKIP" || name == "PASS" || name == "\u4E0D\u8981" || name == "\u8981\u4E0D\u8D77" || name == "\u8FC7" || name == "\u4E0D\u51FA") {
        if (this.curDeckInfo[2] == this.curPlayerId) {
          seal.replyToSender(ctx, msg, "\u4E0D\u80FD\u8DF3\u8FC7");
          return;
        }
        seal.replyToSender(ctx, msg, `${playerName}\u8DF3\u8FC7\u4E86\uFF0C\u4E0B\u4E00\u4F4D\u662F${anotherName}`);
        this.nextTurn(ctx, msg);
        return;
      }
      const [cards2, type, value] = getCards(name);
      if (!type) {
        seal.replyToSender(ctx, msg, "\u4E0D\u5B58\u5728\u724C\u578B");
        return;
      }
      if (!player.hand.check(cards2)) {
        seal.replyToSender(ctx, msg, "\u624B\u724C\u4E0D\u8DB3");
        return;
      }
      if (this.curDeckInfo[2] !== this.curPlayerId && this.curDeckInfo) {
        if (type !== "\u70B8\u5F39" && type !== this.curDeckInfo[0]) {
          seal.replyToSender(ctx, msg, "\u724C\u578B\u9519\u8BEF");
          return;
        }
        if (type == this.curDeckInfo[0] && value <= this.curDeckInfo[1]) {
          seal.replyToSender(ctx, msg, "\u724C\u4E0D\u591F\u5927");
          return;
        }
      }
      player.hand.remove(cards2);
      this.curDeckInfo = [type, value, this.curPlayerId];
      if (player.hand.cards.length == 0) {
        seal.replyToSender(ctx, msg, `${player.data[0]}${playerName}\u80DC\u5229\u4E86`);
        this.end(ctx, msg);
        return;
      }
      replyPrivate(ctx, `\u60A8\u7684\u624B\u724C\u4E3A:
${player.hand.cards.join("\n")}`, player.id);
      seal.replyToSender(ctx, msg, `${playerName}\u6253\u51FA\u4E86${name}\uFF0C\u8FD8\u5269${player.hand.cards.length}\u5F20\u724C\u3002\u4E0B\u4E00\u4F4D\u662F${anotherName}`);
      this.nextTurn(ctx, msg);
      return;
    }
  };

  // src/index.ts
  function main() {
    let ext = seal.ext.find("FightWithLandlord2");
    if (!ext) {
      ext = seal.ext.new("FightWithLandlord2", "\u9519\u8BEF", "2.0.0");
      seal.ext.register(ext);
    }
    const cmdPlay = seal.ext.newCmdItemInfo();
    cmdPlay.name = "ddz";
    cmdPlay.help = `\u5E2E\u52A9\uFF1A
\u3010.ddz start\u3011
\u3010.ddz end\u3011
\u3010.ddz check\u3011\u67E5\u770B\u624B\u724C
\u3010.ddz test \u724C\u578B\u540D\u79F0\u3011\u6D4B\u8BD5\u724C\u578B\u662F\u5426\u5B58\u5728
\u3010.ddz \u724C\u578B\u540D\u79F0\u3011\u51FA\u724C
\u3010.ddz \u4E0D\u8981\u3011\u8DF3\u8FC7
\u51FA\u724C\u6559\u7A0B\uFF1Ax\u3001y\u3001z\u90FD\u4E3A\u724C\u540D
\u738B\u70B8\u3001x\u3001\u5BF9x\u3001\u4E09x\u3001\u70B8\u5F39x
\u4E09x\u5E26y\u3001\u4E09x\u5E26\u5BF9y
\u56DBx\u5E26yz\u3001\u56DBx\u5E26\u5BF9yz

\u724C\u578B\u8FDE\u7EED\u65F6\uFF0Cn\u4F5C\u4E3A\u8FDE\u7EED\u90E8\u5206\u7684\u957F\u5EA6\uFF0Cx\u4F5C\u4E3A\u8D77\u5934\uFF1A
n\u987Ax\u3001n\u8FDE\u5BF9x\u3001n\u98DE\u673Ax
n\u98DE\u673Ax\u5E26yz...\u3001n\u98DE\u673Ax\u5E26\u5BF9yz...
\u5982\uFF1A5\u98DE\u673A3\u5E268910AJ\u5C31\u662F
3334445556667778910AJ`;
    cmdPlay.disabledInPrivate = true;
    cmdPlay.solve = (ctx, msg, cmdArgs) => {
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
          const [cards2, type, value] = getCards(s);
          if (type) {
            seal.replyToSender(ctx, msg, `${cards2.join("")}\u5B58\u5728${type}:${value}`);
            return seal.ext.newCmdExecuteResult(true);
          }
          seal.replyToSender(ctx, msg, "\u4E0D\u5B58\u5728");
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
          const name = val.toUpperCase();
          game.play(ctx, msg, name);
          Game.saveData(ext, id);
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    };
    ext.cmdMap["ddz"] = cmdPlay;
  }
  main();
})();
