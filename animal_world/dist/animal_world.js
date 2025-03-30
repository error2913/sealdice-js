// ==UserScript==
// @name         动物世界
// @author       错误
// @version      1.0.0
// @description  待完善
// @timestamp    1730390918
// 2024-11-01 00:08:38
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/animal_world/dist/animal_world.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/animal_world/dist/animal_world.js
// ==/UserScript==
(() => {
  // src/animal.ts
  function getAnimal(species = "") {
    if (!animalMap.hasOwnProperty(species)) {
      const animals = Object.keys(animalMap);
      species = animals[Math.floor(Math.random() * animals.length)];
    }
    return JSON.parse(JSON.stringify(animalMap[species]));
  }
  var animalMap = {};
  animalMap["黑鱼"] = {
    species: "黑鱼",
    info: "可怕的黑鱼",
    env: "池塘",
    evolve: "白鱼",
    age: [7, 17],
    enemy: ["白鱼", "大鱼", "鱼鹰"],
    food: ["乌龟", "小鱼", "蝌蚪"],
    events: {
      active: ["殴打乌龟"],
      passive: ["死掉"]
    },
    attr: { hp: 10, atk: 100, def: 10, dex: 100, lck: 1 }
  };
  animalMap["白鱼"] = {
    species: "白鱼",
    info: "可怕的白鱼",
    env: "池塘",
    evolve: "",
    age: [17, 37],
    enemy: ["黑鱼", "大鱼", "鱼鹰"],
    food: ["乌龟", "水草", "小鱼"],
    events: {
      active: ["殴打乌龟", "殴打水草"],
      passive: ["死掉"]
    },
    attr: { hp: 100, atk: 50, def: 10, dex: 60, lck: 50 }
  };
  animalMap["乌龟"] = {
    species: "乌龟",
    info: "可怕的乌龟",
    env: "池塘",
    evolve: "",
    age: [0, 100],
    enemy: ["黑鱼", "白鱼", "蛇", "鱼鹰"],
    food: ["水草"],
    events: {
      active: [],
      passive: ["死掉"]
    },
    attr: { hp: 10, atk: 1, def: 100, dex: 1, lck: 1 }
  };
  animalMap["浮游植物"] = {
    species: "浮游植物",
    info: "池塘中的微小植物，提供氧气和养分",
    env: "池塘",
    evolve: "",
    age: [0, 2],
    enemy: ["浮游动物", "小鱼", "水虿", "蝌蚪"],
    food: [],
    events: {
      active: ["光合作用"],
      passive: ["死掉"]
    },
    attr: { hp: 1, atk: 0, def: 0, dex: 0, lck: 50 }
  };
  animalMap["浮游动物"] = {
    species: "浮游动物",
    info: "以浮游植物为食的微小动物，是许多池塘生物的食物",
    env: "池塘",
    evolve: "",
    age: [0, 2],
    enemy: ["小鱼", "水虿", "青蛙"],
    food: ["浮游植物"],
    events: {
      active: [],
      passive: ["死掉"]
    },
    attr: { hp: 2, atk: 1, def: 1, dex: 1, lck: 20 }
  };
  animalMap["水虿"] = {
    species: "水虿",
    info: "蜻蜓的幼虫，水中的小型捕食者",
    env: "池塘",
    evolve: "蜻蜓",
    age: [0, 5],
    enemy: ["青蛙", "鱼类", "蛇"],
    food: ["浮游动物", "孑孓", "蝌蚪"],
    events: {
      active: [],
      passive: ["死掉"]
    },
    attr: { hp: 10, atk: 5, def: 5, dex: 40, lck: 15 }
  };
  animalMap["小鱼"] = {
    species: "小鱼",
    info: "普普通通小小鱼",
    env: "池塘",
    evolve: "黑鱼",
    age: [0, 7],
    enemy: ["青蛙", "鸟", "蛇", "鱼鹰"],
    food: ["浮游动物", "水虿", "孑孓", "蝌蚪"],
    events: {
      active: ["殴打乌龟", "殴打水草"],
      passive: ["死掉"]
    },
    attr: { hp: 15, atk: 5, def: 5, dex: 25, lck: 10 }
  };
  animalMap["蝌蚪"] = {
    species: "蝌蚪",
    info: "青蛙的幼体，水中的小型动物",
    env: "池塘",
    evolve: "青蛙",
    age: [0, 2],
    enemy: ["小鱼", "水虿"],
    food: ["浮游植物"],
    events: {
      active: ["殴打水草"],
      passive: ["死掉"]
    },
    attr: { hp: 5, atk: 1, def: 2, dex: 20, lck: 15 }
  };
  animalMap["青蛙"] = {
    species: "青蛙",
    info: "池塘中的捕食者，吃昆虫和小鱼",
    env: "池塘",
    evolve: "",
    age: [2, 8],
    enemy: ["鸟", "蛇", "鱼鹰"],
    food: ["浮游动物", "孑孓", "小鱼", "水虿"],
    events: {
      active: ["殴打乌龟", "殴打水草"],
      passive: ["死掉"]
    },
    attr: { hp: 30, atk: 10, def: 10, dex: 40, lck: 15 }
  };
  animalMap["鸭子"] = {
    species: "鸭子",
    info: "池塘中的鸟类，喜欢吃水草和小鱼",
    env: "池塘",
    evolve: "",
    age: [0, 10],
    enemy: ["蛇"],
    food: ["水草", "小鱼", "浮游动物"],
    events: {
      active: ["殴打乌龟"],
      passive: ["死掉"]
    },
    attr: { hp: 50, atk: 15, def: 20, dex: 30, lck: 25 }
  };
  animalMap["蛇"] = {
    species: "蛇",
    info: "池塘中的顶级捕食者，捕食青蛙和小型动物",
    env: "池塘",
    evolve: "",
    age: [0, 12],
    enemy: ["鸟", "大型鱼类", "鱼鹰"],
    food: ["青蛙", "小鱼", "乌龟", "鸭子"],
    events: {
      active: ["殴打乌龟"],
      passive: ["死掉"]
    },
    attr: { hp: 60, atk: 30, def: 20, dex: 45, lck: 10 }
  };
  animalMap["水草"] = {
    species: "水草",
    info: "水中的植物，提供食物和庇护",
    env: "池塘",
    evolve: "",
    age: [0, 3],
    enemy: ["乌龟", "鸭子", "鱼类"],
    food: [],
    events: {
      active: ["光合作用"],
      passive: ["死掉"]
    },
    attr: { hp: 20, atk: 0, def: 10, dex: 0, lck: 40 }
  };
  animalMap["孑孓"] = {
    species: "孑孓",
    info: "蚊子幼虫,生活在水中的小型昆虫幼体",
    env: "池塘",
    evolve: "蚊子",
    age: [0, 1],
    enemy: ["小鱼", "水虿", "青蛙"],
    food: ["浮游植物"],
    events: {
      active: [],
      passive: ["死掉"]
    },
    attr: { hp: 2, atk: 1, def: 1, dex: 5, lck: 5 }
  };
  animalMap["蚊子"] = {
    species: "蚊子",
    info: "池塘上空的微小昆虫",
    env: "池塘",
    evolve: "",
    age: [1, 3],
    enemy: ["蜻蜓", "青蛙", "小鱼"],
    food: ["血"],
    events: {
      active: [],
      passive: ["死掉"]
    },
    attr: { hp: 1, atk: 1, def: 0, dex: 90, lck: 10 }
  };
  animalMap["小鸟"] = {
    species: "小鸟",
    info: "池塘周边的捕食者，捕捉青蛙、小鱼和蛇",
    env: "池塘",
    evolve: "",
    age: [0, 10],
    enemy: ["大型鱼类", "蛇"],
    food: ["青蛙", "蛇", "小鱼"],
    events: {
      active: ["殴打乌龟"],
      passive: ["死掉"]
    },
    attr: { hp: 40, atk: 25, def: 15, dex: 50, lck: 30 }
  };
  animalMap["鱼鹰"] = {
    species: "鱼鹰",
    info: "池塘上空的掠食者",
    env: "池塘上空",
    evolve: "",
    age: [0, 20],
    enemy: [],
    food: ["黑鱼", "白鱼", "小鱼", "蛇"],
    events: {
      active: ["殴打乌龟"],
      passive: ["死掉"]
    },
    attr: { hp: 100, atk: 80, def: 20, dex: 70, lck: 35 }
  };

  // src/entry.ts
  function getEntries(n, name = "") {
    const entries = Object.keys(entryMap);
    const result = [];
    for (let i = 0; i < n; i++) {
      if (entries.includes(name)) {
        result.push(entryMap[name]);
      } else {
        const index = Math.floor(Math.random() * entries.length);
        const name2 = entries[index];
        result.push(entryMap[name2]);
        entries.splice(index, 1);
      }
    }
    return result;
  }
  function addEntries(player, entries) {
    entries.forEach((entry) => {
      player.entries.push(entry.name);
      entry.solve(player);
    });
  }
  var entryMap = {};
  entryMap["『胖胖』"] = {
    name: "『胖胖』",
    info: "生命值提高10！",
    solve: (player) => {
      player.animal.attr.hp += 10;
    }
  };
  entryMap["『瘦瘦』"] = {
    name: "『瘦瘦』",
    info: "生命值减少10！",
    solve: (player) => {
      player.animal.attr.hp -= 10;
      if (player.animal.attr.hp < 1) {
        player.animal.attr.hp = 1;
      }
    }
  };
  entryMap["『强大』"] = {
    name: "『强大』",
    info: "攻击值提高10！",
    solve: (player) => {
      player.animal.attr.atk += 10;
    }
  };
  entryMap["『身体虚虚』"] = {
    name: "『身体虚虚』",
    info: "攻击值减少10！",
    solve: (player) => {
      player.animal.attr.atk -= 10;
      if (player.animal.attr.atk < 1) {
        player.animal.attr.atk = 1;
      }
    }
  };
  entryMap["『坚韧』"] = {
    name: "『坚韧』",
    info: "防御值提高10！",
    solve: (player) => {
      player.animal.attr.def += 10;
    }
  };
  entryMap["『迅捷』"] = {
    name: "『迅捷』",
    info: "敏捷值提高10！",
    solve: (player) => {
      player.animal.attr.dex += 10;
    }
  };
  entryMap["『莫名其妙』"] = {
    name: "『莫名其妙』",
    info: "幸运值提高10！",
    solve: (player) => {
      player.animal.attr.lck += 10;
    }
  };
  entryMap["『全面发展』"] = {
    name: "『全面发展』",
    info: "统统提高5！",
    solve: (player) => {
      player.animal.attr.hp += 5;
      player.animal.attr.def += 5;
      player.animal.attr.atk += 5;
      player.animal.attr.dex += 5;
      player.animal.attr.lck += 5;
    }
  };

  // src/utils.ts
  function parseAnimal(data) {
    let animal = {
      species: "未知物种",
      info: "未知",
      env: "未知环境",
      evolve: "",
      age: [0, 999],
      enemy: [],
      food: [],
      events: {
        active: [],
        passive: []
      },
      attr: {
        hp: 0,
        atk: 0,
        def: 0,
        dex: 0,
        lck: 0
      }
    };
    if (!data) {
      return animal;
    }
    try {
      animal = {
        species: data.species,
        info: data.info,
        env: data.env,
        evolve: data.evolve,
        age: data.age,
        enemy: data.enemy,
        food: data.food,
        events: {
          active: data.events.active,
          passive: data.events.passive
        },
        attr: {
          hp: data.attr.hp,
          atk: data.attr.atk,
          def: data.attr.def,
          dex: data.attr.dex,
          lck: data.attr.lck
        }
      };
    } catch (err) {
      console.error(`解析动物失败:`, err);
    }
    return animal;
  }
  function getScoreChart() {
    const scoreChart = Object.values(cache);
    scoreChart.sort((a, b) => b.score - a.score);
    scoreChart.splice(10);
    return scoreChart;
  }
  function BEscapeFromA(playerA, playerB) {
    const [dex1, dex2] = [playerA.animal.attr.dex, playerB.animal.attr.dex];
    if (dex1 * Math.random() < dex2 * Math.random()) {
      return true;
    }
    return false;
  }
  function AHurtB(playerA, playerB) {
    const [lck1, lck2] = [playerA.animal.attr.lck, playerB.animal.attr.lck];
    let crit = false;
    let rate = 0;
    if (lck1 * Math.random() > lck2 * Math.random()) {
      crit = true;
      rate = lck1 / (lck1 + lck2);
    }
    const baseAtk = playerA.animal.attr.atk - playerB.animal.attr.def;
    const baseDamage = baseAtk > 0 ? baseAtk : 1;
    const damage = Math.floor(baseDamage * (1 + rate));
    playerB.animal.attr.hp -= damage;
    return [damage, crit];
  }
  function find(s) {
    let animal;
    let env;
    let event;
    let entry;
    if (animalMap.hasOwnProperty(s)) {
      animal = animalMap[s];
    }
    if (entryMap.hasOwnProperty("『" + s + "』")) {
      entry = entryMap["『" + s + "』"];
    }
    for (let name in envMap) {
      if (name == s) {
        env = envMap[name];
      }
      for (let eventName in envMap[name].events) {
        if (eventName == s) {
          event = envMap[name].events[eventName];
          break;
        }
      }
    }
    return { animal, env, event, entry };
  }

  // src/env.ts
  var envMap = {};
  envMap["池塘"] = {
    name: "池塘",
    info: "这是一个池塘",
    species: ["黑鱼", "白鱼", "乌龟"],
    events: {
      "殴打水草": {
        name: "殴打水草",
        info: "和水草战斗",
        solve: (ctx, msg, players) => {
          const player = players[0];
          if (Math.random() < 0.5) {
            player.animal.attr.hp -= 1;
            seal.replyToSender(ctx, msg, `${player.animal.species}<${player.name}>被水草缠住了，HP-1`);
            return;
          }
          const entry = getEntries(1);
          addEntries(player, entry);
          seal.replyToSender(ctx, msg, `${player.animal.species}<${player.name}>战胜了水草，新的词条：${entry[0].name}`);
        }
      },
      "殴打乌龟": {
        name: "殴打乌龟",
        info: "咬乌龟！",
        solve: (ctx, msg, players) => {
          const player = players[0];
          const turtle = Player.getRandomPlayer(["乌龟"]);
          if (BEscapeFromA(player, turtle)) {
            seal.replyToSender(ctx, msg, `${turtle.animal.species}<${turtle.name}>逃跑了`);
            return;
          }
          const [damage, crit] = AHurtB(player, turtle);
          let text = `${player.animal.species}<${player.name}>殴打了乌龟<${turtle.name}>，${crit ? `暴击了，` : ``}打掉了${damage}血`;
          if (turtle.animal.attr.hp <= 0) {
            const entry = getEntries(1);
            addEntries(player, entry);
            seal.replyToSender(ctx, msg, text + `
${player.animal.species}<${player.name}>打爆了<${turtle.name}>，新的词条：${entry[0].name}`);
            turtle.revive();
            return;
          }
          seal.replyToSender(ctx, msg, text);
        }
      },
      "死掉": {
        name: "死掉",
        info: "死了",
        solve: (ctx, msg, players) => {
          const player = players[0];
          player.revive();
          seal.replyToSender(ctx, msg, `<${player.name}>死了。转生成了新的动物: ${player.animal.species}`);
        }
      },
      "光合作用": {
        name: "光合作用",
        info: "光合作用",
        solve: (ctx, msg, players) => {
          const player = players[0];
          player.animal.attr.hp += 1;
          seal.replyToSender(ctx, msg, `${player.animal.species}<${player.name}>进行光合作用，HP+1`);
        }
      }
    }
  };

  // src/playerManager.ts
  function getPlayerList(ext) {
    let data;
    try {
      data = JSON.parse(ext.storageGet(`playerList`) || "[]");
    } catch (error) {
      console.error(`从数据库中获取playerList失败:`, error);
    }
    if (data && Array.isArray(data)) {
      playerList.push(...data);
    }
    return playerList;
  }
  function savePlayerList(ext) {
    ext.storageSet(`playerList`, JSON.stringify(playerList));
  }
  var playerList = [];

  // src/player.ts
  var Player = class _Player {
    //词条列表
    constructor(id, name) {
      this.id = id;
      this.name = name;
      this.animal = {
        species: "未知物种",
        info: "未知",
        env: "未知环境",
        evolve: "",
        age: [0, 999],
        enemy: [],
        food: [],
        events: {
          active: [],
          passive: []
        },
        attr: {
          hp: 0,
          atk: 0,
          def: 0,
          dex: 0,
          lck: 0
        }
      };
      this.score = 0;
      this.entries = [];
    }
    static getPlayer(ext, id, ctx = void 0) {
      if (!cache.hasOwnProperty(id)) {
        let data;
        try {
          data = JSON.parse(ext.storageGet(`player_${id}`) || "{}");
        } catch (error) {
          console.error(`从数据库中获取player_${id}失败:`, error);
          data = {};
        }
        if (data && Object.keys(data).length > 0) {
          cache[id] = _Player.parse(data);
        } else {
          cache[id] = _Player.createPlayer(id, ctx.player.name || "未知玩家");
          playerList.push(id);
          savePlayerList(ext);
        }
      }
      return cache[id];
    }
    static savePlayer(ext, player) {
      ext.storageSet(`player_${player.id}`, JSON.stringify(player));
    }
    static parse(data) {
      let player;
      if (!data) {
        return new _Player("", "");
      }
      try {
        player = new _Player(data.id, data.name);
        player.animal = parseAnimal(data.animal);
        player.score = data.score;
        player.entries = data.entries;
      } catch (err) {
        console.error(`解析玩家失败:`, err);
        player = new _Player("", "");
      }
      return player;
    }
    static createPlayer(id, name) {
      const player = new _Player(id, name);
      player.animal = getAnimal();
      const entries = getEntries(1);
      addEntries(player, entries);
      return player;
    }
    //TODO:随机ID，随机名字
    static createRobot(species) {
      const player = new _Player(`Robot`, `奇怪的${species}`);
      player.animal = getAnimal(species);
      const entries = getEntries(3);
      addEntries(player, entries);
      return player;
    }
    static getRandomPlayer(speciesList) {
      const players = Object.values(cache).filter((player) => {
        if (speciesList.length == 0) {
          return true;
        }
        return speciesList.includes(player.animal.species);
      });
      if (players.length == 0) {
        return this.createRobot(speciesList[Math.floor(Math.random() * speciesList.length)]);
      }
      return players[Math.floor(Math.random() * players.length)];
    }
    age(ctx, msg) {
      this.animal.age[0] += 1;
      if (this.animal.age[0] > this.animal.age[1]) {
        this.revive();
        seal.replyToSender(ctx, msg, `<${this.name}>老死了。转生成了新的动物: ${this.animal.species}`);
      }
    }
    revive() {
      this.entries = [];
      this.animal = getAnimal();
      const entries = getEntries(1);
      addEntries(this, entries);
    }
    survive(ctx, msg, event) {
      if (event == "觅食" || event == "forage") {
        this.forage(ctx, msg);
        return;
      }
      if (!event || !this.animal.events.active.includes(event)) {
        seal.replyToSender(ctx, msg, `可选：觅食、${this.animal.events.active.join("、")}`);
        return;
      }
      if (!envMap[this.animal.env].events.hasOwnProperty(event)) {
        seal.replyToSender(ctx, msg, `错误，这个事件可能忘记写了:${event}`);
        return;
      }
      envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
      this.age(ctx, msg);
    }
    forage(ctx, msg) {
      const foods = this.animal.food;
      if (foods.length == 0) {
        seal.replyToSender(ctx, msg, `没有可以吃的`);
        this.age(ctx, msg);
        return;
      }
      const food = foods[Math.floor(Math.random() * foods.length)];
      if (!animalMap.hasOwnProperty(food)) {
        const entry = getEntries(1);
        addEntries(this, entry);
        seal.replyToSender(ctx, msg, `${this.animal.species}<${this.name}>吃掉了${food}，新的词条：${entry[0].name}`);
        this.age(ctx, msg);
        return;
      }
      const foodPlayer = _Player.getRandomPlayer([food]);
      if (BEscapeFromA(this, foodPlayer)) {
        seal.replyToSender(ctx, msg, `${foodPlayer.animal.species}<${foodPlayer.name}>逃跑了`);
        this.age(ctx, msg);
        return;
      }
      const [damage, crit] = AHurtB(this, foodPlayer);
      let text = `${this.animal.species}<${this.name}>咬了${foodPlayer.animal.species}<${foodPlayer.name}>，${crit ? `暴击了，` : ``}咬掉了${damage}血`;
      if (foodPlayer.animal.attr.hp <= 0) {
        const entry = getEntries(1);
        addEntries(this, entry);
        seal.replyToSender(ctx, msg, text + `
${this.animal.species}<${this.name}>吃掉了${foodPlayer.animal.species}<${foodPlayer.name}>，新的词条：${entry[0].name}`);
        foodPlayer.revive();
        return;
      }
      seal.replyToSender(ctx, msg, text);
      this.age(ctx, msg);
    }
    explore(ctx, msg) {
      const events = this.animal.events.passive;
      if (Math.random() <= 0.5) {
        this.beAttacked(ctx, msg);
        return;
      }
      if (events.length == 0) {
        seal.replyToSender(ctx, msg, `没有可以探索的`);
        return;
      }
      const event = events[Math.floor(Math.random() * events.length)];
      if (!envMap[this.animal.env].events.hasOwnProperty(event)) {
        seal.replyToSender(ctx, msg, `错误，这个事件可能忘记写了:${event}`);
        return;
      }
      envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
      this.age(ctx, msg);
    }
    beAttacked(ctx, msg) {
      const enemys = this.animal.enemy;
      if (enemys.length == 0) {
        seal.replyToSender(ctx, msg, `什么都没有发生`);
        this.age(ctx, msg);
        return;
      }
      const enemy = enemys[Math.floor(Math.random() * enemys.length)];
      if (!animalMap.hasOwnProperty(enemy)) {
        seal.replyToSender(ctx, msg, `错误，这个敌人可能忘记写了:${enemy}`);
        return;
      }
      const enemyPlayer = _Player.getRandomPlayer([enemy]);
      if (BEscapeFromA(enemyPlayer, this)) {
        seal.replyToSender(ctx, msg, `遭遇${enemyPlayer.animal.species}<${enemyPlayer.name}>袭击，你逃跑了`);
        this.age(ctx, msg);
        return;
      }
      const [damage, crit] = AHurtB(enemyPlayer, this);
      let text = `遭遇${enemyPlayer.animal.species}<${enemyPlayer.name}>袭击，${crit ? `暴击了，` : ``}被咬掉了${damage}血`;
      if (this.animal.attr.hp <= 0) {
        this.revive();
        seal.replyToSender(ctx, msg, text + `
<${this.name}>被吃掉了，转生成了新的动物: ${this.animal.species}`);
        return;
      }
      seal.replyToSender(ctx, msg, text);
      this.age(ctx, msg);
    }
    multiply(ctx, msg) {
      if (this.animal.age[0] < this.animal.age[1] * 0.15) {
        seal.replyToSender(ctx, msg, `繁衍失败，年龄不够`);
        return;
      }
      if (Math.random() * this.animal.attr.hp <= 1) {
        seal.replyToSender(ctx, msg, `繁衍失败`);
        this.age(ctx, msg);
        return;
      }
      const num = Math.ceil(Math.random() * 200 / this.animal.age[1]);
      this.score += num;
      const entry = getEntries(1);
      addEntries(this, entry);
      seal.replyToSender(ctx, msg, `${this.animal.species}<${this.name}>繁衍了${num}个后代，积分加${num}。新的词条：${entry[0].name}`);
      this.age(ctx, msg);
      return;
    }
    evolve(ctx, msg) {
      if (!this.animal.evolve) {
        seal.replyToSender(ctx, msg, `进化失败，没有进化路线`);
        return;
      }
      if (this.entries.length < 5) {
        seal.replyToSender(ctx, msg, `进化失败，词条不足`);
        return;
      }
      this.entries.splice(0, 5);
      this.animal = getAnimal(this.animal.evolve);
      const entries = getEntries(1);
      addEntries(this, entries);
      this.score += 5;
      seal.replyToSender(ctx, msg, `<${this.name}>进化了，进化为${this.animal.species}。得5分`);
    }
    /* TODO
    //遭遇其他玩家？
    public meet(ctx: seal.MsgContext, msg: seal.Message): void {}
    */
  };

  // src/index.ts
  var cache = {};
  function initPlayers(ext) {
    const playerList2 = getPlayerList(ext);
    playerList2.forEach((id) => {
      Player.getPlayer(ext, id);
    });
  }
  function main() {
    let ext = seal.ext.find("animalWorld");
    if (!ext) {
      ext = seal.ext.new("animalWorld", "错误", "1.0.0");
      seal.ext.register(ext);
    }
    initPlayers(ext);
    const cmdAW = seal.ext.newCmdItemInfo();
    cmdAW.name = "aw";
    cmdAW.help = "TODO";
    cmdAW.solve = (ctx, msg, cmdArgs) => {
      let val = cmdArgs.getArgN(1);
      switch (val) {
        case "info": {
          const player = Player.getPlayer(ext, ctx.player.userId, ctx);
          const entries = player.entries;
          const map = {};
          entries.forEach((entry) => {
            map[entry] = map[entry] + 1 || 1;
          });
          const entries2 = [];
          for (let entry in map) {
            entries2.push(`${entry}×${map[entry]}`);
          }
          const text = `昵称:<${player.name}>
物种:${player.animal.species} | 年龄:${player.animal.age[0]}/${player.animal.age[1]}
攻击:${player.animal.attr.atk} | 防御:${player.animal.attr.def} | 敏捷:${player.animal.attr.dex}
幸运:${player.animal.attr.lck} | 生命:${player.animal.attr.hp} | 积分:${player.score}
词条:
${entries2.join("\n")}`;
          seal.replyToSender(ctx, msg, text);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "排行榜":
        case "chart": {
          const scoreChart = getScoreChart();
          if (scoreChart.length == 0) {
            seal.replyToSender(ctx, msg, "暂无记录。");
            return seal.ext.newCmdExecuteResult(true);
          }
          let text = `排行榜
♚`;
          for (let i = 0; i < 10 && i < scoreChart.length; i++) {
            const player = scoreChart[i];
            text += `第${i + 1}名: <${player.name}>  ${player.score}
`;
          }
          seal.replyToSender(ctx, msg, text);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "查询":
        case "find": {
          const s = cmdArgs.getArgN(2);
          const { animal, env, event, entry } = find(s);
          let text = `查询结果如下:`;
          if (animal) {
            text += `
动物:${animal.info}`;
          }
          if (env) {
            text += `
环境:${env.info}`;
          }
          if (event) {
            text += `
事件:${event.info}`;
          }
          if (entry) {
            text += `
词条:${entry.info}`;
          }
          seal.replyToSender(ctx, msg, text);
          return seal.ext.newCmdExecuteResult(true);
        }
        default: {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
      }
    };
    ext.cmdMap["aw"] = cmdAW;
    ext.cmdMap["阿瓦"] = cmdAW;
    const cmdRevive = seal.ext.newCmdItemInfo();
    cmdRevive.name = "revive";
    cmdRevive.help = "没有帮助";
    cmdRevive.solve = (ctx, msg, _) => {
      const player = Player.getPlayer(ext, ctx.player.userId, ctx);
      player.revive();
      seal.replyToSender(ctx, msg, `${player.name}转生成了新的动物: ${player.animal.species}`);
      Player.savePlayer(ext, player);
      return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap["revive"] = cmdRevive;
    ext.cmdMap["转生"] = cmdRevive;
    const cmdSurvive = seal.ext.newCmdItemInfo();
    cmdSurvive.name = "survive";
    cmdSurvive.help = "没有帮助";
    cmdSurvive.solve = (ctx, msg, cmdArgs) => {
      const event = cmdArgs.getArgN(1);
      const player = Player.getPlayer(ext, ctx.player.userId, ctx);
      player.survive(ctx, msg, event);
      Player.savePlayer(ext, player);
      return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap["survive"] = cmdSurvive;
    ext.cmdMap["生存"] = cmdSurvive;
    const cmdExplore = seal.ext.newCmdItemInfo();
    cmdExplore.name = "explore";
    cmdExplore.help = "";
    cmdExplore.solve = (ctx, msg, _) => {
      const player = Player.getPlayer(ext, ctx.player.userId, ctx);
      player.explore(ctx, msg);
      Player.savePlayer(ext, player);
      return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap["explore"] = cmdExplore;
    ext.cmdMap["探索"] = cmdExplore;
    const cmdMultiply = seal.ext.newCmdItemInfo();
    cmdMultiply.name = "multiply";
    cmdMultiply.help = "没有帮助";
    cmdMultiply.solve = (ctx, msg, _) => {
      const player = Player.getPlayer(ext, ctx.player.userId, ctx);
      player.multiply(ctx, msg);
      Player.savePlayer(ext, player);
      return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap["multiply"] = cmdMultiply;
    ext.cmdMap["繁衍"] = cmdMultiply;
    const cmdEvolve = seal.ext.newCmdItemInfo();
    cmdEvolve.name = "evolve";
    cmdEvolve.help = "";
    cmdEvolve.solve = (ctx, msg, _) => {
      const player = Player.getPlayer(ext, ctx.player.userId, ctx);
      player.evolve(ctx, msg);
      Player.savePlayer(ext, player);
      return seal.ext.newCmdExecuteResult(true);
    };
    ext.cmdMap["evolve"] = cmdEvolve;
    ext.cmdMap["进化"] = cmdEvolve;
  }
  main();
})();
