// ==UserScript==
// @name         team
// @author       错误
// @version      4.0.1
// @description  这是一个海豹插件，它提供了一套完整的队伍管理功能，允许用户在 QQ 群组中创建和管理队伍。\n- 更多自定义配置请查看配置项（即插件设置部分）。\n - 如果你也是一名插件作者，你也可以通过globalThis.teamManager.xxx在你的插件中来调用该插件的方法。具体方法请在src/teamManager.ts中查看。\n- 若使用过程中遇到问题或BUG，请联系开发者。如果您有更好的想法，欢迎前往主页提交 Pull Request 或 Issue，共同完善该插件
// @timestamp    1724468302
// 2024-08-24 10:58:22
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/release/team.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/release/team.js
// ==/UserScript==

(() => {
  // src/configManager.ts
  var ConfigManager = class {
    constructor(ext) {
      this.ext = ext;
    }
    registerConfig() {
      seal.ext.registerTemplateConfig(this.ext, "新建队伍", ["新建<{{队伍名字}}>成功"]);
      seal.ext.registerTemplateConfig(this.ext, "绑定队伍", ["绑定<{{队伍名字}}>成功"]);
      seal.ext.registerTemplateConfig(this.ext, "删除队伍", ["删除队伍成功：\n{{队伍列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "队伍列表", ["队伍如下：\n{{队伍列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "添加成员", ["成功添加{{@的人数}}位成员，当前队伍人数{{队伍人数}}人"]);
      seal.ext.registerTemplateConfig(this.ext, "移除成员", ["成功移除{{@的人数}}位成员，当前队伍人数{{队伍人数}}人"]);
      seal.ext.registerTemplateConfig(this.ext, "抽取成员", ["抽到了：\n{{成员列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "呼叫成员", ["请在限定时间60s内回复“到”：\n{{成员列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "呼叫结束", ["应到{{队伍人数}}人，实到{{签到人数}}人，未到{{咕咕人数}}人。未到如下：\n{{成员列表}}"]);
      seal.ext.registerIntConfig(this.ext, "呼叫时间限制/s", 60);
      seal.ext.registerTemplateConfig(this.ext, "展示属性", ["属性如下：\n{{成员属性列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "设置属性", ["修改如下：\n{{修改操作}}\n{{成员属性列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "排序属性", ["排序如下：\n{{成员属性列表}}"]);
      seal.ext.registerTemplateConfig(this.ext, "提示队伍为空", ["队伍里没有成员。"]);
      seal.ext.registerTemplateConfig(this.ext, "提示队伍不存在", ["队伍不存在。"]);
      seal.ext.registerTemplateConfig(this.ext, "提示正在呼叫", ["当前正在呼叫中。"]);
      seal.ext.registerTemplateConfig(this.ext, "战斗轮排序关键词", ["（战斗轮开始）"]);
      seal.ext.registerTemplateConfig(this.ext, "签到关键词", ["到"]);
      seal.ext.registerStringConfig(this.ext, "分隔符", "\n", "队伍列表，成员列表等的分割符");
    }
    getRandomTemplate(key) {
      const templates = seal.ext.getTemplateConfig(this.ext, key);
      return templates[Math.floor(Math.random() * templates.length)];
    }
    createText(name) {
      const text = this.getRandomTemplate("新建队伍").replace("{{队伍名字}}", name);
      return text;
    }
    bindText(name) {
      const text = this.getRandomTemplate("绑定队伍").replace("{{队伍名字}}", name);
      return text;
    }
    delText(nameList) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = nameList.map((name) => `<${name}>`).join(sperator);
      const text = this.getRandomTemplate("删除队伍").replace("{{队伍列表}}", listText);
      return text;
    }
    getListText(teamList) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = teamList.map((team, index) => {
        if (index == 0) {
          return `<${team.name}> ${team.members.length}人◎`;
        }
        return `<${team.name}> ${team.members.length}人`;
      }).join(sperator);
      const text = this.getRandomTemplate("队伍列表").replace("{{队伍列表}}", listText);
      return text;
    }
    addText(atNum, memberNum) {
      const text = this.getRandomTemplate("添加成员").replace("{{@的人数}}", atNum.toString()).replace("{{队伍人数}}", memberNum.toString());
      return text;
    }
    removeText(atNum, memberNum) {
      const text = this.getRandomTemplate("移除成员").replace("{{@的人数}}", atNum.toString()).replace("{{队伍人数}}", memberNum.toString());
      return text;
    }
    drawText(nameList) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = nameList.join(sperator);
      const text = this.getRandomTemplate("抽取成员").replace("{{成员列表}}", listText);
      return text;
    }
    callText(callList) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = callList.map((userId) => `[CQ:at,qq=${userId.replace(/\D+/g, "")}]`).join(sperator);
      const text = this.getRandomTemplate("呼叫成员").replace("{{成员列表}}", listText);
      return text;
    }
    recallText(callList, memberNum, signNum, guguNum) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = callList.map((userId) => `[CQ:at,qq=${userId.replace(/\D+/g, "")}]`).join(sperator);
      const text = this.getRandomTemplate("呼叫结束").replace("{{队伍人数}}", memberNum.toString()).replace("{{签到人数}}", signNum.toString()).replace("{{咕咕人数}}", guguNum.toString()).replace("{{成员列表}}", listText);
      return text;
    }
    showText(members, keys) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = members.map((item) => {
        let text2 = item.name;
        if (keys.length === 0) {
          const hp = item.attr["hp"];
          const max_hp = Math.floor((item.attr["con"] + item.attr["siz"]) / 10);
          text2 += ` hp${hp}/${max_hp}`;
          const san = item.attr["san"];
          const pow = item.attr["pow"];
          text2 += ` san${san}/${pow}`;
          const dex = item.attr["dex"];
          text2 += ` dex${dex}`;
        } else {
          for (const key of keys) {
            text2 += ` ${key}${item.attr[key]}`;
          }
        }
        return text2;
      }).join(sperator);
      const text = this.getRandomTemplate("展示属性").replace("{{成员属性列表}}", listText);
      return text;
    }
    setText(members, key, valueText) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = members.map((item) => {
        let text2 = item.name;
        text2 += ` ${key}=>${item.attr[key]}`;
        return text2;
      }).join(sperator);
      const text = this.getRandomTemplate("设置属性").replace("{{修改操作}}", `操作:${valueText}`).replace("{{成员属性列表}}", listText);
      return text;
    }
    sortText(members, key) {
      const sperator = seal.ext.getStringConfig(this.ext, "分隔符");
      const listText = members.map((item) => {
        let text2 = item.name;
        text2 += ` ${key}${item.attr[key]}`;
        return text2;
      }).join(sperator);
      const text = this.getRandomTemplate("排序属性").replace("{{成员属性列表}}", listText);
      return text;
    }
    emptyText() {
      return this.getRandomTemplate("提示队伍为空");
    }
    notExistText() {
      return this.getRandomTemplate("提示队伍不存在");
    }
    isCallingText() {
      return this.getRandomTemplate("提示正在呼叫");
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

  // src/teamManager.ts
  var TeamManager = class {
    constructor(ext) {
      this.team = {
        name: "默认队伍",
        members: []
      };
      this.teamList = [{ name: "默认队伍", members: [] }];
      this.cache = {};
      this.ext = ext;
    }
    saveTeamList(id, teamList) {
      this.cache[id] = teamList;
      this.ext.storageSet(`${id}_teamList`, JSON.stringify(teamList));
    }
    saveCallList(id, callList) {
      this.ext.storageSet(`${id}_callList`, JSON.stringify(callList));
    }
    /**
     * 获取队伍列表
     * @param {string} id QQ群号，groupId
     * @returns {Team[]} 队伍列表
     */
    getTeamList(id) {
      if (!this.cache.hasOwnProperty(id)) {
        let teamList = this.teamList;
        try {
          const data = JSON.parse(this.ext.storageGet(`${id}_teamList`) || "[]");
          if (data && Array.isArray(data) && data.length !== 0) {
            teamList = data.map((item) => {
              return {
                name: item.name || "默认队伍",
                members: item.members || []
              };
            });
          }
        } catch (err) {
          console.error(`在获取${id}_teamList时发生错误：${err}`);
        }
        this.cache[id] = teamList;
      }
      return this.cache[id];
    }
    /**
     * 获取呼叫列表
     * @param {string} id QQ群号，groupId
     * @returns {string[]} 呼叫成员userId列表
     */
    getCallList(id) {
      let callList = [];
      try {
        const data = JSON.parse(this.ext.storageGet(`${id}_callList`) || "[]");
        if (data && Array.isArray(data)) {
          callList = data;
        }
      } catch (err) {
        console.error(`在获取${id}_callList时发生错误：${err}`);
      }
      return callList;
    }
    /**
     * 绑定或新建队伍，新建时清除没有成员的默认队伍
     * @param {string} id QQ群号，groupId
     * @param {string} name 队伍名字
     * @returns 若绑定队伍则返回true，新建队伍则返回false
     */
    bind(id, name) {
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      var index = teamList.findIndex((item) => item.name === name);
      if (index !== -1) {
        team = teamList[index];
        teamList.splice(index, 1);
        teamList.unshift(team);
        this.saveTeamList(id, teamList);
        return true;
      } else {
        teamList = teamList.filter((item) => item.name !== "默认队伍" || item.members.length !== 0);
        team = {
          name,
          members: []
        };
        teamList.unshift(team);
        this.saveTeamList(id, teamList);
        return false;
      }
    }
    /**
     * 删除队伍
     * @param {string} id QQ群号，groupId
     * @param {string} name 队伍名字
     * @param {seal.Kwarg[]} kwargs 关键字参数，可包含now，all
     * @returns {string[]} 删除成功返回队伍名字列表，否则返回空列表，意味着队伍不存在
     */
    delete(id, name, kwargs) {
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      const keys = kwargs.map((item) => {
        return item.name;
      });
      if (keys.includes("all")) {
        const nameList = teamList.map((team2) => team2.name);
        teamList = this.teamList;
        this.saveTeamList(id, teamList);
        return nameList;
      }
      if (keys.includes("now")) {
        name = team.name;
      } else if (!teamList.some((item) => item.name === name)) {
        return [];
      }
      teamList = teamList.filter((item) => item.name !== name);
      if (teamList.length == 0) {
        teamList.unshift(this.team);
      }
      this.saveTeamList(id, teamList);
      return [name];
    }
    /**
     * 添加成员到当前队伍
     * @param {seal.MsgContext} ctx 
     * @param {string[]} atList at的用户id列表
     * @returns {string[]} 成员userId列表
     */
    add(ctx, atList) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      atList.forEach((userId) => {
        if (!team.members.includes(userId)) {
          team.members.push(userId);
        }
      });
      teamList[0] = team;
      this.saveTeamList(id, teamList);
      return team.members;
    }
    /**
     * 从当前队伍删除成员
     * @param {seal.MsgContext} ctx
     * @param {string[]} atList at的用户id列表
     * @param {seal.Kwarg[]} kwargs 关键字参数，可包含all
     * @returns {string[]} 成员userId列表
     */
    remove(ctx, atList, kwargs) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      const keys = kwargs.map((item) => {
        return item.name;
      });
      if (keys.includes("all")) {
        team.members = [];
      } else {
        team.members = team.members.filter((userId) => !atList.includes(userId));
      }
      teamList[0] = team;
      this.saveTeamList(id, teamList);
      return team.members;
    }
    /**
     * 随机抽取成员
     * @param {seal.MsgContext} ctx
     * @param {number} n 抽取人数
     * @returns {[string[], boolean]} 抽取的成员name列表
     */
    draw(ctx, n) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      let result = [];
      let members = team.members.slice();
      while (result.length < n && members.length > 0) {
        const index = Math.floor(Math.random() * members.length);
        const userId = members.splice(index, 1)[0];
        const msg = getMsg("group", userId, id);
        const mctx = getCtx(ctx.endPoint.userId, msg);
        result.push(mctx.player.name);
      }
      return result;
    }
    /**
     * 呼叫成员
     * @param {seal.MsgContext} ctx
     * @returns {[string[], boolean]} [呼叫的成员userId列表，是否正在呼叫中]
     */
    call(ctx) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      let callList = this.getCallList(id);
      if (callList.length > 0) {
        return [callList, true];
      }
      callList = team.members.slice();
      this.saveCallList(id, callList);
      const timeLimit = seal.ext.getIntConfig(this.ext, "呼叫时间限制/s") * 1e3;
      setTimeout(() => {
        this.recall(ctx);
      }, timeLimit);
      return [callList, false];
    }
    /**
     * 签到
     * @param {seal.MsgContext} ctx
     */
    signUp(ctx) {
      const id = ctx.group.groupId;
      const userId = ctx.player.userId;
      const callList = this.getCallList(id);
      if (callList.length == 0) {
        return;
      }
      const index = callList.indexOf(userId);
      if (index !== -1) {
        callList.splice(index, 1);
        this.saveCallList(id, callList);
      }
    }
    /**
     * 结束呼叫
     * @param {seal.MsgContext} ctx
     */
    recall(ctx) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      let callList = this.getCallList(id);
      const configManager = new ConfigManager(this.ext);
      const memberNum = team.members.length;
      const guguNum = callList.length;
      const signNum = memberNum - guguNum;
      let reply = configManager.recallText(callList, memberNum, signNum, guguNum);
      reply = seal.format(ctx, reply);
      callList = [];
      this.saveCallList(id, callList);
      const msg = getMsg("group", ctx.player.userId, id);
      seal.replyToSender(ctx, msg, reply);
    }
    /**
     * 展示队伍
     * @param {seal.MsgContext} ctx
     * @param {string[]} keys 属性名列表
     * @returns {member[]} 成员属性列表
     */
    show(ctx, keys) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      let members = team.members.map((userId) => {
        const msg = getMsg("group", userId, id);
        const mctx = getCtx(ctx.endPoint.userId, msg);
        const attr = {};
        if (keys.length === 0) {
          keys = ["hp", "con", "siz", "san", "pow", "dex"];
        }
        keys.forEach((key) => {
          attr[key] = seal.vars.intGet(mctx, key)[0];
        });
        return {
          name: mctx.player.name,
          attr
        };
      });
      return members;
    }
    /**
     * 设置属性
     * @param {seal.MsgContext} ctx 
     * @param {string} key 属性名
     * @param {string} valueText 表达式文本
     * @returns {member[]} 成员属性列表
     */
    set(ctx, key, valueText) {
      const id = ctx.group.groupId;
      let teamList = this.getTeamList(id);
      let team = teamList[0];
      let members = team.members.map((userId) => {
        const msg = getMsg("group", userId, id);
        const mctx = getCtx(ctx.endPoint.userId, msg);
        if (["+", "-", "*", "/"].includes(valueText[0])) {
          valueText = key + valueText;
        }
        let value = parseInt(seal.format(mctx, `{${valueText}}`));
        value = isNaN(value) ? 0 : value;
        seal.vars.intSet(mctx, key, value);
        const attr = {};
        attr[key] = seal.vars.intGet(mctx, key)[0];
        return {
          name: mctx.player.name,
          attr
        };
      });
      return members;
    }
    /**
     * 排序属性
     * @param {seal.MsgContext} ctx 
     * @param {string} key 属性名
     * @returns {member[]} 成员属性列表
     */
    sort(ctx, key) {
      let members = this.show(ctx, [key]);
      members.sort((a, b) => {
        return b.attr[key] - a.attr[key];
      });
      return members;
    }
  };

  // src/index.ts
  function main() {
    let ext = seal.ext.find("team");
    if (!ext) {
      ext = seal.ext.new("team", "错误", "4.0.1");
      seal.ext.register(ext);
    }
    const teamManager = new TeamManager(ext);
    const configManager = new ConfigManager(ext);
    configManager.registerConfig();
    const cmdteam = seal.ext.newCmdItemInfo();
    cmdteam.name = "team";
    cmdteam.help = `帮助：
【.team bind <队伍名字>】绑定/新建队伍
【.team del <队伍名字>】删除队伍
【.team del --all】删除所有队伍
【.team del --now】删除当前队伍
【.team list】查看队伍列表
【.team add ...@玩家】添加若干成员
【.team rm ...@玩家】删除若干成员
【.team rm --all】删除所有成员
【.team draw <抽取数量=1>】随机抽取队伍内成员
【.team call】限时呼叫队内成员
【.team show ...<属性名>】查看队内成员属性
【.team st <属性名> <表达式>】修改队内成员属性
【.team sort <属性名>】对队内成员属性进行排序`;
    cmdteam.allowDelegate = true;
    cmdteam.disabledInPrivate = true;
    cmdteam.solve = (ctx, msg, cmdArgs) => {
      ctx.delegateText = "";
      const val = cmdArgs.getArgN(1);
      const id = ctx.group.groupId;
      switch (val) {
        case "bd":
        case "bind": {
          const name = cmdArgs.getRestArgsFrom(2);
          if (!name) {
            seal.replyToSender(ctx, msg, "提示:【.team bind <队伍名字>】队伍名字缺失");
            return seal.ext.newCmdExecuteResult(true);
          }
          const result = teamManager.bind(id, name);
          const reply = result ? configManager.bindText(name) : configManager.createText(name);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "del":
        case "delete": {
          const name = cmdArgs.getRestArgsFrom(2);
          const kwargs = cmdArgs.kwargs;
          if (!name && kwargs.length == 0) {
            seal.replyToSender(ctx, msg, "提示:【.team del <队伍名字>】队伍名字缺失");
            return seal.ext.newCmdExecuteResult(true);
          }
          const nameList = teamManager.delete(id, name, kwargs);
          const reply = nameList.length !== 0 ? configManager.delText(nameList) : configManager.notExistText();
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "lst":
        case "list": {
          const teamList = teamManager.getTeamList(id);
          const reply = configManager.getListText(teamList);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "add": {
          let atList = cmdArgs.at.filter((item) => item.userId !== ctx.endPoint.userId).map((item) => item.userId);
          const members = teamManager.add(ctx, atList);
          const reply = configManager.addText(atList.length, members.length);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "rm":
        case "remove": {
          let atList = cmdArgs.at.filter((item) => item.userId !== ctx.endPoint.userId).map((item) => item.userId);
          const kwargs = cmdArgs.kwargs;
          const members = teamManager.remove(ctx, atList, kwargs);
          const reply = configManager.removeText(atList.length, members.length);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "draw": {
          const teamList = teamManager.getTeamList(id);
          if (teamList[0].members.length === 0) {
            const reply2 = configManager.emptyText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          let num = parseInt(cmdArgs.getArgN(2));
          if (isNaN(num) || num < 1) {
            num = 1;
          }
          const nameList = teamManager.draw(ctx, num);
          const reply = configManager.drawText(nameList);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "call": {
          const teamList = teamManager.getTeamList(id);
          if (teamList[0].members.length === 0) {
            const reply2 = configManager.emptyText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          const [callList, isCalling] = teamManager.call(ctx);
          if (isCalling) {
            const reply2 = configManager.isCallingText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          const reply = configManager.callText(callList);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "show": {
          const teamList = teamManager.getTeamList(id);
          if (teamList[0].members.length === 0) {
            const reply2 = configManager.emptyText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          const keys = cmdArgs.args.slice();
          keys.splice(0, 1);
          const members = teamManager.show(ctx, keys);
          const reply = configManager.showText(members, keys);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "st": {
          const teamList = teamManager.getTeamList(id);
          if (teamList[0].members.length === 0) {
            const reply2 = configManager.emptyText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          const key = cmdArgs.getArgN(2);
          const valueText = cmdArgs.getArgN(3);
          if (!valueText) {
            seal.replyToSender(ctx, msg, "提示:【.team st <属性名> <表达式>】表达式缺失");
            return seal.ext.newCmdExecuteResult(true);
          }
          const members = teamManager.set(ctx, key, valueText);
          const reply = configManager.setText(members, key, valueText);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "sort": {
          const teamList = teamManager.getTeamList(id);
          if (teamList[0].members.length === 0) {
            const reply2 = configManager.emptyText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          const key = cmdArgs.getArgN(2);
          if (!key) {
            seal.replyToSender(ctx, msg, "提示:【.team sort 属性名】属性名缺失");
            return seal.ext.newCmdExecuteResult(true);
          }
          const members = teamManager.sort(ctx, key);
          const reply = configManager.sortText(members, key);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        default: {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
      }
    };
    ext.onNotCommandReceived = (ctx, msg) => {
      if (ctx.isPrivate) return;
      const message = msg.message;
      const sortWords = seal.ext.getTemplateConfig(ext, "战斗轮排序关键词");
      const signWords = seal.ext.getTemplateConfig(ext, "签到关键词");
      if (signWords.includes(message)) {
        teamManager.signUp(ctx);
        return;
      }
      if (sortWords.includes(message)) {
        const id = ctx.group.groupId;
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply2 = configManager.emptyText();
          seal.replyToSender(ctx, msg, reply2);
          return;
        }
        const key = "dex";
        const members = teamManager.sort(ctx, key);
        const reply = configManager.sortText(members, key);
        seal.replyToSender(ctx, msg, reply);
        return;
      }
    };
    ext.cmdMap["team"] = cmdteam;
    ext.cmdMap["tm"] = cmdteam;
    globalThis.teamManager = teamManager;
  }
  main();
})();
