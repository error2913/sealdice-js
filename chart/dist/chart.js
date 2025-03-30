// ==UserScript==
// @name         变量排行榜
// @author       错误
// @version      1.1.1
// @description  为你的豹语变量提供排行榜服务！请在插件设置内填写对应变量和名称，并填写数据更新的条件。插件并不能主动更新排行榜数据，需要被动触发。若图片发送不了请联系错误。
// @timestamp    1731503833
// 2024-11-13 21:17:13
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.gitmirror.com/error2913/sealdice-js/main/chart/dist/chart.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/chart/dist/chart.js
// ==/UserScript==
(() => {
  // src/chart.ts
  var ChartManager = class _ChartManager {
    constructor(data) {
      this.data = data;
    }
    static getData(ext) {
      let data = {};
      try {
        data = JSON.parse(ext.storageGet("data") || "{}");
        for (const key in data) {
          data[key] = new Chart(key, data[key].data);
        }
      } catch (error) {
        console.error("从数据库中获取chart失败:", error);
        data = {};
      }
      return new _ChartManager(data);
    }
    saveData(ext) {
      ext.storageSet("data", JSON.stringify(this.data));
    }
    updateVars(ext, ctx) {
      const uid = ctx.player.userId;
      const varNames = seal.ext.getTemplateConfig(ext, "变量名");
      const names = seal.ext.getTemplateConfig(ext, "变量对应名称");
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (i >= varNames.length) {
          console.error(`在getVarName中出错:${name}(${i})找不到对应变量名`);
          continue;
        }
        const varName = varNames[i];
        const [val, exist] = seal.vars.intGet(ctx, varName);
        if (exist) {
          if (!this.data.hasOwnProperty(name)) {
            this.data[name] = new Chart(name, []);
          }
          const chart = this.data[name].data;
          const index = chart.findIndex((item) => item.uid === uid);
          if (index === -1) {
            chart.push({
              uid,
              un: ctx.player.name,
              value: val
            });
            chart.sort((a, b) => b.value - a.value);
            chart.splice(10);
          } else {
            chart[index].un = ctx.player.name;
            chart[index].value = val;
            chart.sort((a, b) => b.value - a.value);
          }
        }
      }
      this.saveData(ext);
    }
    showChart(name) {
      if (!this.data.hasOwnProperty(name)) {
        this.data[name] = new Chart(name, []);
      }
      return this.data[name].showChart();
    }
  };
  var Chart = class {
    constructor(name, data) {
      this.name = name;
      this.data = data;
    }
    showChart() {
      if (this.data.length === 0) {
        return "暂无数据";
      }
      const url = "http://42.193.236.17:3003";
      const title = `${this.name}排行榜`;
      const file = `${url}/chart?title=${title}&data=${JSON.stringify(this.data)}`;
      return `[CQ:image,file=${file.replace(/\]/g, "%5D").replace(/,/g, "%2C")}]`;
    }
  };

  // src/configManager.ts
  var ConfigManager = class {
    constructor(ext) {
      this.ext = ext;
    }
    register() {
      seal.ext.registerTemplateConfig(this.ext, "变量名", ["$m好感", "$m金币"], "豹语变量");
      seal.ext.registerTemplateConfig(this.ext, "变量对应名称", ["好感", "金币"], "与上边一一对应，用于查找");
      seal.ext.registerTemplateConfig(this.ext, "变量同步正则表达式", ["^晚安$"], "变量可能产生变化时，需要对插件内部数据进行同步");
      seal.ext.registerTemplateConfig(this.ext, "变量同步指令名", ["jrrp"], "变量可能产生变化时，需要对插件内部数据进行同步");
    }
    getVarName(s) {
      const varNames = seal.ext.getTemplateConfig(this.ext, "变量名");
      const names = seal.ext.getTemplateConfig(this.ext, "变量对应名称");
      const index = names.indexOf(s);
      if (index == -1) {
        return "";
      }
      if (index >= varNames.length) {
        console.error(`在getVarName中出错:${s}(${index})找不到对应变量名`);
        return "";
      }
      return varNames[index];
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
  async function update(ext, cm) {
    const updatedPlayers = /* @__PURE__ */ new Set();
    const eps = seal.getEndPoints();
    for (let i = 0; i < eps.length; i++) {
      const epId = eps[i].userId;
      const data = await globalThis.http.getData(epId, "get_group_list?no_cache=true");
      if (data === null) {
        continue;
      }
      for (let j = 0; j < data.length; j++) {
        const gid = `QQ-Group:${data[j].group_id}`;
        const data2 = await globalThis.http.getData(epId, `get_group_member_list?group_id=${data[j].group_id}`);
        if (data2 === null) {
          continue;
        }
        for (let k = 0; k < data2.length; k++) {
          const uid = `QQ:${data2[k].user_id}`;
          if (!updatedPlayers.has(uid)) {
            const msg = getMsg("group", uid, gid);
            const ctx = getCtx(epId, msg);
            cm.updateVars(ext, ctx);
            updatedPlayers.add(uid);
          }
        }
      }
    }
  }

  // src/index.ts
  function main() {
    let ext = seal.ext.find("排行榜");
    if (!ext) {
      ext = seal.ext.new("排行榜", "错误", "1.1.1");
      seal.ext.register(ext);
    }
    const configManager = new ConfigManager(ext);
    configManager.register();
    const cm = ChartManager.getData(ext);
    ext.onCommandReceived = (ctx, _, cmdArgs) => {
      const command = cmdArgs.command;
      const cmds = seal.ext.getTemplateConfig(ext, "变量同步指令名");
      if (cmds.includes(command)) {
        setTimeout(() => {
          cm.updateVars(ext, ctx);
        }, 500);
      }
    };
    ext.onNotCommandReceived = (ctx, msg) => {
      const message = msg.message;
      const patterns = seal.ext.getTemplateConfig(ext, "变量同步正则表达式");
      if (patterns.some((item) => {
        try {
          return new RegExp(item).test(message);
        } catch (error) {
          console.error("Error in RegExp:", error);
          return false;
        }
      })) {
        setTimeout(() => {
          cm.updateVars(ext, ctx);
        }, 500);
      }
    };
    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = "chart";
    cmd.help = `帮助
【.chart <变量名称>】查看排行榜
【.chart update】全部数据更新，需要http功能`;
    cmd.solve = (ctx, msg, cmdArgs) => {
      let val = cmdArgs.getArgN(1);
      switch (val) {
        case "":
        case "help": {
          const names = seal.ext.getTemplateConfig(ext, "变量对应名称");
          const s = cmd.help + `
可选变量名称:${names.join(",")}`;
          seal.replyToSender(ctx, msg, s);
          return seal.ext.newCmdExecuteResult(true);
        }
        case "update": {
          const exthttp = seal.ext.find("HTTP依赖");
          if (!exthttp) {
            seal.replyToSender(ctx, msg, "请先安装 错误:HTTP依赖:>=1.0.0");
            return seal.ext.newCmdExecuteResult(true);
          }
          update(ext, cm).then(() => {
            seal.replyToSender(ctx, msg, "数据更新完成");
          });
          return seal.ext.newCmdExecuteResult(true);
        }
        default: {
          const varName = configManager.getVarName(val);
          if (!varName) {
            const names = seal.ext.getTemplateConfig(ext, "变量对应名称");
            const s = `${val}排行榜不存在
可选变量名称:${names.join(",")}`;
            seal.replyToSender(ctx, msg, s);
            return seal.ext.newCmdExecuteResult(true);
          }
          cm.updateVars(ext, ctx);
          seal.replyToSender(ctx, msg, cm.showChart(val));
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    };
    ext.cmdMap["chart"] = cmd;
    ext.cmdMap["排行榜"] = cmd;
    seal.ext.registerTask(ext, "cron", "0 */2 * * *", () => {
      const exthttp = seal.ext.find("HTTP依赖");
      if (!exthttp) {
        return;
      }
      update(ext, cm).then(() => {
        console.log("排行榜数据更新完成");
      });
    });
  }
  main();
})();
