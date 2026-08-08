// ==UserScript==
// @name         game依赖
// @author       错误
// @version      1.0.0
// @description  我不会写简介。去读readme吧。
// @timestamp    1732336623
// 2024-11-23 12:37:03
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/game/dist/game依赖.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/game/dist/game依赖.js
// ==/UserScript==

(() => {
  // src/chart/chart.ts
  var Chart = class _Chart {
    constructor(func) {
      this.func = func;
      this.list = [];
    }
    static parse(data, func) {
      const chart = new _Chart(func);
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        data = {};
      }
      if (data.hasOwnProperty("list") && Array.isArray(data.list)) {
        for (let pi of data.list) {
          if (pi === null || typeof pi !== "object" || Array.isArray(pi)) {
            continue;
          }
          if (pi.hasOwnProperty("uid") && typeof pi.uid === "string" && pi.hasOwnProperty("name") && typeof pi.name === "string" && pi.hasOwnProperty("value") && typeof pi.value === "number") {
            chart.list.push(pi);
          }
        }
      }
      return chart;
    }
    updateChart(player) {
      const value = this.func(player);
      if (typeof value !== "number") {
        console.error(`更新排行榜时出现错误:返回值不是数字`);
        return;
      }
      const index = this.list.findIndex((pi) => pi.uid === player.uid);
      if (index === -1) {
        const pi = {
          uid: player.uid,
          name: player.name,
          value
        };
        this.list.push(pi);
      } else {
        this.list[index].name = player.name;
        this.list[index].value = value;
      }
      this.list.sort((a, b) => {
        return b.value - a.value;
      });
      this.list = this.list.slice(0, 10);
    }
    showChart() {
      if (this.list.length === 0) {
        return "排行榜为空";
      }
      let s = "";
      for (let i = 0; i < this.list.length; i++) {
        const pi = this.list[i];
        s += `第${i + 1}名： <${pi.name}>(${pi.value})
`;
      }
      s = s.trim();
      return s;
    }
  };

  // src/chart/chartManager.ts
  var ChartManager = class {
    constructor(ext) {
      this.ext = ext;
      this.map = {};
      this.cache = {};
    }
    clearCache() {
      this.cache = {};
    }
    registerChart(name, func) {
      if (this.map.hasOwnProperty(name)) {
        console.error(`注册排行榜${name}时出现错误:该名字已注册`);
        return;
      }
      if (Chart.parse(null, func) === void 0) {
        console.error(`注册排行榜${name}时出现错误:计算函数错误`);
        return;
      }
      this.map[name] = func;
    }
    getChart(name) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`获取排行榜${name}时出现错误:该名字未注册`);
        return void 0;
      }
      if (!this.cache.hasOwnProperty(name)) {
        let data = {};
        try {
          data = JSON.parse(this.ext.storageGet(`chart_${name}`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取${`chart_${name}`}失败:`, error);
        }
        const func = this.map[name];
        this.cache[name] = Chart.parse(data, func);
      }
      return this.cache[name];
    }
    saveChart(name) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`保存排行榜${name}时出现错误:该名字未注册`);
        return;
      }
      if (this.cache.hasOwnProperty(name)) {
        const chart = this.cache[name];
        this.ext.storageSet(`chart_${name}`, JSON.stringify(chart));
      }
    }
    updateChart(name, player) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`更新排行榜${name}时出现错误:该名字未注册`);
        return;
      }
      const chart = this.getChart(name);
      if (!chart) {
        return;
      }
      chart.updateChart(player);
      this.saveChart(name);
    }
    updateAllChart(player) {
      for (const name of Object.keys(this.map)) {
        this.updateChart(name, player);
      }
    }
    showAvailableChart() {
      return Object.keys(this.map).join("\n");
    }
  };

  // src/market/marketManager.ts
  var MarketManager = class {
    constructor(ext) {
      this.ext = ext;
      this.list = [];
      this.getMarket();
    }
    parse(data) {
      if (!Array.isArray(data)) {
        return [];
      }
      const list = [];
      for (let i = 0; i < data.length; i++) {
        const si = data[i];
        if (!si.hasOwnProperty("id") || typeof si.id !== "number" || !si.hasOwnProperty("uid") || typeof si.uid !== "string" || !si.hasOwnProperty("title") || typeof si.title !== "string" || !si.hasOwnProperty("content") || typeof si.content !== "string" || !si.hasOwnProperty("name") || typeof si.name !== "string" || !si.hasOwnProperty("price") || typeof si.price !== "number" || !si.hasOwnProperty("count") || typeof si.count !== "number") {
          return [];
        }
        list.push(si);
      }
      return list;
    }
    getMarket() {
      if (this.list.length === 0) {
        let data = {};
        try {
          data = JSON.parse(this.ext.storageGet(`market`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取${`market`}失败:`, error);
        }
        this.list = this.parse(data);
      }
      return this.list;
    }
    saveMarket() {
      this.ext.storageSet(`market`, JSON.stringify(this.list));
    }
    createNewId() {
      if (this.list.length === 0) {
        return 1;
      }
      const id = this.list[this.list.length - 1].id;
      return id + 1;
    }
    putOnSale(player, title, content, name, price, count) {
      if (title.length === 0) {
        return new Error("请输入标题");
      }
      if (title.length > 12) {
        return new Error("标题长度不能超过12个字符");
      }
      if (content.length > 300) {
        return new Error("内容长度不能超过300个字符");
      }
      if (!player.backpack.checkExists(name, count)) {
        return new Error(`背包内【${name}】数量不足`);
      }
      player.backpack.removeItem(name, count);
      const sellInfo = {
        id: this.createNewId(),
        uid: player.uid,
        title,
        content,
        name,
        price,
        count
      };
      this.list.push(sellInfo);
      this.saveMarket();
      return null;
    }
    buyGoods(gm, player, id, count = 0) {
      const index = this.list.findIndex((si2) => si2.id === id);
      if (index === -1) {
        return new Error("商品不存在");
      }
      const si = this.list[index];
      if (count === 0 || count > si.count) {
        count = si.count;
      }
      const price = si.price * count;
      if (player.money < price) {
        return new Error("货币不足");
      }
      this.list[index].count -= count;
      if (this.list[index].count <= 0) {
        this.list.splice(index, 1);
      }
      player.money -= price;
      player.backpack.addItem(si.name, count);
      const mplayer = gm.player.getPlayer(si.uid, "");
      mplayer.money += price;
      gm.player.savePlayer(si.uid);
      this.saveMarket();
      return null;
    }
    getSellInfo(id) {
      const index = this.list.findIndex((si) => si.id === id);
      if (index === -1) {
        return {
          id: 0,
          uid: "",
          title: "",
          content: "",
          name: "",
          price: 0,
          count: 0
        };
      }
      return this.list[index];
    }
    removeSellInfo(id) {
      const index = this.list.findIndex((si) => si.id === id);
      if (index !== -1) {
        this.list.splice(index, 1);
        this.saveMarket();
      }
    }
    showSellInfo() {
      if (this.list.length === 0) {
        return ["市场暂无商品"];
      }
      const pageSize = 10;
      const totalPages = Math.ceil(this.list.length / pageSize);
      const pages = [];
      let arr = [];
      for (let i = 0; i < this.list.length; i++) {
        const item = this.list[i];
        const s = `${item.id}.【${item.title}】`;
        arr.push(s);
        if (i % pageSize === pageSize - 1 || i === this.list.length - 1) {
          const pageNum = i === 0 ? 1 : Math.ceil(i / pageSize);
          const s2 = arr.join("\n") + `
第${pageNum}/${totalPages}页`;
          pages.push(s2);
          arr = [];
        }
      }
      return pages;
    }
  };

  // src/backpack/backpack.ts
  var Backpack = class _Backpack {
    constructor() {
      this.items = {};
    }
    static parse(data, items) {
      const backpack = new _Backpack();
      if (data === null || typeof data !== "object" || Array.isArray(data) || data.items === null || typeof data.items !== "object" || Array.isArray(data.items)) {
        backpack.items = items || {};
        return backpack;
      }
      for (let name of Object.keys(data.items)) {
        const count = data.items[name];
        if (typeof count == "number") {
          backpack.items[name] = count;
        }
      }
      return backpack;
    }
    addItem(name, count) {
      if (!this.items.hasOwnProperty(name)) {
        this.items[name] = count;
      } else {
        this.items[name] += count;
      }
    }
    removeItem(name, count) {
      if (!this.items.hasOwnProperty(name)) {
        return;
      }
      this.items[name] -= count;
      if (this.items[name] <= 0) {
        delete this.items[name];
      }
    }
    removeItemsByTypes(gm, ...types) {
      const propMap = gm.prop.propMap;
      for (let name of Object.keys(this.items)) {
        if (!propMap.hasOwnProperty(name)) {
          continue;
        }
        const type = propMap[name].type;
        if (types.includes(type)) {
          delete this.items[name];
        }
      }
    }
    clear() {
      this.items = {};
    }
    len() {
      return Object.keys(this.items).length;
    }
    draw(n) {
      const result = new _Backpack();
      let totalCount = this.sum();
      if (totalCount < n) {
        n = totalCount;
      }
      for (let i = 0; i < n; i++) {
        const index = Math.ceil(Math.random() * totalCount);
        const names = Object.keys(this.items);
        let tempCount = 0;
        for (let name of names) {
          tempCount += this.items[name];
          if (tempCount >= index) {
            result.addItem(name, 1);
            this.removeItem(name, 1);
            break;
          }
        }
        totalCount--;
        if (totalCount <= 0) {
          break;
        }
      }
      return result;
    }
    checkExists(name, count) {
      if (!this.items.hasOwnProperty(name) || this.items[name] < count) {
        return false;
      }
      return true;
    }
    checkTypesExists(gm, ...types) {
      const propMap = gm.prop.propMap;
      for (let name of Object.keys(this.items)) {
        if (!propMap.hasOwnProperty(name)) {
          continue;
        }
        const type = propMap[name].type;
        if (types.includes(type)) {
          return true;
        }
      }
      return false;
    }
    sum() {
      let count = 0;
      for (let name of Object.keys(this.items)) {
        count += this.items[name];
      }
      return count;
    }
    sumByTypes(gm, ...types) {
      const propMap = gm.prop.propMap;
      let count = 0;
      for (let name of Object.keys(this.items)) {
        if (!propMap.hasOwnProperty(name)) {
          continue;
        }
        const type = propMap[name].type;
        if (types.includes(type)) {
          count += this.items[name];
        }
      }
      return count;
    }
    getTypes(gm) {
      const propMap = gm.prop.propMap;
      const result = [];
      for (let name of Object.keys(this.items)) {
        if (!propMap.hasOwnProperty(name)) {
          continue;
        }
        const type = propMap[name].type;
        if (!result.includes(type)) {
          result.push(type);
        }
      }
      return result;
    }
    getNames() {
      return Object.keys(this.items);
    }
    getCount(name) {
      if (!this.items.hasOwnProperty(name)) {
        return 0;
      }
      return this.items[name];
    }
    showBackpack() {
      if (this.len() === 0) {
        return "背包为空";
      }
      let s = "";
      for (let name of Object.keys(this.items)) {
        s += `【${name}】 x ${this.items[name]}
`;
      }
      s = s.trim();
      return s;
    }
    mergeBackpack(backpack) {
      for (let name of Object.keys(backpack.items)) {
        this.addItem(name, backpack.items[name]);
      }
    }
    removeBackpack(backpack) {
      for (let name of Object.keys(backpack.items)) {
        this.removeItem(name, backpack.items[name]);
      }
    }
    findByTypes(gm, ...types) {
      const propMap = gm.prop.propMap;
      const result = new _Backpack();
      for (let name of Object.keys(this.items)) {
        if (!propMap.hasOwnProperty(name)) {
          continue;
        }
        const type = propMap[name].type;
        if (types.includes(type)) {
          result.addItem(name, this.items[name]);
        }
      }
      return result;
    }
    findByCountRange(min, max) {
      const result = new _Backpack();
      for (let name of Object.keys(this.items)) {
        if (this.items[name] >= min && this.items[name] <= max) {
          result.addItem(name, this.items[name]);
        }
      }
      return result;
    }
  };

  // src/player/player.ts
  var Player = class _Player {
    constructor(uid, vi) {
      this.uid = uid;
      this.name = "";
      this.backpack = new Backpack();
      this.varsMap = globalThis.varsManager.parse(null, vi);
    }
    static parse(data, uid, vi) {
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        data = {};
      }
      const player = new _Player(uid, vi);
      if (data.hasOwnProperty("name")) {
        player.name = data.name;
      }
      if (data.hasOwnProperty("date")) {
        player.date = data.date;
      }
      if (data.hasOwnProperty("money")) {
        player.money = data.money;
      }
      if (data.hasOwnProperty("backpack")) {
        player.backpack = Backpack.parse(data.backpack, null);
      }
      if (data.hasOwnProperty("varsMap")) {
        player.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
      }
      return player;
    }
    signIn() {
      const date = (/* @__PURE__ */ new Date()).toLocaleString().split(" ")[0];
      if (this.date === date) {
        return false;
      }
      this.date = date;
      return true;
    }
  };

  // src/player/playerManager.ts
  var PlayerManager = class {
    constructor(ext) {
      this.ext = ext;
      this.varsInfo = {};
      this.cache = {};
    }
    clearCache() {
      this.cache = {};
    }
    getPlayer(uid, name) {
      if (!this.cache.hasOwnProperty(uid)) {
        let data = {};
        try {
          data = JSON.parse(this.ext.storageGet(`player_${uid}`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取${`player_${uid}`}失败:`, error);
        }
        const vi = this.varsInfo;
        this.cache[uid] = Player.parse(data, uid, vi);
      }
      if (this.cache[uid].name === "") {
        this.cache[uid].name = name;
      }
      return this.cache[uid];
    }
    savePlayer(uid) {
      if (this.cache.hasOwnProperty(uid)) {
        const player = this.cache[uid];
        this.ext.storageSet(`player_${uid}`, JSON.stringify(player));
      }
    }
  };

  // src/prop/prop.ts
  var Prop = class {
    constructor() {
      this.name = "";
      this.desc = "";
      this.type = "";
      this.solve = (_, __) => {
        return { result: null, err: null };
      };
    }
    showProp() {
      return `【${this.name}】
类型:${this.type}
描述:${this.desc}`;
    }
  };

  // src/prop/propManager.ts
  var PropManager = class {
    constructor() {
      this.propMap = {};
    }
    clear() {
      this.propMap = {};
    }
    registerProp(prop) {
      const name = prop.name;
      this.propMap[name] = prop;
    }
    removeProp(name) {
      if (this.propMap.hasOwnProperty(name)) {
        delete this.propMap[name];
      }
    }
    getProp(name = "") {
      if (!name || !this.propMap.hasOwnProperty(name)) {
        return new Prop();
      }
      return this.propMap[name];
    }
    useProp(name, player, count, ...args) {
      if (!player.backpack.checkExists(name, count)) {
        const err = new Error(`背包内【${name}】数量不足`);
        return { result: null, err };
      }
      const prop = this.getProp(name);
      if (prop.name === "") {
        const err = new Error(`【${name}】不知道有什么用`);
        return { result: null, err };
      }
      try {
        const { result, err } = prop.solve(player, count, ...args);
        if (err !== null) {
          return { result: null, err };
        }
        player.backpack.removeItem(name, count);
        return { result, err: null };
      } catch (err) {
        err.message = `【${prop.name}】出现错误:${err.message}`;
        return { result: null, err };
      }
    }
    showPropList() {
      return Object.keys(this.propMap).join("\n");
    }
  };

  // src/shop/shop.ts
  var Shop = class _Shop {
    constructor(gc) {
      this.goodsConfig = gc;
      this.updateTime = 0;
      this.goods = {};
    }
    static parse(data, gc) {
      const shop = new _Shop(gc);
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        data = {};
      }
      if (data.hasOwnProperty("updateTime") && typeof data.updateTime === "number") {
        shop.updateTime = data.updateTime;
      }
      if (data.hasOwnProperty("goods") && typeof data.goods === "object" && !Array.isArray(data.goods)) {
        for (const name of Object.keys(data.goods)) {
          const g = data.goods[name];
          if (g.hasOwnProperty("price") && typeof g.price === "number" && g.hasOwnProperty("count") && typeof g.count === "number") {
            shop.goods[name] = g;
          }
        }
      }
      return shop;
    }
    showShop() {
      if (Object.keys(this.goods).length === 0) {
        return "商店里什么都没有";
      }
      let s = "";
      for (const name of Object.keys(this.goods)) {
        const g = this.goods[name];
        s += `【${name}】: 价格${g.price} 数量${g.count}
`;
      }
      s = s.trim();
      return s;
    }
    updateShop() {
      this.updateTime = Math.floor(Date.now() / 1e3);
      this.goods = {};
      for (const name of Object.keys(this.goodsConfig)) {
        const gi = this.goodsConfig[name];
        if (Math.random() < gi.prob) {
          const pb = gi.price.base;
          const pd = gi.price.delta;
          const cb = gi.count.base;
          const cd = gi.count.delta;
          const price = Math.floor(Math.random() * (pd * 2 + 1) + pb - pd);
          const count = Math.floor(Math.random() * (cd * 2 + 1) + cb - cd);
          this.goods[name] = {
            price,
            count
          };
        }
      }
      return this;
    }
    getGoods(name) {
      if (!this.goods.hasOwnProperty(name)) {
        return { price: 0, count: 0 };
      }
      return this.goods[name];
    }
    addGoods(name, price, count) {
      if (this.goods.hasOwnProperty(name)) {
        return;
      }
      this.goods[name] = {
        price,
        count
      };
    }
    supplyGoods(name, count) {
      if (!this.goods.hasOwnProperty(name)) {
        return;
      }
      this.goods[name].count += count;
    }
    buyGoods(player, name, count) {
      if (!this.goods.hasOwnProperty(name)) {
        return new Error("没有这个商品");
      }
      if (this.goods[name].count < count) {
        return new Error("商品数量不足");
      }
      if (count <= 0) {
        return new Error("购买数量小于1");
      }
      const price = this.goods[name].price * count;
      if (player.money < price) {
        return new Error("货币不足");
      }
      this.goods[name].count -= count;
      player.money -= price;
      player.backpack.addItem(name, count);
      return null;
    }
    removeGoods(name) {
      if (this.goods.hasOwnProperty(name)) {
        delete this.goods[name];
      }
    }
  };

  // src/shop/shopManager.ts
  var ShopManager = class {
    constructor(ext) {
      this.ext = ext;
      this.map = {};
      this.cache = {};
    }
    registerShop(name, gc, interval) {
      if (this.map.hasOwnProperty(name)) {
        console.error(`注册商店${name}时出现错误:该名字已注册`);
        return;
      }
      this.map[name] = {
        goodsConfig: gc,
        interval
      };
    }
    getShop(name) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`获取商店${name}时出现错误:该名字未注册`);
        return void 0;
      }
      if (!this.cache.hasOwnProperty(name)) {
        let data = {};
        try {
          data = JSON.parse(this.ext.storageGet(`shop_${name}`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取${`shop_${name}`}失败:`, error);
        }
        const gc = this.map[name].goodsConfig;
        this.cache[name] = Shop.parse(data, gc);
      }
      const now = Math.floor(Date.now() / 1e3);
      const updateTime = this.cache[name].updateTime;
      const interval = this.map[name].interval;
      const dateDiff = Math.ceil((now - updateTime) / 24 * 60 * 60);
      if (interval !== 0 && dateDiff >= interval) {
        this.cache[name].updateShop();
        this.saveShop(name);
      }
      return this.cache[name];
    }
    saveShop(name) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`保存商店${name}时出现错误:该名字未注册`);
        return;
      }
      if (this.cache.hasOwnProperty(name)) {
        const shop = this.cache[name];
        this.ext.storageSet(`shop_${name}`, JSON.stringify(shop));
      }
    }
    setGoodsInfo(name, goodsName, gi) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`获取商店${name}时出现错误:该名字未注册`);
        return void 0;
      }
      this.map[name][goodsName] = gi;
      if (this.cache.hasOwnProperty(name)) {
        delete this.cache[name];
        this.getShop(name);
        this.saveShop(name);
      }
    }
    getGoodsInfo(name, goodsName) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`获取商店${name}时出现错误:该名字未注册`);
        return void 0;
      }
      if (!this.map[name].hasOwnProperty(goodsName)) {
        console.error(`获取商店${name}时出现错误:该商品信息未注册`);
        return void 0;
      }
      return this.map[name][goodsName];
    }
    updateShop(name) {
      if (!this.map.hasOwnProperty(name)) {
        console.error(`更新商店${name}时出现错误:该名字未注册`);
        return void 0;
      }
      const shop = this.getShop(name);
      if (!shop) {
        return void 0;
      }
      shop.updateShop();
      this.saveShop(name);
      return shop;
    }
  };

  // src/game/game.ts
  var Game = class _Game {
    constructor(gid, vi) {
      this.gid = gid;
      this.varsMap = globalThis.varsManager.parse(null, vi);
    }
    static parse(data, gid, vi) {
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        data = {};
      }
      const game = new _Game(gid, vi);
      if (data.hasOwnProperty("varsMap")) {
        game.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
      }
      return game;
    }
  };

  // src/game/gameManager.ts
  var GameManager = class {
    constructor(ext) {
      this.ext = ext;
      this.varsInfo = {};
      this.prop = new PropManager();
      this.player = new PlayerManager(ext);
      this.chart = new ChartManager(ext);
      this.shop = new ShopManager(ext);
      this.market = new MarketManager(ext);
      this.cache = {};
    }
    clearCache() {
      this.cache = {};
    }
    getGame(gid) {
      if (!this.cache.hasOwnProperty(gid)) {
        let data = {};
        try {
          data = JSON.parse(this.ext.storageGet(`game_${gid}`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取${`game_${gid}`}失败:`, error);
        }
        const vi = this.varsInfo;
        this.cache[gid] = Game.parse(data, gid, vi);
      }
      return this.cache[gid];
    }
    saveGame(gid) {
      if (this.cache.hasOwnProperty(gid)) {
        const game = this.cache[gid];
        this.ext.storageSet(`game_${gid}`, JSON.stringify(game));
      }
    }
  };

  // src/team/team.ts
  var Team = class _Team {
    constructor() {
      this.members = [];
    }
    static parse(data, members) {
      const team = new _Team();
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        data = {};
      }
      if (data.hasOwnProperty("members") && Array.isArray(data.members)) {
        team.members = data.members;
      } else {
        team.members = members || [];
      }
      return team;
    }
    addMember(uid) {
      if (!this.checkExists(uid)) {
        this.members.push(uid);
      }
    }
    removeMember(uid) {
      const index = this.members.indexOf(uid);
      if (index !== -1) {
        this.members.splice(index, 1);
      }
    }
    clear() {
      this.members = [];
    }
    len() {
      return this.members.length;
    }
    draw(n) {
      if (n <= 0) {
        return [];
      }
      const result = [];
      const members = this.members.slice();
      for (let i = 0; i < n && i < this.members.length; i++) {
        const index = Math.floor(Math.random() * members.length);
        const uid = members[index];
        result.push(uid);
        members.splice(index, 1);
      }
      return result;
    }
    checkExists(uid) {
      return this.members.includes(uid);
    }
    getPlayers(gm) {
      const result = [];
      for (let uid of this.members) {
        const player = gm.player.getPlayer(uid, "未知用户");
        result.push(player);
      }
      return result;
    }
    showTeam(gm) {
      if (this.members.length === 0) {
        return "队伍为空";
      }
      const players = this.getPlayers(gm);
      const names = players.map((player) => `<${player.name}>`);
      return names.join("\n");
    }
    mergeTeam(team) {
      for (let uid of team.members) {
        if (!this.checkExists(uid)) {
          this.addMember(uid);
        }
      }
    }
    removeTeam(team) {
      for (let uid of team.members) {
        this.removeMember(uid);
      }
    }
    operationToAllMembers(gm, func) {
      const result = [];
      for (let uid of this.members) {
        const player = gm.player.getPlayer(uid, "未知用户");
        try {
          result.push({
            player,
            result: func(player)
          });
        } catch (error) {
          console.error(`执行全队操作时出现错误:`, error);
        }
      }
      return result;
    }
    sort(gm, func, reverse = false) {
      const players = this.getPlayers(gm);
      players.sort((a, b) => {
        return func(a) - func(b);
      });
      if (reverse) {
        players.reverse();
      }
      this.members = players.map((player) => player.uid);
      return this;
    }
  };

  // src/vars/varsManager.ts
  var VarsManager = class {
    constructor() {
      this.typeMap = {};
      this.registerVarsType("boolean", (data, bool) => {
        return typeof data === "boolean" ? data : bool;
      });
      this.registerVarsType("string", (data, s) => {
        return typeof data === "string" ? data : s;
      });
      this.registerVarsType("number", (data, n) => {
        return typeof data === "number" ? data : n;
      });
      this.registerVarsType("backpack", Backpack.parse);
      this.registerVarsType("team", Team.parse);
    }
    registerVarsType(type, parseFunc) {
      if (this.typeMap.hasOwnProperty(type)) {
        console.error(`注册变量解析器${type}时出现错误:该名字已注册`);
        return;
      }
      this.typeMap[type] = {
        parse: parseFunc
      };
    }
    parse(data, vi) {
      const result = {};
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        data = {};
      }
      for (let key of Object.keys(vi)) {
        const type = vi[key][0];
        if (!this.typeMap.hasOwnProperty(type)) {
          continue;
        }
        if (!data.hasOwnProperty(key)) {
          data[key] = null;
        }
        const args = vi[key].slice(1);
        result[key] = this.typeMap[type].parse(data[key], ...args);
      }
      return result;
    }
    getParseFunc(type) {
      if (!this.typeMap.hasOwnProperty(type)) {
        return null;
      }
      return this.typeMap[type].parse;
    }
  };

  // src/index.ts
  function main() {
    let ext = seal.ext.find("game依赖");
    if (!ext) {
      ext = seal.ext.new("game依赖", "错误", "1.0.0");
      seal.ext.register(ext);
    }
    const data = {};
    function getGameManager(ext2) {
      return data.hasOwnProperty(ext2.name) ? data[ext2.name] : new GameManager(ext2);
    }
    function registerGameManager(gm) {
      data[gm.ext.name] = gm;
    }
    globalThis.getGameManager = getGameManager;
    globalThis.registerGameManager = registerGameManager;
    globalThis.varsManager = new VarsManager();
  }
  main();
})();
