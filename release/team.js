// ==UserScript==
// @name         team
// @author       错误
// @version      4.0.0
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
      seal.ext.registerTemplateConfig(this.ext, "\u65B0\u5EFA\u961F\u4F0D", ["\u65B0\u5EFA<{{\u961F\u4F0D\u540D\u5B57}}>\u6210\u529F"]);
      seal.ext.registerTemplateConfig(this.ext, "\u7ED1\u5B9A\u961F\u4F0D", ["\u7ED1\u5B9A<{{\u961F\u4F0D\u540D\u5B57}}>\u6210\u529F"]);
      seal.ext.registerTemplateConfig(this.ext, "\u5220\u9664\u961F\u4F0D", ["\u5220\u9664\u961F\u4F0D\u6210\u529F\uFF1A\n{{\u961F\u4F0D\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u961F\u4F0D\u5217\u8868", ["\u961F\u4F0D\u5982\u4E0B\uFF1A\n{{\u961F\u4F0D\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u6DFB\u52A0\u6210\u5458", ["\u6210\u529F\u6DFB\u52A0{{@\u7684\u4EBA\u6570}}\u4F4D\u6210\u5458\uFF0C\u5F53\u524D\u961F\u4F0D\u4EBA\u6570{{\u961F\u4F0D\u4EBA\u6570}}\u4EBA"]);
      seal.ext.registerTemplateConfig(this.ext, "\u79FB\u9664\u6210\u5458", ["\u6210\u529F\u79FB\u9664{{@\u7684\u4EBA\u6570}}\u4F4D\u6210\u5458\uFF0C\u5F53\u524D\u961F\u4F0D\u4EBA\u6570{{\u961F\u4F0D\u4EBA\u6570}}\u4EBA"]);
      seal.ext.registerTemplateConfig(this.ext, "\u62BD\u53D6\u6210\u5458", ["\u62BD\u5230\u4E86\uFF1A\n{{\u6210\u5458\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u547C\u53EB\u6210\u5458", ["\u8BF7\u5728\u9650\u5B9A\u65F6\u95F460s\u5185\u56DE\u590D\u201C\u5230\u201D\uFF1A\n{{\u6210\u5458\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u547C\u53EB\u7ED3\u675F", ["\u5E94\u5230{{\u961F\u4F0D\u4EBA\u6570}}\u4EBA\uFF0C\u5B9E\u5230{{\u7B7E\u5230\u4EBA\u6570}}\u4EBA\uFF0C\u672A\u5230{{\u5495\u5495\u4EBA\u6570}}\u4EBA\u3002\u672A\u5230\u5982\u4E0B\uFF1A\n{{\u6210\u5458\u5217\u8868}}"]);
      seal.ext.registerIntConfig(this.ext, "\u547C\u53EB\u65F6\u95F4\u9650\u5236/s", 60);
      seal.ext.registerTemplateConfig(this.ext, "\u5C55\u793A\u5C5E\u6027", ["\u5C5E\u6027\u5982\u4E0B\uFF1A\n{{\u6210\u5458\u5C5E\u6027\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u8BBE\u7F6E\u5C5E\u6027", ["\u4FEE\u6539\u5982\u4E0B\uFF1A\n{{\u4FEE\u6539\u64CD\u4F5C}}\n{{\u6210\u5458\u5C5E\u6027\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u6392\u5E8F\u5C5E\u6027", ["\u6392\u5E8F\u5982\u4E0B\uFF1A\n{{\u6210\u5458\u5C5E\u6027\u5217\u8868}}"]);
      seal.ext.registerTemplateConfig(this.ext, "\u63D0\u793A\u961F\u4F0D\u4E3A\u7A7A", ["\u961F\u4F0D\u91CC\u6CA1\u6709\u6210\u5458\u3002"]);
      seal.ext.registerTemplateConfig(this.ext, "\u63D0\u793A\u961F\u4F0D\u4E0D\u5B58\u5728", ["\u961F\u4F0D\u4E0D\u5B58\u5728\u3002"]);
      seal.ext.registerTemplateConfig(this.ext, "\u63D0\u793A\u6B63\u5728\u547C\u53EB", ["\u5F53\u524D\u6B63\u5728\u547C\u53EB\u4E2D\u3002"]);
      seal.ext.registerTemplateConfig(this.ext, "\u6218\u6597\u8F6E\u6392\u5E8F\u5173\u952E\u8BCD", ["\uFF08\u6218\u6597\u8F6E\u5F00\u59CB\uFF09"]);
      seal.ext.registerTemplateConfig(this.ext, "\u7B7E\u5230\u5173\u952E\u8BCD", ["\u5230"]);
      seal.ext.registerStringConfig(this.ext, "\u5206\u9694\u7B26", "\n", "\u961F\u4F0D\u5217\u8868\uFF0C\u6210\u5458\u5217\u8868\u7B49\u7684\u5206\u5272\u7B26");
    }
    getRandomTemplate(key) {
      const templates = seal.ext.getTemplateConfig(this.ext, key);
      return templates[Math.floor(Math.random() * templates.length)];
    }
    createText(name) {
      const text = this.getRandomTemplate("\u65B0\u5EFA\u961F\u4F0D").replace("{{\u961F\u4F0D\u540D\u5B57}}", name);
      return text;
    }
    bindText(name) {
      const text = this.getRandomTemplate("\u7ED1\u5B9A\u961F\u4F0D").replace("{{\u961F\u4F0D\u540D\u5B57}}", name);
      return text;
    }
    delText(nameList) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = nameList.map((name) => `<${name}>`).join(sperator);
      const text = this.getRandomTemplate("\u5220\u9664\u961F\u4F0D").replace("{{\u961F\u4F0D\u5217\u8868}}", listText);
      return text;
    }
    getListText(teamList) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = teamList.map((team, index) => {
        if (index == 0) {
          return `<${team.name}> ${team.members.length}\u4EBA\u25CE`;
        }
        return `<${team.name}> ${team.members.length}\u4EBA`;
      }).join(sperator);
      const text = this.getRandomTemplate("\u961F\u4F0D\u5217\u8868").replace("{{\u961F\u4F0D\u5217\u8868}}", listText);
      return text;
    }
    addText(atNum, memberNum) {
      const text = this.getRandomTemplate("\u6DFB\u52A0\u6210\u5458").replace("{{@\u7684\u4EBA\u6570}}", atNum.toString()).replace("{{\u961F\u4F0D\u4EBA\u6570}}", memberNum.toString());
      return text;
    }
    removeText(atNum, memberNum) {
      const text = this.getRandomTemplate("\u79FB\u9664\u6210\u5458").replace("{{@\u7684\u4EBA\u6570}}", atNum.toString()).replace("{{\u961F\u4F0D\u4EBA\u6570}}", memberNum.toString());
      return text;
    }
    drawText(nameList) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = nameList.join(sperator);
      const text = this.getRandomTemplate("\u62BD\u53D6\u6210\u5458").replace("{{\u6210\u5458\u5217\u8868}}", listText);
      return text;
    }
    callText(callList) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = callList.map((userId) => `[CQ:at,qq=${userId.replace(/\D+/g, "")}]`).join(sperator);
      const text = this.getRandomTemplate("\u547C\u53EB\u6210\u5458").replace("{{\u6210\u5458\u5217\u8868}}", listText);
      return text;
    }
    recallText(callList, memberNum, signNum, guguNum) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = callList.map((userId) => `[CQ:at,qq=${userId.replace(/\D+/g, "")}]`).join(sperator);
      const text = this.getRandomTemplate("\u547C\u53EB\u7ED3\u675F").replace("{{\u961F\u4F0D\u4EBA\u6570}}", memberNum.toString()).replace("{{\u7B7E\u5230\u4EBA\u6570}}", signNum.toString()).replace("{{\u5495\u5495\u4EBA\u6570}}", guguNum.toString()).replace("{{\u6210\u5458\u5217\u8868}}", listText);
      return text;
    }
    showText(members, keys) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
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
      const text = this.getRandomTemplate("\u5C55\u793A\u5C5E\u6027").replace("{{\u6210\u5458\u5C5E\u6027\u5217\u8868}}", listText);
      return text;
    }
    setText(members, key, valueText) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = members.map((item) => {
        let text2 = item.name;
        text2 += ` ${key}=>${item.attr[key]}`;
        return text2;
      }).join(sperator);
      const text = this.getRandomTemplate("\u8BBE\u7F6E\u5C5E\u6027").replace("{{\u4FEE\u6539\u64CD\u4F5C}}", `\u64CD\u4F5C:${valueText}`).replace("{{\u6210\u5458\u5C5E\u6027\u5217\u8868}}", listText);
      return text;
    }
    sortText(members, key) {
      const sperator = seal.ext.getStringConfig(this.ext, "\u5206\u9694\u7B26");
      const listText = members.map((item) => {
        let text2 = item.name;
        text2 += ` ${key}${item.attr[key]}`;
        return text2;
      }).join(sperator);
      const text = this.getRandomTemplate("\u6392\u5E8F\u5C5E\u6027").replace("{{\u6210\u5458\u5C5E\u6027\u5217\u8868}}", listText);
      return text;
    }
    emptyText() {
      return this.getRandomTemplate("\u63D0\u793A\u961F\u4F0D\u4E3A\u7A7A");
    }
    notExistText() {
      return this.getRandomTemplate("\u63D0\u793A\u961F\u4F0D\u4E0D\u5B58\u5728");
    }
    isCallingText() {
      return this.getRandomTemplate("\u63D0\u793A\u6B63\u5728\u547C\u53EB");
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
        name: "\u9ED8\u8BA4\u961F\u4F0D",
        members: []
      };
      this.teamList = [{ name: "\u9ED8\u8BA4\u961F\u4F0D", members: [] }];
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
                name: item.name || "\u9ED8\u8BA4\u961F\u4F0D",
                members: item.members || []
              };
            });
          }
        } catch (err) {
          console.error(`\u5728\u83B7\u53D6${id}_teamList\u65F6\u53D1\u751F\u9519\u8BEF\uFF1A${err}`);
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
        console.error(`\u5728\u83B7\u53D6${id}_callList\u65F6\u53D1\u751F\u9519\u8BEF\uFF1A${err}`);
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
        teamList = teamList.filter((item) => item.name !== "\u9ED8\u8BA4\u961F\u4F0D" || item.members.length !== 0);
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
      const timeLimit = seal.ext.getIntConfig(this.ext, "\u547C\u53EB\u65F6\u95F4\u9650\u5236/s") * 1e3;
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
      const callList = this.getCallList(id);
      const configManager = new ConfigManager(this.ext);
      const memberNum = team.members.length;
      const guguNum = callList.length;
      const signNum = memberNum - guguNum;
      let reply = configManager.recallText(callList, memberNum, signNum, guguNum);
      reply = seal.format(ctx, reply);
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
      ext = seal.ext.new("team", "\u9519\u8BEF", "4.0.0");
      seal.ext.register(ext);
    }
    const teamManager = new TeamManager(ext);
    const configManager = new ConfigManager(ext);
    configManager.registerConfig();
    const cmdteam = seal.ext.newCmdItemInfo();
    cmdteam.name = "team";
    cmdteam.help = `\u5E2E\u52A9\uFF1A
\u3010.team bind \u961F\u4F0D\u540D\u5B57\u3011\u7ED1\u5B9A/\u65B0\u5EFA\u961F\u4F0D
\u3010.team del \u961F\u4F0D\u540D\u5B57\u3011\u5220\u9664\u961F\u4F0D
\u3010.team del --all\u3011\u5220\u9664\u6240\u6709\u961F\u4F0D
\u3010.team del --now\u3011\u5220\u9664\u5F53\u524D\u961F\u4F0D
\u3010.team lst\u3011\u961F\u4F0D\u5217\u8868
\u3010.team add @xx@xxx...\u3011\u6DFB\u52A0\u82E5\u5E72\u6210\u5458
\u3010.team rm @xx@xxx...\u3011\u5220\u9664\u82E5\u5E72\u6210\u5458
\u3010.team rm --all\u3011\u5220\u9664\u6240\u6709\u6210\u5458
\u3010.team draw (\u62BD\u53D6\u6570\u91CF)\u3011\u968F\u673A\u62BD\u53D6\u961F\u4F0D\u5185\u6210\u5458
\u3010.team call\u3011\u8C03\u67E5\u5458\u96C6\u7ED3\uFF01
\u3010.team show (\u5C5E\u6027\u540D)\u3011\u67E5\u770B\u5C5E\u6027
\u3010.team st <\u5C5E\u6027\u540D> <\u8868\u8FBE\u5F0F>\u3011\u4FEE\u6539\u5C5E\u6027
\u3010.team sort \u5C5E\u6027\u540D\u3011\u5BF9\u6210\u5458\u7684\u8BE5\u9879\u5C5E\u6027\u6392\u5E8F`;
    cmdteam.allowDelegate = true;
    cmdteam.disabledInPrivate = true;
    cmdteam.solve = (ctx, msg, cmdArgs) => {
      ctx.delegateText = "";
      const val = cmdArgs.getArgN(1);
      const id = ctx.group.groupId;
      switch (val) {
        case "b":
        case "bd":
        case "bind": {
          const name = cmdArgs.getRestArgsFrom(2);
          if (!name) {
            seal.replyToSender(ctx, msg, "\u53C2\u6570\u9519\u8BEF\uFF0C\u3010.team bind \u961F\u4F0D\u540D\u5B57\u3011\u7ED1\u5B9A/\u65B0\u5EFA\u961F\u4F0D");
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
            seal.replyToSender(ctx, msg, "\u53C2\u6570\u9519\u8BEF\uFF0C\u3010.team del \u961F\u4F0D\u540D\u5B57\u3011\u5220\u9664\u961F\u4F0D");
            return seal.ext.newCmdExecuteResult(true);
          }
          const nameList = teamManager.delete(id, name, kwargs);
          const reply = nameList.length !== 0 ? configManager.delText(nameList) : configManager.notExistText();
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "l":
        case "lst":
        case "list": {
          const teamList = teamManager.getTeamList(id);
          const reply = configManager.getListText(teamList);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "a":
        case "add": {
          let atList = cmdArgs.at.filter((item) => item.userId !== ctx.endPoint.userId).map((item) => item.userId);
          const members = teamManager.add(ctx, atList);
          const reply = configManager.addText(atList.length, members.length);
          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "r":
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
        case "c":
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
        case "st":
        case "set": {
          const teamList = teamManager.getTeamList(id);
          if (teamList[0].members.length === 0) {
            const reply2 = configManager.emptyText();
            seal.replyToSender(ctx, msg, reply2);
            return seal.ext.newCmdExecuteResult(true);
          }
          const key = cmdArgs.getArgN(2);
          const valueText = cmdArgs.getArgN(3);
          if (!key || !valueText) {
            seal.replyToSender(ctx, msg, "\u53C2\u6570\u9519\u8BEF\uFF0C\u3010.team st <\u5C5E\u6027\u540D> <\u8868\u8FBE\u5F0F>\u3011\u4FEE\u6539\u5C5E\u6027");
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
            seal.replyToSender(ctx, msg, "\u53C2\u6570\u9519\u8BEF\uFF0C\u3010.team sort \u5C5E\u6027\u540D\u3011\u5BF9\u6210\u5458\u7684\u8BE5\u9879\u5C5E\u6027\u6392\u5E8F");
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
      const sortWords = seal.ext.getTemplateConfig(ext, "\u6218\u6597\u8F6E\u6392\u5E8F\u5173\u952E\u8BCD");
      const signWords = seal.ext.getTemplateConfig(ext, "\u7B7E\u5230\u5173\u952E\u8BCD");
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
