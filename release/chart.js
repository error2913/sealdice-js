// ==UserScript==
// @name         变量排行榜
// @author       错误
// @version      1.0.0
// @description  为你的豹语变量提供排行榜服务！请在插件设置内填写对应变量和名称，并填写数据更新的条件。插件并不能主动更新排行榜数据，需要被动触发。
// @timestamp    1731503833
// 2024-11-13 21:17:13
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/release/chart.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/release/chart.js
// ==/UserScript==
(() => {
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
  function getChart(ext) {
    let chart = {};
    try {
      chart = JSON.parse(ext.storageGet("chart") || "{}");
    } catch (error) {
      console.error("从数据库中获取chart失败:", error);
      chart = {};
    }
    return chart;
  }
  function saveChart(ext, chart) {
    ext.storageSet(`chart`, JSON.stringify(chart));
  }
  function getChartText(s, chart, configManager) {
    const varName = configManager.getVarName(s);
    if (!varName) {
      return `${s}排行榜不存在`;
    }
    const arr = [];
    for (const id in chart) {
      let val = 0;
      if (chart[id].hasOwnProperty(s)) {
        val = chart[id][s];
      }
      if (val === 0) {
        continue;
      }
      arr.push([id, val]);
    }
    if (arr.length === 0) {
      return `${s}排行榜为空`;
    }
    arr.sort((a, b) => b[1] - a[1]);
    let text = `${s}排行榜
♚`;
    for (let i = 0; i < 10 && i < arr.length; i++) {
      const [id, val] = arr[i];
      text += `第${i + 1}名: <${id}>  ${val}
`;
    }
    return text;
  }
  function updateVars(ext, ctx, chart) {
    const id = ctx.player.userId;
    const varNames = seal.ext.getTemplateConfig(ext, "变量名");
    const names = seal.ext.getTemplateConfig(ext, "变量对应名称");
    let newChart = {};
    chart[id] = {};
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      if (i >= varNames.length) {
        console.error(`在getVarName中出错:${name}(${i})找不到对应变量名`);
        continue;
      }
      const varName = varNames[i];
      const [val, exist] = seal.vars.intGet(ctx, varName);
      if (exist) {
        chart[id][name] = val;
        const arr = [];
        for (const id2 in chart) {
          let val2 = 0;
          if (chart[id2].hasOwnProperty(name)) {
            val2 = chart[id2][name];
          }
          arr.push([id2, val2]);
        }
        arr.sort((a, b) => b[1] - a[1]);
        arr.splice(10);
        for (const [id2, _] of arr) {
          if (!newChart[id2] || id2 === id) {
            newChart[id2] = chart[id2];
          }
        }
      }
    }
    saveChart(ext, newChart);
    return newChart;
  }

  // src/index.ts
  function main() {
    let ext = seal.ext.find("排行榜");
    if (!ext) {
      ext = seal.ext.new("排行榜", "错误", "1.0.0");
      seal.ext.register(ext);
    }
    const configManager = new ConfigManager(ext);
    configManager.register();
    let chart = getChart(ext);
    ext.onCommandReceived = (ctx, _, cmdArgs) => {
      const command = cmdArgs.command;
      const cmds = seal.ext.getTemplateConfig(ext, "变量同步指令名");
      if (cmds.includes(command)) {
        setTimeout(() => {
          chart = updateVars(ext, ctx, chart);
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
          chart = updateVars(ext, ctx, chart);
        }, 500);
      }
    };
    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = "chart";
    cmd.help = `帮助
【.chart <变量名称>】查看排行榜
【.chart show】查看已有的变量名`;
    cmd.solve = (ctx, msg, cmdArgs) => {
      let val = cmdArgs.getArgN(1);
      switch (val) {
        case "":
        case "help": {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        case "show": {
          const names = seal.ext.getTemplateConfig(ext, "变量对应名称");
          seal.replyToSender(ctx, msg, `可选变量名称:${names.join(",")}`);
          return seal.ext.newCmdExecuteResult(true);
        }
        default: {
          seal.replyToSender(ctx, msg, getChartText(val, chart, configManager));
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    };
    ext.cmdMap["chart"] = cmd;
    ext.cmdMap["排行榜"] = cmd;
  }
  main();
})();
